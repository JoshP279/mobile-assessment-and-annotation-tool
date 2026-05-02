import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewAssessmentComponent } from './viewassessment.component';

describe('ViewassessmentComponent', () => {
  let component: ViewAssessmentComponent;
  let fixture: ComponentFixture<ViewAssessmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewAssessmentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewAssessmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
