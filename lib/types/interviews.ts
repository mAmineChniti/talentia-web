export type InterviewType = 'ONLINE' | 'ONSITE';
export type InterviewStatus = 'PLANNED' | 'DONE' | 'CANCELLED' | string;

export interface InterviewRequest {
  applicationId: number;
  interviewDate: string;
  type: InterviewType;
  location?: string;
}

export interface InterviewResponse {
  id: number;
  applicationId: number;
  interviewDate: string;
  type: InterviewType;
  meetingLink: string;
  location?: string;
  status: InterviewStatus;
}
