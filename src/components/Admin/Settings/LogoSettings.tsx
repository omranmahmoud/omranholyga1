import React, { useState, useEffect } from 'react';
import { Upload, X, Check } from 'lucide-react';
import { uploadToCloudinary } from '../../../services/cloudinary';
import { toast } from 'react-hot-toast';
import { useStore } from '../../../context/StoreContext';

interface LogoSettingsProps {
  compact?: boolean;
}

export function LogoSettings({ compact = false }: LogoSettingsProps) {
  const { settings, updateSettings } = useStore();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (settings?.logo) {
      setPreviewUrl(settings.logo);
    }
  }, [settings?.logo]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const imageUrl = await uploadToCloudinary(selectedFile);
      
      // Update store settings with new logo
      await updateSettings({ logo: imageUrl });
      
      // Clear selection
      setSelectedFile(null);
    } catch (error) {
      toast.error('Failed to update logo');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      await updateSettings({ logo: null });
      setSelectedFile(null);
      setPreviewUrl('');
    } catch (error) {
      toast.error('Failed to remove logo');
    }
  };

  if (compact) {
    return (
      <div className="space-y-4">
        <div>
          <h4 className="text-md font-medium text-gray-900">Store Logo</h4>
          <p className="mt-1 text-sm text-gray-500">
            Upload your store logo (200x50px recommended)
          </p>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg p-4
            ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'}
            transition-all duration-200
          `}
        >
          {previewUrl ? (
            <div className="space-y-3">
              <div className="relative w-32 mx-auto">
                <img
                  src={previewUrl}
                  alt="Logo preview"
                  className="w-full h-auto max-h-16 object-contain"
                />
                <button
                  onClick={handleRemoveLogo}
                  className="absolute -top-1 -right-1 p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
                >
                  <X className="w-3 h-3 text-gray-500" />
                </button>
              </div>
              {selectedFile && (
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Check className="w-3 h-3" />
                      Save Logo
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="text-center">
              <Upload className="mx-auto h-8 w-8 text-gray-400" />
              <div className="mt-2">
                <label className="relative cursor-pointer">
                  <span className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    Upload logo
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>
                <p className="text-xs text-gray-500 mt-1">or drag and drop</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full version (original)
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Store Logo</h2>
        <p className="mt-1 text-sm text-gray-500">
          Upload your store logo. Recommended size: 200x50 pixels.
        </p>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-8
          ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'}
          transition-all duration-200
        `}
      >
        {previewUrl ? (
          <div className="space-y-4">
            <div className="relative w-48 mx-auto">
              <img
                src={previewUrl}
                alt="Logo preview"
                className="w-full h-auto"
              />
              <button
                onClick={handleRemoveLogo}
                className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            {selectedFile && (
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            )}
          </div>
        ) : (
          <div className="text-center">
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
                  onChange={handleFileChange}
                />
              </label>
              <p className="text-sm text-gray-500 mt-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              PNG, JPG, GIF up to 2MB
            </p>
          </div>
        )}
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Logo Guidelines</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Use a transparent background (PNG format recommended)</li>
          <li>• Keep the file size under 2MB</li>
          <li>• Maintain a clear, readable design at different sizes</li>
          <li>• Use your brand colors consistently</li>
        </ul>
      </div>
    </div>
  );
}
