import type { Commentaire, PostRequest, PostResponse } from '@/lib/types/posts';

import { request } from './http';

// Posts & comments (community feed)
export const postsApi = {
  list: () => request<PostResponse[]>('/posts'),
  get: (id: number) => request<PostResponse>(`/posts/${id}`),
  create: (body: PostRequest) =>
    request<PostResponse>('/posts', { method: 'POST', json: body }),
  update: (id: number, body: PostRequest) =>
    request<PostResponse>(`/posts/${id}`, { method: 'PUT', json: body }),
  remove: (id: number) => request<string>(`/posts/${id}`, { method: 'DELETE' }),
  like: (postId: number, userId: number) => {
    return request<PostResponse>(`/posts/${postId}/like/${userId}`, {
      method: 'POST',
    });
  },
  likesCount: (postId: number) =>
    request<number>(`/posts/${postId}/likes/count`),
};

export const commentairesApi = {
  list: () => request<Commentaire[]>('/commentaires'),
  listByPost: (postId: number) =>
    request<Commentaire[]>(`/commentaires/post/${postId}`),
  listByUser: (userId: number) =>
    request<Commentaire[]>(`/commentaires/user/${userId}`),
  create: (postId: number, userId: number, contenu: string) => {
    return request<Commentaire>(`/commentaires/${postId}/${userId}`, {
      method: 'POST',
      json: { contenu },
    });
  },
  update: (id: number, contenu: string) => {
    return request<Commentaire>(`/commentaires/${id}`, {
      method: 'PUT',
      json: { contenu },
    });
  },
  remove: (id: number) =>
    request<string>(`/commentaires/${id}`, { method: 'DELETE' }),
};
