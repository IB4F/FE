import { Component, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

interface QuizOption {
  id: string;
  optionText: string;
  optionImageUrl: string | null;
}

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quiz.component.html',
  styleUrl: './quiz.component.scss',
})
export class QuizComponent implements OnDestroy {
  @Input() question: string = '';
  @Input() options: QuizOption[] = [];
  @Input() questionAudioUrl: string | null = null;
  @Input() multipleAnswer: boolean = false;
  @Output() optionSelected = new EventEmitter<string>();
  @Output() multipleOptionsSelected = new EventEmitter<string[]>();

  selectedOptionId: string | null = null;
  selectedOptionIds: string[] = [];
  isPlaying: boolean = false;
  audio: HTMLAudioElement | null = null;

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index); // A, B, C, D...
  }

  setSelectedOption(optionId: string) {
    if (this.multipleAnswer) {
      // Toggle selection for multiple choice
      const index = this.selectedOptionIds.indexOf(optionId);
      if (index > -1) {
        this.selectedOptionIds.splice(index, 1);
      } else {
        this.selectedOptionIds.push(optionId);
      }
    } else {
      // Single selection
      this.selectedOptionId = optionId;
    }
  }

  submitAnswer() {
    if (this.multipleAnswer) {
      if (this.selectedOptionIds.length > 0) {
        this.multipleOptionsSelected.emit([...this.selectedOptionIds]);
        this.selectedOptionIds = [];
      }
    } else {
      if (this.selectedOptionId) {
        this.optionSelected.emit(this.selectedOptionId);
        this.selectedOptionId = null;
      }
    }
  }

  hasImage(option: QuizOption): boolean {
    return !!option.optionImageUrl;
  }

  isOptionSelected(optionId: string): boolean {
    if (this.multipleAnswer) {
      return this.selectedOptionIds.includes(optionId);
    } else {
      return this.selectedOptionId === optionId;
    }
  }

  hasQuestionAudio(): boolean {
    return !!this.questionAudioUrl;
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

    this.stopAudio(); // Stop any existing audio
    
    this.audio = new Audio(this.questionAudioUrl);
    this.audio.onended = () => {
      this.isPlaying = false;
    };
    this.audio.onerror = () => {
      this.isPlaying = false;
      console.error('Error playing audio');
    };
    
    this.audio.play().then(() => {
      this.isPlaying = true;
    }).catch((error) => {
      console.error('Error playing audio:', error);
      this.isPlaying = false;
    });
  }

  private stopAudio() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio = null;
    }
    this.isPlaying = false;
  }

  ngOnDestroy() {
    this.stopAudio();
  }
}
