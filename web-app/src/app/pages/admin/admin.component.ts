import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../API/api.service';
import Swal from 'sweetalert2';
import { Marker } from '../../classes/Marker';
import { Lecturer } from '../../classes/Lecturer';
import { Module } from '../../classes/Module';
import { Moderator } from '../../classes/Moderator';
import { Router } from '@angular/router';
import { Assessment } from '../../classes/Assessment';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
})
export class AdminComponent implements OnInit {
  loading: boolean = false;

  moduleName: string = '';
  moduleCode: string = '';
  moduleSearchText: string = '';

  lecturerEmail: string = '';
  lecturerName: string = '';
  lecturerSurname: string = '';
  lecturerPassword: string = '';
  lecturerMarkingStyle: string = 'Right Handed Ticks';
  lecturerSearchText: string = '';

  markerEmail: string = '';
  markerName: string = '';
  markerSurname: string = '';
  markerPassword: string = '';
  markerMarkingStyle: string = 'Right Handed Ticks';
  markerSearchText: string = '';

  modules: Module[] = [];
  filteredModules: Module[] = [];
  lecturers: Lecturer[] = [];
  filteredLecturers: Lecturer[] = [];
  moderators: Moderator[] = [];
  markers: Marker[] = [];
  filteredMarkers: Marker[] = [];
  assessments: Assessment[] = [];
  filteredAssessments: Assessment[] = [];
  assessmentSearchText: string = '';

  constructor(
    private router: Router,
    private api: ApiService,
  ) {}

  ngOnInit(): void {
    const email = sessionStorage.getItem('AdminEmail');
    if (!email) {
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
    } else {
      this.loadExistingData();
    }
  }

  loadExistingData(): void {
    this.loading = true;

    this.api.getModules().subscribe((modules) => {
      this.modules = modules;
      this.filteredModules = modules;
    });

    this.api.getLecturers().subscribe((lecturers) => {
      this.lecturers = lecturers;
      this.filteredLecturers = lecturers;
    });

    this.api.getModerators().subscribe((moderators) => {
      this.moderators = moderators;
    });

    this.api.getAllAssessments().subscribe((assessments) => {
      this.assessments = assessments;
      this.filteredAssessments = assessments;
    });

    this.api.getAssistantMarkers().subscribe(
      (markers) => {
        this.markers = markers;
        this.filteredMarkers = markers;
        this.loading = false;
      },
      (err) => {
        this.loading = false;
        Swal.fire('Error', 'Failed to load data', 'error');
      },
    );
  }

  onAddModule(): void {
    if (this.moduleName && this.moduleCode) {
      this.loading = true;
      this.api
        .addModule(new Module(this.moduleCode, this.moduleName))
        .subscribe(
          (res) => {
            this.loading = false;
            Swal.fire({
              icon: 'success',
              title: 'Success',
              text: 'Module added successfully',
              position: 'bottom-end',
              timer: 1500,
              showConfirmButton: false,
              timerProgressBar: true,
            });
            this.modules.push(new Module(this.moduleCode, this.moduleName));
            this.moduleName = '';
            this.moduleCode = '';
          },
          (err) => {
            if (err.status === 409) {
              this.loading = false;
              Swal.fire(
                'Error',
                'Module code already exists, please add a new module with a unique module code',
                'error',
              );
              return;
            }
            this.loading = false;
            Swal.fire('Error', 'Failed to add module', 'error');
          },
        );
    } else {
      Swal.fire('Error', 'Please fill out all fields', 'error');
    }
  }
  onEditModule(module: Module): void {
    Swal.fire({
      title: 'Edit Module',
      html: `<input id="module-name" class="swal2-input" placeholder="Module Name" value="${module.ModuleName}" style="width: 350px;">`,
      focusConfirm: false,
      confirmButtonText: 'Save Changes',
      showCancelButton: true,
      cancelButtonColor: '#d33',
      preConfirm: () => {
        const moduleName = (
          document.getElementById('module-name') as HTMLInputElement
        ).value;
        if (!moduleName) {
          Swal.showValidationMessage('Please enter the new Module Name');
          return null;
        }
        return { moduleName };
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const { moduleName } = result.value!;
        this.loading = true;
        this.api.editModule(module.ModuleCode, moduleName).subscribe(
          (res) => {
            this.loading = false;
            Swal.fire({
              icon: 'success',
              title: 'Success',
              text: 'Module updated successfully',
              position: 'bottom-end',
              timer: 1500,
              showConfirmButton: false,
              timerProgressBar: true,
            });
            module.ModuleName = moduleName;
          },
          (err) => {
            this.loading = false;
            Swal.fire('Error', 'Failed to update module', 'error');
          },
        );
      }
    });
  }

