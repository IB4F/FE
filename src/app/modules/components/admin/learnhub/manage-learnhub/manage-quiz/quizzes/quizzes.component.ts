import {Component, OnInit} from '@angular/core';
import {CommonModule, Location} from "@angular/common";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {MatTooltipModule} from "@angular/material/tooltip";
import {ActivatedRoute, ParamMap} from "@angular/router";
import {FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {DetailsService, QuizType, QuizzesService} from '../../../../../../../api-client';
import {NgToastService} from "ng-angular-popup";
import {oneCorrectOptionValidator} from "../../../../../../../helpers/customValidators/option-chek.validator";
import {MatDialogModule} from "@angular/material/dialog";
import {MatCheckboxModule} from "@angular/material/checkbox";
import {MatInputModule} from "@angular/material/input";
import {MatSelectModule} from "@angular/material/select";
import {MatOptionModule} from "@angular/material/core";
import {MatRadioModule} from "@angular/material/radio";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatSliderModule} from "@angular/material/slider";

@Component({
  selector: 'app-quizzes',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatDialogModule,
    MatCheckboxModule,
    MatInputModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatOptionModule,
    MatRadioModule,
    MatFormFieldModule,
    MatSliderModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './quizzes.component.html',
  styleUrl: './quizzes.component.scss'
})
export class QuizzesComponent implements OnInit {
  quizId: string | null = null;
  linkId!: string;
  quizFormGroup!: FormGroup;

  quizTypes: QuizType[] = [];

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private _formBuilder: FormBuilder,
    private quizzesService: QuizzesService,
    private toast: NgToastService,
    private _detailsService: DetailsService,
  ) {
  }

  ngOnInit(): void {
    this.loadCombos();
    // Inizializza il form con valori di default
    this.initializeQuizForm();

    this.route.paramMap.subscribe((params: ParamMap) => {
      this.linkId = params.get('linkId') as string;
      this.quizId = params.get('quizId');
      if (this.isEditMode) {
        // Se è in modalità modifica, carica i dati del quiz
        this.loadQuizData(this.quizId as string);
      }
    });
  }

  loadQuizData(id: string): void {
    this.quizzesService.apiQuizzesGetSingleQuizGet(id).subscribe({
      next: (resp) => {
        // Applica la patch ai valori del form solo dopo aver ricevuto i dati
        this.patchFormValues(resp);
      },
      error: (error) => {
        this.toast.danger(error?.error?.message, 'GABIM', 3000);
        this.goBack();
      }
    });
  }

  initializeQuizForm() {
    this.quizFormGroup = this._formBuilder.group({
      quizType: ['', Validators.required],
      question: ['', Validators.required],
      explanation: ['', Validators.required],
      options: this._formBuilder.array(
        [
          this.createOption(),
          this.createOption(),
          this.createOption(),
          this.createOption()
        ],
        oneCorrectOptionValidator()
      ),
      points: [1, Validators.required]
    });
  }

  patchFormValues(data: any) {
    const optionsArray = this.quizFormGroup.get('options') as FormArray;
    while (optionsArray.length !== 0) {
      optionsArray.removeAt(0);
    }

    data.options.forEach((option: any) => {
      optionsArray.push(this.createOption(option));
    });

    console.log(data.quizType)
    this.quizFormGroup.patchValue({
      quizType: data.quizType,
      question: data.question,
      explanation: data.explanation,
      points: data.points
    });
  }

  get options(): FormArray {
    return this.quizFormGroup.get('options') as FormArray;
  }

  createOption(option?: any): FormGroup {
    return this._formBuilder.group({
      optionText: [option?.optionText || '', Validators.required],
      isCorrect: [option?.isCorrect || false]
    });
  }

  private loadCombos() {
    this.getQuizTypeList();
  }

  private getQuizTypeList() {
    this._detailsService.apiDetailsGetQuizTypesGet().subscribe(res => {
      this.quizTypes = res;
    })
  }

  isFormValid(): boolean {
    return this.quizFormGroup.valid;
  }

  get isEditMode(): boolean {
    return !!this.quizId;
  }

  handleButtonClick(): void {
    if (!this.isFormValid()) return;

    const formValue = this.quizFormGroup.value;
    const formattedData: any = {
      ...formValue,
      options: formValue.options.map((option: any) => ({
        optionText: option.optionText,
        isCorrect: option.isCorrect
      }))
    };

    if (this.isEditMode && this.quizId) {
      this.quizzesService.apiQuizzesUpdateQuizPut(this.quizId, formattedData).subscribe({
        next: (resp) => {
          this.toast.success('Kuici u perditesua me sukses', 'SUKSES', 3000);
          this.goBack();
        },
        error: (error) => this.toast.danger(error?.error?.message, 'GABIM', 3000)
      });
    } else {
      this.quizzesService.apiQuizzesPostQuizPost(this.linkId, formattedData).subscribe({
        next: (resp) => {
          this.toast.success('Kuici u krijua me sukses', 'SUKSES', 3000);
          this.goBack();
        },
        error: (error) => this.toast.danger(error?.error?.message, 'GABIM', 3000)
      });
    }
  }

  goBack(): void {
    this.location.back();
  }
}
