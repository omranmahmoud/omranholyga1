import api from './api';
import { toast } from 'react-hot-toast';

export interface FooterSettings {
  description: string;
  address: string;
  phone: string;
  email: string;
  socialLinks: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
  };
  newsletter: {
    title: string;
    subtitle: string;
    placeholder: string;
    buttonText: string;
  };
}

export interface FooterLink {
  _id: string;
  name: string;
  url: string;
  section: 'shop' | 'support' | 'company';
  isActive: boolean;
}

class FooterService {
  async getSettings(): Promise<FooterSettings> {
    try {
      const response = await api.get('/footer/settings');
      return response.data;
    } catch (error) {
      console.error('Error fetching footer settings:', error);
      throw new Error('Failed to fetch footer settings');
    }
  }

  async getLinks(): Promise<FooterLink[]> {
    try {
      const response = await api.get('/footer/links');
      return response.data;
    } catch (error) {
      console.error('Error fetching footer links:', error);
      throw new Error('Failed to fetch footer links');
    }
  }

  async updateSettings(data: Partial<FooterSettings>): Promise<FooterSettings> {
    try {
      const response = await api.put('/footer/settings', data);
      toast.success('Footer settings updated successfully');
      return response.data;
    } catch (error) {
      console.error('Error updating footer settings:', error);
      throw new Error('Failed to update footer settings');
    }
  }

  async createLink(data: Omit<FooterLink, '_id'>): Promise<FooterLink> {
    try {
      const response = await api.post('/footer/links', data);
      toast.success('Footer link created successfully');
      return response.data;
    } catch (error) {
      console.error('Error creating footer link:', error);
      throw new Error('Failed to create footer link');
    }
  }

  async updateLink(id: string, data: Partial<FooterLink>): Promise<FooterLink> {
    try {
      const response = await api.put(`/footer/links/${id}`, data);
      toast.success('Footer link updated successfully');
      return response.data;
    } catch (error) {
      console.error('Error updating footer link:', error);
      throw new Error('Failed to update footer link');
    }
  }

  async deleteLink(id: string): Promise<void> {
    try {
      await api.delete(`/footer/links/${id}`);
      toast.success('Footer link deleted successfully');
    } catch (error) {
      console.error('Error deleting footer link:', error);
      throw new Error('Failed to delete footer link');
    }
  }
}

export const footerService = new FooterService();