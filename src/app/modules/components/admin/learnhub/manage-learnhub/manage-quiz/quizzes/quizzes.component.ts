import {Component, DestroyRef, inject, OnInit, PLATFORM_ID} from '@angular/core';
import {isPlatformBrowser} from '@angular/common';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {CommonModule, Location} from "@angular/common";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {MatTooltipModule} from "@angular/material/tooltip";
import {ActivatedRoute, ParamMap} from "@angular/router";
import {FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {DetailsService, QuizType, QuizzesService, FileService} from '../../../../../../../api-client';
import {NgToastService} from "ng-angular-popup";
import {atLeastOneCorrectOptionValidator} from "../../../../../../../helpers/customValidators/option-chek.validator";
import {MatDialogModule, MatDialog} from "@angular/material/dialog";
import {MatCheckboxModule} from "@angular/material/checkbox";
import {MatInputModule} from "@angular/material/input";
import {MatSelectModule} from "@angular/material/select";
import {MatOptionModule} from "@angular/material/core";
import {MatRadioModule} from "@angular/material/radio";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatSliderModule} from "@angular/material/slider";
import {forkJoin, Observable, of} from "rxjs";
import {switchMap} from "rxjs/operators";
import {ViewChild, ElementRef} from "@angular/core";
import {environment} from "@env";
import {ConfirmModalComponent} from "../../../../../../shared/components/confirm-modal/confirm-modal.component";
import {QuillModule} from "ngx-quill";
import {TranslatePipe} from '../../../../../../../pipes/translate.pipe';

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
    MatTooltipModule,
    QuillModule
  ,
    TranslatePipe],
  templateUrl: './quizzes.component.html',
  styleUrl: './quizzes.component.scss'
})
export class QuizzesComponent implements OnInit {
  @ViewChild('questionAudioInput', {static: false}) questionAudioInput!: ElementRef<HTMLInputElement>;
  @ViewChild('explanationAudioInput', {static: false}) explanationAudioInput!: ElementRef<HTMLInputElement>;

  quizId: string | null = null;
  linkId!: string;
  quizFormGroup!: FormGroup;

  quizTypes: QuizType[] = [];
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

  // Child quiz properties
  childQuizzes: any[] = [];
  showChildQuizzesSection: boolean = false;

  private destroyRef = inject(DestroyRef);

  // Image preview properties
  showImagePreview: boolean = false;
  previewImageUrl: string = '';
  previewImageTitle: string = '';

  isBrowser: boolean;

