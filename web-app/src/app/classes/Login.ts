/**
 * Login class
 * This class is used to store the login credentials of the user.
 */
export class Login {
    MarkerEmail: string;
    Password: string;
    /**
     * Constructor for the Login class
     * By defaukt, the MarkerEmail and Password are set to empty strings.
     * This is because the user has not entered any login credentials yet. When the user enters their login credentials, the values of these variables will be updated.
     */
    constructor() {
      this.MarkerEmail = '';
      this.Password = '';
    }
  }