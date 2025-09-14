import { useEffect, useState } from 'react';
import { X, Search, Plus } from 'lucide-react';
import { getPrimaryProductImage } from '../../../utils/imageUtils';
import api from '../../../services/api';
import { toast } from 'react-hot-toast';

interface Product {
  _id: string;
  name: string;
  price: number;
  images: string[];
  category?: string | { name?: string };
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (product: Product) => void;
  existingIds: Set<string>;
}

export function FlashSaleSelectProductModal({ isOpen, onClose, onSelect, existingIds }: Props) {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (isOpen) fetchProducts(); }, [isOpen]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.getWithRetry('/products');
      setAllProducts(res.data || []);
    } catch (e:any) {
      toast.error(e.response?.data?.message || 'Failed to load products');
    } finally { setLoading(false); }
  };

  if (!isOpen) return null;

  const filtered = allProducts.filter(p => {
    if (existingIds.has(p._id)) return false;
    return p.name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add Products</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="mb-4 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
        </div>
        <div className="max-h-[400px] overflow-y-auto space-y-2">
          {loading ? (
            <div className="py-10 text-center text-gray-500">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-gray-500">No products</div>
          ) : filtered.map(p => (
            <button
              key={p._id}
              onClick={() => { onSelect(p); }}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-gray-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 overflow-hidden rounded bg-gray-100">
                  <img
                    src={getPrimaryProductImage(p)}
                    alt={p.name}
                    title={p.images?.[0] || ''}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder-image.svg'; }}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-800">{p.name}</p>
                  <p className="text-xs text-gray-500">${p.price.toFixed(2)}</p>
                </div>
              </div>
              <Plus className="w-5 h-5 text-indigo-600" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
