import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuizModalComponent } from './quiz-modal.component';

describe('QuizModalComponent', () => {
  let component: QuizModalComponent;
  let fixture: ComponentFixture<QuizModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuizModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(QuizModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
