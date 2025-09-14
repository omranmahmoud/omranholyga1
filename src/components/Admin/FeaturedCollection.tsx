import React, { useState, useEffect } from 'react';
import { Plus, X, GripVertical, Image as ImageIcon } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { uploadToCloudinary } from '../../services/cloudinary';
import { SelectProductModal } from './SelectProductModal';

interface FeaturedProduct {
  _id: string;
  name: string;
  price: number;
  images: string[];
  order: number;
  isFeatured: boolean;
}

export function FeaturedCollection() {
  const [products, setProducts] = useState<FeaturedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await api.get('/products');
      const sortedProducts = response.data
        .filter((p: FeaturedProduct) => p.isFeatured)
        .sort((a: FeaturedProduct, b: FeaturedProduct) => a.order - b.order);
      setProducts(sortedProducts);
    } catch (error) {
      toast.error('Failed to fetch featured products');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(products);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order numbers
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index
    }));

    setProducts(updatedItems);

    try {
      // Update order in database
      await api.put(`/products/featured/reorder`, {
        products: updatedItems.map(item => ({
          id: item._id,
          order: item.order
        }))
      });
    } catch (error) {
      toast.error('Failed to update product order');
      fetchFeaturedProducts(); // Revert to original order
    }
  };

  const handleAddToFeatured = async (productId: string) => {
    try {
      await api.put(`/products/${productId}`, {
        isFeatured: true,
        order: products.length // Add to the end
      });
      await fetchFeaturedProducts();
      toast.success('Product added to featured collection');
    } catch (error) {
      toast.error('Failed to add product to featured collection');
    }
  };

  const handleRemoveFromFeatured = async (productId: string) => {
    try {
      await api.put(`/products/${productId}`, { isFeatured: false });
      setProducts(products.filter(p => p._id !== productId));
      toast.success('Product removed from featured collection');
    } catch (error) {
      toast.error('Failed to remove product from featured collection');
    }
  };

  const handleImageUpload = async (productId: string) => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const imageUrl = await uploadToCloudinary(selectedFile);
      await api.put(`/products/${productId}`, {
        images: [imageUrl]
      });
      
      setProducts(products.map(p => 
        p._id === productId 
          ? { ...p, images: [imageUrl] }
          : p
      ));
      
      setSelectedFile(null);
      setPreviewUrl('');
      toast.success('Product image updated successfully');
    } catch (error) {
      toast.error('Failed to update product image');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
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
        <h2 className="text-2xl font-bold text-gray-900">Featured Collection</h2>
        <button
          onClick={() => setIsSelectModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="featured-products">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-4"
            >
              {products.map((product, index) => (
                <Draggable
                  key={product._id}
                  draggableId={product._id}
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

                        <div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {product.images[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <label className="absolute inset-0 cursor-pointer bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleFileChange}
                            />
                          </label>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-medium text-gray-900 truncate">
                            {product.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            ${product.price.toFixed(2)}
                          </p>
                        </div>

                        <button
                          onClick={() => handleRemoveFromFeatured(product._id)}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                        >
                          <X className="w-5 h-5" />
                        </button>
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

      {products.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No featured products
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Add products to your featured collection to showcase them on your homepage.
          </p>
        </div>
      )}

      <SelectProductModal
        isOpen={isSelectModalOpen}
        onClose={() => setIsSelectModalOpen(false)}
        onSelect={handleAddToFeatured}
      />
    </div>
  );
}