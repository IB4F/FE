import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageLearnhubComponent } from './manage-learnhub.component';

describe('ManageLearnhubComponent', () => {
  let component: ManageLearnhubComponent;
  let fixture: ComponentFixture<ManageLearnhubComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageLearnhubComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ManageLearnhubComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
