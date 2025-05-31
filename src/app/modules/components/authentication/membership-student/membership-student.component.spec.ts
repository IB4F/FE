import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MembershipStudentComponent } from './membership-student.component';

describe('MembershipStudentComponent', () => {
  let component: MembershipStudentComponent;
  let fixture: ComponentFixture<MembershipStudentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MembershipStudentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MembershipStudentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
