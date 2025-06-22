import {Component, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {CommonModule} from "@angular/common";
import {MatInputModule} from "@angular/material/input";
import {MatSelectModule} from "@angular/material/select";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatIconModule} from '@angular/material/icon';
import {MatSliderModule} from "@angular/material/slider";
import {MatTooltipModule} from "@angular/material/tooltip";
import {Class, DetailsService, LearnHubCreateDTO, LearnHubsService, Subjects} from "../../../../../api-client";
import {NgToastService} from "ng-angular-popup";
import {ActivatedRoute, Router} from "@angular/router";
import {requiredRowsValidator} from "../../../../../helpers/customValidators/links.validator";
import {MatCheckboxModule} from "@angular/material/checkbox";
import {MatRadioModule} from "@angular/material/radio";
import {MatButton} from "@angular/material/button";

@Component({
  selector: 'app-manage-learnhub',
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
  templateUrl: './manage-learnhub.component.html',
  styleUrl: './manage-learnhub.component.scss'
})

export class ManageLearnhubComponent implements OnInit {

  learnHubFormGroup!: FormGroup;
  classesList: Class[] = [];
  subjectList: Subjects[] = [];

  learHub: any;
  idLearnHub!: string;

  constructor(
    private _formBuilder: FormBuilder,
    private learnHubsService: LearnHubsService,
    private toast: NgToastService,
    private route: ActivatedRoute,
    private _detailsService: DetailsService,
    public router: Router,
  ) {
  }

  ngOnInit(): void {
    this.idLearnHub = this.route.snapshot.params['id'];
    this.getLearnHubInfo();
    this.loadCombos();
    this.initializeCategoryManagementForm();
  }

  get isEditMode(): boolean {
    return !!this.learHub;
  }

  getLearnHubInfo() {
    this.learnHubsService.apiLearnHubsGetSingleLearnhubGet(this.idLearnHub).subscribe({
      next: (resp) => {
        console.log(resp);
      },
      error: (error) => {
        this.toast.danger(error?.error?.message, 'GABIM', 3000);
      }
    })
  }

  initializeCategoryManagementForm() {
    // Define form control values
    const formValues = {
      title: this.learHub?.title || '',
      typeClass: this.learHub?.typeClass || '',
      subject: this.learHub?.subject || '',
      description: this.learHub?.description || '',
      isFree: this.learHub?.isFree || ''
    };

    // Initialize form group with conditionally disabled controls
    this.learnHubFormGroup = this._formBuilder.group({
      title: [formValues.title, Validators.required],
      classType: [{value: formValues.typeClass, disabled: !!formValues.typeClass}, Validators.required],
      subject: [{value: formValues.subject, disabled: !!formValues.subject}, Validators.required],
      description: [formValues.description, Validators.required],
      isFree: [formValues.isFree, Validators.required],
      links: this._formBuilder.array([], requiredRowsValidator())
    });

    // Populate numbered rows if available
    if (this.learHub?.links) {
      this.populateNumberedRows(this.learHub.links);
    }
  }

  populateNumberedRows(rows: any[]) {
    rows.forEach(row => {
      const linkGroup = this._formBuilder.group({
        number: [row.number],
        title: [row.title, Validators.required]
      });
      this.links.push(linkGroup);
    });
  }

  get links(): FormArray {
    return this.learnHubFormGroup.get('links') as FormArray;
  }

  addRow() {
    const linkNumber = this.links.length + 1;
    const linkGroup = this._formBuilder.group({
      number: [linkNumber],
      title: ['', Validators.required]
    });
    this.links.push(linkGroup);
  }

  removeRow(index: number) {
    this.links.removeAt(index);
    this.updateRowNumbers();
  }

  updateRowNumbers() {
    this.links.controls.forEach((linkGroup, index) => {
      linkGroup.get('number')?.setValue(index + 1);
    });
  }

  isFormValid(): boolean {
    return this.learnHubFormGroup.valid;
  }

  handleButtonClick() {
    if (!this.isFormValid()) return;
    const formData = this.learnHubFormGroup.value;
    const formattedData: LearnHubCreateDTO = {
      ...formData,
      isFree: formData.isFree === 'true'
    };
    if (this.isEditMode) {
      if (this.learHub._id !== undefined) {

      }
      if (this.learHub._id !== undefined) {
        this.learnHubsService.apiLearnHubsUpdateLearnhubPut(this.learHub._id, formattedData).subscribe({
          next: (resp) => {
            this.toast.success(resp?.message, 'SUCCESS', 3000);
          },
          error: (error) => this.toast.danger(error?.error?.message, 'GABIM', 3000)
        });
      } else {
        this.toast.danger("LearnHub ID is undefined.", 'GABIM', 3000)
      }
    } else {
      //for the create
      this.learnHubsService.apiLearnHubsPostLearnhubPost(formattedData).subscribe({
        next: (resp) => {
          this.toast.success(resp?.message, 'SUCCESS', 3000);
          this.router.navigate(['/admin/learnhub']);
        },
        error: (error) => this.toast.danger(error?.error?.message, 'GABIM', 3000)
      });
    }
  }

  private loadCombos() {
    this.getClassesList();
    this.getSubjectsList();
  }

  private getClassesList() {
    this._detailsService.apiDetailsGetClassGet().subscribe(res => {
      this.classesList = res;
    })
  }

  private getSubjectsList() {
    this._detailsService.apiDetailsGetSubjectsGet().subscribe(res => {
      this.subjectList = res;
    })
  }

}
