import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { ApiService } from '../../API/api.service';
import JSZip, { file } from 'jszip';
import { Submission } from '../../classes/Submission';
import { Module } from '../../classes/Module';
import { Marker } from '../../classes/Marker';
import { Moderator } from '../../classes/Moderator';
import { CommonModule, isPlatformBrowser, Location } from '@angular/common';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { waitForAsync } from '@angular/core/testing';

@Component({
  selector: 'app-editassessment',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './editassessment.component.html',
  styleUrl: './editassessment.component.css',
})
/**
 * EditAssessmentComponent class for editing an assessment
 * OnInit is implemented, to allow for retrieval of data when the component is initialized.
 */
export class EditAssessmentComponent implements OnInit {
  assessmentName: string = '';
  assessmentLecturerEmail: string = '';
  assessmentModuleCode: string = '';
  assessmentModEmail: string = '';
  assessmentID: number = 0;
  oldMark: number = 0;
  email = '';
  searchTerm: string = '';
  assessmentType = '';
  loading: boolean = false;
  assessmentForm: FormGroup;
  modules: Module[] = [];
  moderators: Moderator[] = [];
  markers: Marker[] = [];
  filteredMarkers: Marker[] = [];
  allMarkers: Marker[] = [];
  selectedMarkers: Marker[] = [];
  TotalMark: number = 0;
  selectedMemoFile: File | null = null;
  selectedSubmissionsFile: File | null = null;
  submissions: Submission[] = [];
  isHoveringMemo = false;
  isHoveringSubmissions = false;
  isMemoUpdateEnabled = false;
  isSubmissionsUpdateEnabled = false;

