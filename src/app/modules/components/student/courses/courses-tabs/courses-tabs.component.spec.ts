import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoursesTabsComponent } from './courses-tabs.component';

describe('CoursesTabsComponent', () => {
  let component: CoursesTabsComponent;
  let fixture: ComponentFixture<CoursesTabsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoursesTabsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CoursesTabsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
