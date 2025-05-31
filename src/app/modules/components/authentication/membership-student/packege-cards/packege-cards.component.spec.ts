import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PackegeCardsComponent } from './packege-cards.component';

describe('PackegeCardsComponent', () => {
  let component: PackegeCardsComponent;
  let fixture: ComponentFixture<PackegeCardsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PackegeCardsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PackegeCardsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
