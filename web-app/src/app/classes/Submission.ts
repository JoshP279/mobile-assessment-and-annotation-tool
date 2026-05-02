/**
 * This class is used to create a Submission object
 * This class is used to create a Submission object, and stores the submissionID, studentNumber, submissionMark, studentName, 
 * studentSurname and submissionStatus of the submission.
 */
export class Submission{
    submissionID: number;
    studentNumber: string;
    submissionMark: number;
    studentName:string;
    studentSurname:string;
    submissionStatus:string;
    submissionFolderName: string;
    
    constructor(SubmissionID:number,StudentNumber: string, SubmissionMark: number, StudentFirstName:string, StudentLastName:string, SubmissionStatus:string, submissionFolderName: string){
        this.submissionID = SubmissionID;
        this.studentNumber = StudentNumber;
        this.submissionMark = SubmissionMark;
        this.studentName = StudentFirstName;
        this.studentSurname = StudentLastName;
        this.submissionStatus = SubmissionStatus;
        this.submissionFolderName = submissionFolderName;
    }
}