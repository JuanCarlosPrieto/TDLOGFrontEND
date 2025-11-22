import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Piece } from './piece';

describe('Piece', () => {
  let component: Piece;
  let fixture: ComponentFixture<Piece>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Piece]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Piece);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
