import { Component, Input, Output, EventEmitter, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CdkDragDrop, DragDropModule, transferArrayItem, moveItemInArray } from '@angular/cdk/drag-drop';

export interface MatchWord  { wordId: string; text: string; }
export interface MatchImage { imageId: string; imageUrl: string | null; }

interface MatchCard {
  imageId: string;
  imageUrl: string | null;
  placed: MatchTile[];
}

interface MatchTile { wordId: string; text: string; }

@Component({
  selector: 'app-match-quiz',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './match-quiz.component.html',
  styleUrls: ['../dnd-quiz.scss'],
})
export class MatchQuizComponent implements OnDestroy {
  private sanitizer = inject(DomSanitizer);

  @Input() question = '';

  get safeQuestion(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.question || '');
  }
  @Input() points = 0;
  @Input() questionAudioUrl: string | null = null;
  @Input() isChildQuiz = false;

  @Input() set words(val: MatchWord[]) {
    this.bank = val.map(w => ({ wordId: w.wordId, text: w.text }));
  }

  @Input() set images(val: MatchImage[]) {
    this.cards = val.map(img => ({ imageId: img.imageId, imageUrl: img.imageUrl, placed: [] }));
  }

  @Output() answered = new EventEmitter<{ matches: { wordId: string; imageId: string }[] }>();

  bank: MatchTile[] = [];
  cards: MatchCard[] = [];

  isPlaying = false;
  private audio: HTMLAudioElement | null = null;

  get cardIds(): string[] {
    return this.cards.map(c => `match-card-${c.imageId}`);
  }

  get allConnectedIds(): string[] {
    return ['match-bank', ...this.cardIds];
  }

  get allFilled(): boolean {
    return this.cards.every(c => c.placed.length > 0);
  }

  get isCorrect(): boolean {
    return this.allFilled;
  }

  onDropToCard(event: CdkDragDrop<MatchTile[]>, card: MatchCard) {
    if (event.previousContainer === event.container) return;

    if (card.placed.length > 0) {
      // Displaced tile goes back to bank
      transferArrayItem(card.placed, this.bank, 0, this.bank.length);
    }
    transferArrayItem(
      event.previousContainer.data,
      card.placed,
      event.previousIndex,
      0
    );
  }

  onDropToBank(event: CdkDragDrop<MatchTile[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(this.bank, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        this.bank,
        event.previousIndex,
        event.currentIndex
      );
    }
  }

  submit() {
    if (!this.allFilled) return;
    this.answered.emit({
      matches: this.cards.map(c => ({ wordId: c.placed[0].wordId, imageId: c.imageId }))
    });
  }

  toggleAudio() {
    if (!this.questionAudioUrl) return;
    if (this.isPlaying) { this.stopAudio(); } else { this.playAudio(); }
  }

  private playAudio() {
    if (!this.questionAudioUrl) return;
    this.stopAudio();
    this.audio = new Audio(this.questionAudioUrl);
    this.audio.onended = () => { this.isPlaying = false; };
    this.audio.onerror = () => { this.isPlaying = false; };
    this.audio.play().then(() => { this.isPlaying = true; }).catch(() => { this.isPlaying = false; });
  }

  private stopAudio() {
    if (this.audio) { this.audio.pause(); this.audio.currentTime = 0; this.audio = null; }
    this.isPlaying = false;
  }

  ngOnDestroy() { this.stopAudio(); }
}
