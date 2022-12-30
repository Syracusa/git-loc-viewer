import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainstatComponent } from './mainstat.component';

describe('MainstatComponent', () => {
  let component: MainstatComponent;
  let fixture: ComponentFixture<MainstatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MainstatComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainstatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
