import type { User } from './users';

export type TypePost = 'PUBLICITE' | 'POSTE_TRAVAIL' | 'FORMATION';

export interface PostRequest {
  contenu: string;
  typePost: TypePost;
  auteurId: number;
  trainingId?: number;
}

export interface PostResponse {
  id: number;
  contenu: string;
  dateCreation: string;
  typePost: TypePost;
  auteurId: number;
  auteurName: string;
  auteurLastname: string;
  nombreLikes: number;
  likedByCurrentUser: boolean;
  // Training info (only set for FORMATION posts)
  trainingId?: number;
  trainingTitle?: string;
  trainingTrainer?: string;
  trainingLocation?: string;
  trainingCapacity?: number;
  trainingEnrollmentCount?: number;
  trainingStatus?: string;
}

// entity/Commentaire.java
export interface Commentaire {
  id: number;
  contenu: string;
  dateCreation: string;
  auteur?: User;
  post?: { id: number };
}
