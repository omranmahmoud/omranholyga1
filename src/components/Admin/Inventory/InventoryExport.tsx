import React from 'react';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface InventoryItem {
  product: {
    name: string;
  };
  size: string;
  color: string;
  quantity: number;
  status: string;
  location: string;
  lastUpdated: string;
}

interface InventoryExportProps {
  inventory: InventoryItem[];
}

export function InventoryExport({ inventory }: InventoryExportProps) {
  const handleExport = () => {
    // Prepare data for export
    const data = inventory.map(item => ({
      'Product Name': item.product.name,
      'Size': item.size,
      'Color': item.color,
      'Quantity': item.quantity,
      'Status': item.status.replace('_', ' ').toUpperCase(),
      'Location': item.location,
      'Last Updated': new Date(item.lastUpdated).toLocaleDateString()
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory');

    // Generate filename with current date
    const date = new Date().toISOString().split('T')[0];
    const fileName = `inventory_export_${date}.xlsx`;

    // Save file
    XLSX.writeFile(wb, fileName);
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
    >
      <Download className="w-5 h-5" />
      Export Inventory
    </button>
  );
}