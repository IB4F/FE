import { Component, OnInit, OnDestroy, Renderer2, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentService } from '../../../../api-client';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { NgToastService } from 'ng-angular-popup';
import {QuizComponent} from "./quiz/quiz.component";
import confetti from 'canvas-confetti';

interface QuizProgress {
  totalQuizzes: number;
  completedQuizzes: number;
  currentQuizIndex: number;
  totalPointsEarned: number;
  totalPossiblePoints: number;
  lastCompletedQuizId: string | null;
  lastCompletedAt: string | null;
}

interface QuizData {
  id: string;
  question: string;
  points: number;
  options: Array<{
    id: string;
    optionText: string;
    optionImageUrl: string | null;
  }>;
  questionAudioUrl: string | null;
  explanationAudioUrl: string | null;
  quizzTypeName: string;
  parentQuizId: string | null;
  multipleAnswer: boolean;
}

@Component({
  selector: 'app-quiz-list',
  standalone: true,
  imports: [CommonModule, QuizComponent], // Aggiungi QuizComponent qui
  templateUrl: './quiz-list.component.html',
  styleUrls: ['./quiz-list.component.scss'],
})
export class QuizListComponent implements OnInit, OnDestroy {
  linkId!: string;
  parentQuizIds: string[] = [];
  progress: QuizProgress | null = null;
  currentQuiz: QuizData | null = null;
  currentQuizIndex: number = 0;
  isChildQuiz: boolean = false;
  currentParentQuizId: string | null = null;
  showExplanation: boolean = false;
  explanation: string | null = null;
  explanationAudioUrl: string | null = null;
  nextChildQuizId: string | null = null;
  hasChildQuizzes: boolean = false;
  quizStartedAt: string | null = null;
  dataLoaded: boolean = false;
  isExplanationAudioPlaying: boolean = false;
  explanationAudio: HTMLAudioElement | null = null;

  constructor(
    private studentService: StudentService,
    private route: ActivatedRoute,
    private router: Router,
    private toast: NgToastService,
    private renderer2: Renderer2,
    private elementRef: ElementRef
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe((params: ParamMap) => {
      this.linkId = params.get('id') as string;
      if (this.linkId) {
        this.loadQuizzesAndProgress();
      }
    });
  }

  loadQuizzesAndProgress() {
    this.studentService.apiStudentQuizzesLinkIdGet(this.linkId).subscribe({
      next: (result) => {
        this.parentQuizIds = result.parentQuizIds || [];
        this.progress = result.progress || null;
        this.currentQuizIndex = this.progress?.currentQuizIndex || 0;
        
        if (this.parentQuizIds.length > 0 && this.currentQuizIndex < this.parentQuizIds.length) {
          this.loadCurrentQuiz();
        } else if (this.progress && this.progress.completedQuizzes === this.progress.totalQuizzes) {
          this.showCompletionMessage();
        }
        this.dataLoaded = true;
      },
      error: (err) => {
        this.toast.danger(err?.error?.message || 'Gabim në ngarkimin e kuizeve', 'GABIM', 3000);
        this.dataLoaded = true;
      },
    });
  }

  loadCurrentQuiz() {
    if (this.currentQuizIndex >= this.parentQuizIds.length) {
      this.showCompletionMessage();
      return;
    }

    const quizId = this.parentQuizIds[this.currentQuizIndex];
    this.currentParentQuizId = quizId;
    this.isChildQuiz = false;
    
    this.studentService.apiStudentQuizzesSingleQuizIdGet(quizId).subscribe({
      next: (quiz) => {
        this.currentQuiz = quiz;
        this.startQuiz(quizId);
      },
      error: (err) => {
        this.toast.danger(err?.error?.message || 'Gabim në ngarkimin e kuizit', 'GABIM', 3000);
      },
    });
  }

  startQuiz(quizId: string) {
    this.studentService.apiStudentQuizzesQuizIdStartPost(quizId).subscribe({
      next: (result) => {
        this.quizStartedAt = result.startedAt;
      },
      error: (err) => {
        console.warn('Could not start quiz timer:', err);
      },
    });
  }

  handleOptionSelection(selectedOptionId: string) {
    if (!this.currentQuiz || !this.quizStartedAt) return;

    const selectedOption = this.currentQuiz.options.find(opt => opt.id === selectedOptionId);
    if (!selectedOption) return;
    
    const submission = {
      quizId: this.currentQuiz.id,
      answerId: selectedOption.id,
      startedAt: this.quizStartedAt
    };

    this.studentService.apiStudentQuizzesSubmitPost(submission).subscribe({
      next: (result) => {
        if (result.answer) {
          // Correct answer
          this.handleCorrectAnswer();
        } else {
          // Incorrect answer
          this.handleIncorrectAnswer(result);
        }
      },
      error: (err) => {
        console.error('Quiz submission error:', err);
        this.toast.danger(
          err?.error?.message || 'Gabim në dërgimin e përgjigjes. Ju lutem provoni përsëri.',
          'GABIM',
          4000
        );
      },
    });
  }