  /**
   * @param fb - The form builder service for creating form controls
   * @param api  - The API service for making HTTP requests to the server
   * @param router - The router service for navigating between pages
   */
  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private location: Location,
  ) {
    this.assessmentForm = this.fb.group({
      assessmentName: ['', Validators.required],
      module: ['', Validators.required],
      moderator: ['', Validators.required],
      markers: [[], Validators.required],
      totalMarks: [
        null,
        [Validators.required, Validators.pattern(/^[1-9]\d*$/)],
      ],
      selectedMFile: [null],
      selectedSFile: [null],
    });
  }

  /**
   * Function to handle the initialization of the component.
   * This function fetches the modules, moderators and markers from the server.
   */
  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const storedAssessmentID = sessionStorage.getItem('assessmentID');
      const storedAssessmentName = sessionStorage.getItem('assessmentName');
      const storedEmail = sessionStorage.getItem('email');
      const storedAssessmentType = sessionStorage.getItem('assessmentType');
      const storedAssessmentModuleCode = sessionStorage.getItem(
        'assessmentModuleCode',
      );
      const storedAssessmentModEmail = sessionStorage.getItem('modEmail');
      if (storedAssessmentID !== null) {
        this.assessmentID = parseInt(storedAssessmentID);
      }
      if (storedAssessmentName !== null) {
        this.assessmentName = storedAssessmentName;
      }
      if (storedEmail !== null) {
        this.email = storedEmail;
      }
      if (storedAssessmentType !== null) {
        this.assessmentType = storedAssessmentType;
      }
      if (storedAssessmentModuleCode !== null) {
        this.assessmentModuleCode = storedAssessmentModuleCode;
      }
      if (storedAssessmentModEmail !== null) {
        this.assessmentModEmail = storedAssessmentModEmail;
      } else {
        sessionStorage.clear();
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Please log in to access this page',
          showConfirmButton: true,
        }).then((result) => {
          if (result.isConfirmed) {
            this.router.navigate(['/login']);
          }
        });
      }
    }
    this.fetchData();
  }

  onSearchMarkers() {
    console.log(this.searchTerm);
    this.filteredMarkers = this.markers.filter(
      (marker) =>
        marker.Name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        marker.Surname.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        marker.MarkerEmail.toLowerCase().includes(
          this.searchTerm.toLowerCase(),
        ),
    );
  }
  fetchData(): void {
    this.loading = true;
    this.getModules()
      .then(() => this.getModerators())
      .then(() => this.getMarkers())
      .then(() => this.getSubmissions(this.assessmentID))
      .then(() => this.getAssessmentInfo())
      .catch((error) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load data. Please check your internet connection.',
        });
        this.loading = false;
      });
  }

  onUpdateMemorandumToggle(): void {
    const memoFileControl = this.assessmentForm.get('selectedMFile');

    if (this.isMemoUpdateEnabled) {
      memoFileControl?.setValidators([Validators.required]);
    } else {
      memoFileControl?.clearValidators();
    }
    memoFileControl?.updateValueAndValidity();
  }

  onUpdateSubmissionToggle(): void {
    const submissionFileControl = this.assessmentForm.get('selectedSFile');

    if (this.isSubmissionsUpdateEnabled) {
      submissionFileControl?.setValidators([Validators.required]);
    } else {
      submissionFileControl?.clearValidators();
    }

    submissionFileControl?.updateValueAndValidity();
  }

  async getAssessmentInfo(): Promise<void> {
    if (this.markers.length === 0) {
      await this.loadMarkers(); // Ensure markers are loaded before proceeding
    }

    this.api.getAssessmentInfo(this.assessmentID).subscribe((res: any) => {
      if (res) {
        const markerEmails = JSON.parse(res.MarkerEmail);
        this.selectedMarkers = this.markers.filter((marker) =>
          markerEmails.includes(marker.MarkerEmail),
        );
        this.oldMark = res.TotalMark;
        this.assessmentForm.patchValue({
          assessmentName: res.AssessmentName,
          module: res.ModuleCode,
          moderator: res.ModEmail,
          totalMarks: res.TotalMark,
          markers: this.selectedMarkers.map((marker) => marker.MarkerEmail),
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'No connection',
          text: 'Cannot connect to server',
        });
      }
    });
    this.loading = false;
  }

  async loadMarkers(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.api.getMarkers().subscribe((res: any) => {
        if (res && Array.isArray(res)) {
          this.markers = res.map(
            (marker: any) =>
              new Marker(
                marker.MarkerEmail,
                marker.Name,
                marker.Surname,
                '',
                marker.MarkingStyle,
              ),
          );
          this.filteredMarkers = res.map(
            (marker: any) =>
              new Marker(
                marker.MarkerEmail,
                marker.Name,
                marker.Surname,
                '',
                marker.MarkingStyle,
              ),
          );
          resolve(); // Mark as resolved once markers are loaded
        } else {
          reject('Failed to load markers');
        }
      });
    });
  }

  /**
   * Function to retrieve all submissions for an assessment
   * @param assessmentID - The ID of the assessment
   */
  getSubmissions(assessmentID: number) {
    this.api.getSubmissions(assessmentID).subscribe((res: any) => {
      if (res && Array.isArray(res)) {
        this.submissions = res.map(
          (submission: any) =>
            new Submission(
              submission.submissionID,
              submission.studentNumber,
              submission.submissionMark,
              submission.studentName,
              submission.studentSurname,
              submission.submissionStatus,
              submission.submissionFolderName,
            ),
        );
      } else {
        Swal.fire({
          icon: 'error',
          title: 'No connection',
          text: 'Cannot connect to server',
        });
      }
    });
  }
  /**
   * Function to fetch the modules from the server.
   * This function sends a GET request to the server to fetch the modules.
   * If the response is successful, the modules are stored in the modules array.
   * If the response is unsuccessful, an error message is displayed.
   */
  getModules(): Promise<void> {
    return this.api
      .getModules()
      .toPromise()
      .then((res: any) => {
        if (res && Array.isArray(res)) {
          this.modules = res.map(
            (module: any) => new Module(module.ModuleCode, module.ModuleName),
          );
        } else {
          throw new Error('No modules found or invalid response format.');
        }
      });
  }

  /**
   * Function to fetch the moderators from the server.
   * This function sends a GET request to the server to fetch the moderators.
   * If the response is successful, the moderators are stored in the moderators array.
   * If the response is unsuccessful, an error message is displayed.
   * The logged in user's email is filtered out from the list of moderators, as a lecturer cannot select themselves as a moderator.
   */
  getModerators(): Promise<void> {
    return this.api
      .getModerators()
      .toPromise()
      .then((res: any) => {
        if (res && Array.isArray(res)) {
          if (this.email === this.assessmentModEmail) {
            this.moderators = res
              .filter(
                (moderator: any) =>
                  moderator.ModEmail !== this.assessmentLecturerEmail,
              )
              .map(
                (moderator: any) =>
                  new Moderator(
                    moderator.MarkerEmail,
                    moderator.Name,
                    moderator.Surname,
                  ),
              );
          } else {
            this.moderators = res
              .filter((moderator: any) => moderator.ModEmail !== this.email)
              .map(
                (moderator: any) =>
                  new Moderator(
                    moderator.MarkerEmail,
                    moderator.Name,
                    moderator.Surname,
                  ),
              );
          }
        } else {
          throw new Error('No moderators found or invalid response format.');
        }
      });
  }

  /**
   * Function to fetch the markers from the server.
   * This function sends a GET request to the server to fetch the markers.
   * If the response is successful, the markers are stored in the markers array.
   * If the response is unsuccessful, an error message is displayed.
   * The logged in user's email is filtered out from the list of markers, as a lecturer cannot select themselves as a marker, since they are already that lecturer.
   * To be clear, the lecturer always has access to assess their own assessments, so they do not need to be added as a marker.
   */
  getMarkers() {
    this.api.getMarkers().subscribe((res: any) => {
      if (res && Array.isArray(res)) {
        this.allMarkers = res.map(
          (marker: any) =>
            new Marker(
              marker.MarkerEmail,
              marker.Name,
              marker.Surname,
              '',
              marker.MarkingStyle,
            ),
        );
        this.markers = res
          .filter(
            (marker: any) => marker.MarkerEmail !== this.assessmentModEmail,
          )
          .map(
            (marker: any) =>
              new Marker(
                marker.MarkerEmail,
                marker.Name,
                marker.Surname,
                '',
                marker.MarkingStyle,
              ),
          );
        this.filteredMarkers = res
          .filter(
            (marker: any) => marker.MarkerEmail !== this.assessmentModEmail,
          )
          .map(
            (marker: any) =>
              new Marker(
                marker.MarkerEmail,
                marker.Name,
                marker.Surname,
                '',
                marker.MarkingStyle,
              ),
          );
      } else {
        alert('No markers found or invalid response format.');
      }
    });
  }

  onDashboard(): void {
    this.router.navigateByUrl('/dashboard');
  }

  /**
   * Function to handle the assessment being edited
   * This function is called when the form is updated.
   * If the form is valid, the function sets the loading variable to true, and reads the file selected for the memorandum.
   * The file is read as an array buffer, and the assessment information is created.
   * The assessment information is then sent to the server to edit the assessment.
   * If the response is successful, the function calls the addSubmissions function.
   * If the response is unsuccessful, an error message is displayed.
   * If the form is invalid, an error message is displayed.
   */
  onSubmit(): void {
    if (this.assessmentForm.valid) {
      this.loading = true;

      // Only handle memorandum if isMemoUpdateEnabled is true
      if (this.isMemoUpdateEnabled && this.selectedMemoFile) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const fileData = reader.result as ArrayBuffer;
          const byteArray = new Uint8Array(fileData);
          this.sendAssessmentUpdate(byteArray);
        };
        reader.readAsArrayBuffer(this.selectedMemoFile);
      } else {
        this.sendAssessmentUpdate(null);
      }
    }
  }

  sendAssessmentUpdate(memoByteArray: Uint8Array | null): void {
    const assessmentInfo = {
      AssessmentID: this.assessmentID,
      MarkerEmail: this.assessmentForm.value.markers,
      AssessmentName: this.assessmentForm.value.assessmentName,
      ModuleCode: this.assessmentForm.value.module,
      Memorandum: memoByteArray,
      ModEmail: this.assessmentForm.value.moderator,
      TotalMark: this.assessmentForm.value.totalMarks,
      OldMark: this.oldMark,
    };

    this.api.editAssessment(assessmentInfo).subscribe(
      (res: any) => {
        if (res.message === 'Assessment edited successfully') {
          if (this.isSubmissionsUpdateEnabled) {
            this.updateSubmissions(this.assessmentID);
          } else {
            Swal.fire({
              icon: 'success',
              title: 'Success',
              text: 'Assessment edited successfully!',
              showConfirmButton: false,
              timer: 1500,
              position: 'bottom-end',
            });
            this.loading = false;
          }
          this.router.navigateByUrl('/dashboard');
        }
        this.loading = false;
      },
      (error) => {
        this.loading = false;
        Swal.fire('Error', 'Failed to edit assessment', 'error');
      },
    );
  }

  updateSubmissions(assessmentID: number): void {
    if (this.selectedSubmissionsFile) {
      const zip = new JSZip();
      const existingStudentNumbers = this.submissions.map(
        (sub) => sub.studentNumber,
      );
      this.selectedSubmissionsFile
        .arrayBuffer()
        .then((zipFileData) => zip.loadAsync(zipFileData))
        .then((zipContents) => {
          const promises: Promise<void>[] = [];
          zip.forEach((relativePath, zipEntry) => {
            const pathParts = relativePath.split('/');
            if (pathParts.length > 1) {
              const folderName = pathParts[0];
              const fileName = pathParts[pathParts.length - 1];
              var [firstName, lastName, studentNumber] = ['', '', ''];
              if (this.assessmentType === 'Moodle') {
                [firstName, lastName, studentNumber] =
                  this.extractInfoFromMoodleFolderName(folderName);
              } else {
                [firstName, lastName, studentNumber] =
                  this.extractInfoFromTDriveFolderName(folderName, fileName);
              }
              console.log(
                `Folder: ${folderName}, FirstName: ${firstName}, LastName: ${lastName}, StudentNumber: ${studentNumber}`,
              );
              if (fileName.endsWith('.pdf')) {
                promises.push(
                  zipEntry.async('arraybuffer').then((pdfData) => {
                    const submissionExists =
                      existingStudentNumbers.includes(studentNumber);
                    const submissionID = this.submissions.find(
                      (sub) => sub.studentNumber === studentNumber,
                    )?.submissionID;
                    if (submissionExists && submissionID) {
                      this.updateSubmission(
                        new Uint8Array(pdfData),
                        assessmentID,
                        submissionID,
                        firstName,
                        lastName,
                        studentNumber,
                        folderName,
                      );
                    } else {
                      this.processSubmissionPDF(
                        new Uint8Array(pdfData),
                        assessmentID,
                        firstName,
                        lastName,
                        studentNumber,
                        folderName,
                      );
                    }
                  }),
                );
              }
            }
          });

          return Promise.all(promises);
        })
        .then(() => {
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Assessment edited successfully!',
          });
          this.loading = false;
        })
        .catch((error) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text:
              'Failed to extract ZIP file. Please ensure the ZIP file is structured correctly. Error: ' +
              error,
          });
          this.loading = false;
        });
    }
  }

  updateSubmission(
    pdfData: Uint8Array,
    assessmentID: number,
    submissionID: number,
    firstName: string,
    lastName: string,
    studentNumber: string,
    folderName: string,
  ): void {
    const submissionInfo = {
      AssessmentID: assessmentID,
      SubmissionID: submissionID,
      SubmissionPDF: pdfData,
      StudentNum: studentNumber,
      StudentName: firstName,
      StudentSurname: lastName,
      SubmissionStatus: 'Unmarked', // Default status is unmarked until the marker marks the submission
      SubmissionFolderName: folderName,
    };

    try {
      this.api.updateSubmission(submissionInfo).subscribe((res: any) => {
        if (res && res.message === 'Submission edited successfully') {
          console.log(
            `Submission edited for ${firstName} ${lastName} (${studentNumber})`,
          );
        }
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to add submissions',
      });
    }
  }
  onUpdateMarkerList(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const selectedModEmail = selectElement.value;
    this.markers = this.allMarkers;
    this.markers = this.markers.filter(
      (marker: Marker) => marker.MarkerEmail !== selectedModEmail,
    );
    this.selectedMarkers = this.selectedMarkers.filter(
      (marker: Marker) => marker.MarkerEmail !== selectedModEmail,
    );
    this.filteredMarkers = this.markers;
  }

  processSubmissionPDF(
    pdfData: Uint8Array,
    assessmentID: number,
    firstName: string,
    lastName: string,
    studentNumber: string,
    folderName: string,
  ): void {
    const submissionInfo = {
      AssessmentID: assessmentID,
      SubmissionPDF: pdfData,
      StudentNum: studentNumber,
      StudentName: firstName,
      StudentSurname: lastName,
      SubmissionStatus: 'Unmarked', // Default status is unmarked until the marker marks the submission
      SubmissionFolderName: folderName,
    };

    try {
      this.api.addSubmission(submissionInfo).subscribe((res: any) => {
        if (res && res.message === 'Submission added successfully') {
          console.log(
            `Submission added for ${firstName} ${lastName} (${studentNumber})`,
          );
        }
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to add submissions',
      });
    }
  }
  extractInfoFromMoodleFolderName(
    folderName: string,
  ): [string, string, string] {
    let [studentNumber, name] = folderName.split('-');
    studentNumber = studentNumber.slice(1);
    const nameParts = name.split('_')[0].split(' ');
    console.log(nameParts.length);
    if (nameParts.length <= 2) {
      return [nameParts[0], nameParts[1], studentNumber];
    }
    const lastName = nameParts.slice(-2).join(' ');
    const firstName = nameParts.slice(0, -2).join(' ');
    return [firstName, lastName, studentNumber];
  }

  extractInfoFromTDriveFolderName(
    folderName: string,
    fileName: string,
  ): [string, string, string] {
    console.log(fileName);
    const [name, surname] = folderName.split('-').slice(0, 2);
    let studentNumber = fileName.split('-')[1];
    studentNumber = studentNumber.replace('.pdf', '');
    return [name, surname, studentNumber];
  }

  /**
   * Function to check if a file is a PDF file.
   * @param file - The file to check if it is a PDF file
   * @returns true if the file is a PDF file, false otherwise
   */
  isPDF(file: File): boolean {
    return file.type === 'application/pdf';
  }

  /**
   * Function to check if a file is a ZIP file.
   * @param file - The file to check if it is a ZIP file
   * @returns true if the file is a ZIP file, false otherwise
   */
  isZIP(file: File): boolean {
    return (
      file.type === 'application/zip' ||
      file.type === 'application/x-zip-compressed'
    );
  }
  /**
   * Function to handle the selection of a file for the memorandum.
   * @param event - The event object for the file input
   * This function is called when a file is selected for the memorandum.
   * If the file is a PDF file, the file is stored in the selectedMemoFile variable.
   * If the file is not a PDF file, an error message is displayed.
   */
  onMemoFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file && this.isPDF(file)) {
      this.selectedMemoFile = file;
      this.assessmentForm.patchValue({
        selectedMFile: file,
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Invalid File Type',
        text: 'Please select a PDF file',
      });
    }
  }
  /**
   * Function to handle the dropping of a file for the memorandum.
   * @param event - The drag event object for when a file is dropped
   * This function is called when a file is dropped for the memorandum.
   * If the file is a PDF file, the file is stored in the selectedMemoFile variable.
   * If the file is not a PDF file, an error message is displayed.
   */
  onMemoDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer?.files[0];
    if (file && this.isPDF(file)) {
      this.selectedMemoFile = file;
      this.assessmentForm.patchValue({
        selectedMFile: file,
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Invalid File Type',
        text: 'Please select a PDF file',
      });
    }
    this.removeDragOverClass();
  }

  /**
   * Function to handle the input change event for the total marks input.
   * @param event - The event object for the input element
   * This function is called when the input value changes, and ensures that the input value is a number.
   */
  onInputChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const inputValue = inputElement.value.trim();
    if (isNaN(parseInt(inputValue, 10))) {
      this.assessmentForm.patchValue({
        totalMarks: null,
      });
    }
  }

  /**
   * Function to handle the drag over event for the dropzone.
   * @param event - The drag event object for when a file is dragged over the dropzone
   * This function is called when a file is dragged over the dropzone.
   * The function prevents the default behaviour of the event, and stops the event from propagating to other events.
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.addDragOverClass();
  }

  /**
   * Function to handle the drag enter event for the dropzone.
   * @param event - The drag event object for when a file is dragged over the dropzone
   * This function is called when a file is dragged over the dropzone.
   * The function prevents the default behaviour of the event, and stops the event from propagating to other events.
   */
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.removeDragOverClass();
    this.isHoveringMemo = false;
  }

  onDragLeaveMemo(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.removeDragOverClass();
    this.isHoveringMemo = false;
  }

  onDragLeaveSubmissions(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.removeDragOverClass();
    this.isHoveringSubmissions = false;
  }
  /**
   * Function to add the dragover class to the dropzone.
   * This function adds the dragover class to the dropzone element.
   * This class is used to indicate that a file is being dragged over the dropzone.
   */
  addDragOverClass(): void {
    const dropzone = document.querySelector('.dropzone');
    dropzone?.classList.add('dragover');
  }

  /**
   * Function to remove the dragover class from the dropzone.
   * This function removes the dragover class from the dropzone element.
   * This class is used to indicate that a file is being dragged over the dropzone.
   */
  removeDragOverClass(): void {
    const dropzone = document.querySelector('.dropzone');
    dropzone?.classList.remove('dragover');
  }

  // Check if the marker is the lecturer
  isLecturer(marker: Marker): boolean {
    return marker.MarkerEmail === this.assessmentLecturerEmail;
  }

  // Handle changes to marker selection
  onMarkerChange(event: any, marker: Marker): void {
    // Prevent removing lecturer marker from selectedMarkers
    if (marker.MarkerEmail === this.email) {
      Swal.fire({
        icon: 'warning',
        title: 'Action not allowed',
        text: 'You cannot deselect the assessment lecturer as a marker',
      });
      event.target.checked = true;
      return;
    }

    if (event.target.checked) {
      // Add marker to selectedMarkers if checked
      if (!this.selectedMarkers.includes(marker)) {
        this.selectedMarkers.push(marker);
      }
    } else {
      // Remove marker from selectedMarkers if unchecked
      this.selectedMarkers = this.selectedMarkers.filter(
        (m) => m.MarkerEmail !== marker.MarkerEmail,
      );
    }

    // Update the form control with the selected marker emails
    this.assessmentForm.controls['markers'].setValue(
      this.selectedMarkers.map((m) => m.MarkerEmail),
    );
  }

  // Determine if a marker is selected
  isMarkerSelected(marker: Marker): boolean {
    return this.selectedMarkers.some(
      (m) => m.MarkerEmail === marker.MarkerEmail,
    );
  }

  /**
   * Function to handle the dropping of a zip file for the submissions.
   * @param event - The drag event object for when a file is dropped
   * This function is called when a file is dropped for the submissions.
   * If the file is a ZIP file, the file is stored in the selectedSubmissionsFile variable.
   * If the file is not a ZIP file, an error message is displayed.
   */
  onSubmissionsDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer?.files[0];
    if (file && this.isZIP(file)) {
      this.selectedSubmissionsFile = file;
      this.assessmentForm.patchValue({
        selectedSFile: file,
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Invalid File Type',
        text: 'Please select a zip file',
      });
    }
    this.removeDragOverClass();
  }

  /**
   * Function to handle the selection of a file for the submissions.
   * @param event - The event object for the file input
   * This function is called when a file is selected for the submissions.
   * If the file is a ZIP file, the file is stored in the selectedSubmissionsFile variable.
   * If the file is not a ZIP file, an error message is displayed.
   */
  onSubmissionsFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file && this.isZIP(file)) {
      this.selectedSubmissionsFile = file;
      this.assessmentForm.patchValue({
        selectedSFile: file,
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Invalid File Type',
        text: 'Please select a zip file',
      });
    }
  }

  onReturnAssessment() {
    this.location.back();
  }
}
