import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LearnhubComponent } from './learnhub.component';

describe('LearnhubComponent', () => {
  let component: LearnhubComponent;
  let fixture: ComponentFixture<LearnhubComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LearnhubComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LearnhubComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
