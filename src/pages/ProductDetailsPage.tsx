import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Star, Heart, ShoppingBag } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { convertPrice, formatPrice } from '../utils/currency';
import { ProductGallery } from '../components/ProductDetails/ProductGallery';
import { ColorSelector } from '../components/ProductDetails/ColorSelector';
import { SizeSelector } from '../components/ProductDetails/SizeSelector';
import { ProductReviews } from '../components/ProductDetails/ProductReviews';
import { RelatedProducts } from '../components/Featured/RelatedProducts';
import api from '../services/api';
import { toast } from 'react-hot-toast';


interface ProductStock {
  productId: string;
  name: string;
  stock: number;
  sizes: Array<{ name: string; stock: number }>;
}

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
  colors: Array<{
    name: string;
    code: string;
    images?: string[];
    sizes: Array<{ name: string; stock: number }>;
  }>;
  stock: number;
  rating: number;
  reviews: any[];
  isNew?: boolean;
  video?: string;
}

export function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [loading, setLoading] = useState(true);
  const [convertedPrice, setConvertedPrice] = useState<number | null>(null);
  const [convertedOriginalPrice, setConvertedOriginalPrice] = useState<number | null>(null);
  const [stockInfo, setStockInfo] = useState<ProductStock | null>(null);
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const { currency } = useCurrency();
  const { settings } = useStore();

  // Get sizes for selected color
  const colorObj = product?.colors.find(c => c.name === selectedColor);
  const colorSizes = colorObj?.sizes || [];
  const selectedSizeStock = colorSizes.find(s => s.name === selectedSize)?.stock;

  // Get images for selected color, fallback to main product images
  const colorImages = (colorObj && Array.isArray(colorObj.images) && colorObj.images.length > 0)
    ? colorObj.images
    : (Array.isArray(product?.images) ? product.images : []);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (!id) return;
        const response = await api.getWithRetry(`/products/${id}`);
        const productData = response.data;
        setProduct(productData);

        // Set default selections
        if (productData.colors.length > 0) {
          setSelectedColor(productData.colors[0].name);
          if (productData.colors[0].sizes.length > 0) {
            setSelectedSize(productData.colors[0].sizes[0].name);
          }
        }

        // Convert prices
        const price = await convertPrice(productData.price, 'USD', currency);
        setConvertedPrice(price);

        if (productData.originalPrice) {
          const originalPrice = await convertPrice(productData.originalPrice, 'USD', currency);
          setConvertedOriginalPrice(originalPrice);
        }
      } catch (error) {
        toast.error('Failed to fetch product details');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, currency]);

  // Fetch stock info
  useEffect(() => {
    const fetchStock = async () => {
      if (!id) return;
      try {
        const res = await api.getWithRetry(`/products/${id}/stock`);
        setStockInfo(res.data);
      } catch (e) {
        setStockInfo(null);
      }
    };
    fetchStock();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product || !convertedPrice) return;

    if (!selectedSize) {
      toast.error('Please select a size');
      return;
    }
    if (!selectedColor) {
      toast.error('Please select a color');
      return;
    }

    // Check if selected size is in stock
    const sizeStock = colorSizes.find((s: any) => s.name === selectedSize)?.stock || 0;
    if (sizeStock === 0) {
      toast.error('Selected size is out of stock');
      return;
    }

    const success = await addToCart({
      id: product._id,
      name: product.name,
      price: convertedPrice,
      image: product.images[0],
      color: selectedColor,
      size: selectedSize
    });

    if (success) {
      toast.success('Added to cart');
    }
  };

  const handleWishlist = () => {
    if (!product || !convertedPrice) return;

    if (!isAuthenticated) {
      toast.error('Please log in to add items to your wishlist');
      return;
    }

    if (isInWishlist(product._id)) {
      removeFromWishlist(product._id);
      toast.success('Removed from wishlist');
    } else {
      addToWishlist({
        id: product._id,
        name: product.name,
        price: convertedPrice,
        image: product.images[0]
      });
      toast.success('Added to wishlist');
    }
  };

  const handleReviewAdded = async () => {
    try {
      if (!id) return;
      const response = await api.getWithRetry(`/products/${id}`);
      setProduct(response.data);
    } catch (error) {
      console.error('Error refreshing product data:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!product || convertedPrice === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Product not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Gallery */}
          <ProductGallery 
            images={colorImages}
            productName={product.name}
            video={product.video}
          />

          {/* Product Info */}
          <div className="space-y-6">
            {/* Badges */}
            <div className="flex gap-2 items-center flex-wrap">
              {product.isNew && (
                <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded-full">
                  New
                </span>
              )}
              {convertedOriginalPrice && (
                <span className="px-3 py-1 bg-rose-600 text-white text-xs font-medium rounded-full">
                  Save {Math.round(((convertedOriginalPrice - convertedPrice) / convertedOriginalPrice) * 100)}%
                </span>
              )}
              {/* Stock Badge */}
              {stockInfo && (
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${stockInfo.stock === 0 ? 'bg-red-600 text-white' : 'bg-green-100 text-green-800'}`}>
                  {stockInfo.stock === 0 ? 'Out of Stock' : `${stockInfo.stock} in stock`}
                </span>
              )}
            </div>

            {/* Title and Rating */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium text-gray-900">{product.rating.toFixed(1)}</span>
                </div>
                <span className="text-sm text-gray-500">
                  ({product.reviews.length} reviews)
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-indigo-600">
                {formatPrice(convertedPrice, currency)}
              </span>
              {convertedOriginalPrice && (
                <span className="text-xl text-gray-500 line-through">
                  {formatPrice(convertedOriginalPrice, currency)}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-600">{product.description}</p>

            {/* Stock Text Info */}
            {selectedColor && selectedSize && (
              <div className="text-sm text-gray-700">
                <span className="font-medium">Stock for {selectedColor} / {selectedSize}:</span> {selectedSizeStock ?? 'N/A'}
              </div>
            )}

            {/* Color Selection */}
            {product.colors.length > 0 && (
              <ColorSelector
                colors={product.colors}
                selectedColor={selectedColor}
                onColorChange={setSelectedColor}
              />
            )}

            {/* Size Selection */}
            {colorSizes.length > 0 && (
              <SizeSelector
                sizes={colorSizes}
                selectedSize={selectedSize}
                onSizeChange={setSelectedSize}
              />
            )}

            {/* Actions */}
            <div className="space-y-4 pt-6">
              <button
                onClick={handleAddToCart}
                className="w-full text-white py-4 rounded-full font-semibold transition-colors hover:opacity-90 flex items-center justify-center gap-2 group"
                style={{ backgroundColor: settings?.addToCartBgColor || '#4f46e5' }}
                disabled={!!stockInfo && stockInfo.stock === 0}
              >
                <ShoppingBag className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" />
                Add to Cart
              </button>

              <button
                onClick={handleWishlist}
                className={`w-full py-4 rounded-full font-semibold flex items-center justify-center gap-2 transition-colors ${
                  isInWishlist(product._id)
                    ? 'bg-rose-50 text-rose-600'
                    : 'bg-white text-gray-900 border border-gray-200 hover:border-gray-300'
                }`}
              >
                <Heart className={`w-5 h-5 ${isInWishlist(product._id) ? 'fill-current' : ''}`} />
                {isInWishlist(product._id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
              </button>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16">
          <ProductReviews
            productId={product._id}
            reviews={product.reviews}
            onReviewAdded={handleReviewAdded}
          />
        </div>

        {/* Related Products */}
        <div className="mt-16">
          <RelatedProducts />
        </div>
      </div>
    </div>
  );
}