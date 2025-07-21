import {Component, Inject, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {oneCorrectOptionValidator} from "../../../../../../../helpers/customValidators/option-chek.validator";
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from "@angular/material/dialog";
import {CommonModule} from "@angular/common";
import {MatIconModule} from '@angular/material/icon';
import {MatCheckboxModule} from "@angular/material/checkbox";
import {MatInputModule} from "@angular/material/input";
import {MatOptionModule} from "@angular/material/core";
import {MatSelectModule} from "@angular/material/select";
import {MatRadioModule} from "@angular/material/radio";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatSliderModule} from "@angular/material/slider";
import {MatButtonModule} from "@angular/material/button";
import {QuizzesService} from "../../../../../../../api-client";
import {NgToastService} from "ng-angular-popup";

@Component({
  selector: 'app-quiz-modal',
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
    MatButtonModule
  ],
  templateUrl: './quiz-modal.component.html',
  styleUrl: './quiz-modal.component.scss'
})
export class QuizModalComponent implements OnInit {
  quizFormGroup!: FormGroup;

  constructor(
    private _formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<QuizModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { exam: any, linkId: string },
    private quizzesService: QuizzesService,
    private toast: NgToastService
  ) {
  }

  ngOnInit() {
    console.log(this.data.exam)
    this.initializeQuizForm();
  }

  initializeQuizForm() {
    this.quizFormGroup = this._formBuilder.group({
      question: [this.data.exam?.question || '', Validators.required],
      explanation: [this.data.exam?.explanation || '', Validators.required],
      options: this._formBuilder.array(
        this.data.exam?.options?.length > 0 ? this.data.exam.options.map((option: any) => this.createOption(option)) : [
          this.createOption(),
          this.createOption(),
          this.createOption(),
          this.createOption()
        ], oneCorrectOptionValidator()
      ),
      points: [this.data.exam?.points || 1, Validators.required]
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

  isFormValid(): boolean {
    return this.quizFormGroup.valid;
  }

  get isEditMode(): boolean {
    return !!this.data.exam;
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

    console.log(formattedData)

    if (this.isEditMode) {
      if (this.data.exam.id !== undefined) {
        this.quizzesService.apiQuizzesUpdateQuizPut(this.data.exam.id, formattedData).subscribe({
          next: (resp) => {
            this.toast.success('Kuici u perditesua me sukses', 'SUKSES', 3000);
            this.dialogRef.close({success: true, data: resp.data});
          },
          error: (error) => this.toast.danger(error?.error?.message, 'GABIM', 3000)

        });
      } else {
        this.toast.danger('Exam ID is undefined.', 'GABIM', 3000);
      }
    } else {
      this.quizzesService.apiQuizzesPostQuizPost(this.data.linkId,formattedData).subscribe({
        next: (resp) => {
          this.toast.success('Kuici u krijua me sukses', 'SUKSES', 3000);
          this.dialogRef.close({success: true, data: resp.data});
        },
        error: (error) => this.toast.danger(error?.error?.message, 'GABIM', 3000)
      });
    }
  }
}
