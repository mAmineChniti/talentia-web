export type ApplicationStatus =
  'PENDING' | 'HR_INTERVIEW' | 'TECHNICAL_INTERVIEW' | 'ACCEPTED' | 'REJECTED';

export interface ApplicationRequest {
  cv: File;
  motivationLetter: string;
  poste: string;
  userId: number;
  postId: number;
}

export interface ApplicationResponse {
  id: number;
  candidateId: number;
  postId: number;
  candidateName: string;
  candidateEmail: string;
  score: number;
  stars: number;
  strengths: string;
  weaknesses: string;
  feedback: string;
  recommendation: string;
  motivationLetter: string;
  status: ApplicationStatus;
  datePostulation: string;
}

// POST /applications/apply returns the raw Application entity (not the DTO),
// so it exposes `candidate { id }` / `cvText` instead of candidateName/postId.
export interface ApplicationApplyResponse {
  id: number;
  candidate: { id: number };
  datePostulation: string;
  cvText?: string;
  motivationLetter?: string;
  score?: number | null;
  stars?: number | null;
  feedback?: string;
  strengths?: string;
  weaknesses?: string;
  recommendation?: string;
  status: ApplicationStatus;
}
