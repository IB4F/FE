import { Component, Inject, OnInit, ViewChild, ElementRef, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { QuizzesService, FileService, QuizType } from '../../../../../../../../api-client';
import { NgToastService } from 'ng-angular-popup';
import { atLeastOneCorrectOptionValidator } from '../../../../../../../../helpers/customValidators/option-chek.validator';
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
import { QuillModule } from 'ngx-quill';
import {TranslatePipe} from '../../../../../../../../pipes/translate.pipe';

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
    MatTooltipModule,
    QuillModule
  ,
    TranslatePipe],
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

  // Explanation image
  selectedExplanationImage: File | null = null;
  existingExplanationImage: { id: string; url: string } | null = null;

  // Existing audio data
  existingQuestionAudio: { id: string; url: string } | null = null;
  existingExplanationAudio: { id: string; url: string } | null = null;

  // Existing option images data
  existingOptionImages: ({ id: string; url: string } | null)[] = [null, null, null, null];

  isBrowser: boolean;

  // Quill editor configuration
  quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'header': [1, 2, 3, false] }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ]
  };

  constructor(
    private dialogRef: MatDialogRef<ChildQuizModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ChildQuizModalData,
    private _formBuilder: FormBuilder,
    private quizzesService: QuizzesService,
    private fileService: FileService,
    private toast: NgToastService
  ) {
    this.isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  }

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
        ],
        atLeastOneCorrectOptionValidator()
      ),
      points: [1, Validators.required]
    });
  }

  patchFormValues(data: any) {
    const optionsArray = this.quizFormGroup.get('options') as FormArray;
    while (optionsArray.length !== 0) {
      optionsArray.removeAt(0);
    }

    // Reset images arrays
    this.selectedOptionImages = [null, null, null, null];
    this.existingOptionImages = [null, null, null, null];

    data.options.forEach((option: any) => {
      optionsArray.push(this.createOption(option));
    });

    this.quizFormGroup.patchValue({
      quizType: data.quizType,
      question: data.question,
      explanation: data.explanation,
      points: data.points
    });

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

    if (data.explanationImageId && data.explanationImageUrl) {
      this.existingExplanationImage = {
        id: data.explanationImageId,
        url: data.explanationImageUrl
      };
    }

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

  addOption(): void {
    if (this.options.length < 4) {
      this.options.push(this.createOption());
    }
  }

  removeOption(index: number): void {
    if (this.options.length > 2) {
      this.options.removeAt(index);
      this.selectedOptionImages.splice(index, 1);
      this.existingOptionImages.splice(index, 1);
    }
  }

  isFormValid(): boolean {
    const formValid = this.quizFormGroup.valid;
    const imagesValid = this.validateImageOptions();
    return formValid && imagesValid;
  }

  get isEditMode(): boolean {
    return this.data.isEditMode || false;
  }

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

  onExplanationImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedExplanationImage = file;
      this.existingExplanationImage = null;
    }
  }

  onOptionImageSelected(event: any, index: number): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedOptionImages[index] = file;
    }
  }

  removeQuestionAudio(): void {
    this.existingQuestionAudio = null;
    this.selectedQuestionAudio = null;
  }

  removeExplanationAudio(): void {
    this.existingExplanationAudio = null;
    this.selectedExplanationAudio = null;
  }

  removeExplanationImage(): void {
    this.existingExplanationImage = null;
    this.selectedExplanationImage = null;
  }

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

  areImagesRequired(): boolean {
    const quizTypeName = this.getSelectedQuizTypeName();
    return quizTypeName.toLowerCase().includes('imazhe');
  }

  validateImageOptions(): boolean {
    if (!this.areImagesRequired()) {
      return true;
    }
    for (let i = 0; i < this.options.length; i++) {
      const hasSelectedImage = this.selectedOptionImages[i] !== null;
      const hasExistingImage = this.existingOptionImages[i] !== null;
      if (!hasSelectedImage && !hasExistingImage) {
        return false;
      }
    }
    return true;
  }

  getImageValidationError(): string {
    if (!this.areImagesRequired()) {
      return '';
    }
    const missingOptions: number[] = [];
    for (let i = 0; i < this.options.length; i++) {
      const hasSelectedImage = this.selectedOptionImages[i] !== null;
      const hasExistingImage = this.existingOptionImages[i] !== null;
      if (!hasSelectedImage && !hasExistingImage) {
        missingOptions.push(i + 1);
      }
    }
    if (missingOptions.length > 0) {
      return `Opsionet ${missingOptions.join(', ')} duhet të kenë imazhe.`;
    }
    return '';
  }

  isOptionMissingImage(index: number): boolean {
    if (!this.areImagesRequired()) {
      return false;
    }
    const hasSelectedImage = this.selectedOptionImages[index] !== null;
    const hasExistingImage = this.existingOptionImages[index] !== null;
    return !hasSelectedImage && !hasExistingImage;
  }

  private uploadFiles(): Observable<any> {
    const uploadObservables: Observable<any>[] = [];

    // [0] Question audio
    if (this.selectedQuestionAudio) {
      uploadObservables.push(this.fileService.apiFileUploadAudioPost(this.selectedQuestionAudio));
    } else {
      uploadObservables.push(of(null));
    }

    // [1] Explanation audio
    if (this.selectedExplanationAudio) {
      uploadObservables.push(this.fileService.apiFileUploadAudioPost(this.selectedExplanationAudio));
    } else {
      uploadObservables.push(of(null));
    }

    // [2] Explanation image
    if (this.selectedExplanationImage) {
      uploadObservables.push(this.fileService.apiFileUploadImagePost(this.selectedExplanationImage));
    } else {
      uploadObservables.push(of(null));
    }

    // [3..3+options.length] Option images
    if (this.shouldShowImageFields()) {
      for (let i = 0; i < this.options.length; i++) {
        const image = this.selectedOptionImages[i];
        if (image) {
          uploadObservables.push(this.fileService.apiFileUploadImagePost(image));
        } else {
          uploadObservables.push(of(null));
        }
      }
    } else {
      for (let i = 0; i < this.options.length; i++) {
        uploadObservables.push(of(null));
      }
    }

    return forkJoin(uploadObservables);
  }

  handleSave(): void {
    if (!this.isFormValid()) return;

    this.uploadFiles().pipe(
      switchMap((uploadResults) => {
        const formValue = this.quizFormGroup.value;

        const questionAudioId = uploadResults[0]?.fileId || this.existingQuestionAudio?.id || null;
        const explanationAudioId = uploadResults[1]?.fileId || this.existingExplanationAudio?.id || null;
        const explanationImageId = uploadResults[2]?.fileId || this.existingExplanationImage?.id || null;

        const optionImageIds = uploadResults.slice(3, 3 + this.options.length).map((result: any, index: number) =>
          result?.fileId || this.existingOptionImages[index]?.id || null
        );

        const formattedData: any = {
          ...formValue,
          questionAudioId,
          explanationAudioId,
          explanationImageId,
          options: formValue.options.map((option: any, index: number) => ({
            optionText: option.optionText,
            isCorrect: option.isCorrect,
            optionImageId: optionImageIds[index] || null
          }))
        };

        if (this.isEditMode && this.data.childQuiz?.id) {
          return this.quizzesService.apiQuizzesUpdateQuizPut(this.data.childQuiz.id, {
            ...formattedData,
            parentQuizId: this.data.parentQuizId
          });
        } else {
          return this.quizzesService.apiQuizzesPostChildQuizPost(
            this.data.linkId,
            this.data.parentQuizId,
            formattedData
          );
        }
      })
    ).subscribe({
      next: () => {
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