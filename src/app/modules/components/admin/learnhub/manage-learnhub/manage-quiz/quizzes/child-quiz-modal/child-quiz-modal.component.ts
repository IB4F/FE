import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { QuizzesService, FileService, QuizType } from '../../../../../../../../api-client';
import { NgToastService } from 'ng-angular-popup';
import { oneCorrectOptionValidator } from '../../../../../../../../helpers/customValidators/option-chek.validator';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSliderModule } from '@angular/material/slider';
import { forkJoin, Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

export interface ChildQuizModalData {
  linkId: string;
  parentQuizId: string;
  quizTypes: QuizType[];
  childQuiz?: any;
  isEditMode?: boolean;
}

@Component({
  selector: 'app-child-quiz-modal',
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
  templateUrl: './child-quiz-modal.component.html',
  styleUrl: './child-quiz-modal.component.scss'
})
export class ChildQuizModalComponent implements OnInit {
  @ViewChild('questionAudioInput', { static: false }) questionAudioInput!: ElementRef<HTMLInputElement>;
  @ViewChild('explanationAudioInput', { static: false }) explanationAudioInput!: ElementRef<HTMLInputElement>;

  quizFormGroup!: FormGroup;
  selectedQuestionAudio: File | null = null;
  selectedExplanationAudio: File | null = null;
  selectedOptionImages: (File | null)[] = [null, null, null, null];

  // Existing audio data
  existingQuestionAudio: { id: string; url: string } | null = null;
  existingExplanationAudio: { id: string; url: string } | null = null;

  // Existing option images data
  existingOptionImages: ({ id: string; url: string } | null)[] = [null, null, null, null];

  constructor(
    private dialogRef: MatDialogRef<ChildQuizModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ChildQuizModalData,
    private _formBuilder: FormBuilder,
    private quizzesService: QuizzesService,
    private fileService: FileService,
    private toast: NgToastService
  ) {}

  ngOnInit(): void {
    this.initializeQuizForm();

    if (this.data.isEditMode && this.data.childQuiz) {
      this.patchFormValues(this.data.childQuiz);
    }
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

    this.quizFormGroup.patchValue({
      quizType: data.quizType,
      question: data.question,
      explanation: data.explanation,
      points: data.points
    });

    // Set existing audio data with full backend URL
    if (data.questionAudioId && data.questionAudioUrl) {
      this.existingQuestionAudio = {
        id: data.questionAudioId,
        url: data.questionAudioUrl
      };
    }

    if (data.explanationAudioId && data.explanationAudioUrl) {
      this.existingExplanationAudio = {
        id: data.explanationAudioId,
        url: data.explanationAudioUrl
      };
    }

    // Set existing option images data
    if (data.options && Array.isArray(data.options)) {
      data.options.forEach((option: any, index: number) => {
        if (option.optionImageId && option.optionImageUrl && index < 4) {
          this.existingOptionImages[index] = {
            id: option.optionImageId,
            url: option.optionImageUrl
          };
        }
      });
    }
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
    return this.data.isEditMode || false;
  }

  // File handling methods
  onQuestionAudioSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedQuestionAudio = file;
      this.existingQuestionAudio = null;
    }
  }

  onExplanationAudioSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedExplanationAudio = file;
      this.existingExplanationAudio = null;
    }
  }

  onOptionImageSelected(event: any, index: number): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedOptionImages[index] = file;
    }
  }

  // Remove existing audio methods
  removeQuestionAudio(): void {
    this.existingQuestionAudio = null;
    this.selectedQuestionAudio = null;
  }

  removeExplanationAudio(): void {
    this.existingExplanationAudio = null;
    this.selectedExplanationAudio = null;
  }

  // Remove existing option image method
  removeOptionImage(index: number): void {
    this.existingOptionImages[index] = null;
    this.selectedOptionImages[index] = null;
  }

  getSelectedQuizTypeName(): string {
    const quizTypeId = this.quizFormGroup.get('quizType')?.value;
    const quizType = this.data.quizTypes.find(type => type.id === quizTypeId);
    return quizType?.name || '';
  }

  shouldShowImageFields(): boolean {
    const quizTypeName = this.getSelectedQuizTypeName();
    return quizTypeName.toLowerCase().includes('imazhe');
  }

  // File upload methods
  private uploadFiles(): Observable<any> {
    const uploadObservables: Observable<any>[] = [];

    // Upload question audio if selected
    if (this.selectedQuestionAudio) {
      uploadObservables.push(
        this.fileService.apiFileUploadAudioPost(this.selectedQuestionAudio)
      );
    } else {
      uploadObservables.push(of(null));
    }

    // Upload explanation audio if selected
    if (this.selectedExplanationAudio) {
      uploadObservables.push(
        this.fileService.apiFileUploadAudioPost(this.selectedExplanationAudio)
      );
    } else {
      uploadObservables.push(of(null));
    }

    // Upload option images if selected and quiz type supports images
    if (this.shouldShowImageFields()) {
      this.selectedOptionImages.forEach((image, index) => {
        if (image) {
          uploadObservables.push(
            this.fileService.apiFileUploadImagePost(image)
          );
        } else {
          uploadObservables.push(of(null));
        }
      });
    } else {
      // Add null observables for options when images are not needed
      for (let i = 0; i < 4; i++) {
        uploadObservables.push(of(null));
      }
    }

    return forkJoin(uploadObservables);
  }

  handleSave(): void {
    if (!this.isFormValid()) return;

    // First upload all files
    this.uploadFiles().pipe(
      switchMap((uploadResults) => {
        const formValue = this.quizFormGroup.value;

        // Extract file IDs from upload results or use existing IDs
        const questionAudioId = uploadResults[0]?.fileId || this.existingQuestionAudio?.id || null;
        const explanationAudioId = uploadResults[1]?.fileId || this.existingExplanationAudio?.id || null;

        // Extract option image IDs
        const optionImageIds = uploadResults.slice(2, 6).map((result: any, index: number) =>
          result?.fileId || this.existingOptionImages[index]?.id || null
        );

        const formattedData: any = {
          ...formValue,
          questionAudioId: questionAudioId,
          explanationAudioId: explanationAudioId,
          options: formValue.options.map((option: any, index: number) => ({
            optionText: option.optionText,
            isCorrect: option.isCorrect,
            optionImageId: optionImageIds[index] || null
          }))
        };

        // Always use child quiz endpoints since this is a child quiz modal
        if (this.isEditMode && this.data.childQuiz?.id) {
          // For updating child quiz, we need to include the parent quiz ID
          return this.quizzesService.apiQuizzesUpdateQuizPut(this.data.childQuiz.id, {
            ...formattedData,
            parentQuizId: this.data.parentQuizId
          });
        } else {
          // For creating new child quiz
          return this.quizzesService.apiQuizzesPostChildQuizPost(
            this.data.linkId,
            this.data.parentQuizId,
            formattedData
          );
        }
      })
    ).subscribe({
      next: (resp) => {
        const message = this.isEditMode ? 'Kuizi i vegjël u përditësua me sukses' : 'Kuizi i vegjël u krijua me sukses';
        this.toast.success(message, 'SUKSES', 3000);
        this.dialogRef.close(true);
      },
      error: (error) => this.toast.danger(error?.error?.message, 'GABIM', 3000)
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
