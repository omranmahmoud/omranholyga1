import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { BackgroundList } from './BackgroundList';
import { BackgroundModal } from './BackgroundModal';
import api from '../../../services/api';
import { toast } from 'react-hot-toast';

interface Background {
  _id: string;
  name: string;
  type: 'color' | 'gradient' | 'pattern';
  value: string;
  isActive: boolean;
  order: number;
}

export function BackgroundManager() {
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState<Background | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBackgrounds();
  }, []);

  const fetchBackgrounds = async () => {
    try {
      const response = await api.get('/backgrounds');
      setBackgrounds(response.data);
    } catch (error) {
      toast.error('Failed to fetch backgrounds');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackground = async (data: Partial<Background>) => {
    try {
      const response = await api.post('/backgrounds', {
        ...data,
        order: backgrounds.length
      });
      setBackgrounds([...backgrounds, response.data]);
      toast.success('Background created successfully');
      setIsModalOpen(false);
    } catch (error) {
      toast.error('Failed to create background');
    }
  };

  const handleUpdateBackground = async (id: string, data: Partial<Background>) => {
    try {
      const response = await api.put(`/backgrounds/${id}`, data);
      setBackgrounds(backgrounds.map(bg => 
        bg._id === id ? response.data : bg
      ));
      toast.success('Background updated successfully');
      setIsModalOpen(false);
      setSelectedBackground(null);
    } catch (error) {
      toast.error('Failed to update background');
    }
  };

  const handleDeleteBackground = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this background?')) return;

    try {
      await api.delete(`/backgrounds/${id}`);
      setBackgrounds(backgrounds.filter(bg => bg._id !== id));
      toast.success('Background deleted successfully');
    } catch (error) {
      toast.error('Failed to delete background');
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(backgrounds);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order numbers
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index
    }));

    setBackgrounds(updatedItems);

    try {
      await api.put('/backgrounds/reorder', {
        backgrounds: updatedItems.map(item => ({
          id: item._id,
          order: item.order
        }))
      });
    } catch (error) {
      toast.error('Failed to update background order');
      fetchBackgrounds(); // Revert to original order
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
          <h1 className="text-2xl font-bold text-gray-900">Background Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Customize the website's background appearance.
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedBackground(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Background
        </button>
      </div>

      <BackgroundList
        backgrounds={backgrounds}
        onEdit={(background) => {
          setSelectedBackground(background);
          setIsModalOpen(true);
        }}
        onDelete={handleDeleteBackground}
        onDragEnd={handleDragEnd}
      />

      <BackgroundModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedBackground(null);
        }}
        onSubmit={selectedBackground 
          ? (data) => handleUpdateBackground(selectedBackground._id, data)
          : handleCreateBackground
        }
        background={selectedBackground}
      />
    </div>
  );
}