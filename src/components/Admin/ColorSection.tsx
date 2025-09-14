import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { uploadToCloudinary } from '../../services/cloudinary';
import { toast } from 'react-hot-toast';

interface Size {
  name: string;
  stock: number;
}

interface Color {
  name: string;
  code: string;
  images: string[];
  sizes: Size[];
}

interface ColorSectionProps {
  color: Color;
  onUpdate: (color: Color) => void;
  onRemove: () => void;
}

export function ColorSection({ color, onUpdate, onRemove }: ColorSectionProps) {
  const [localImages, setLocalImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>(color.images || []);
  const [sizeName, setSizeName] = useState('');
  const [sizeStock, setSizeStock] = useState('');

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + imagePreviews.length > 5) {
      toast.error('Maximum 5 images per color');
      return;
    }
    setLocalImages(prev => [...prev, ...files]);
    const uploadedUrls = await Promise.all(files.map(file => uploadToCloudinary(file)));
    setImagePreviews(prev => [...prev, ...uploadedUrls]);
    onUpdate({ ...color, images: [...(color.images || []), ...uploadedUrls] });
  };

  const removeImage = (index: number) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    onUpdate({ ...color, images: color.images.filter((_, i) => i !== index) });
  };

  const addSize = () => {
    if (!sizeName || !sizeStock) return;
    const newSize = { name: sizeName, stock: Number(sizeStock) };
    onUpdate({ ...color, sizes: [...(color.sizes || []), newSize] });
    setSizeName('');
    setSizeStock('');
  };

  const removeSize = (index: number) => {
    onUpdate({ ...color, sizes: color.sizes.filter((_, i) => i !== index) });
  };

  return (
    <div className="border rounded-lg p-4 mb-4 bg-gray-50">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full" style={{ backgroundColor: color.code }} />
          <span className="font-medium">{color.name}</span>
        </div>
        <button onClick={onRemove} className="text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>
      {/* Image Upload */}
      <div className="mb-2">
        <label className="block text-xs font-medium text-gray-700 mb-1">Images (max 5)</label>
        <div className="flex gap-2 mb-2">
          {imagePreviews.map((url, idx) => (
            <div key={idx} className="relative w-16 h-16 rounded overflow-hidden">
              <img src={url} alt="Color" className="w-full h-full object-cover" />
              <button type="button" onClick={() => removeImage(idx)} className="absolute top-0 right-0 bg-white rounded-full p-0.5">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {imagePreviews.length < 5 && (
            <label className="w-16 h-16 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-gray-400">
              <Upload className="w-4 h-4 text-gray-400" />
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          )}
        </div>
      </div>
      {/* Sizes for this color */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Sizes</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="Size name"
            value={sizeName}
            onChange={e => setSizeName(e.target.value)}
            className="px-2 py-1 border rounded text-xs"
          />
          <input
            type="number"
            placeholder="Stock"
            value={sizeStock}
            onChange={e => setSizeStock(e.target.value)}
            className="px-2 py-1 border rounded text-xs w-20"
          />
          <button type="button" onClick={addSize} className="px-2 py-1 bg-indigo-600 text-white rounded text-xs">Add</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {color.sizes.map((size, idx) => (
            <div key={idx} className="flex items-center gap-1 bg-white border rounded px-2 py-1 text-xs">
              <span>{size.name} ({size.stock})</span>
              <button type="button" onClick={() => removeSize(idx)} className="text-gray-400 hover:text-gray-600">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
