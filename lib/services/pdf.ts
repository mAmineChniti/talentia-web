import { request } from './http';

export const pdfApi = {
  upload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<string>('/pdf/upload', { method: 'POST', body: form });
  },
};
