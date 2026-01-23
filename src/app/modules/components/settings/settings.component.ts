import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from "@angular/common";
import {FormBuilder, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {passwordValidator} from "../../../helpers/customValidators/check-password.validator";
import {map, Subject, take, takeUntil} from "rxjs";
import {UserService} from "../../../services/user.service";
import {ProfileTabs, UserRole} from "../../shared/constant/enums";
import {ChangePasswordComponent} from "./change-password/change-password.component";
import {ProfileComponent} from "./profile/profile.component";
import {SubscriptionDashboardComponent} from "./subscription-dashboard/subscription-dashboard.component";
import {PreferencesComponent} from "./preferences/preferences.component";
import {AuthService, ChangePasswordDTO, Class, DetailsService, User} from "../../../api-client";
import {NgToastService} from "ng-angular-popup";
import {TokenStorageService} from "../../../services/token-storage.service";

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    ChangePasswordComponent,
    ProfileComponent,
    SubscriptionDashboardComponent,
    PreferencesComponent
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit, OnDestroy {

  profileFormGroup!: FormGroup;
  changePasswordFormGroup!: FormGroup;
  fullName!: string;
  user$ = this.userService.user$;
  childrenCount: number | null = null;
  studentsCount: number | null = null;
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
  mobileMenuOpen = false;

  private unsubscribe$ = new Subject<void>();
  classesList: Class[] = [];
  userRole: string | null = null;
  canAccessSubscriptionDashboard$ = this.user$.pipe(
    map(user => {
      if (!user || !user.email) return false;
      const userEmailDomain = user.email.split('@')[1];
      // Allow subscription dashboard access for all domains except @bga.al
      return userEmailDomain !== 'bga.al';
    })
  );

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private _authService: AuthService,
    private toast: NgToastService,
    private _detailsService: DetailsService,
    private _tokenStorageService: TokenStorageService
  ) {
    this.initializeForms();
  }

  ngOnInit() {
    this.userRole = this._tokenStorageService.getRole();
    this.getClassesList();
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    // Ensure body scroll is restored when component is destroyed
    this.mobileMenuOpen = false;
    this.handleBodyScroll();
  }

  initializeForms() {
    this.profileFormGroup = this.formBuilder.group({
      email: [''],
      firstName: [''],
      lastName: [''],
      currentClass: [{value: '', disabled: true}],
      role: [''],
      birthday: [null],
      school: [''],
      phoneNumber: ['', this.phoneValidator],
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
        // Convert E164 phone number back to phone object format for the component
        let phoneNumberValue = null;
        if (user.phoneNumber) {
          phoneNumberValue = {
            countryCode: this.getCountryCodeFromE164(user.phoneNumber),
            number: this.getNumberFromE164(user.phoneNumber),
            e164Number: user.phoneNumber
          };
        }

        this.profileFormGroup.patchValue({
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          currentClass: user.currentClass,
          role: user.role,
          birthday: user.dateOfBirth,
          school: user.school,
          phoneNumber: phoneNumberValue
        });
        this.fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`;
        this.childrenCount = user.childrenCount ?? null;
        this.studentsCount = user.studentsCount ?? null;
      }
    });
  }

  private getClassesList() {
    this._detailsService.apiDetailsGetClassGet().subscribe(res => {
      this.classesList = res;
      this.loadUserData();
    })
  }

  selectTab(tab: ProfileTabs) {
    // Prevent access to subscription dashboard for @bga.al domain users
    if (tab === ProfileTabs.SubscriptionDashboard) {
      this.user$.pipe(take(1)).subscribe(user => {
        if (!user || !user.email) return;
        const userEmailDomain = user.email.split('@')[1];
        if (userEmailDomain === 'bga.al') {
          this.toast.info('Kjo funksionalitet nuk është i disponueshëm për llogaritë e brendshme.', 'INFO', 3000);
          return;
        }
        this.selectedTab = tab;
      });
    } else {
      this.selectedTab = tab;
    }
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    this.handleBodyScroll();
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
    this.handleBodyScroll();
  }

  private handleBodyScroll() {
    if (this.mobileMenuOpen) {
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${window.scrollY}px`;
      // Lower header z-index while menu is open to avoid stacking-context issues
      document.body.classList.add('menu-open');
    } else {
      // Restore body scroll when menu is closed
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      document.body.classList.remove('menu-open');
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
  }

  onChangePassword(passwords: ChangePasswordDTO) {
    if (this.changePasswordFormGroup.valid) {

      this._authService.apiAuthChangePasswordPost(passwords).subscribe(
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

        const formValue = this.profileFormGroup.value;

        // Extract phone number in E164 format
        const phoneValue = formValue.phoneNumber;
        const phoneNumber = phoneValue?.e164Number || phoneValue;

        const userDetail: User = {
          ...user,
          ...formValue,
          phoneNumber: phoneNumber
        };

        this._authService.apiAuthIdPut(userId, userDetail).subscribe({
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

  // Custom validator for phone numbers
  phoneValidator(control: any) {
    if (!control.value) {
      return null;
    }

    // Check if the phone number object has a valid format
    if (control.value && control.value.e164Number) {
      const phoneNumber = control.value.e164Number;
      // Check if it's a valid international number (at least 10 digits after country code)
      if (phoneNumber.length >= 10) {
        return null; // Valid
      }
    }

    return { invalidPhone: true };
  }

  // Helper method to extract country code from E164 number
  private getCountryCodeFromE164(e164Number: string): string {
    const countryCodeMap: { [key: string]: string } = {
      '+355': 'al',
      '+39': 'it',
      '+49': 'de',
      '+33': 'fr',
      '+44': 'uk'
    };

    for (const [code, country] of Object.entries(countryCodeMap)) {
      if (e164Number.startsWith(code)) {
        return country;
      }
    }

    return 'al'; // Default to Albania
  }

  // Helper method to extract number from E164 format
  private getNumberFromE164(e164Number: string): string {
    const countryCodeMap: { [key: string]: string } = {
      '+355': 'al',
      '+39': 'it',
      '+49': 'de',
      '+33': 'fr',
      '+44': 'uk'
    };

    for (const [code, country] of Object.entries(countryCodeMap)) {
      if (e164Number.startsWith(code)) {
        return e164Number.substring(code.length);
      }
    }

    return e164Number; // Return as-is if no match found
  }

}