  onDeleteModule(moduleCode: string): void {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      preConfirm: () => {
        if (
          this.assessments.some(
            (assessment) => assessment.moduleCode === moduleCode,
          )
        ) {
          Swal.showValidationMessage(
            'This module still has assessments, please delete their assessments first',
          );
          return false;
        }
        return true;
      },
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.api.deleteModule(moduleCode).subscribe(
          (res) => {
            this.loading = false;
            Swal.fire({
              icon: 'success',
              title: 'Success',
              text: 'Module has been deleted successfully',
              position: 'bottom-end',
              timer: 1500,
              showConfirmButton: false,
              timerProgressBar: true,
            });
            this.modules = this.modules.filter(
              (m) => m.ModuleCode !== moduleCode,
            );
            this.filteredModules = this.filteredModules.filter(
              (m) => m.ModuleCode !== moduleCode,
            );
          },
          (err) => {
            this.loading = false;
            Swal.fire('Error', 'Failed to delete module', 'error');
          },
        );
      }
    });
  }

  onSearchModule() {
    this.filteredModules = this.modules.filter(
      (module) =>
        module.ModuleName.toLowerCase().includes(
          this.moduleSearchText.toLowerCase(),
        ) ||
        module.ModuleCode.toLowerCase().includes(
          this.moduleSearchText.toLowerCase(),
        ),
    );
  }

  onSearchLecturer() {
    this.filteredLecturers = this.lecturers.filter(
      (lecturer) =>
        lecturer.Name.toLowerCase().includes(
          this.lecturerSearchText.toLowerCase(),
        ) ||
        lecturer.Surname.toLowerCase().includes(
          this.lecturerSearchText.toLowerCase(),
        ) ||
        lecturer.MarkerEmail.toLowerCase().includes(
          this.lecturerSearchText.toLowerCase(),
        ),
    );
  }

  onSearchMarker() {
    this.filteredMarkers = this.markers.filter(
      (marker) =>
        marker.Name.toLowerCase().includes(
          this.markerSearchText.toLowerCase(),
        ) ||
        marker.Surname.toLowerCase().includes(
          this.markerSearchText.toLowerCase(),
        ) ||
        marker.MarkerEmail.toLowerCase().includes(
          this.markerSearchText.toLowerCase(),
        ),
    );
  }

  onSearchAssessment() {
    this.filteredAssessments = this.assessments.filter(
      (assessment) =>
        assessment.assessmentName
          .toLowerCase()
          .includes(this.assessmentSearchText.toLowerCase()) ||
        assessment.moduleCode
          .toLowerCase()
          .includes(this.assessmentSearchText.toLowerCase()),
    );
  }

  onAddLecturer(): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (
      this.lecturerEmail &&
      emailRegex.test(this.lecturerEmail) &&
      this.lecturerName &&
      this.lecturerSurname &&
      this.lecturerPassword
    ) {
      this.loading = true;
      this.api
        .addLecturer(
          new Lecturer(
            this.lecturerEmail,
            this.lecturerName,
            this.lecturerSurname,
            this.lecturerPassword,
            this.lecturerMarkingStyle,
          ),
        )
        .subscribe(
          (res) => {
            this.loading = false;
            Swal.fire({
              icon: 'success',
              title: 'Success',
              text: 'Lecturer added successfully',
              position: 'bottom-end',
              timer: 1500,
              showConfirmButton: false,
              timerProgressBar: true,
            });
            this.lecturers.push(
              new Lecturer(
                this.lecturerEmail,
                this.lecturerName,
                this.lecturerSurname,
                this.lecturerPassword,
                this.lecturerMarkingStyle,
              ),
            );
            this.lecturerEmail = '';
            this.lecturerName = '';
            this.lecturerSurname = '';
            this.lecturerPassword = '';
            this.lecturerMarkingStyle = 'Right Handed Ticks';
          },
          (err) => {
            if (err.status === 409) {
              this.loading = false;
              Swal.fire(
                'Error',
                'Lecturer already exists, please add a new lecturer with a unique email address',
                'error',
              );
              return;
            }
            this.loading = false;
            Swal.fire('Error', 'Failed to add lecturer', 'error');
          },
        );
    } else if (emailRegex.test(this.lecturerEmail) === false) {
      Swal.fire('Error', 'Please enter a valid email address', 'error');
    } else {
      Swal.fire('Error', 'Please fill out all fields', 'error');
    }
  }

  onEditLecturer(lecturer: Lecturer): void {
    Swal.fire({
      title: 'Edit Lecturer',
      html:
        `<input id="lecturer-name" class="swal2-input" placeholder="Lecturer Name" value="${lecturer.Name}" style="width: 350px;">` +
        `<input id="lecturer-surname" class="swal2-input" placeholder="Lecturer Surname" value="${lecturer.Surname}" style="width: 350px;">` +
        `<input id="lecturer-password" class="swal2-input" placeholder="Lecturer Password" value="${lecturer.Password}" style="width: 350px;">` +
        `<select id="lecturer-markingStyle" class="swal2-input" style="width: 350px; margin-top: 10px;">
              <option value="" disabled ${lecturer.MarkingStyle === '' ? 'selected' : ''} hidden>Select Marking Style</option>
              <option value="Right Handed Ticks" ${lecturer.MarkingStyle === 'Right Handed Ticks' ? 'selected' : ''}>Right Handed Ticks</option>
              <option value="Left Handed Ticks" ${lecturer.MarkingStyle === 'Left Handed Ticks' ? 'selected' : ''}>Left Handed Ticks</option>
          </select>`,
      focusConfirm: false,
      confirmButtonText: 'Save Changes',
      showCancelButton: true,
      cancelButtonColor: '#d33',
      preConfirm: () => {
        const email = lecturer.MarkerEmail;
        const name = (
          document.getElementById('lecturer-name') as HTMLInputElement
        ).value;
        const surname = (
          document.getElementById('lecturer-surname') as HTMLInputElement
        ).value;
        const password = (
          document.getElementById('lecturer-password') as HTMLInputElement
        ).value;
        const markingStyle = (
          document.getElementById('lecturer-markingStyle') as HTMLSelectElement
        ).value;
        if (!email || !name || !surname || !password || !markingStyle) {
          Swal.showValidationMessage('Please fill out all fields');
          return null;
        }

        return { email, name, surname, password, markingStyle };
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const { email, name, surname, password, markingStyle } = result.value!;

        // Logic to update the lecturer using the new values
        this.loading = true;
        this.api
          .editMarker(email, name, surname, password, markingStyle)
          .subscribe(
            (res) => {
              this.loading = false;
              Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Lecturer updated successfully',
                position: 'bottom-end',
                timer: 1500,
                showConfirmButton: false,
                timerProgressBar: true,
              });
              lecturer.MarkerEmail = email;
              lecturer.Name = name;
              lecturer.Surname = surname;
              lecturer.Password = password;
              lecturer.MarkingStyle = markingStyle;
            },
            (err) => {
              this.loading = false;
              Swal.fire('Error', 'Failed to update lecturer', 'error');
            },
          );
      }
    });
  }

  onDeleteLecturer(email: string): void {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      preConfirm: () => {
        if (
          this.assessments.some(
            (assessment) =>
              assessment.lecturerEmail === email ||
              assessment.modEmail === email,
          )
        ) {
          Swal.showValidationMessage(
            'This lecturer still has assessments they are lecturing or moderating, please delete the relevant assessments first.',
          );
          return false;
        }
        return true;
      },
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.api.deleteMarker(email).subscribe(
          (res) => {
            this.loading = false;
            this.lecturers = this.lecturers.filter(
              (l) => l.MarkerEmail !== email,
            );
            this.filteredLecturers = this.filteredLecturers.filter(
              (l) => l.MarkerEmail !== email,
            );
            Swal.fire({
              icon: 'success',
              title: 'Success',
              text: 'Lecturer has been deleted',
              position: 'bottom-end',
              timer: 1500,
              showConfirmButton: false,
              timerProgressBar: true,
            });
          },
          (err) => {
            this.loading = false;
            Swal.fire('Error', 'Failed to delete lecturer', 'error');
          },
        );
      }
    });
  }

  onAddAssistantMarker(): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (
      this.markerEmail &&
      emailRegex.test(this.markerEmail) &&
      this.markerName &&
      this.markerSurname &&
      this.markerPassword
    ) {
      this.loading = true;
      this.api
        .addMarker(
          new Marker(
            this.markerEmail,
            this.markerName,
            this.markerSurname,
            this.markerPassword,
            this.markerMarkingStyle,
          ),
        )
        .subscribe(
          (res) => {
            this.loading = false;
            Swal.fire({
              icon: 'success',
              title: 'Success',
              text: 'Marker added successfully',
              position: 'bottom-end',
              timer: 1500,
              showConfirmButton: false,
              timerProgressBar: true,
            });
            this.markers.push(
              new Marker(
                this.markerEmail,
                this.markerName,
                this.markerSurname,
                this.markerPassword,
                this.markerMarkingStyle,
              ),
            );
            this.markerEmail = '';
            this.markerName = '';
            this.markerSurname = '';
            this.markerPassword = '';
            this.markerMarkingStyle = 'RIght Handed Ticks';
          },
          (err) => {
            if (err.status === 409) {
              this.loading = false;
              Swal.fire(
                'Error',
                'Assistant marker already exists, please add a new assistant marker with a unique email address.',
                'error',
              );
              return;
            }
            this.loading = false;
            Swal.fire('Error', 'Failed to add marker', 'error');
          },
        );
    } else if (emailRegex.test(this.markerEmail) === false) {
      Swal.fire(
        'Error',
        `${this.markerEmail} is an invalid email address`,
        'error',
      );
    } else {
      Swal.fire('Error', 'Please fill out all fields', 'error');
    }
  }

  onEditAssistantMarker(marker: Marker): void {
    Swal.fire({
      title: 'Edit Marker',
      html:
        `<input id="marker-name" class="swal2-input" placeholder="Marker Name" value="${marker.Name}" style="width: 350px;">` +
        `<input id="marker-surname" class="swal2-input" placeholder="Marker Surname" value="${marker.Surname}" style="width: 350px;">` +
        `<input id="marker-password" class="swal2-input" placeholder="Marker Password" value="${marker.Password}" style="width: 350px;">` +
        `<select id="marker-markingStyle" class="swal2-input" style="width: 350px; margin-top: 10px;">
            <option value="" disabled ${marker.MarkingStyle === '' ? 'selected' : ''} hidden>Select Marking Style</option>
            <option value="Right Handed Ticks" ${marker.MarkingStyle === 'Right Handed Ticks' ? 'selected' : ''}>Right Handed Ticks</option>
            <option value="Left Handed Ticks" ${marker.MarkingStyle === 'Left Handed Ticks' ? 'selected' : ''}>Left Handed Ticks</option>
        </select>`,
      focusConfirm: false,
      confirmButtonText: 'Save Changes',
      showCancelButton: true,
      cancelButtonColor: '#d33',
      preConfirm: () => {
        const email = marker.MarkerEmail;
        const name = (
          document.getElementById('marker-name') as HTMLInputElement
        ).value;
        const surname = (
          document.getElementById('marker-surname') as HTMLInputElement
        ).value;
        const password = (
          document.getElementById('marker-password') as HTMLInputElement
        ).value;
        const markingStyle = (
          document.getElementById('marker-markingStyle') as HTMLSelectElement
        ).value;
        if (!name || !surname || !password) {
          Swal.showValidationMessage('Please fill out all fields');
          return null;
        }

        return { email, name, surname, password, markingStyle };
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const { email, name, surname, password, markingStyle } = result.value!;

        this.loading = true;
        this.api
          .editMarker(email, name, surname, password, markingStyle)
          .subscribe(
            (res) => {
              this.loading = false;
              Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Marker updated successfully.',
                position: 'bottom-end',
                timer: 1500,
                showConfirmButton: false,
                timerProgressBar: true,
              });
              marker.MarkerEmail = email;
              marker.Name = name;
              marker.Surname = surname;
              marker.Password = password;
              marker.MarkingStyle = markingStyle;
            },
            (err) => {
              this.loading = false;
              Swal.fire('Error', 'Failed to update marker', 'error');
            },
          );
      }
    });
  }

  onDeleteAssistantMarker(email: string): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This action cannot be undone, and the assistant markers will be removed from any assessments they are currently assigned to.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.api.deleteMarker(email).subscribe(
          (res) => {
            this.loading = false;
            Swal.fire({
              icon: 'success',
              title: 'Success',
              text: 'Marker has been deleted',
              position: 'bottom-end',
              timer: 1500,
              showConfirmButton: false,
              timerProgressBar: true,
            });
            this.markers = this.markers.filter((m) => m.MarkerEmail !== email);
            this.filteredMarkers = this.filteredMarkers.filter(
              (m) => m.MarkerEmail !== email,
            );
          },
          (err) => {
            this.loading = false;
            Swal.fire('Error', 'Failed to delete marker', 'error');
          },
        );
      }
    });
  }

  onDeleteAssessment(assessmentID: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.api.deleteAssessment(assessmentID).subscribe(
          (res) => {
            this.loading = false;
            Swal.fire({
              icon: 'success',
              title: 'Success',
              text: 'Assessment has been deleted.',
              position: 'bottom-end',
              timer: 1500,
              showConfirmButton: false,
              timerProgressBar: true,
            });
            this.assessments = this.assessments.filter(
              (a) => a.assessmentID !== assessmentID,
            );
            this.filteredAssessments = this.filteredAssessments.filter(
              (a) => a.assessmentID !== assessmentID,
            );
          },
          (err) => {
            this.loading = false;
            Swal.fire('Error', 'Failed to delete assessment', 'error');
          },
        );
      }
    });
  }

  onLogout(): void {
    sessionStorage.clear();
    this.router.navigateByUrl('/login', { replaceUrl: true }).then(() => {
      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', () => {
        window.history.pushState(null, '', window.location.href);
      });
    });
  }
}
