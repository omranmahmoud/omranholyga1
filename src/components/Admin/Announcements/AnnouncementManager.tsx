import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { AnnouncementList } from './AnnouncementList';
import { AnnouncementModal } from './AnnouncementModal';
import api from '../../../services/api';
import { toast } from 'react-hot-toast';

interface Announcement {
  _id: string;
  text: string;
  url?: string;
  icon: string;
  isActive: boolean;
  order: number;
  fontSize?: string;
  textColor?: string;
  backgroundColor?: string;
  description?: string;
}

export function AnnouncementManager() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
  const response = await api.getWithRetry('/announcements');
      setAnnouncements(response.data);
    } catch (error) {
      toast.error('Failed to fetch announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncement = async (data: Partial<Announcement>) => {
    try {
  const response = await api.postWithRetry('/announcements', {
        ...data,
  description: data.description || '',
        order: announcements.length
      });
      setAnnouncements([...announcements, response.data]);
      toast.success('Announcement created successfully');
      setIsModalOpen(false);
    } catch (error) {
      toast.error('Failed to create announcement');
    }
  };

  const handleUpdateAnnouncement = async (id: string, data: Partial<Announcement>) => {
    try {
  const response = await api.putWithRetry(`/announcements/${id}`, data);
      setAnnouncements(announcements.map(ann => 
        ann._id === id ? response.data : ann
      ));
      toast.success('Announcement updated successfully');
      setIsModalOpen(false);
      setSelectedAnnouncement(null);
    } catch (error) {
      toast.error('Failed to update announcement');
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;

    try {
  await api.deleteWithRetry(`/announcements/${id}`);
      setAnnouncements(announcements.filter(ann => ann._id !== id));
      toast.success('Announcement deleted successfully');
    } catch (error) {
      toast.error('Failed to delete announcement');
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(announcements);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order numbers
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index
    }));

    setAnnouncements(updatedItems);

    try {
  await api.putWithRetry('/announcements/reorder', {
        announcements: updatedItems.map(item => ({
          id: item._id,
          order: item.order
        }))
      });
    } catch (error) {
      toast.error('Failed to update announcement order');
      fetchAnnouncements(); // Revert to original order
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage sliding text announcements shown at the top of the page.
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedAnnouncement(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Announcement
        </button>
      </div>

      <AnnouncementList
        announcements={announcements}
        onEdit={(announcement) => {
          setSelectedAnnouncement(announcement);
          setIsModalOpen(true);
        }}
        onDelete={handleDeleteAnnouncement}
        onDragEnd={handleDragEnd}
      />

      <AnnouncementModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAnnouncement(null);
        }}
        onSubmit={selectedAnnouncement 
          ? (data) => handleUpdateAnnouncement(selectedAnnouncement._id, data)
          : handleCreateAnnouncement
        }
        announcement={selectedAnnouncement}
      />
    </div>
  );
}