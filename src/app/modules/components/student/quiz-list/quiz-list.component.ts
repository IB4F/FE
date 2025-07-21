import { Component, OnInit, Renderer2, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuizzesService } from '../../../../api-client';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { NgToastService } from 'ng-angular-popup';
import {QuizComponent} from "./quiz/quiz.component";
import confetti from 'canvas-confetti';

@Component({
  selector: 'app-quiz-list',
  standalone: true,
  imports: [CommonModule, QuizComponent], // Aggiungi QuizComponent qui
  templateUrl: './quiz-list.component.html',
  styleUrls: ['./quiz-list.component.scss'],
})
export class QuizListComponent implements OnInit {
  linkId!: string;
  quizzes: any[] = [];
  currentQuiz: any | null = null; // Il quiz attualmente visualizzato
  totalScore: number = 0; // Punteggio totale dell'utente
  isSidebarCollapsed: boolean = false;

  constructor(
    private quizzesService: QuizzesService,
    private route: ActivatedRoute,
    private toast: NgToastService,
    private renderer2: Renderer2,
    private elementRef: ElementRef // Per il canvas dei confetti
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe((params: ParamMap) => {
      this.linkId = params.get('id') as string;
      if (this.linkId) {
        this.getQuizListByLinkId();
      }
    });
  }

  getQuizListByLinkId() {
    this.quizzesService.apiQuizzesGetListQuizzesGet(this.linkId).subscribe({
      next: (result) => {
        this.quizzes = result;
        // Trova il primo quiz non risposto all'inizializzazione
        this.findAndSetInitialQuiz();
        console.log(result);
      },
      error: (err) => {
        this.toast.danger(err?.error?.message, 'GABIM', 3000);
      },
    });
  }

  // Trova e imposta il primo quiz non risposto
  findAndSetInitialQuiz() {
    const firstUnansweredQuiz = this.quizzes.find((quiz) => !quiz.isAnswered);
    if (firstUnansweredQuiz) {
      this.currentQuiz = firstUnansweredQuiz;
    } else if (this.quizzes.length > 0) {
      // Se tutti sono stati risposti, mostra il primo (o un messaggio di completamento)
      this.currentQuiz = this.quizzes[0];
      this.toast.info(
        "Hai completato tutti i quiz! Rivedi le tue risposte o attendi nuovi quiz.",
        "Quiz Completati",
        5000
      );
    }
  }

  // Metodo per selezionare un quiz dalla lista
  selectQuiz(quiz: any) {
    this.currentQuiz = quiz;
  }

  // Metodo chiamato quando un'opzione viene selezionata nel componente Quiz
  handleOptionSelection(selectedOptionText: string) {
    // QUI ANDRÀ LA LOGICA PER VERIFICARE LA RISPOSTA E ACCUMULARE PUNTI
    // Esempio: Se la risposta fosse corretta (simulato):
    console.log(`Opzione selezionata: ${selectedOptionText}`);
    console.log(`Quiz corrente:`, this.currentQuiz);

    // Esempio per simulare l'incremento del punteggio e i confetti
    // In un'applicazione reale, questa logica verrebbe da una risposta API
    if (
      selectedOptionText === 'Roma' &&
      this.currentQuiz?.question === 'Cili është kryeqyteti i Italisë?'
    ) {
      this.totalScore += this.currentQuiz.points;
      this.triggerConfetti();
      this.toast.success("Risposta corretta!", "Bravissimo!", 2000);
      // Marca il quiz come risposto (questo in un'applicazione reale dovrebbe venire dal backend)
      if (this.currentQuiz) {
        this.currentQuiz.isAnswered = true;
      }
      // Passa al prossimo quiz non risposto
      this.moveToNextUnansweredQuiz();

    } else if (
      selectedOptionText === 'Dante Aligieri' &&
      this.currentQuiz?.question === 'Kush e shkroi "Komedia Hyjnore"?'
    ) {
      this.totalScore += this.currentQuiz.points;
      this.triggerConfetti();
      this.toast.success("Risposta corretta!", "Bravissimo!", 2000);
      if (this.currentQuiz) {
        this.currentQuiz.isAnswered = true;
      }
      this.moveToNextUnansweredQuiz();
    } else if (
      selectedOptionText === 'Python' &&
      this.currentQuiz?.question === 'Cili gjuhë programimi njihet për sintaksën e saj "të folur" dhe përdorimin e gjerë të hapësirave të bardha për të përcaktuar blloqet e kodit?'
    ) {
      this.totalScore += this.currentQuiz.points;
      this.triggerConfetti();
      this.toast.success("Risposta corretta!", "Bravissimo!", 2000);
      if (this.currentQuiz) {
        this.currentQuiz.isAnswered = true;
      }
      this.moveToNextUnansweredQuiz();
    }
    else {
      this.toast.danger("Risposta errata. Riprova!", "Ops!", 2000);
    }
  }

  moveToNextUnansweredQuiz() {
    const currentIndex = this.quizzes.findIndex(q => q.id === this.currentQuiz?.id);
    const remainingQuizzes = this.quizzes.slice(currentIndex + 1);
    const nextUnanswered = remainingQuizzes.find(q => !q.isAnswered);

    if (nextUnanswered) {
      this.currentQuiz = nextUnanswered;
    } else {
      this.toast.info("Hai completato tutti i quiz disponibili!", "Congratulazioni!", 5000);
      this.currentQuiz = null; // O potresti mostrare una schermata di riepilogo
    }
  }


  // Metodo per attivare i confetti
  triggerConfetti() {
    const duration = 3000; // in milliseconds

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Clear confetti after a certain duration
    setTimeout(() => confetti.reset(), duration);
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }
}
