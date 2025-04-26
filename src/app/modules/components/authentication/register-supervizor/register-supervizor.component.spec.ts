import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterSupervizorComponent } from './register-supervizor.component';

describe('RegisterSupervizorComponent', () => {
  let component: RegisterSupervizorComponent;
  let fixture: ComponentFixture<RegisterSupervizorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterSupervizorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RegisterSupervizorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
