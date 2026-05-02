import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { ApiService } from '../../API/api.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Assessment } from '../../classes/Assessment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  imports: [CommonModule, FormsModule],
})
/**
 * DashboardComponent class
 * This class is used to display the dashboard page
 * OnInit is implemented, to allow for retrieval of data when the component is initialized.
 *
 */
export class DashboardComponent implements OnInit {
  email: string = '';
  assessments: Assessment[] = [];
  filteredAssessments: Assessment[] = [];
  searchTerm: string = '';
  selectedStatus: string = '';
  sortOrder = 'asc';
  loading = false;

  /**
   * @param api  - The API service for making HTTP requests to the server
   * @param router - The router service for navigating between pages
   */
  constructor(
    private api: ApiService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  /**
   * ngOnInit method
   * This method is called when the component is initialized
   * It retrieves the email from session storage and calls the getAssessments method
   */
  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const storedEmail = sessionStorage.getItem('email');
      if (storedEmail) {
        this.email = storedEmail;
        this.onGetAssessments(this.email);
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
  }
  /**
   * This method is used to retrieve the assessments for a marker
   * @param email - The email of the marker
   * It calls the getAssessments method from the API service
   * If the response is successful, the assessments are stored in the assessments array
   * If the response is unsuccessful, an error message is displayed
   */
  onGetAssessments(email: string): void {
    this.loading = true;
    this.api.getAssessments(email).subscribe(
      (res: any) => {
        if (res && Array.isArray(res) && res.length > 0) {
          this.assessments = res;
          this.filteredAssessments = res;
          this.sortAssessments();
        }
      },
      (error) => {
        if (error.status === 404) {
          // do nothing if no assessments are found (the user has not added any assessments)
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Unable to fetch assessments',
          });
        }
      },
    );
    this.loading = false;
  }

  /**
   * This method is used to navigate to the add-assessment page, or add-tdriveassessment page, depending on type of assessment being added
   * It stores the email in session storage
   */
  onAddAssessment(): void {
    sessionStorage.setItem('email', this.email);
    Swal.fire({
      icon: 'question',
      title: 'What type of assessment would you like to add?',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: `Moodle Assesment`,
      confirmButtonColor: '#000080',
      denyButtonText: `Test Drive Assessment`,
    }).then((result) => {
      if (result.isConfirmed) {
        sessionStorage.setItem('assessmentType', 'Moodle');
        this.router.navigateByUrl('/add-assessment');
      } else if (result.isDenied) {
        sessionStorage.setItem('assessmentType', 'Test Drive');
        this.router.navigateByUrl('/add-assessment');
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        // do nothing if the user cancels the operation
      }
    });
  }

  /**
   * Function to navigate to the view-assessment page
   * @param assessmentID - The ID of the assessment
   * @param assessmentName - The name of the assessment
   * @param moduleCode - The module code of the assessment
   * @param modEmail - The email of the moderator
   * This method is used to navigate to the view-assessment page, where the relevant submissions are displayed for that assessment
   */
  onViewAsssessment(
    assessmentID: number,
    assessmentName: string,
    assessmentLecturerEmail: string,
    moduleCode: string,
    modEmail: string,
    assesmentType: string,
  ): void {
    sessionStorage.setItem('assessmentID', assessmentID.toString());
    sessionStorage.setItem('assessmentName', assessmentName);
    sessionStorage.setItem('assessmentModule', moduleCode);
    sessionStorage.setItem('modEmail', modEmail);
    sessionStorage.setItem('lecturerEmail', assessmentLecturerEmail);
    sessionStorage.setItem('assessmentType', assesmentType);
    this.router.navigateByUrl('/view-assessment)');
  }

  /**
   * Function to calculate the stroke-dashoffset for solid progress bar
   * @param numMarked - The number of submissions marked
   * @param totalSubmissions - The total number of submissions
   * @returns a number that represents the stroke offset for the progress circle
   */
  calculateDashOffset(numMarked: number, totalSubmissions: number): number {
    const percentage = (numMarked / totalSubmissions) * 100;
    const dashOffset = 283 - (percentage / 100) * 283; // 283 is the circumference of the circle
    return dashOffset;
  }

  /**
   * Function to calculate the progress of marking for an assessment
   * @param numMarked - The number of submissions marked
   * @param totalSubmissions - The total number of submissions
   * @returns a number that represents number of submissions marked as a percentage of total submissions
   */
  getProgressPercentage(numMarked: number, totalSubmissions: number): number {
    return totalSubmissions > 0
      ? Math.round((numMarked / totalSubmissions) * 100)
      : 0;
  }

  /**
   * Function to calculate the color of the progress bar
   * @param numMarked - The number of submissions marked
   * @param totalSubmissions = The total number of submissions
   * @returns a string that represents the color of the progress bar
   */
  getColor(numMarked: number, totalSubmissions: number): string {
    const percentage = (numMarked / totalSubmissions) * 100;
    return percentage === 100 ? 'green' : percentage >= 50 ? 'red' : 'orange';
  }

  /**
   * Function to filter the assessments based on the search term
   * It filters the assessments based on the assessment name and module code
   * The filtered assessments are stored in the filteredAssessments array
   */
  onSearch(): void {
    this.filteredAssessments = this.assessments.filter(
      (assessment) =>
        assessment.assessmentName
          .toLowerCase()
          .includes(this.searchTerm.toLowerCase()) ||
        assessment.moduleCode
          .toLowerCase()
          .includes(this.searchTerm.toLowerCase()),
    );
  }
  /**
   * Function to log out the user
   * It clears the session storage and navigates to the login page
   */
  onLogout(): void {
    sessionStorage.clear();
    this.router.navigateByUrl('/login', { replaceUrl: true }).then(() => {
      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', () => {
        window.history.pushState(null, '', window.location.href);
      });
    });
  }

  /**
   * Function to navigate to the dashboard page
   * It navigates to the dashboard page
   */
  onDashboard(): void {
    this.router.navigateByUrl('/dashboard');
  }

  filterAssessments() {
    console.log(this.selectedStatus);

    this.filteredAssessments = this.assessments.filter((assessment) => {
      const lecturing = assessment.modEmail !== this.email;
      const moderating = assessment.modEmail === this.email;

      if (this.selectedStatus === 'Lecturer') {
        return lecturing;
      } else if (this.selectedStatus === 'Moderator') {
        return moderating;
      } else {
        return true;
      }
    });
  }

  sortAssessments() {
    this.filteredAssessments.sort((a, b) => {
      const comparison =
        a.numMarked / a.totalSubmissions - b.numMarked / b.totalSubmissions;
      return this.sortOrder === 'asc' ? comparison : -comparison;
    });
  }
}
