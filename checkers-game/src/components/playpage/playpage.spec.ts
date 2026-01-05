import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Playpage } from './playpage';

describe('Playpage', () => {
  let component: Playpage;
  let fixture: ComponentFixture<Playpage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Playpage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Playpage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
