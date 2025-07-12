import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StepsManagerComponent } from './steps-manager.component';

describe('StepsManagerComponent', () => {
  let component: StepsManagerComponent;
  let fixture: ComponentFixture<StepsManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepsManagerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StepsManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
