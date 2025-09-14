import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { NavigationCategoryModal } from './NavigationCategoryModal';

interface NavigationCategory {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
  order: number;
  subCategories?: {
    name: string;
    slug: string;
  }[];
}

export function NavigationCategories() {
  const [categories, setCategories] = useState<NavigationCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<NavigationCategory | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/navigation');
      setCategories(response.data.sort((a: NavigationCategory, b: NavigationCategory) => 
        (a.order || 0) - (b.order || 0)
      ));
    } catch (error) {
      toast.error('Failed to fetch navigation categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (formData: Partial<NavigationCategory>) => {
    try {
      const response = await api.post('/navigation', {
        ...formData,
        order: categories.length
      });
      setCategories([...categories, response.data]);
      toast.success('Category created successfully');
      setIsModalOpen(false);
    } catch (error) {
      toast.error('Failed to create category');
    }
  };

  const handleUpdateCategory = async (id: string, formData: Partial<NavigationCategory>) => {
    try {
      const response = await api.put(`/navigation/${id}`, formData);
      setCategories(categories.map(cat => 
        cat._id === id ? response.data : cat
      ));
      toast.success('Category updated successfully');
      setIsModalOpen(false);
      setSelectedCategory(null);
    } catch (error) {
      toast.error('Failed to update category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    try {
      await api.delete(`/navigation/${id}`);
      setCategories(categories.filter(cat => cat._id !== id));
      toast.success('Category deleted successfully');
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(categories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order numbers
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index
    }));

    setCategories(updatedItems);

    try {
      await api.put('/navigation/reorder', {
        categories: updatedItems.map(item => ({
          id: item._id,
          order: item.order
        }))
      });
    } catch (error) {
      toast.error('Failed to update category order');
      fetchCategories(); // Revert to original order
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
        <h1 className="text-2xl font-bold text-gray-900">Navigation Categories</h1>
        <button
          onClick={() => {
            setSelectedCategory(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Category
        </button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="navigation-categories">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-4"
            >
              {categories.map((category, index) => (
                <Draggable
                  key={category._id}
                  draggableId={category._id}
                  index={index}
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="bg-white rounded-lg shadow-sm border border-gray-200"
                    >
                      <div className="p-4 flex items-center gap-4">
                        <div
                          {...provided.dragHandleProps}
                          className="cursor-move text-gray-400 hover:text-gray-600"
                        >
                          <GripVertical className="w-5 h-5" />
                        </div>

                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{category.name}</h3>
                          {category.subCategories && category.subCategories.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {category.subCategories.map((sub, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                                >
                                  {sub.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedCategory(category);
                              setIsModalOpen(true);
                            }}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Pencil className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <NavigationCategoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCategory(null);
        }}
        onSubmit={selectedCategory 
          ? (data) => handleUpdateCategory(selectedCategory._id, data)
          : handleCreateCategory
        }
        category={selectedCategory}
      />
    </div>
  );
}