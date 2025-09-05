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
    it('should return correct status class for Completed', () => {
      expect(component.getStatusClass('Completed')).toBe('status-completed');
    });

    it('should return correct status class for Not Started', () => {
      expect(component.getStatusClass('Not Started')).toBe('status-not-started');
    });

    it('should return correct status class for In Progress', () => {
      expect(component.getStatusClass('In Progress')).toBe('status-in-progress');
    });

    it('should return correct status class for unknown status', () => {
      expect(component.getStatusClass('Unknown')).toBe('status-unknown');
    });

    it('should return correct status text for Completed', () => {
      expect(component.getStatusText('Completed')).toBe('Përfunduar');
    });

    it('should return correct status text for Not Started', () => {
      expect(component.getStatusText('Not Started')).toBe('Nuk është filluar');
    });

    it('should return correct status text for In Progress', () => {
      expect(component.getStatusText('In Progress')).toBe('Në progres');
    });

    it('should return correct status icon for Completed', () => {
      expect(component.getStatusIcon('Completed')).toBe('check_circle');
    });

    it('should return correct status icon for Not Started', () => {
      expect(component.getStatusIcon('Not Started')).toBe('radio_button_unchecked');
    });

    it('should return correct status icon for In Progress', () => {
      expect(component.getStatusIcon('In Progress')).toBe('play_circle');
    });
  });

  describe('Navigation', () => {
    it('should navigate to quiz list when goToQuizList is called', () => {
      const linkId = 'test-link-id';
      component.goToQuizList(linkId);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/student/quiz-list', linkId]);
    });
  });

  describe('Status Display Logic', () => {
    it('should handle missing status property gracefully', () => {
      // Test that methods handle undefined/null status
      expect(component.getStatusClass(undefined as any)).toBe('status-unknown');
      expect(component.getStatusClass(null as any)).toBe('status-unknown');
      expect(component.getStatusText(undefined as any)).toBe('E panjohur');
      expect(component.getStatusText(null as any)).toBe('E panjohur');
      expect(component.getStatusIcon(undefined as any)).toBe('help');
      expect(component.getStatusIcon(null as any)).toBe('help');
    });
  });
});
