import {Component, Input, OnInit} from '@angular/core';
import {CommonModule} from "@angular/common";
import {Router} from "@angular/router";

@Component({
  selector: 'app-links-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './links-list.component.html',
  styleUrl: './links-list.component.scss'
})
export class LinksListComponent implements OnInit {
  @Input() course!: any;
  @Input() courseIndex = 0;
  @Input() subjectToneColor = '#1B9CD8';
  @Input() subjectSoftColor = '#E8F4FB';

  readonly difficultyDots = [1, 2, 3, 4, 5];

  constructor(private router: Router) {}

  ngOnInit() {}

  get courseCode(): string {
    return String.fromCharCode(65 + this.courseIndex);
  }

  get totalExercises(): number {
    return (this.course?.links || []).reduce((sum: number, l: any) => sum + (l.quizzesCount || 0), 0);
  }

  get doneExercises(): number {
    return (this.course?.links || [])
      .filter((l: any) => l.status === 'Completed')
      .reduce((sum: number, l: any) => sum + (l.quizzesCount || 0), 0);
  }

  get progressPct(): number {
    return this.totalExercises ? this.doneExercises / this.totalExercises : 0;
  }

  get progressPctDisplay(): number {
    return Math.round(this.progressPct * 100);
  }

  private get ringR(): number { return (44 - 6) / 2; }
  private get ringC(): number { return 2 * Math.PI * this.ringR; }

  get ringCircumference(): number { return this.ringC; }

  get ringOffset(): number {
    return this.ringC * (1 - this.progressPct);
  }

  goToQuizList(linkId: string) {
    this.router.navigate(['/student/quiz-list', linkId]);
  }

  hasQuizzes(link: any): boolean {
    return link.quizzesCount && link.quizzesCount > 0;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Completed':   return 'done';
      case 'In Progress': return 'progress';
      case 'Not Started': return 'todo';
      default:            return 'todo';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'Completed':   return 'Përfunduar';
      case 'In Progress': return 'Në vazhdim';
      case 'Not Started': return 'I pastartuar';
      default:            return 'I pastartuar';
    }
  }
}
