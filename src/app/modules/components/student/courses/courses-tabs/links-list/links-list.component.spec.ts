import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { LinksListComponent } from './links-list.component';

describe('LinksListComponent', () => {
  let component: LinksListComponent;
  let fixture: ComponentFixture<LinksListComponent>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LinksListComponent],
      providers: [
        { provide: Router, useValue: routerSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LinksListComponent);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Status Methods', () => {
    it('should return "done" class for Completed', () => {
      expect(component.getStatusClass('Completed')).toBe('done');
    });

    it('should return "todo" class for Not Started', () => {
      expect(component.getStatusClass('Not Started')).toBe('todo');
    });

    it('should return "progress" class for In Progress', () => {
      expect(component.getStatusClass('In Progress')).toBe('progress');
    });

    it('should return "todo" class for unknown status', () => {
      expect(component.getStatusClass('Unknown')).toBe('todo');
    });

    it('should return correct status text for Completed', () => {
      expect(component.getStatusText('Completed')).toBe('Përfunduar');
    });

    it('should return correct status text for Not Started', () => {
      expect(component.getStatusText('Not Started')).toBe('I pastartuar');
    });

    it('should return correct status text for In Progress', () => {
      expect(component.getStatusText('In Progress')).toBe('Në vazhdim');
    });
  });

  describe('Navigation', () => {
    it('should navigate to quiz list when goToQuizList is called', () => {
      const linkId = 'test-link-id';
      component.goToQuizList(linkId);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/student/quiz-list', linkId]);
    });
  });

  describe('Progress', () => {
    it('should return 0 progress when course has no links', () => {
      component.course = { links: [] };
      expect(component.progressPct).toBe(0);
      expect(component.progressPctDisplay).toBe(0);
    });

    it('should compute courseCode from courseIndex', () => {
      component.courseIndex = 0;
      expect(component.courseCode).toBe('A');
      component.courseIndex = 1;
      expect(component.courseCode).toBe('B');
    });
  });
});
