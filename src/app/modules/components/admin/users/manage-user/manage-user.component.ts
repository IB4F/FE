import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {AdminUserService} from "../../../../../api-client";
import {NgToastService} from "ng-angular-popup";
import {MatButton} from "@angular/material/button";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatIconModule} from "@angular/material/icon";
import {MatInputModule} from "@angular/material/input";
import {MatSelectModule} from "@angular/material/select";
import {MatTooltipModule} from "@angular/material/tooltip";
import {CommonModule} from "@angular/common";
import {FormBuilder, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {MatCheckboxModule} from "@angular/material/checkbox";
import {MatRadioModule} from "@angular/material/radio";
import {MatSliderModule} from "@angular/material/slider";

@Component({
  selector: 'app-manage-user',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatCheckboxModule,
    MatInputModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatRadioModule,
    MatFormFieldModule,
    MatSliderModule,
    MatTooltipModule,
    MatButton
  ],
  templateUrl: './manage-user.component.html',
  styleUrl: './manage-user.component.scss'
})
export class ManageUserComponent implements OnInit {
  userForm!: FormGroup;
  idUser!: string;
  userInfo: any;

  constructor(
    private route: ActivatedRoute,
    private adminUserService: AdminUserService,
    private toast: NgToastService,
    private _formBuilder: FormBuilder,
  ) {
    this.userForm = this._formBuilder.group({
      firstName: [''],
      lastName: [''],
      email: [''],
      role: [''],
      school: [''],
      city: ['']
    });
  }

  ngOnInit() {
    this.idUser = this.route.snapshot.params['id'];
    this.getUserInfo();
  }

  getUserInfo() {
    this.adminUserService.apiAdminUsersIdGet(this.idUser).subscribe({
      next: (resp) => {
        this.userInfo = resp;
        this.fetchForm();
      },
      error: (error) => {
        this.toast.danger(error?.error?.message, 'GABIM', 3000);
      }
    })
  }

  fetchForm() {
    this.userForm = this._formBuilder.group({
      firstName: [this.userInfo?.firstName ?? ''],
      lastName: [this.userInfo?.lastName ?? ''],
      email: [this.userInfo?.email ?? ''],
      role: [this.userInfo?.role ?? ''],
      school: [this.userInfo?.school ?? ''],
      city: [this.userInfo?.city ?? ''],
    });
  }

  onUpdate() {
    const adminUserDetailsDTO = {
      ...this.userInfo,
      ...this.userForm.value,
    }
    this.adminUserService.apiAdminUsersIdPut(this.idUser, adminUserDetailsDTO).subscribe(
      {
        next: (resp) => {
          console.log(resp)
        },
        error: (error) => this.toast.danger(error?.error?.message, 'GABIM', 3000)
      }
    );
  }
}
