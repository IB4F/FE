import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterFamilyComponent } from './register-family.component';

describe('RegisterFamilyComponent', () => {
  let component: RegisterFamilyComponent;
  let fixture: ComponentFixture<RegisterFamilyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterFamilyComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RegisterFamilyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
