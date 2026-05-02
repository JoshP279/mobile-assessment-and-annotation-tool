/**
 * Lecturer class
 * This class is used to create a new Lecturer object, and stores the email of the lecturer.
 */
export class Lecturer{
    MarkerEmail: string;
    Name:string;
    Surname:string;
    Password:string;
    MarkingStyle: string;
    constructor(MarkerEmail: string, Name: string, Surname: string, Password:string, MarkingStyle:string){ {
      this.MarkerEmail = MarkerEmail;
      this.Name = Name;
      this.Surname = Surname;
      this.Password = Password;
      this.MarkingStyle = MarkingStyle
    }
  }
}