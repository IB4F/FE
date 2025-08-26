import {Component, OnInit} from '@angular/core';
import {CommonModule, Location} from "@angular/common";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {MatTooltipModule} from "@angular/material/tooltip";
import {ActivatedRoute, ParamMap} from "@angular/router";
import {FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {DetailsService, QuizType, QuizzesService, FileService} from '../../../../../../../api-client';
import {NgToastService} from "ng-angular-popup";
import {oneCorrectOptionValidator} from "../../../../../../../helpers/customValidators/option-chek.validator";
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
  @ViewChild('questionAudioInput', {static: false}) questionAudioInput!: ElementRef<HTMLInputElement>;
  @ViewChild('explanationAudioInput', {static: false}) explanationAudioInput!: ElementRef<HTMLInputElement>;

  quizId: string | null = null;
  linkId!: string;
  quizFormGroup!: FormGroup;

  quizTypes: QuizType[] = [];
  selectedQuestionAudio: File | null = null;
  selectedExplanationAudio: File | null = null;
  selectedOptionImages: (File | null)[] = [null, null, null, null];

  // Existing audio data
  existingQuestionAudio: { id: string; url: string } | null = null;
  existingExplanationAudio: { id: string; url: string } | null = null;

  // Existing option images data
  existingOptionImages: ({ id: string; url: string } | null)[] = [null, null, null, null];

  // Child quiz properties
  childQuizzes: any[] = [];
  showChildQuizzesSection: boolean = false;

  // Image preview properties
  showImagePreview: boolean = false;
  previewImageUrl: string = '';
  previewImageTitle: string = '';

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
        this.childQuizzes = resp.childQuizzes || [];
        // Show child quizzes section after parent quiz is loaded
        this.showChildQuizzesSection = true;
      },
      error: (error) => {
        this.toast.danger(error?.error?.message, 'GABIM', 3000);
        this.goBack();
      }
    });
  }

  // Load child quizzes for the current parent quiz
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

  // Check if child quizzes can be added (parent must have an ID and not exceed max limit)
  canAddChildQuizzes(): boolean {
    return this.isEditMode && this.childQuizzes.length < 3;
  }

  // Get the reason why child quizzes cannot be added
  getChildQuizzesDisabledReason(): string {
    if (!this.isEditMode) {
      return 'Ju duhet të ruani kuizin kryesor para se të shtoni nën-kuize';
    }
    if (this.childQuizzes.length >= 3) {
      return 'Ju keni arritur numrin maksimal të nën-kuizeve (3)';
    }
    return '';
  }

  // Open modal to add child quiz
  openAddChildQuizModal(): void {
    if (!this.canAddChildQuizzes()) {
      this.toast.warning(this.getChildQuizzesDisabledReason(), 'KUJDES', 3000);
      return;
    }

    // Import the modal component dynamically
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

  // Edit child quiz
  editChildQuiz(childQuiz: any): void {
    // Import the modal component dynamically
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

  // Delete child quiz
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

  // File handling methods
  onQuestionAudioSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedQuestionAudio = file;
      // Clear existing audio when new file is selected
      this.existingQuestionAudio = null;
    }
  }

  onExplanationAudioSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedExplanationAudio = file;
      // Clear existing audio when new file is selected
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

  handleButtonClick(): void {
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

        if (this.isEditMode && this.quizId) {
          return this.quizzesService.apiQuizzesUpdateQuizPut(this.quizId, formattedData);
        } else {
          return this.quizzesService.apiQuizzesPostQuizPost(this.linkId, formattedData);
        }
      })
    ).subscribe({
      next: (resp) => {
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

  // Image preview methods
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
