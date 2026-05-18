import { Component, Input, Output, EventEmitter, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

export interface SpellTile { id: string; letter: string; }

@Component({
  selector: 'app-spell-quiz',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './spell-quiz.component.html',
  styleUrls: ['../dnd-quiz.scss'],
})
export class SpellQuizComponent implements OnDestroy {
  private sanitizer = inject(DomSanitizer);

  @Input() question = '';

  get safeQuestion(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.question || '');
  }
  @Input() points = 0;
  @Input() questionAudioUrl: string | null = null;
  @Input() isChildQuiz = false;
  @Input() hint = '';
  @Input() imageUrl: string | null = null;

  @Input() set letters(val: string[]) {
    this.bank = val.map((l, i) => ({ id: 'l' + i, letter: l }));
  }
  @Input() set wordLength(val: number) {
    this.slots = Array.from({ length: val }, () => [] as SpellTile[]);
  }

  @Output() answered = new EventEmitter<{ orderedLetters: string[] }>();

  bank: SpellTile[] = [];
  slots: SpellTile[][] = [];

  isPlaying = false;
  private audio: HTMLAudioElement | null = null;

  get slotIds(): string[] {
    return this.slots.map((_, i) => `spell-slot-${i}`);
  }

  get allConnectedIds(): string[] {
    return ['spell-bank', ...this.slotIds];
  }

  get allFilled(): boolean {
    return this.slots.every(s => s.length > 0);
  }

  get isCorrect(): boolean {
    return this.allFilled;
  }

  onDropToSlot(event: CdkDragDrop<SpellTile[]>, slotIdx: number) {
    if (event.previousContainer === event.container) return;

    if (this.slots[slotIdx].length > 0) {
      // Displaced tile returns to bank
      transferArrayItem(this.slots[slotIdx], this.bank, 0, this.bank.length);
    }
    transferArrayItem(
      event.previousContainer.data,
      this.slots[slotIdx],
      event.previousIndex,
      0
    );
  }

  onDropToBank(event: CdkDragDrop<SpellTile[]>) {
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
    this.answered.emit({ orderedLetters: this.slots.map(s => s[0].letter) });
  }

  toggleAudio() {
    if (!this.questionAudioUrl) return;
    if (this.isPlaying) {
      this.stopAudio();
    } else {
      this.playAudio();
    }
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
