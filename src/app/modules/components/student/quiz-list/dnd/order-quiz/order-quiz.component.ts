import { Component, Input, Output, EventEmitter, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

export interface OrderTile { id: string; text: string; }

@Component({
  selector: 'app-order-quiz',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './order-quiz.component.html',
  styleUrls: ['../dnd-quiz.scss'],
})
export class OrderQuizComponent implements OnDestroy {
  private sanitizer = inject(DomSanitizer);

  @Input() question = '';

  get safeQuestion(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.question || '');
  }
  @Input() points = 0;
  @Input() questionAudioUrl: string | null = null;
  @Input() isChildQuiz = false;

  @Input() set tiles(val: OrderTile[]) {
    this._allTiles = val;
    this.bank = [...val];
    this.sentence = Array.from({ length: val.length }, () => [] as OrderTile[]);
  }

  @Output() answered = new EventEmitter<{ orderedTileIds: string[] }>();

  bank: OrderTile[] = [];
  sentence: OrderTile[][] = [];
  private _allTiles: OrderTile[] = [];

  isPlaying = false;
  private audio: HTMLAudioElement | null = null;

  get slotIds(): string[] {
    return this.sentence.map((_, i) => `order-slot-${i}`);
  }

  get allConnectedIds(): string[] {
    return ['order-bank', ...this.slotIds];
  }

  get allFilled(): boolean {
    return this.sentence.every(s => s.length > 0);
  }

  get isCorrect(): boolean {
    return this.allFilled;
  }

  tileTextById(id: string): string {
    return this._allTiles.find(t => t.id === id)?.text ?? '';
  }

  slotMinWidth(slotIdx: number): number {
    const text = this.sentence[slotIdx]?.[0]?.text ?? '____';
    return Math.max(80, text.length * 12 + 32);
  }

  onDropToSlot(event: CdkDragDrop<OrderTile[]>, slotIdx: number) {
    if (event.previousContainer === event.container) return;

    if (this.sentence[slotIdx].length > 0) {
      transferArrayItem(this.sentence[slotIdx], this.bank, 0, this.bank.length);
    }
    transferArrayItem(
      event.previousContainer.data,
      this.sentence[slotIdx],
      event.previousIndex,
      0
    );
  }

  onDropToBank(event: CdkDragDrop<OrderTile[]>) {
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
    this.answered.emit({ orderedTileIds: this.sentence.map(s => s[0].id) });
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
