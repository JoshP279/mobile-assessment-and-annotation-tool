export class Assessment {
    assessmentID: number;
    lecturerEmail: string;
    moduleCode: string;
    assessmentName: string;
    numMarked: number;
    totalSubmissions: number;
    modEmail: string;
    assessmentType: string;
  
    public constructor(
      assessmentID: number,
      lecturerEmail: string,
      moduleCode: string,
      assessmentName: string,
      numMarked: number,
      totalSubmissions: number,
      modEmail: string,
      assessmentType: string
    ) {
      this.assessmentID = assessmentID;
      this.lecturerEmail = lecturerEmail;
      this.moduleCode = moduleCode;
      this.assessmentName = assessmentName;
      this.numMarked = numMarked;
      this.totalSubmissions = totalSubmissions;
      this.modEmail = modEmail;
      this.assessmentType = assessmentType;
    }
  }