import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Eye, Trash2 } from 'lucide-react';
import { HeroModal } from './HeroModal';
import { useStore } from '../../context/StoreContext';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface HeroSection {
  _id: string;
  title: string;
  subtitle: string;
  image: string;
  primaryButtonText: string;
  secondaryButtonText: string;
  isActive: boolean;
}

export function Hero() {
  const { refreshHero } = useStore();
  const [heroSections, setHeroSections] = useState<HeroSection[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHero, setSelectedHero] = useState<HeroSection | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHeroSections = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await api.get('/hero', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setHeroSections(response.data);
      setLoading(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch hero sections';
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeroSections();
  }, []);

  const handleSubmit = async (formData: any) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      if (selectedHero) {
        await api.put(`/hero/${selectedHero._id}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        toast.success('Hero section updated successfully');
      } else {
        await api.post('/hero', formData, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        toast.success('Hero section created successfully');
      }
      await fetchHeroSections();
      await refreshHero();
      setIsModalOpen(false);
      setSelectedHero(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save hero section';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      await api.delete(`/hero/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      toast.success('Hero section deleted successfully');
      await fetchHeroSections();
      await refreshHero();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete hero section';
      toast.error(errorMessage);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      await api.put(`/hero/${id}`, { isActive: true }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      await fetchHeroSections();
      await refreshHero();
      toast.success('Hero section activated');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to activate hero section';
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Hero Sections</h1>
        <button
          onClick={() => {
            setSelectedHero(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Hero Section
        </button>
      </div>

      {heroSections.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Hero Sections Found</h3>
          <p className="text-gray-500">Create your first hero section to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {heroSections.map((hero) => (
            <div
              key={hero._id}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              <div className="aspect-video relative">
                <img
                  src={hero.image}
                  alt={hero.title}
                  className="w-full h-full object-cover"
                />
                {hero.isActive && (
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      Active
                    </span>
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="font-medium text-gray-900">{hero.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{hero.subtitle}</p>
                
                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedHero(hero);
                      setIsModalOpen(true);
                    }}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Edit hero section"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(hero._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete hero section"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  {!hero.isActive && (
                    <button
                      onClick={() => handleActivate(hero._id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors ml-auto"
                      title="Set as active"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <HeroModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedHero(null);
        }}
        onSubmit={handleSubmit}
        hero={selectedHero}
      />
    </div>
  );
}