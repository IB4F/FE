import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common'; // Importa CommonModule per *ngFor

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule], // Aggiungi CommonModule qui
  templateUrl: './quiz.component.html',
  styleUrl: './quiz.component.scss',
})
export class QuizComponent {
  @Input() question: string = '';
  @Input() options: { optionText: string }[] = [];
  @Output() optionSelected = new EventEmitter<string>();

  selectedOption: string | null = null; // Variabile per tenere traccia dell'opzione selezionata

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index); // A, B, C, D...
  }

  // Metodo per impostare l'opzione selezionata (al click dell'utente)
  setSelectedOption(optionText: string) {
    this.selectedOption = optionText;
    console.log(`Opzione selezionata internamente: ${this.selectedOption}`);
  }

  // Metodo per inviare la risposta (al click del pulsante Submit)
  submitAnswer() {
    if (this.selectedOption) {
      this.optionSelected.emit(this.selectedOption); // Emette l'opzione selezionata al componente padre
      this.selectedOption = null; // Resetta la selezione dopo l'invio
    }
  }
}
