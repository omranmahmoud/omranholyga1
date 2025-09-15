import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

// Static imports for screens
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import HomeScreen from '../screens/HomeScreen';
import CategoryScreen from '../screens/CategoryScreen';
import ProductListScreen from '../screens/ProductListScreen';
import ProductDetailsScreen from '../screens/ProductDetailsScreen';
import CartScreen from '../screens/CartScreen';
import ProfileScreen from '../screens/ProfileScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import AdminScreen from '../screens/AdminScreen';
import SearchScreen from '../screens/SearchScreen';
import WishlistScreen from '../screens/WishlistScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import ShippingAddressScreen from '../screens/ShippingAddressScreen';
import PaymentScreen from '../screens/PaymentScreen';
import RecentlyViewedScreen from '../screens/RecentlyViewedScreen';
import FlashSaleScreen from '../screens/FlashSaleScreen';
import OrderDetailsScreen from '../screens/OrderDetailsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  console.log('Screens check: ready (lazy)');
  
  return (
    <NavigationContainer
      fallback={
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      }
    >
      <Stack.Navigator 
        initialRouteName="Home" 
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
  <Stack.Screen name="Category" component={CategoryScreen} />
        <Stack.Screen name="ProductList" component={ProductListScreen} />
        <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
        <Stack.Screen name="Cart" component={CartScreen} />
  <Stack.Screen name="ShippingAddress" component={ShippingAddressScreen} />
  <Stack.Screen name="Checkout" component={CheckoutScreen} />
  <Stack.Screen name="Payment" component={PaymentScreen} />
  <Stack.Screen name="Wishlist" component={WishlistScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
        <Stack.Screen name="Admin" component={AdminScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
  <Stack.Screen name="RecentlyViewed" component={RecentlyViewedScreen} />
  <Stack.Screen name="FlashSale" component={FlashSaleScreen} />
  <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}