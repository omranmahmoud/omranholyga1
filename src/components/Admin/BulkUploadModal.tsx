import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, X, FileSpreadsheet, Download, CheckCircle2, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDone: () => void;
}

type DraftRow = Record<string, any>;

const TEMPLATE_HEADERS = [
  'name',
  'description',
  'price',
  'originalPrice',
  'images', // comma-separated URLs
  'category', // category name or ObjectId
  'colors', // e.g. "Red:#FF0000 | Blue:#0000FF"
  'sizes', // e.g. "S:10 | M:5 | L:0"
  'isNew',
  'isFeatured',
  'currency' // default USD
];

export function BulkUploadModal({ isOpen, onClose, onDone }: BulkUploadModalProps) {
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  if (!isOpen) return null;

  const parseFile = async (file: File) => {
    try {
      const isCSV = /\.csv$/i.test(file.name);
      let workbook: XLSX.WorkBook;

      if (isCSV) {
        // For CSV, read as text string
        const text = await file.text();
        workbook = XLSX.read(text, { type: 'string' });
      } else {
        // For XLSX, read as array buffer
        const data = await file.arrayBuffer();
        workbook = XLSX.read(data, { type: 'array' });
      }
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: '', blankrows: false }) as DraftRow[];
      setRows(json);
      if (json.length === 0) {
        toast.error('No data rows found in the first sheet');
      }
    } catch (err: any) {
      toast.error('Failed to parse file');
      console.error(err);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    if (!allowed.includes(file.type) && !file.name.match(/\.(xlsx|csv)$/i)) {
      toast.error('Please upload an .xlsx or .csv file');
      return;
    }
    setFileName(file.name);
    setResult(null);
    setRows([]);
    parseFile(file);
    // Allow selecting the same file again by resetting input value
    e.currentTarget.value = '';
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'products-template.xlsx');
  };

  const upload = async () => {
    if (rows.length === 0) {
      toast.error('No rows to upload');
      return;
    }
    setUploading(true);
    setResult(null);
    try {
      const response = await api.postWithRetry('/products/bulk', { products: rows });
      setResult(response.data);
      const { success, failed } = response.data || {};
      if (failed === 0) {
        toast.success(`Uploaded ${success} products`);
        onDone();
      } else if (success > 0) {
        toast(`Uploaded ${success}, ${failed} failed`);
      } else {
        toast.error('All rows failed');
      }
    } catch (err: any) {
      // Show server-provided summary/errors if available
      const data = err?.response?.data;
      if (data?.results) {
        setResult(data);
        const { success = 0, failed = 0 } = data;
        if (success > 0) toast(`Uploaded ${success}, ${failed} failed`);
        else toast.error('All rows failed');
      } else {
        toast.error(data?.message || 'Bulk upload failed');
      }
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

        <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">Bulk Upload Products</h3>
            <button onClick={onClose} className="p-2 rounded hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50 cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Choose Excel/CSV</span>
                <input type="file" accept=".xlsx,.csv" className="hidden" onChange={handleFile} />
              </label>
              <button onClick={downloadTemplate} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50">
                <Download className="w-4 h-4" />
                Template
              </button>
            </div>

            {rows.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-80 overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        {Object.keys(rows[0]).map((h) => (
                          <th key={h} className="px-3 py-2 text-left font-medium text-gray-600">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 50).map((r, idx) => (
                        <tr key={idx} className={idx % 2 ? 'bg-white' : 'bg-gray-50/50'}>
                          {Object.keys(rows[0]).map((h) => (
                            <td key={h} className="px-3 py-2 text-gray-800 whitespace-pre-wrap">
                              {String(r[h] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {rows.length > 50 && (
                  <div className="p-2 text-xs text-gray-500">Showing first 50 of {rows.length} rows</div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-gray-500 gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                {fileName ? (
                  <span>Selected: {fileName} (no rows detected)</span>
                ) : (
                  <span>No file selected</span>
                )}
              </div>
            )}

            {result && (
              <div className="rounded-lg border p-3 text-sm flex items-center gap-3">
                {result.failed === 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                )}
                <div className="flex-1">
                  <div><span className="font-medium">Total:</span> {result.total}</div>
                  <div><span className="font-medium">Success:</span> {result.success}</div>
                  <div><span className="font-medium">Failed:</span> {result.failed}</div>
                  {Array.isArray(result.results) && result.results.some((r: any) => r.status === 'failed') && (
                    <div className="mt-2 text-xs text-gray-600 max-h-40 overflow-auto">
                      <div className="font-medium mb-1">First 10 errors:</div>
                      <ul className="list-disc pl-5 space-y-1">
                        {result.results.filter((r: any) => r.status === 'failed').slice(0, 10).map((r: any) => (
                          <li key={r.index}>Row {r.index + 1}: {r.error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg border hover:bg-gray-50">Close</button>
            <button
              disabled={uploading || rows.length === 0}
              onClick={upload}
              className={`px-4 py-2 rounded-lg text-white ${uploading || rows.length === 0 ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
