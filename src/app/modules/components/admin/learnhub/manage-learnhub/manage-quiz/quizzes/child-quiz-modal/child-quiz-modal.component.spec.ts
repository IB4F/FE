import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChildQuizModalComponent } from './child-quiz-modal.component';

describe('ChildQuizModalComponent', () => {
  let component: ChildQuizModalComponent;
  let fixture: ComponentFixture<ChildQuizModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChildQuizModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChildQuizModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
