import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../API/api.service';
import { Router } from '@angular/router';
import { Login } from '../../classes/Login';
import { catchError, timeout } from 'rxjs/operators';
import { of } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
/**
 * Login component for handling user login functionality.
 */
export class LoginComponent {
  loginObj: Login;

  /**
   *
   * @param api - The API service for making HTTP requests to the server
   * @param router - The router service for navigating between pages
   */
  constructor(
    private api: ApiService,
    private router: Router,
  ) {
    this.loginObj = new Login();
  }
  /**
   * Function to handle the login functionality.
   * This function sends a GET request to the server with the login credentials.
   */
  onLogin() {
    sessionStorage.clear();
    this.api
      .login(this.loginObj)
      .pipe(
        catchError((error) => {
          // Check if there is no response or status is 0 (network issues)
          if (!error.status || error.status === 0) {
            Swal.fire({
              icon: 'error',
              title: 'No connection',
              text: 'Cannot connect to server',
            });
            return of(null); // Return null to prevent further execution
          } else {
            // If the error has a response, we log it and return an observable with the error object
            console.error('Error occurred:', error);
            return of(error.error); // Return error object for handling in subscribe
          }
        }),
      )
      .subscribe((res: any) => {
        if (res && res.MarkerRole) {
          if (res.MarkerRole === 'Lecturer') {
            const email = this.loginObj.MarkerEmail;
            sessionStorage.setItem('email', email);
            this.router.navigateByUrl('/dashboard');
          } else if (res.MarkerRole === 'Admin') {
            const email = this.loginObj.MarkerEmail;
            sessionStorage.setItem('AdminEmail', email);
            this.router.navigateByUrl('/admin');
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Invalid Role',
              text: 'You do not have the correct role to access this page.',
            });
          }
        } else if (res && res.error === 'Invalid username or password') {
          Swal.fire({
            icon: 'error',
            title: 'Invalid Credentials',
            text: 'Incorrect email or password.',
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Unable to connect to the server, please try again later.',
          });
        }
      });
  }
}
