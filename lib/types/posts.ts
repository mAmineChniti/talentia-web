import type { User } from './users';

export type TypePost = 'PUBLICITE' | 'POSTE_TRAVAIL' | 'FORMATION';

export interface PostRequest {
  contenu: string;
  typePost: TypePost;
  auteurId: number;
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
}

// entity/Commentaire.java
export interface Commentaire {
  id: number;
  contenu: string;
  dateCreation: string;
  auteur?: User;
  post?: { id: number };
}
