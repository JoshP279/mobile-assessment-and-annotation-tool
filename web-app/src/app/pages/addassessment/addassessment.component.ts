import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import JSZip from 'jszip';
import Swal from 'sweetalert2';
import { ApiService } from '../../API/api.service';
import { Marker } from '../../classes/Marker';
import { Moderator } from '../../classes/Moderator';
import { Module } from '../../classes/Module';

@Component({
  selector: 'app-addassessment',
  standalone: true,
  templateUrl: './addassessment.component.html',
  styleUrls: ['./addassessment.component.css'],
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
})
/**
 * AddAssessment component for handling the addition of assessments.
 * OnInit is implemented, to allow for retrieval of data when the component is initialized.
 */
export class AddAssessmentComponent implements OnInit {
  email: string = '';
  assessmentName: string = '';
  loading: boolean = false;
  assessmentForm: FormGroup;
  modules: Module[] = [];
  AssessmentName: string = '';
  searchTerm = '';
  moderators: Moderator[] = [];
  markers: Marker[] = [];
  filteredMarkers: Marker[] = [];
  allMarkers: Marker[] = [];
  selectedMarkers: Marker[] = [];
  TotalMark: number = 0;
  selectedMemoFile: File | null = null;
  selectedSubmissionsFile: File | null = null;
  assessmentType: string = '';
  isHoveringMemo: boolean = false;
  isHoveringSubmissions: boolean = false;
  /**
   * @param fb - The form builder service for creating form controls
   * @param api  - The API service for making HTTP requests to the server
   * @param router - The router service for navigating between pages
   */
  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private router: Router,
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
      selectedMFile: [null, Validators.required],
      selectedSFile: [null, Validators.required],
    });
  }
  /**
   * Function to handle the initialization of the component.
   * This function fetches the modules, moderators and markers from the server.
   */
  ngOnInit(): void {
    const storedEmail = sessionStorage.getItem('email');
    const assessmentType = sessionStorage.getItem('assessmentType');

    if (storedEmail && assessmentType) {
      this.email = storedEmail;
      this.assessmentType = assessmentType;
      this.fetchData();
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
  async fetchData(): Promise<void> {
    try {
      this.loading = true;

      const modules = this.getModules();
      const moderators = this.getModerators();
      const markers = this.getMarkers();

      await Promise.all([modules, moderators, markers]);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch data',
      });
    } finally {
      this.loading = false;
    }
  }

  /**
   * Function to fetch the modules from the server.
   * This function sends a GET request to the server to fetch the modules.
   * If the response is successful, the modules are stored in the modules array.
   * If the response is unsuccessful, an error message is displayed.
   */
  async getModules() {
    this.api.getModules().subscribe((res: any) => {
      if (res && Array.isArray(res)) {
        this.modules = res.map(
          (module: any) => new Module(module.ModuleCode, module.ModuleName),
        );
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error fetching modules',
        });
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
  async getModerators() {
    this.api.getModerators().subscribe((res: any) => {
      if (res && Array.isArray(res)) {
        this.moderators = res
          .filter((moderator: any) => moderator.MarkerEmail !== this.email)
          .map(
            (moderator: any) =>
              new Moderator(
                moderator.MarkerEmail,
                moderator.Name,
                moderator.Surname,
              ),
          );
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error fetching moderators',
        });
      }
    });
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

  /**
   * Function to fetch the markers from the server.
   * This function sends a GET request to the server to fetch the markers.
   * If the response is successful, the markers are stored in the markers array.
   * If the response is unsuccessful, an error message is displayed.
   * The logged in user's email is filtered out from the list of markers, as a lecturer cannot select themselves as a marker, since they are already that lecturer.
   * To be clear, the lecturer always has access to assess their own assessments, so they do not need to be added as a marker.
   */
  async getMarkers() {
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
        const lecturerMarker = this.markers.find(
          (marker) => marker.MarkerEmail === this.email,
        );

        if (lecturerMarker) {
          this.selectedMarkers.push(lecturerMarker);
        }
        this.assessmentForm.patchValue({
          markers: this.selectedMarkers.map((marker) => marker.MarkerEmail),
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error fetching markers',
        });
      }
    });
  }

  onSearchMarkers() {
    this.filteredMarkers = this.markers.filter(
      (marker) =>
        marker.Name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        marker.Surname.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        marker.MarkerEmail.toLowerCase().includes(
          this.searchTerm.toLowerCase(),
        ),
    );
  }

  /**
   * Function to handle the submission of the form.
   * This function is called when the form is submitted.
   * If the form is valid, the function sets the loading variable to true, and reads the file selected for the memorandum.
   * The file is read as an array buffer, and the assessment information is created.
   * The assessment information is then sent to the server to add the assessment.
   * If the response is successful, the function calls the addSubmissions function.
   * If the response is unsuccessful, an error message is displayed.
   * If the form is invalid, an error message is displayed.
   */
  onSubmit(): void {
    if (this.assessmentForm.valid) {
      this.loading = true;
      const reader = new FileReader();
      const file: File = this.assessmentForm.value.selectedMFile;
      if (file) {
        reader.onloadend = async () => {
          const fileData = reader.result as ArrayBuffer;
          const byteArray = new Uint8Array(fileData);
          const assessmentInfo = {
            LecturerEmail: this.email,
            MarkerEmail: this.assessmentForm.value.markers,
            AssessmentName: this.assessmentForm.value.assessmentName,
            ModuleCode: this.assessmentForm.value.module,
            Memorandum: byteArray,
            ModEmail: this.assessmentForm.value.moderator,
            TotalMark: this.assessmentForm.value.totalMarks,
            NumSubmissionsMarked: 0,
            TotalNumSubmissions: 0,
            AssessmentType: this.assessmentType,
          };
          try {
            this.api.addAssessment(assessmentInfo).subscribe((res: any) => {
              if (
                res &&
                res.message === 'Assessment added successfully' &&
                res.assessmentID
              ) {
                this.addSubmissions(res.assessmentID);
              } else if (res.Failed) {
                this.loading = false;
                Swal.fire({
                  icon: 'error',
                  title: 'Error',
                  text: 'Failed to add assessment',
                });
              }
            });
          } catch (error) {
            this.loading = false;
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to add assessment',
            });
          }
        };
        reader.readAsArrayBuffer(file);
      }
    }
  }

  /**
   * Function to add submissions to the assessment.
   * @param assessmentID - The ID of the assessment
   * This function is called when the assessment is successfully added.
   * The function reads the file selected for the submissions.
   * The file is read as an array buffer, and the ZIP file is loaded asynchronously. Note that the ZIP file must be structured correctly for the submissions to be added successfully.
   * The function then iterates through the ZIP file, extracting the folder name, first name, last name and student number from the folder name.
   * The function then processes the submission PDF, adding the submission to the server.
   * If the response is successful, a success message is displayed.
   * If the response is unsuccessful, an error message is displayed.
   * If there is an error reading the ZIP file, an error message is displayed.
   */
  addSubmissions(assessmentID: number): void {
    if (this.selectedSubmissionsFile) {
      const zip = new JSZip();
      this.selectedSubmissionsFile
        .arrayBuffer()
        .then((zipFileData) => {
          zip
            .loadAsync(zipFileData)
            .then((zipContents) => {
              const promises: Promise<void>[] = [];
              zip.forEach((relativePath, zipEntry) => {
                const pathParts = relativePath
                  .replace(/^\/*|\/*$/g, '')
                  .split('/');
                if (pathParts.length > 1) {
                  const folderName = pathParts[0];
                  const fileName = pathParts[pathParts.length - 1];
                  var [firstName, lastName, studentNumber] = ['', '', ''];
                  if (this.assessmentType === 'Moodle') {
                    [firstName, lastName, studentNumber] =
                      this.extractInfoFromMoodleFolderName(folderName);
                  } else {
                    [firstName, lastName, studentNumber] =
                      this.extractInfoFromTDriveFolderName(
                        folderName,
                        fileName,
                      );
                  }
                  if (!studentNumber || studentNumber.length !== 9) {
                    throw new Error('Invalid student number'); //then folder structure is wrong, so catch error, delete assessment and return
                  }
                  if (fileName.endsWith('.pdf')) {
                    promises.push(
                      zipEntry.async('arraybuffer').then((pdfData) => {
                        this.processSubmissionPDF(
                          new Uint8Array(pdfData),
                          assessmentID,
                          firstName,
                          lastName,
                          studentNumber,
                          folderName,
                        );
                        this.router.navigateByUrl('/dashboard');
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
                text: 'Assessment added successfully!',
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
              this.api.deleteAssessment(assessmentID).subscribe((res: any) => {
                if (res && res.message === 'Assessment deleted successfully') {
                  console.log('Assessment deleted successfully');
                }
              });
              this.loading = false;
            });
        })
        .catch((error) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error reading ZIP file: ' + error,
          });
          this.api.deleteAssessment(assessmentID).subscribe((res: any) => {
            if (res && res.message === 'Assessment deleted successfully') {
              console.log('Assessment deleted successfully');
            }
          });
          this.loading = false;
        });
    }
  }
  /**
   *
   * @param folderName - The name of the folder containing the submission. This folder name is parsed to extract student number, name and surname.
   * @returns - A tuple containing the student number, first name and last name of the student.
   */
  extractInfoFromMoodleFolderName(
    folderName: string,
  ): [string, string, string] {
    let [studentNumber, name] = folderName.split('-');
    studentNumber = studentNumber.slice(1);
    const nameParts = name.split('_')[0].split(' ');
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
   * Function to process the submission PDF.
   * @param pdfData - The PDF data of the submission
   * @param assessmentID - The ID of the assessment
   * @param firstName - The first name of the student
   * @param lastName - The last name of the student
   * @param studentNumber - The student number of the student
   * This function sends a PUT request to the server to add the submission.
   * If the response is successful, a success message is displayed.
   * If the response is unsuccessful, an error message is displayed.
   */
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

  /**
   * Function to handle the logout of the user.
   * This function is called when the user clicks the logout button.
   * The user's email is removed from the session storage, and the user is redirected to the login page.
   */
  onLogout(): void {
    sessionStorage.removeItem('email');
    this.router.navigateByUrl('/login');
  }

  /**
   * Function to navigate to the dashboard page.
   * This function is called when the user clicks the dashboard button.
   * The user is redirected to the dashboard page.
   */
  onDashboard(): void {
    this.router.navigateByUrl('/dashboard');
  }
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
        (m) =>
          m.MarkerEmail !== marker.MarkerEmail ||
          m.MarkerEmail === this.assessmentForm.value.moderator,
      );
    }

    // Update the form control with the selected marker emails
    this.assessmentForm.controls['markers'].setValue(
      this.selectedMarkers.map((m) => m.MarkerEmail),
    );
  }

  isMarkerSelected(marker: Marker): boolean {
    return this.selectedMarkers.some(
      (m) => m.MarkerEmail === marker.MarkerEmail,
    );
  }
}
