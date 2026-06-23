export interface Major {
  id: string;
  code: string;
  name: string;
  faculty: string;
}

export interface GeneratorConfig {
  campusName: string;
  campusNickname: string;
  spreadsheetName: string;
  driveFolderId: string;
  idFormat: string;
  enableEmailNotification: boolean;
  adminEmail: string;
  majors: Major[];
}

export interface SubmissionData {
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  placeOfBirth: string;
  dateOfBirth: string;
  schoolOrigin: string;
  majorId: string;
  photoFile: File | null;
  ijazahFile: File | null;
}
