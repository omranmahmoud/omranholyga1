import React, { useState } from 'react';
import { Upload, AlertTriangle, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';

interface InventoryBulkUpdateProps {
  onUpload: (data: any[]) => Promise<void>;
}

export function InventoryBulkUpdate({ onUpload }: InventoryBulkUpdateProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      toast.error('Please upload an Excel file');
      return;
    }

    setLoading(true);
    try {
      const data = await readExcelFile(file);
      await onUpload(data);
      toast.success('Inventory updated successfully');
    } catch (error) {
      toast.error('Failed to process file');
    } finally {
      setLoading(false);
    }
  };

  const readExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = (error) => reject(error);
      reader.readAsBinaryString(file);
    });
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
      className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
        isDragging
          ? 'border-indigo-500 bg-indigo-50'
          : 'border-gray-300 hover:border-gray-400'
      }`}
    >
      <input
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
        id="bulk-upload"
      />
      
      <div className="space-y-4">
        <div className="flex justify-center">
          <Upload className="w-12 h-12 text-gray-400" />
        </div>
        
        <div>
          <label
            htmlFor="bulk-upload"
            className="text-indigo-600 hover:text-indigo-500 cursor-pointer"
          >
            Upload a file
          </label>
          <p className="text-sm text-gray-500 mt-1">or drag and drop</p>
        </div>

        <div className="text-xs text-gray-500">
          <p>Excel files only (.xlsx, .xls)</p>
          <a
            href="#"
            className="text-indigo-600 hover:text-indigo-500"
            onClick={(e) => {
              e.preventDefault();
              // Download template logic here
            }}
          >
            Download template
          </a>
        </div>

        {loading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        )}
      </div>
    </div>
  );
}