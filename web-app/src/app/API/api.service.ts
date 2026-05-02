import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as dotenv from 'dotenv';
import { environment } from '../../environments/environment';
@Injectable({
  providedIn: 'root',
})
/**
 * ApiService class
 * This class is used to make API calls to the backend server
 * The base URL is set to the IP address of the backend server
 * The methods in this class are used to make requests to the server
 */
export class ApiService {
  private baseUrl = `${environment.apiHost}:${environment.apiPort}`;
  constructor(private http: HttpClient) {}

  login(loginObj: any): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/login?MarkerEmail=${loginObj.MarkerEmail}&Password=${loginObj.Password}`,
    );
  }
  getAssessments(email: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/assessments?MarkerEmail=${email}`);
  }
  getAllAssessments(): Observable<any> {
    return this.http.get(`${this.baseUrl}/allAssessments`);
  }
  getSubmissions(assessmentID: number): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/submissions?AssessmentID=${assessmentID}`,
    );
  }
  getLecturers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/lecturers`);
  }
  getModules(): Observable<any> {
    return this.http.get(`${this.baseUrl}/modules`);
  }
  getModerators(): Observable<any> {
    return this.http.get(`${this.baseUrl}/moderators`);
  }
  getMarkers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/markers`);
  }
  getAssistantMarkers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/demiMarkers`);
  }
  addAssessment(assessmentForm: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/addAssessment`, assessmentForm);
  }
  addSubmission(submissionForm: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/addSubmission`, submissionForm);
  }
  updateSubmission(submissionForm: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/editSubmission`, submissionForm);
  }
  getMarkedSubmission(submissionID: number): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/markedSubmission?SubmissionID=${submissionID}`,
    );
  }
  sendStudentEmail(emailData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/sendStudentEmail`, emailData);
  }
  sendModeratorEmail(emailData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/sendModeratorEmail`, emailData);
  }
  editAssessment(assessmentForm: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/editAssessment`, assessmentForm);
  }
  addModerator(email: String, name: String): Observable<any> {
    return this.http.put(`${this.baseUrl}/addModerator`, email);
  }
  addMarker(markerForm: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/addDemiMarker`, markerForm);
  }
  addModule(moduleForm: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/addModule`, moduleForm);
  }
  editModule(moduleCode: string, moduleName: string): Observable<any> {
    return this.http.put(
      `${this.baseUrl}/editModule?ModuleCode=${moduleCode}&ModuleName=${moduleName}`,
      moduleCode,
    );
  }
  addLecturer(lecturerForm: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/addLecturer`, lecturerForm);
  }

  deleteModule(moduleCode: string): Observable<any> {
    return this.http.delete(
      `${this.baseUrl}/deleteModule?ModuleCode=${moduleCode}`,
    );
  }
  deleteMarker(email: string): Observable<any> {
    return this.http.delete(
      `${this.baseUrl}/deleteMarker?MarkerEmail=${email}`,
    );
  }
  deleteModerator(email: string): Observable<any> {
    return this.http.delete(
      `${this.baseUrl}/deleteModerator?ModeratorEmail=${email}`,
    );
  }
  editMarker(
    email: string,
    name: string,
    surname: string,
    password: string,
    markingStyle: string,
  ): Observable<any> {
    const markerData = {
      MarkerEmail: email,
      Name: name,
      Surname: surname,
      Password: password,
      MarkingStyle: markingStyle,
    };
    return this.http.put(`${this.baseUrl}/editMarker`, markerData);
  }
  deleteAssessment(assessmentID: number): Observable<any> {
    return this.http.delete(
      `${this.baseUrl}/deleteAssessment?AssessmentID=${assessmentID}`,
    );
  }
  getAssessmentInfo(assessmentID: number): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/assessmentInfo?AssessmentID=${assessmentID}`,
    );
  }
  updateSubmissionInfo(submissionInfo: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/updateSubmission`, submissionInfo);
  }
  getQuestionPerMark(submissionID: number): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/questionPerMark?SubmissionID=${submissionID}`,
    );
  }
  sendModeratorZipEmail(emailData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/sendModeratorZipEmail`, emailData);
  }
}
