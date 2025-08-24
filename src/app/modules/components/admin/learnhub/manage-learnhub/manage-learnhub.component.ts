import {Component, OnInit} from '@angular/core';
import {AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {CommonModule, Location} from "@angular/common";
import {MatInputModule} from "@angular/material/input";
import {MatSelectModule} from "@angular/material/select";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatIconModule} from '@angular/material/icon';
import {MatSliderModule} from "@angular/material/slider";
import {MatTooltipModule} from "@angular/material/tooltip";
import {
  Class,
  DetailsService,
  LearnHubCreateDTO,
  LearnHubsService,
  LinksService,
  Subjects
} from "../../../../../api-client";
import {NgToastService} from "ng-angular-popup";
import {ActivatedRoute, Router} from "@angular/router";
import {requiredRowsValidator} from "../../../../../helpers/customValidators/links.validator";
import {MatCheckboxModule} from "@angular/material/checkbox";
import {MatRadioModule} from "@angular/material/radio";
import {MatButton, MatButtonModule} from "@angular/material/button";

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
    MatButton,
    MatButtonModule
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
    private location: Location,
    private linksService: LinksService
  ) {
  }

  ngOnInit(): void {
    this.idLearnHub = this.route.snapshot.params['id'];
    this.loadCombos();
    this.initializeCategoryManagementForm();

    if (this.idLearnHub) {
      this.getLearnHubInfo();
    }
  }

  get isEditMode(): boolean {
    return !!this.learHub;
  }

  getLearnHubInfo() {
    this.learnHubsService.apiLearnHubsGetSingleLearnhubGet(this.idLearnHub).subscribe({
      next: (resp) => {
        this.learHub = resp;
        this.patchFormWithLearnhubData();
      },
      error: (error) => {
        this.toast.danger(error?.error?.message, 'GABIM', 3000);
      }
    })
  }

  initializeCategoryManagementForm() {
    this.learnHubFormGroup = this._formBuilder.group({
      title: ['', Validators.required],
      classType: ['', Validators.required],
      subject: ['', Validators.required],
      description: ['', Validators.required],
      difficulty: ['', [Validators.required, Validators.min(0), Validators.max(10)]],
      isFree: ['', Validators.required],
      links: this._formBuilder.array([], requiredRowsValidator())
    });
  }

  patchFormWithLearnhubData() {
    if (this.learHub) {
      this.learnHubFormGroup.patchValue({
        title: this.learHub.title,
        classType: this.learHub.classType,
        subject: this.learHub.subject,
        description: this.learHub.description,
        difficulty: this.learHub.difficulty,
        isFree: this.learHub.isFree
      });

      if (this.learHub.typeClass) {
        this.learnHubFormGroup.get('classType')?.disable();
      }
      if (this.learHub.subject) {
        this.learnHubFormGroup.get('subject')?.disable();
      }

      if (this.learHub.links) {
        this.populateNumberedRows(this.learHub.links);
      }
    }
  }

  populateNumberedRows(rows: any[]) {
    while (this.links.length !== 0) {
      this.links.removeAt(0);
    }
    rows.forEach(row => {
      const linkGroup = this._formBuilder.group({
        id: [row.id],
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
      id: [null],
      number: [linkNumber],
      title: ['', Validators.required]
    });
    this.links.push(linkGroup);
  }

  removeRow(index: number) {
    const linkControl = this.links.at(index);
    const linkId = linkControl.get('id')?.value;

    if (linkId) {
      this.linksService.apiLinksDeleteLinkDelete(linkId).subscribe({
        next: (resp) => {
          this.links.removeAt(index);
          this.updateRowNumbers();
          this.toast.success('Lidhja u fshi me sukses!', 'SUKSES', 3000);
        },
        error: (error) => {
          this.toast.danger(error?.error?.message || 'Gabim gjatë fshirjes së lidhjes', 'GABIM', 3000);
        }
      });
    } else {
      this.links.removeAt(index);
      this.updateRowNumbers();
    }
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
    const formData = this.learnHubFormGroup.getRawValue();
    const formattedData: LearnHubCreateDTO = {
      ...formData,
      isFree: formData.isFree
    };
    if (this.idLearnHub) {
      this.learnHubsService.apiLearnHubsUpdateLearnhubPut(this.idLearnHub, formattedData).subscribe({
        next: (resp) => {
          this.getLearnHubInfo();
          this.learnHubFormGroup.markAsPristine();
          this.toast.success('U perditësua!', 'SUKSES', 3000);
        },
        error: (error) => this.toast.danger(error?.error?.message, 'GABIM', 3000)
      });
    } else {
      //for the create
      this.learnHubsService.apiLearnHubsPostLearnhubPost(formattedData).subscribe({
        next: (resp) => {
          this.idLearnHub = resp;
          this.getLearnHubInfo();
          this.learnHubFormGroup.markAsPristine();
          this.toast.success('Learnhubi u krijua', 'SUCCESS', 3000);
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

  goToQuiz(link: AbstractControl) {
    const linkId = link.get('id')?.value;
    this.router.navigate(['/admin/learnhub/manage/quiz', linkId]);
  }

  goBack(): void {
    this.location.back();
  }

}