  handleMultipleOptionsSelection(selectedOptionIds: string[]) {
    if (!this.currentQuiz || !this.quizStartedAt) return;

    const selectedOptions = this.currentQuiz.options.filter(opt => selectedOptionIds.includes(opt.id));
    if (selectedOptions.length === 0) return;
    
    const submission = {
      quizId: this.currentQuiz.id,
      answerIds: selectedOptionIds,
      startedAt: this.quizStartedAt
    };

    this.studentService.apiStudentQuizzesSubmitPost(submission).subscribe({
      next: (result) => {
        if (result.answer) {
          // Correct answer
          this.handleCorrectAnswer();
        } else {
          // Incorrect answer
          this.handleIncorrectAnswer(result);
        }
      },
      error: (err) => {
        console.error('Quiz submission error:', err);
        this.toast.danger(
          err?.error?.message || 'Gabim në dërgimin e përgjigjes. Ju lutem provoni përsëri.',
          'GABIM',
          4000
        );
      },
    });
  }

  handleCorrectAnswer() {
    // Add points (no deduction for correct answers)
    if (this.progress) {
      this.progress.totalPointsEarned += this.currentQuiz!.points;
      this.progress.completedQuizzes++;
    }
    
    this.triggerConfetti();
    this.toast.success("Përgjigje e saktë!", "Bravissimo!", 2000);
    
    // Move to next parent quiz
    this.moveToNextParentQuiz();
  }

  handleIncorrectAnswer(result: any) {
    // Deduct 2 points for incorrect answer
    if (this.progress) {
      this.progress.totalPointsEarned = Math.max(0, this.progress.totalPointsEarned - 2);
    }
    
    this.explanation = result.explanation;
    this.explanationAudioUrl = result.explanationAudioUrl;
    this.nextChildQuizId = result.childQuizId;
    this.hasChildQuizzes = !!result.childQuizId;
    this.showExplanation = true;
    
    this.toast.danger("Përgjigje e gabuar. -2 pikë", "Ops!", 3000);
  }

  onExplanationUnderstood() {
    this.showExplanation = false;
    this.stopExplanationAudio(); // Stop any playing explanation audio
    
    if (this.hasChildQuizzes && this.nextChildQuizId) {
      // Load child quiz
      this.loadChildQuiz(this.nextChildQuizId);
    } else {
      // No child quizzes, move to next parent quiz
      this.moveToNextParentQuiz();
    }
  }

  loadChildQuiz(childQuizId: string) {
    this.isChildQuiz = true;
    
    this.studentService.apiStudentQuizzesSingleQuizIdGet(childQuizId).subscribe({
      next: (quiz) => {
        this.currentQuiz = quiz;
        this.startQuiz(childQuizId);
      },
      error: (err) => {
        this.toast.danger(err?.error?.message || 'Gabim në ngarkimin e kuizit fëmijë', 'GABIM', 3000);
        // If child quiz fails to load, move to next parent quiz
        this.moveToNextParentQuiz();
      },
    });
  }

  moveToNextParentQuiz() {
    this.currentQuizIndex++;
    this.isChildQuiz = false;
    
    if (this.currentQuizIndex < this.parentQuizIds.length) {
      this.loadCurrentQuiz();
    } else {
      this.showCompletionMessage();
    }
  }

  showCompletionMessage() {
    this.currentQuiz = null;
    this.toast.success(
      "Urime! Ke përfunduar të gjitha kuizet!",
      "Përfunduar",
      5000
    );
  }


  triggerConfetti() {
    const duration = 3000;
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    setTimeout(() => confetti.reset(), duration);
  }

  goBack() {
    this.router.navigate(['/student/kurset']);
  }

  getProgressPercentage(): number {
    if (!this.progress || this.progress.totalPossiblePoints === 0) return 0;
    return (this.progress.totalPointsEarned / this.progress.totalPossiblePoints) * 100;
  }

  getTargetAchieved(): boolean {
    return this.getProgressPercentage() >= 70;
  }

  toggleExplanationAudio() {
    if (!this.explanationAudioUrl) return;

    if (this.isExplanationAudioPlaying) {
      this.stopExplanationAudio();
    } else {
      this.playExplanationAudio();
    }
  }

  private playExplanationAudio() {
    if (!this.explanationAudioUrl) return;

    this.stopExplanationAudio(); // Stop any existing audio
    
    this.explanationAudio = new Audio(this.explanationAudioUrl);
    this.explanationAudio.onended = () => {
      this.isExplanationAudioPlaying = false;
    };
    this.explanationAudio.onerror = () => {
      this.isExplanationAudioPlaying = false;
      console.error('Error playing explanation audio');
    };
    
    this.explanationAudio.play().then(() => {
      this.isExplanationAudioPlaying = true;
    }).catch((error) => {
      console.error('Error playing explanation audio:', error);
      this.isExplanationAudioPlaying = false;
    });
  }

  private stopExplanationAudio() {
    if (this.explanationAudio) {
      this.explanationAudio.pause();
      this.explanationAudio.currentTime = 0;
      this.explanationAudio = null;
    }
    this.isExplanationAudioPlaying = false;
  }

  ngOnDestroy() {
    this.stopExplanationAudio();
  }
}
