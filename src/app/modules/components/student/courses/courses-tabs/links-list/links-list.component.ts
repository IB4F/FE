import {Component, Input, OnInit} from '@angular/core';
import {CommonModule} from "@angular/common";
import {Router} from "@angular/router";

@Component({
  selector: 'app-links-list',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './links-list.component.html',
  styleUrl: './links-list.component.scss'
})
export class LinksListComponent implements OnInit {
  @Input() course!: any;
  difficultyColorClass!: string;

  constructor(private router: Router) {
  }

  ngOnInit() {
    if (this.course && this.course.difficulty) {
      this.difficultyColorClass = `difficulty-${this.course.difficulty}`;
    }
  }

  goToQuizList(linkId: string) { // Metodo per la navigazione
    this.router.navigate(['/student/quiz-list', linkId]);
  }
}
