]import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { uploadToCloudinary } from '../../../services/cloudinary';
import { toast } from 'react-hot-toast';

interface HeroImageUploadProps {
  currentImage?: string;
  onImageUpload: (imageUrl: string) => Promise<void>;
}

export function HeroImageUpload({ currentImage, onImageUpload }: HeroImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string>(currentImage || '');
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleImageChange = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      
      // Create preview
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      // Upload to Cloudinary
      const imageUrl = await uploadToCloudinary(file);
      
      // Update hero with new image
      await onImageUpload(imageUrl);
      
      toast.success('Hero image updated successfully');
    } catch (error) {
      toast.error('Failed to upload image');
      setPreviewUrl(currentImage || '');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleImageChange(file);
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`
        relative border-2 border-dashed rounded-xl transition-all duration-200
        ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'}
      `}
    >
      {previewUrl ? (
        <div className="relative aspect-[16/9] rounded-lg overflow-hidden">
          <img
            src={previewUrl}
            alt="Hero preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
            <label className="cursor-pointer p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors">
              <Upload className="w-5 h-5 text-gray-600" />
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageChange(file);
                }}
                disabled={uploading}
              />
            </label>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <label className="relative cursor-pointer">
              <span className="font-medium text-indigo-600 hover:text-indigo-500">
                Upload a file
              </span>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageChange(file);
                }}
                disabled={uploading}
              />
            </label>
            <p className="text-sm text-gray-500 mt-1">or drag and drop</p>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            PNG, JPG, GIF up to 5MB
          </p>
        </div>
      )}

      {uploading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent"></div>
        </div>
      )}
    </div>
  );
}
