import {Component, DestroyRef, inject, OnInit, PLATFORM_ID} from '@angular/core';
import {isPlatformBrowser} from '@angular/common';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {CommonModule, Location} from "@angular/common";
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
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

  // Question image
  selectedQuestionImage: File | null = null;
  selectedQuestionImagePreviewUrl: string | null = null;
  existingQuestionImage: { id: string; url: string } | null = null;

  // Explanation image
  selectedExplanationImage: File | null = null;
  selectedExplanationImagePreviewUrl: string | null = null;
  existingExplanationImage: { id: string; url: string } | null = null;

  // Existing audio data
  existingQuestionAudio: { id: string; url: string } | null = null;
  existingExplanationAudio: { id: string; url: string } | null = null;

  // Selected audio preview URLs
  selectedQuestionAudioPreviewUrl: string | null = null;
  selectedExplanationAudioPreviewUrl: string | null = null;

  // Existing option images data
  existingOptionImages: ({ id: string; url: string } | null)[] = [null, null, null, null];
  selectedOptionImagePreviewUrls: (string | null)[] = [null, null, null, null];

  // DnD image preview URLs
  dndSpellImagePreviewUrl: string | null = null;
  dndMatchPairPreviewUrls: (string | null)[] = [];

  // Child quiz properties
  childQuizzes: any[] = [];
  showChildQuizzesSection: boolean = false;

  // Child quiz inline form
  showChildQuizForm = false;
  editingChildQuizId: string | null = null;
  childQuizFormGroup!: FormGroup;
  cqSelectedQuestionAudio: File | null = null;
  cqSelectedExplanationAudio: File | null = null;
  cqSelectedExplanationImage: File | null = null;
  cqSelectedQuestionImage: File | null = null;
  cqSelectedOptionImages: (File | null)[] = [null, null, null, null];
  cqExistingQuestionAudio: { id: string; url: string } | null = null;
  cqExistingQuestionImage: { id: string; url: string } | null = null;
  cqExistingExplanationAudio: { id: string; url: string } | null = null;
  cqExistingExplanationImage: { id: string; url: string } | null = null;
  cqExistingOptionImages: ({ id: string; url: string } | null)[] = [null, null, null, null];
  cqDndSpellImageFile: File | null = null;
  cqExistingDndSpellImageId: string | null = null;
  cqExistingDndSpellImageUrl: string | null = null;

  // Preview URLs for child quiz selected files
  cqSelectedQuestionImagePreviewUrl: string | null = null;
  cqSelectedExplanationImagePreviewUrl: string | null = null;
  cqSelectedOptionImagePreviewUrls: (string | null)[] = [null, null, null, null];
  cqDndSpellImagePreviewUrl: string | null = null;
  cqDndMatchPairPreviewUrls: (string | null)[] = [];

  // Selected audio preview URLs for child quiz
  cqSelectedQuestionAudioPreviewUrl: string | null = null;
  cqSelectedExplanationAudioPreviewUrl: string | null = null;

  private destroyRef = inject(DestroyRef);

  // Image preview properties
  showImagePreview: boolean = false;
  previewImageUrl: string = '';
  previewImageTitle: string = '';

  // Quiz preview
  showQuizPreview: boolean = false;

  // Child quiz preview
  showChildQuizPreview: boolean = false;
  previewingChildQuiz: any = null;

  // DnD state
  dndSpellImageFile: File | null = null;
  existingDndSpellImageId: string | null = null;
  existingDndSpellImageUrl: string | null = null;

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
    private sanitizer: DomSanitizer,
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

  openChildQuizForm(): void {
    if (!this.canAddChildQuizzes()) {
      this.toast.warning(this.getChildQuizzesDisabledReason(), 'KUJDES', 3000);
      return;
    }
    this.editingChildQuizId = null;
    this.resetCqFormState();
    this.initChildQuizForm();
    this.showChildQuizForm = true;
  }

  openEditChildQuizInline(childQuiz: any): void {
    this.editingChildQuizId = childQuiz.id;
    this.resetCqFormState();
    this.initChildQuizForm();
    this.patchChildQuizFormValues(childQuiz);
    this.showChildQuizForm = true;
  }

  closeChildQuizForm(): void {
    this.showChildQuizForm = false;
    this.editingChildQuizId = null;
  }

  private resetCqFormState(): void {
    this.cqSelectedQuestionAudio = null;
    this.cqSelectedQuestionImage = null;
    this.cqSelectedExplanationAudio = null;
    this.cqSelectedExplanationImage = null;
    this.cqSelectedOptionImages = [null, null, null, null];
    this.cqExistingQuestionAudio = null;
    this.cqExistingQuestionImage = null;
    this.cqExistingExplanationAudio = null;
    this.cqExistingExplanationImage = null;
    this.cqExistingOptionImages = [null, null, null, null];
    this.cqDndSpellImageFile = null;
    this.cqExistingDndSpellImageId = null;
    this.cqExistingDndSpellImageUrl = null;
    this.cqSelectedQuestionImagePreviewUrl = null;
    this.cqSelectedExplanationImagePreviewUrl = null;
    this.cqSelectedOptionImagePreviewUrls = [null, null, null, null];
    this.cqDndSpellImagePreviewUrl = null;
    this.cqDndMatchPairPreviewUrls = [];
    this.cqSelectedQuestionAudioPreviewUrl = null;
    this.cqSelectedExplanationAudioPreviewUrl = null;
  }

  private initChildQuizForm(): void {
    this.childQuizFormGroup = this._formBuilder.group({
      quizType: ['', Validators.required],
      question: ['', Validators.required],
      explanation: ['', Validators.required],
      options: this._formBuilder.array(
        [this.createOption(), this.createOption()],
        atLeastOneCorrectOptionValidator()
      ),
      points: [1, Validators.required],
      dndSpellWord:         [''],
      dndSpellLetters:      [''],
      dndSpellHint:         [''],
      dndOrderTiles:        this._formBuilder.array([]),
      dndOrderCorrectOrder: [''],
      dndMatchPairs:        this._formBuilder.array([]),
    });
  }

  private patchChildQuizFormValues(data: any): void {
    const optionsArray = this.childQuizFormGroup.get('options') as FormArray;
    while (optionsArray.length) optionsArray.removeAt(0);
    data.options?.forEach((o: any) => optionsArray.push(this.createOption(o)));

    this.childQuizFormGroup.patchValue({
      quizType:    data.quizType,
      question:    data.question,
      explanation: data.explanation,
      points:      data.points
    });

    if (data.questionAudioId && data.questionAudioUrl)
      this.cqExistingQuestionAudio = { id: data.questionAudioId, url: data.questionAudioUrl };
    if (data.questionImageId && data.questionImageUrl)
      this.cqExistingQuestionImage = { id: data.questionImageId, url: data.questionImageUrl };
    if (data.explanationAudioId && data.explanationAudioUrl)
      this.cqExistingExplanationAudio = { id: data.explanationAudioId, url: data.explanationAudioUrl };
    if (data.explanationImageId && data.explanationImageUrl)
      this.cqExistingExplanationImage = { id: data.explanationImageId, url: data.explanationImageUrl };

    data.options?.forEach((o: any, i: number) => {
      if (o.optionImageId && o.optionImageUrl && i < 4)
        this.cqExistingOptionImages[i] = { id: o.optionImageId, url: o.optionImageUrl };
    });

    this.cqDndOrderTiles.clear();
    this.cqDndMatchPairs.clear();

    if (data.dndSpell) {
      this.childQuizFormGroup.patchValue({
        dndSpellWord:    data.dndSpell.word,
        dndSpellLetters: data.dndSpell.letters?.join(', ') ?? '',
        dndSpellHint:    data.dndSpell.hint,
      });
      this.cqExistingDndSpellImageId  = data.dndSpell.imageFileId ?? null;
      this.cqExistingDndSpellImageUrl = data.dndSpell.imageUrl    ?? null;
    }

    if (data.dndOrder) {
      data.dndOrder.tiles.forEach((tile: any) => {
        this.cqDndOrderTiles.push(this._formBuilder.group({ id: [tile.id], text: [tile.text] }));
      });
      const tileIds = data.dndOrder.tiles.map((t: any) => t.id);
      const indices = (data.dndOrder.correctOrder as string[]).map((uuid: string) => tileIds.indexOf(uuid));
      this.childQuizFormGroup.patchValue({ dndOrderCorrectOrder: indices.join(',') });
    }

    if (data.dndMatch) {
      data.dndMatch.pairs.forEach((pair: any) => {
        this.cqDndMatchPairs.push(this._formBuilder.group({
          word:                [pair.word],
          existingImageFileId: [pair.imageFileId ?? null],
          existingImageUrl:    [pair.imageUrl    ?? null],
          imageFile:           [null]
        }));
      });
    }
  }

  get cqOptions(): FormArray {
    return this.childQuizFormGroup?.get('options') as FormArray;
  }

  cqAddOption(): void {
    if (this.cqOptions.length < 4) this.cqOptions.push(this.createOption());
  }

  cqRemoveOption(i: number): void {
    if (this.cqOptions.length > 2) {
      this.cqOptions.removeAt(i);
      this.cqSelectedOptionImages.splice(i, 1);
      this.cqExistingOptionImages.splice(i, 1);
    }
  }

  get cqDndOrderTiles(): FormArray {
    return this.childQuizFormGroup?.get('dndOrderTiles') as FormArray;
  }

  get cqDndMatchPairs(): FormArray {
    return this.childQuizFormGroup?.get('dndMatchPairs') as FormArray;
  }

  cqGetSelectedQuizTypeName(): string {
    const id = this.childQuizFormGroup?.get('quizType')?.value;
    return this.quizTypes.find(t => t.id === id)?.name || '';
  }

  cqIsDragSpell(): boolean { return this.cqGetSelectedQuizTypeName() === 'DragSpell'; }
  cqIsDragOrder(): boolean { return this.cqGetSelectedQuizTypeName() === 'DragOrder'; }
  cqIsDragMatch(): boolean { return this.cqGetSelectedQuizTypeName() === 'DragMatch'; }
  cqIsDragType():  boolean { return this.cqIsDragSpell() || this.cqIsDragOrder() || this.cqIsDragMatch(); }

  cqShouldShowImageFields(): boolean {
    return this.cqGetSelectedQuizTypeName().toLowerCase().includes('imazhe');
  }

  cqValidateImageOptions(): boolean {
    if (!this.cqShouldShowImageFields()) return true;
    for (let i = 0; i < this.cqOptions.length; i++) {
      if (!this.cqSelectedOptionImages[i] && !this.cqExistingOptionImages[i]) return false;
    }
    return true;
  }

  cqIsFormValid(): boolean {
    if (this.cqIsDragType()) {
      return ['quizType', 'question', 'explanation', 'points']
        .every(f => this.childQuizFormGroup?.get(f)?.valid);
    }
    return !!this.childQuizFormGroup?.valid && this.cqValidateImageOptions();
  }

  cqAddDndOrderTile(): void {
    this.cqDndOrderTiles.push(this._formBuilder.group({ id: [''], text: [''] }));
  }

  cqRemoveDndOrderTile(i: number): void {
    this.cqDndOrderTiles.removeAt(i);
  }

  cqAddDndMatchPair(): void {
    this.cqDndMatchPairs.push(this._formBuilder.group({
      word: [''], existingImageFileId: [null], existingImageUrl: [null], imageFile: [null]
    }));
  }

  cqRemoveDndMatchPair(i: number): void {
    this.cqDndMatchPairs.removeAt(i);
  }

  cqOnDndSpellImageSelected(e: any): void {
    const f = e.target.files[0];
    if (f) {
      this.cqDndSpellImageFile = f;
      this.cqDndSpellImagePreviewUrl = URL.createObjectURL(f);
      this.cqExistingDndSpellImageId = null;
      this.cqExistingDndSpellImageUrl = null;
    }
  }

  cqRemoveDndSpellImage(): void {
    this.cqDndSpellImageFile = null;
    this.cqDndSpellImagePreviewUrl = null;
    this.cqExistingDndSpellImageId = null;
    this.cqExistingDndSpellImageUrl = null;
  }

  cqOnDndMatchPairImageSelected(e: any, i: number): void {
    const f = e.target.files[0];
    if (f) {
      this.cqDndMatchPairs.at(i).get('imageFile')?.setValue(f);
      this.cqDndMatchPairs.at(i).get('existingImageFileId')?.setValue(null);
      this.cqDndMatchPairs.at(i).get('existingImageUrl')?.setValue(null);
      this.cqDndMatchPairPreviewUrls[i] = URL.createObjectURL(f);
    }
  }

  cqRemoveDndMatchPairImage(i: number): void {
    this.cqDndMatchPairs.at(i).get('imageFile')?.setValue(null);
    this.cqDndMatchPairs.at(i).get('existingImageFileId')?.setValue(null);
    this.cqDndMatchPairs.at(i).get('existingImageUrl')?.setValue(null);
    this.cqDndMatchPairPreviewUrls[i] = null;
  }

  cqOnQuestionAudioSelected(e: any): void {
    const f = e.target.files[0];
    if (f) {
      this.cqSelectedQuestionAudio = f;
      this.cqSelectedQuestionAudioPreviewUrl = URL.createObjectURL(f);
      this.cqExistingQuestionAudio = null;
    }
  }

  cqOnExplanationAudioSelected(e: any): void {
    const f = e.target.files[0];
    if (f) {
      this.cqSelectedExplanationAudio = f;
      this.cqSelectedExplanationAudioPreviewUrl = URL.createObjectURL(f);
      this.cqExistingExplanationAudio = null;
    }
  }

  cqOnExplanationImageSelected(e: any): void {
    const f = e.target.files[0];
    if (f) {
      this.cqSelectedExplanationImage = f;
      this.cqSelectedExplanationImagePreviewUrl = URL.createObjectURL(f);
      this.cqExistingExplanationImage = null;
    }
  }

  cqOnOptionImageSelected(e: any, i: number): void {
    const f = e.target.files[0];
    if (f) {
      this.cqSelectedOptionImages[i] = f;
      this.cqSelectedOptionImagePreviewUrls[i] = URL.createObjectURL(f);
    }
  }

  cqOnQuestionImageSelected(e: any): void {
    const f = e.target.files[0];
    if (f) {
      this.cqSelectedQuestionImage = f;
      this.cqSelectedQuestionImagePreviewUrl = URL.createObjectURL(f);
      this.cqExistingQuestionImage = null;
    }
  }

  cqRemoveQuestionAudio(): void { this.cqExistingQuestionAudio = null; this.cqSelectedQuestionAudio = null; this.cqSelectedQuestionAudioPreviewUrl = null; }
  cqRemoveQuestionImage(): void { this.cqExistingQuestionImage = null; this.cqSelectedQuestionImage = null; this.cqSelectedQuestionImagePreviewUrl = null; }
  cqRemoveExplanationAudio(): void { this.cqExistingExplanationAudio = null; this.cqSelectedExplanationAudio = null; this.cqSelectedExplanationAudioPreviewUrl = null; }
  cqRemoveExplanationImage(): void { this.cqExistingExplanationImage = null; this.cqSelectedExplanationImage = null; this.cqSelectedExplanationImagePreviewUrl = null; }
  cqRemoveOptionImage(i: number): void { this.cqExistingOptionImages[i] = null; this.cqSelectedOptionImages[i] = null; this.cqSelectedOptionImagePreviewUrls[i] = null; }

  private cqUploadFiles(): Observable<any> {
    // [0] questionAudio  [1] expAudio  [2] questionImage  [3] expImage
    // [4] dndSpellImage (DragSpell) | dndMatchPair images (DragMatch) | optionImages (standard)
    const obs: Observable<any>[] = [
      this.cqSelectedQuestionAudio    ? this.fileService.apiFileUploadAudioPost(this.cqSelectedQuestionAudio)    : of(null),
      this.cqSelectedExplanationAudio ? this.fileService.apiFileUploadAudioPost(this.cqSelectedExplanationAudio) : of(null),
      this.cqSelectedQuestionImage    ? this.fileService.apiFileUploadImagePost(this.cqSelectedQuestionImage)    : of(null),
      this.cqSelectedExplanationImage ? this.fileService.apiFileUploadImagePost(this.cqSelectedExplanationImage) : of(null),
    ];

    if (this.cqIsDragSpell()) {
      obs.push(this.cqDndSpellImageFile ? this.fileService.apiFileUploadImagePost(this.cqDndSpellImageFile) : of(null));
    } else if (this.cqIsDragMatch()) {
      this.cqDndMatchPairs.controls.forEach(ctrl => {
        const f = ctrl.get('imageFile')?.value;
        obs.push(f ? this.fileService.apiFileUploadImagePost(f) : of(null));
      });
    } else {
      for (let i = 0; i < this.cqOptions.length; i++) {
        const img = this.cqShouldShowImageFields() ? this.cqSelectedOptionImages[i] : null;
        obs.push(img ? this.fileService.apiFileUploadImagePost(img) : of(null));
      }
    }
    return forkJoin(obs);
  }

  cqHandleSave(): void {
    if (!this.cqIsFormValid()) return;

    this.cqUploadFiles().pipe(
      switchMap(results => {
        const fv = this.childQuizFormGroup.value;

        const payload: any = {
          quizType:           fv.quizType,
          question:           fv.question,
          explanation:        fv.explanation,
          points:             fv.points,
          questionAudioId:    results[0]?.fileId || this.cqExistingQuestionAudio?.id    || null,
          explanationAudioId: results[1]?.fileId || this.cqExistingExplanationAudio?.id || null,
          questionImageId:    results[2]?.fileId || this.cqExistingQuestionImage?.id    || null,
          explanationImageId: results[3]?.fileId || this.cqExistingExplanationImage?.id || null,
          options:   [],
          dndSpell:  null,
          dndOrder:  null,
          dndMatch:  null,
        };

        if (this.cqIsDragSpell()) {
          payload.dndSpell = {
            word:        fv.dndSpellWord,
            letters:     (fv.dndSpellLetters as string).split(',').map((l: string) => l.trim()).filter(Boolean),
            hint:        fv.dndSpellHint,
            imageFileId: results[4]?.fileId || this.cqExistingDndSpellImageId || null,
          };
        } else if (this.cqIsDragOrder()) {
          payload.dndOrder = {
            tiles:        this.cqDndOrderTiles.controls.map(c => ({ text: c.get('text')?.value })),
            correctOrder: (fv.dndOrderCorrectOrder as string).split(',').map((s: string) => parseInt(s.trim(), 10)),
          };
        } else if (this.cqIsDragMatch()) {
          payload.dndMatch = {
            pairs: this.cqDndMatchPairs.controls.map((c, i) => ({
              word:        c.get('word')?.value,
              imageFileId: results[4 + i]?.fileId || c.get('existingImageFileId')?.value || null,
            })),
          };
        } else {
          const optionImageIds = results.slice(4, 4 + this.cqOptions.length)
            .map((r: any, i: number) => r?.fileId || this.cqExistingOptionImages[i]?.id || null);
          payload.options = fv.options.map((o: any, i: number) => ({
            optionText:    o.optionText,
            isCorrect:     o.isCorrect,
            optionImageId: optionImageIds[i] || null
          }));
        }

        if (this.editingChildQuizId) {
          return this.quizzesService.apiQuizzesUpdateQuizPut(this.editingChildQuizId,
            { ...payload, parentQuizId: this.quizId });
        } else {
          return this.quizzesService.apiQuizzesPostChildQuizPost(this.linkId, this.quizId!, payload);
        }
      })
    ).subscribe({
      next: () => {
        this.toast.success(
          this.editingChildQuizId ? 'Nën-kuizi u përditësua me sukses' : 'Nën-kuizi u shtua me sukses',
          'SUKSES', 3000
        );
        this.closeChildQuizForm();
        this.loadChildQuizzes();
      },
      error: err => this.toast.danger(err?.error?.message, 'GABIM', 3000)
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
      points: [1, Validators.required],
      // DragSpell
      dndSpellWord:    [''],
      dndSpellLetters: [''],
      dndSpellHint:    [''],
      // DragOrder
      dndOrderTiles:        this._formBuilder.array([]),
      dndOrderCorrectOrder: [''],
      // DragMatch
      dndMatchPairs: this._formBuilder.array([]),
    });
  }

  get dndOrderTiles(): FormArray {
    return this.quizFormGroup.get('dndOrderTiles') as FormArray;
  }

  get dndMatchPairs(): FormArray {
    return this.quizFormGroup.get('dndMatchPairs') as FormArray;
  }

  isDragSpell(): boolean { return this.getSelectedQuizTypeName() === 'DragSpell'; }
  isDragOrder(): boolean { return this.getSelectedQuizTypeName() === 'DragOrder'; }
  isDragMatch(): boolean { return this.getSelectedQuizTypeName() === 'DragMatch'; }
  isDragType(): boolean  { return this.isDragSpell() || this.isDragOrder() || this.isDragMatch(); }

  addDndOrderTile(): void {
    this.dndOrderTiles.push(this._formBuilder.group({ id: [''], text: [''] }));
  }

  removeDndOrderTile(i: number): void {
    this.dndOrderTiles.removeAt(i);
  }

  addDndMatchPair(): void {
    this.dndMatchPairs.push(this._formBuilder.group({
      word:                [''],
      existingImageFileId: [null],
      existingImageUrl:    [null],
      imageFile:           [null]
    }));
  }

  removeDndMatchPair(i: number): void {
    this.dndMatchPairs.removeAt(i);
  }

  onDndSpellImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.dndSpellImageFile = file;
      this.dndSpellImagePreviewUrl = URL.createObjectURL(file);
      this.existingDndSpellImageId = null;
      this.existingDndSpellImageUrl = null;
    }
  }

  removeDndSpellImage(): void {
    this.dndSpellImageFile = null;
    this.dndSpellImagePreviewUrl = null;
    this.existingDndSpellImageId = null;
    this.existingDndSpellImageUrl = null;
  }

  onDndMatchPairImageSelected(event: any, i: number): void {
    const file = event.target.files[0];
    if (file) {
      this.dndMatchPairs.at(i).get('imageFile')?.setValue(file);
      this.dndMatchPairs.at(i).get('existingImageFileId')?.setValue(null);
      this.dndMatchPairs.at(i).get('existingImageUrl')?.setValue(null);
      this.dndMatchPairPreviewUrls[i] = URL.createObjectURL(file);
    }
  }

  removeDndMatchPairImage(i: number): void {
    this.dndMatchPairs.at(i).get('imageFile')?.setValue(null);
    this.dndMatchPairs.at(i).get('existingImageFileId')?.setValue(null);
    this.dndMatchPairs.at(i).get('existingImageUrl')?.setValue(null);
    this.dndMatchPairPreviewUrls[i] = null;
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

    if (data.questionImageId && data.questionImageUrl) {
      this.existingQuestionImage = {
        id: data.questionImageId,
        url: data.questionImageUrl
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

    // Reset question image and DnD state
    this.selectedQuestionImage = null;
    this.existingQuestionImage = null;
    this.dndSpellImageFile = null;
    this.existingDndSpellImageId = null;
    this.existingDndSpellImageUrl = null;
    this.dndOrderTiles.clear();
    this.dndMatchPairs.clear();

    if (data.dndSpell) {
      this.quizFormGroup.patchValue({
        dndSpellWord:    data.dndSpell.word,
        dndSpellLetters: data.dndSpell.letters?.join(', ') ?? '',
        dndSpellHint:    data.dndSpell.hint,
      });
      this.existingDndSpellImageId  = data.dndSpell.imageFileId ?? null;
      this.existingDndSpellImageUrl = data.dndSpell.imageUrl    ?? null;
    }

    if (data.dndOrder) {
      data.dndOrder.tiles.forEach((tile: any) => {
        this.dndOrderTiles.push(this._formBuilder.group({ id: [tile.id], text: [tile.text] }));
      });
      const tileIds = data.dndOrder.tiles.map((t: any) => t.id);
      const indices = (data.dndOrder.correctOrder as string[]).map(uuid => tileIds.indexOf(uuid));
      this.quizFormGroup.patchValue({ dndOrderCorrectOrder: indices.join(',') });
    }

    if (data.dndMatch) {
      data.dndMatch.pairs.forEach((pair: any) => {
        this.dndMatchPairs.push(this._formBuilder.group({
          word:                [pair.word],
          existingImageFileId: [pair.imageFileId ?? null],
          existingImageUrl:    [pair.imageUrl    ?? null],
          imageFile:           [null]
        }));
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
    if (this.isDragType()) {
      const baseFields = ['quizType', 'question', 'explanation', 'points'];
      return baseFields.every(f => this.quizFormGroup.get(f)?.valid);
    }
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
      this.selectedQuestionAudioPreviewUrl = URL.createObjectURL(file);
      this.existingQuestionAudio = null;
    }
  }

  onExplanationAudioSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedExplanationAudio = file;
      this.selectedExplanationAudioPreviewUrl = URL.createObjectURL(file);
      this.existingExplanationAudio = null;
    }
  }

  onExplanationImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedExplanationImage = file;
      this.selectedExplanationImagePreviewUrl = URL.createObjectURL(file);
      this.existingExplanationImage = null;
    }
  }

  onOptionImageSelected(event: any, index: number): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedOptionImages[index] = file;
      this.selectedOptionImagePreviewUrls[index] = URL.createObjectURL(file);
    }
  }

  removeQuestionAudio(): void {
    this.existingQuestionAudio = null;
    this.selectedQuestionAudio = null;
    this.selectedQuestionAudioPreviewUrl = null;
  }

  onQuestionImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedQuestionImage = file;
      this.selectedQuestionImagePreviewUrl = URL.createObjectURL(file);
      this.existingQuestionImage = null;
    }
  }

  removeQuestionImage(): void {
    this.existingQuestionImage = null;
    this.selectedQuestionImage = null;
    this.selectedQuestionImagePreviewUrl = null;
  }

  removeExplanationAudio(): void {
    this.existingExplanationAudio = null;
    this.selectedExplanationAudio = null;
    this.selectedExplanationAudioPreviewUrl = null;
  }

  removeExplanationImage(): void {
    this.existingExplanationImage = null;
    this.selectedExplanationImage = null;
    this.selectedExplanationImagePreviewUrl = null;
  }

  removeOptionImage(index: number): void {
    this.existingOptionImages[index] = null;
    this.selectedOptionImages[index] = null;
    this.selectedOptionImagePreviewUrls[index] = null;
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
    uploadObservables.push(this.selectedQuestionAudio
      ? this.fileService.apiFileUploadAudioPost(this.selectedQuestionAudio)
      : of(null));

    // [1] Explanation audio
    uploadObservables.push(this.selectedExplanationAudio
      ? this.fileService.apiFileUploadAudioPost(this.selectedExplanationAudio)
      : of(null));

    // [2] Question image
    uploadObservables.push(this.selectedQuestionImage
      ? this.fileService.apiFileUploadImagePost(this.selectedQuestionImage)
      : of(null));

    // [3] Explanation image
    uploadObservables.push(this.selectedExplanationImage
      ? this.fileService.apiFileUploadImagePost(this.selectedExplanationImage)
      : of(null));

    if (this.isDragType()) {
      // [4] DragSpell illustration image
      uploadObservables.push(this.isDragSpell() && this.dndSpellImageFile
        ? this.fileService.apiFileUploadImagePost(this.dndSpellImageFile)
        : of(null));

      // [5..] DragMatch pair images (one slot per pair, always — null if no new file)
      if (this.isDragMatch()) {
        this.dndMatchPairs.controls.forEach(ctrl => {
          const imageFile = ctrl.get('imageFile')?.value;
          uploadObservables.push(imageFile
            ? this.fileService.apiFileUploadImagePost(imageFile)
            : of(null));
        });
      }
    } else {
      // [4..4+options.length] Option images
      for (let i = 0; i < this.options.length; i++) {
        const image = this.shouldShowImageFields() ? this.selectedOptionImages[i] : null;
        uploadObservables.push(image
          ? this.fileService.apiFileUploadImagePost(image)
          : of(null));
      }
    }

    return forkJoin(uploadObservables);
  }

  handleButtonClick(): void {
    if (!this.isFormValid()) return;

    this.uploadFiles().pipe(
      switchMap((uploadResults) => {
        const formValue = this.quizFormGroup.value;

        const questionAudioId    = uploadResults[0]?.fileId || this.existingQuestionAudio?.id    || null;
        const explanationAudioId = uploadResults[1]?.fileId || this.existingExplanationAudio?.id || null;
        const questionImageId    = uploadResults[2]?.fileId || this.existingQuestionImage?.id    || null;
        const explanationImageId = uploadResults[3]?.fileId || this.existingExplanationImage?.id || null;

        const formattedData: any = {
          quizType:          formValue.quizType,
          question:          formValue.question,
          explanation:       formValue.explanation,
          points:            formValue.points,
          questionAudioId,
          questionImageId,
          explanationAudioId,
          explanationImageId,
          options:           [],
          dndSpell:          null,
          dndOrder:          null,
          dndMatch:          null,
        };

        if (this.isDragSpell()) {
          formattedData.dndSpell = {
            word:        formValue.dndSpellWord,
            letters:     (formValue.dndSpellLetters as string).split(',').map((l: string) => l.trim()).filter(Boolean),
            hint:        formValue.dndSpellHint,
            imageFileId: uploadResults[4]?.fileId || this.existingDndSpellImageId || null,
          };
        } else if (this.isDragOrder()) {
          formattedData.dndOrder = {
            tiles:        this.dndOrderTiles.controls.map(ctrl => ({ text: ctrl.get('text')?.value })),
            correctOrder: (formValue.dndOrderCorrectOrder as string).split(',').map((s: string) => parseInt(s.trim(), 10)),
          };
        } else if (this.isDragMatch()) {
          formattedData.dndMatch = {
            pairs: this.dndMatchPairs.controls.map((ctrl, i) => ({
              word:        ctrl.get('word')?.value,
              imageFileId: uploadResults[4 + i]?.fileId || ctrl.get('existingImageFileId')?.value || null,
            })),
          };
        } else {
          const optionImageIds = uploadResults.slice(4, 4 + this.options.length).map((result: any, index: number) =>
            result?.fileId || this.existingOptionImages[index]?.id || null
          );
          formattedData.options = formValue.options.map((option: any, index: number) => ({
            optionText:    option.optionText,
            isCorrect:     option.isCorrect,
            optionImageId: optionImageIds[index] || null,
          }));
        }

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

  openQuizPreview(): void {
    this.showQuizPreview = true;
  }

  closeQuizPreview(): void {
    this.showQuizPreview = false;
  }

  openChildQuizPreview(cq: any): void {
    this.previewingChildQuiz = cq;
    this.showChildQuizPreview = true;
  }

  closeChildQuizPreview(): void {
    this.showChildQuizPreview = false;
    this.previewingChildQuiz = null;
  }

  cqPreviewTypeName(): string {
    return this.getQuizTypeName(this.previewingChildQuiz?.quizType || '');
  }

  cqPreviewShouldShowImages(): boolean {
    return this.cqPreviewTypeName().toLowerCase().includes('imazhe');
  }

  getPreviewQuestionImageUrl(): string | null {
    if (this.existingQuestionImage) return this.existingQuestionImage.url;
    if (this.selectedQuestionImage) return URL.createObjectURL(this.selectedQuestionImage);
    return null;
  }

  getPreviewOptionImageUrl(index: number): string | null {
    if (this.existingOptionImages[index]) return this.existingOptionImages[index]!.url;
    if (this.selectedOptionImages[index]) return URL.createObjectURL(this.selectedOptionImages[index]!);
    return null;
  }

  getPreviewDragSpellLetters(): string[] {
    const raw = this.quizFormGroup.get('dndSpellLetters')?.value as string || '';
    return raw.split(',').map((l: string) => l.trim()).filter(Boolean);
  }

  stripHtml(html: string | null | undefined): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
  }

  safeHtml(html: string | null | undefined): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      html || '<em style="color:var(--muted-2)">Pyetja nuk është plotësuar…</em>'
    );
  }
}