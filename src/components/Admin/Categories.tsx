import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, AlertCircle, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { CategoryModal } from './CategoryModal';
import api from '../../services/api';
import { withFallback } from '../../utils/images';
import { toast } from 'react-hot-toast';

interface Category {
  _id: string;
  name: string;
  description: string;
  image: string;
  resolvedImage?: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  order?: number;
}

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
  const response = await api.getWithRetry('/categories');
      setCategories(response.data.sort((a: Category, b: Category) => 
        (a.order || 0) - (b.order || 0)
      ));
    } catch (error) {
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (formData: Partial<Category>) => {
    try {
  const response = await api.postWithRetry('/categories', {
        ...formData,
        order: categories.length // Add to the end
      });
      setCategories([...categories, response.data]);
      toast.success('Category created successfully');
      setIsModalOpen(false);
    } catch (error) {
      toast.error('Failed to create category');
    }
  };

  const handleUpdateCategory = async (id: string, formData: Partial<Category>) => {
    try {
  const response = await api.putWithRetry(`/categories/${id}`, formData);
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
  await api.deleteWithRetry(`/categories/${id}`);
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
      // Update order in database
  await api.putWithRetry('/categories/reorder', {
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
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

      {categories.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Categories Found</h3>
          <p className="text-gray-500">Create your first category to get started.</p>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="categories">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
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
                        className="bg-white rounded-xl shadow-sm overflow-hidden"
                      >
                        <div className="aspect-video relative">
                          <img
                            src={withFallback(category.resolvedImage || category.image)}
                            alt={category.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                          <div className="absolute top-4 right-4">
                            <div
                              {...provided.dragHandleProps}
                              className="p-2 bg-white/90 backdrop-blur-sm rounded-lg cursor-move hover:bg-white transition-colors"
                            >
                              <GripVertical className="w-5 h-5 text-gray-600" />
                            </div>
                          </div>
                          <div className="absolute bottom-4 left-4">
                            <h3 className="text-lg font-semibold text-white">{category.name}</h3>
                          </div>
                        </div>
                        <div className="p-4">
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {category.description || 'No description available'}
                          </p>
                          <div className="mt-4 flex items-center justify-between">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              category.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {category.isActive ? 'Active' : 'Inactive'}
                            </span>
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
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      <CategoryModal
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