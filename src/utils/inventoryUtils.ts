import { z } from 'zod';
import { InventoryItem } from '../services/inventoryService';

// Validation schema for inventory data
const InventoryDataSchema = z.object({
  product: z.object({
    _id: z.string(),
    name: z.string()
  }),
  size: z.string().min(1, 'Size is required'),
  color: z.string().min(1, 'Color is required'),
  quantity: z.number().int().min(0, 'Quantity must be a non-negative number'),
  location: z.string().min(1, 'Location is required')
});

export function calculateLowStockThreshold(item: InventoryItem): number {
  // Default threshold is 20% of initial stock or 5, whichever is greater
  const defaultThreshold = Math.max(Math.ceil(item.quantity * 0.2), 5);
  return defaultThreshold;
}

export function getInventoryStatus(quantity: number, threshold: number): 'in_stock' | 'low_stock' | 'out_of_stock' {
  if (quantity <= 0) return 'out_of_stock';
  if (quantity <= threshold) return 'low_stock';
  return 'in_stock';
}

export function formatInventoryDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function validateInventoryData(data: Partial<InventoryItem>): { isValid: boolean; errors: string[] } {
  try {
    InventoryDataSchema.parse(data);
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(err => err.message)
      };
    }
    return {
      isValid: false,
      errors: ['Invalid inventory data']
    };
  }
}

// Helper function to safely serialize inventory data
export function serializeInventoryData(data: any): Partial<InventoryItem> {
  return {
    ...data,
    _id: data._id?.toString(),
    product: data.product ? {
      _id: data.product._id?.toString(),
      name: data.product.name
    } : undefined,
    quantity: Number(data.quantity)
  };
}