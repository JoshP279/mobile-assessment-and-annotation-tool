import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddAssessmentComponent } from './addassessment.component';

describe('AddassessmentComponent', () => {
  let component: AddAssessmentComponent;
  let fixture: ComponentFixture<AddAssessmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddAssessmentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddAssessmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
