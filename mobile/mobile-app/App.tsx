import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ErrorBoundary from './src/components/ErrorBoundary';
import React from 'react';
import { I18nManager, View } from 'react-native';
import i18n from './src/i18n';
import { WishlistProvider } from './src/context/WishlistContext';
import { RecentlyViewedProvider } from './src/context/RecentlyViewedContext';
import { DirectionProvider, useDirection } from './src/context/DirectionContext';
// Initialize i18n (side-effect import)
import './src/i18n';

function AppShell() {
  const { direction } = useDirection();
  return (
    <View style={{ flex: 1, alignItems: 'stretch', direction }}>
      <RootNavigator />
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <DirectionProvider>
                <ErrorBoundary>
                  <RecentlyViewedProvider>
                    <AppShell />
                  </RecentlyViewedProvider>
                </ErrorBoundary>
              </DirectionProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