  // Quill editor configuration
  quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{'header': [1, 2, 3, false]}],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      [{'color': []}, {'background': []}],
      [{'align': []}],
      ['link'],
      ['clean']
    ]
  };

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private _formBuilder: FormBuilder,
    private quizzesService: QuizzesService,
    private fileService: FileService,
    private toast: NgToastService,
    private _detailsService: DetailsService,
    private dialog: MatDialog,
  ) {
    this.isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  }

  ngOnInit(): void {
    this.loadCombos();
    this.initializeQuizForm();

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params: ParamMap) => {
      this.linkId = params.get('linkId') as string;
      this.quizId = params.get('quizId');
      if (this.isEditMode) {
        this.loadQuizData(this.quizId as string);
      }
    });
  }

  loadQuizData(id: string): void {
    this.quizzesService.apiQuizzesGetSingleQuizGet(id).subscribe({
      next: (resp) => {
        this.patchFormValues(resp);
        this.childQuizzes = resp.childQuizzes || [];
        this.showChildQuizzesSection = true;
      },
      error: (error) => {
        this.toast.danger(error?.error?.message, 'GABIM', 3000);
        this.goBack();
      }
    });
  }

  loadChildQuizzes(): void {
    if (this.quizId) {
      this.quizzesService.apiQuizzesGetChildQuizzesGet(this.quizId).subscribe({
        next: (result) => {
          this.childQuizzes = result || [];
        },
        error: (error) => {
          this.toast.danger(error?.error?.message, 'GABIM', 3000);
        }
      });
    }
  }

  canAddChildQuizzes(): boolean {
    return this.isEditMode && this.childQuizzes.length < 3;
  }

  getChildQuizzesDisabledReason(): string {
    if (!this.isEditMode) {
      return 'Ju duhet të ruani kuizin kryesor para se të shtoni nën-kuize';
    }
    if (this.childQuizzes.length >= 3) {
      return 'Ju keni arritur numrin maksimal të nën-kuizeve (3)';
    }
    return '';
  }

  openAddChildQuizModal(): void {
    if (!this.canAddChildQuizzes()) {
      this.toast.warning(this.getChildQuizzesDisabledReason(), 'KUJDES', 3000);
      return;
    }

    import('./child-quiz-modal/child-quiz-modal.component').then(({ChildQuizModalComponent}) => {
      const dialogRef = this.dialog.open(ChildQuizModalComponent, {
        width: '90%',
        maxWidth: '1200px',
        height: '90vh',
        data: {
          linkId: this.linkId,
          parentQuizId: this.quizId,
          quizTypes: this.quizTypes
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.loadChildQuizzes();
        }
      });
    });
  }

  editChildQuiz(childQuiz: any): void {
    import('./child-quiz-modal/child-quiz-modal.component').then(({ChildQuizModalComponent}) => {
      const dialogRef = this.dialog.open(ChildQuizModalComponent, {
        width: '90%',
        maxWidth: '1200px',
        height: '90vh',
        data: {
          linkId: this.linkId,
          parentQuizId: this.quizId,
          quizTypes: this.quizTypes,
          childQuiz: childQuiz,
          isEditMode: true
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.loadChildQuizzes();
        }
      });
    });
  }

  deleteChildQuiz(childQuiz: any): void {
    const dialogRef = this.dialog.open(ConfirmModalComponent, {
      data: {
        title: 'Fshi Nën-Kuizin',
        message: 'A jeni të sigurt që dëshironi të fshini nën-kuizin?',
        id: childQuiz.id
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.success) {
        this.quizzesService.apiQuizzesDeleteQuizDelete(childQuiz.id).subscribe({
          next: () => {
            this.loadChildQuizzes();
            this.toast.success('Kuizi i u fshi me sukses', 'SUKSES', 3000);
          },
          error: () => {
            this.toast.danger('Ndodhi një gabim gjatë fshirjes së kuizit', 'GABIM', 3000);
          }
        });
      }
    })
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

  private loadCombos() {
    this.getQuizTypeList();
  }

  private getQuizTypeList() {
    this._detailsService.apiDetailsGetQuizTypesGet().subscribe({
      next: res => { this.quizTypes = res; },
      error: () => { this.toast.danger('Gabim në ngarkimin e llojeve të kuizeve', 'GABIM', 3000); }
    })
  }

  isFormValid(): boolean {
    const formValid = this.quizFormGroup.valid;
    const imagesValid = this.validateImageOptions();
    return formValid && imagesValid;
  }

  get isEditMode(): boolean {
    return !!this.quizId;
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
    const quizType = this.quizTypes.find(type => type.id === quizTypeId);
    return quizType?.name || '';
  }

  getQuizTypeName(quizTypeId: string): string {
    const quizType = this.quizTypes.find(type => type.id === quizTypeId);
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

  handleButtonClick(): void {
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

        if (this.isEditMode && this.quizId) {
          return this.quizzesService.apiQuizzesUpdateQuizPut(this.quizId, formattedData);
        } else {
          return this.quizzesService.apiQuizzesPostQuizPost(this.linkId, formattedData);
        }
      })
    ).subscribe({
      next: () => {
        const message = this.isEditMode ? 'Kuici u perditesua me sukses' : 'Kuici u krijua me sukses';
        this.toast.success(message, 'SUKSES', 3000);
        this.goBack();
      },
      error: (error) => this.toast.danger(error?.error?.message, 'GABIM', 3000)
    });
  }

  goBack(): void {
    this.location.back();
  }

  previewImage(imageUrl: string, title: string): void {
    if (imageUrl) {
      this.previewImageUrl = imageUrl;
      this.previewImageTitle = title;
      this.showImagePreview = true;
    }
  }

  previewOptionImage(index: number): void {
    const optionImage = this.existingOptionImages[index];
    if (optionImage?.url) {
      this.previewImage(optionImage.url, `Option ${index + 1}`);
    }
  }

  closeImagePreview(): void {
    this.showImagePreview = false;
    this.previewImageUrl = '';
    this.previewImageTitle = '';
  }
}