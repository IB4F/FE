import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from "@angular/common";
import {FormBuilder, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {passwordValidator} from "../../../helpers/customValidators/check-password.validator";
import {map, Subject, take, takeUntil} from "rxjs";
import {UserService} from "../../../services/user.service";
import {ProfileTabs} from "../../shared/constant/enums";
import {ChangePasswordComponent} from "./change-password/change-password.component";
import {ProfileComponent} from "./profile/profile.component";
import {AuthService, User} from "../../../api-client";
import {NgToastService} from "ng-angular-popup";

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    ChangePasswordComponent,
    ProfileComponent
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit, OnDestroy {

  profileFormGroup!: FormGroup;
  changePasswordFormGroup!: FormGroup;
  fullName!: string;
  user$ = this.userService.user$;
  userInitials$ = this.user$.pipe(
    map(user => {
      if (!user) return '';
      const firstNameInitial = user.firstName?.[0] || '';
      const lastNameInitial = user.lastName?.[0] || '';
      return `${firstNameInitial}${lastNameInitial}`.toUpperCase();
    })
  );

  ProfileTabs = ProfileTabs;
  selectedTab: ProfileTabs = ProfileTabs.PersonalInfo;

  private unsubscribe$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private _authService: AuthService,
    private toast: NgToastService,
  ) {
    this.initializeForms();
  }

  ngOnInit() {
    this.loadUserData();
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  initializeForms() {
    this.profileFormGroup = this.formBuilder.group({
      email: [''],
      firstName: [''],
      lastName: [''],
      role: [''],
      birthday: [null],
      school: [''],
    });

    this.changePasswordFormGroup = this.formBuilder.group({
      currentPassword: ['', [passwordValidator]],
      newPassword: ['', [passwordValidator]]
    });
  }

  loadUserData() {
    this.user$.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe(user => {
      if (user) {
        this.profileFormGroup.patchValue({
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          birthday: user.dateOfBirth,
          school: user.school
        });
        this.fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`;
      }
    });
  }

  selectTab(tab: ProfileTabs) {
    this.selectedTab = tab;
  }

  onChangePassword(passwords: { currentPassword: string, newPassword: string }) {
    if (this.changePasswordFormGroup.valid) {

      this._authService.resetPost(passwords).subscribe(
        {
          next: (response) => {
            console.log(response);
            this.changePasswordFormGroup.reset();
          },
          error: (err) => {
            console.log(err);
          }
        }
      );
    } else {
    }
  }

  saveProfileData() {
    if (this.profileFormGroup.valid) {
      this.user$.pipe(take(1)).subscribe(user => {
        const userId = user?.id;
        if (!userId) {
          return;
        }
        const userDetail: User = {
          ...user,
          ...this.profileFormGroup.value
        };
        this._authService.idPut(userId, userDetail).subscribe({
            next: () => {
              this.userService.loadUserData(true).subscribe();
              this.toast.success('Të dhënat u përditësuan me sukses!', 'SUCCESS', 3000)
            },
            error: (error) => this.toast.danger(error?.error?.message, 'ERROR', 3000)
          }
        );
      })
    }
  }
}
