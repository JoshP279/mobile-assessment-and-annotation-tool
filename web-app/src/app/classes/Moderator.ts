/**
 * This class is used to create a Moderator object, and stores the email of the moderator.
 */
export class Moderator{
    ModEmail: string;
    Name:string;
    Surname:String;
    constructor(ModEmail: string, Name:string, Surname:String){ {
      this.ModEmail = ModEmail;
      this.Name = Name;
      this.Surname = Surname;
    }
  }
}