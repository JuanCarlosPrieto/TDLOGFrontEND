import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Gamepage } from './gamepage';

describe('Gamepage', () => {
  let component: Gamepage;
  let fixture: ComponentFixture<Gamepage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Gamepage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Gamepage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
