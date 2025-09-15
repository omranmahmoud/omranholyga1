// types/navigation.ts
// Draft order payload passed from Checkout -> Payment when using card method
export interface DraftOrderPayload {
  items: { product: string; quantity: number; size?: string }[];
  shippingAddress: { street: string; city: string; country: string };
  paymentMethod: 'card' | 'cod';
  customerInfo: { firstName: string; lastName: string; email: string; mobile: string };
  currency: string;
}

export type RootStackParamList = {
  Login: { redirect?: keyof RootStackParamList; prefillIdentifier?: string } | undefined;
  Signup: { prefillIdentifier?: string } | undefined;
  Home: undefined;
  Category: undefined; // new category exploration screen
  // Optional category allows deep-linking / navigation from category grids
  ProductList: { category?: string } | undefined;
  ProductDetails: { productId: string };
  Cart: undefined;
  ShippingAddress: undefined;
  Checkout: { address?: {
    country?: string;
    countryCode?: string;
    phoneCode?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    phone2?: string;
  email?: string; // added for order creation payload
    city?: string;
    state?: string;
    zip?: string;
    line1?: string;
    line2?: string;
    makeDefault?: boolean;
  } } | undefined;
  Wishlist: undefined;
  Profile: undefined;
  // Allow navigation with a recently created order id (e.g., after placing order)
  OrderHistory: { newOrderId?: string } | undefined;
  Payment: { 
    summary: {
      subtotal: number;
      shipping: number;
      shippingGuarantee: number;
      promotions: number; // negative discount value already
      total: number;
      couponDiscount: number;
      giftAppliedAmount: number;
    };
    address?: {
      firstName?: string; lastName?: string; phone?: string; city?: string; state?: string; zip?: string; line1?: string; line2?: string; countryCode?: string;
    };
    orderNumber: string;
    draftOrder?: DraftOrderPayload; // newly added optional draft order used for card submission
  } | undefined;
  Admin: undefined;
  Search: { initialQuery?: string } | undefined;
  RecentlyViewed: undefined;
  FlashSale: undefined; // flash sale listing screen
  OrderDetails: { orderId: string } | undefined;
};

// Navigation prop types for screens
import { NativeStackNavigationProp as StackNavigationProp } from '@react-navigation/native-stack';

export type NavigationProps<T extends keyof RootStackParamList> = {
  navigation: StackNavigationProp<RootStackParamList, T>;
};

// Route prop types for screens
import { RouteProp } from '@react-navigation/native';

export type RouteProps<T extends keyof RootStackParamList> = {
  route: RouteProp<RootStackParamList, T>;
};