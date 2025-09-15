import api from './api';

export type Category = {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
  resolvedImage?: string;
};

export async function fetchCategories(): Promise<Category[]> {
  const res = await api.get('/api/categories');
  return res.data;
}
