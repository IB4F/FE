import {Component, Input, OnInit} from '@angular/core';
import {CommonModule} from "@angular/common";
import {Router} from "@angular/router";
import {MatIconModule} from "@angular/material/icon";
import {TierIconComponent} from "../../../../../shared/components/tier-icon/tier-icon.component";

@Component({
  selector: 'app-links-list',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    TierIconComponent
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

  hasQuizzes(link: any): boolean {
    return link.quizzesCount && link.quizzesCount > 0;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Completed':
        return 'status-completed';
      case 'Not Started':
        return 'status-not-started';
      case 'In Progress':
        return 'status-in-progress';
      default:
        return 'status-unknown';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'Completed':
        return 'Përfunduar';
      case 'Not Started':
        return 'Nuk është filluar';
      case 'In Progress':
        return 'Në progres';
      default:
        return 'E panjohur';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'Completed':
        return 'check_circle';
      case 'Not Started':
        return 'radio_button_unchecked';
      case 'In Progress':
        return 'play_circle';
      default:
        return 'help';
    }
  }
}
