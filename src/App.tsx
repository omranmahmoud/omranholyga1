import { StrictMode, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layouts
import { MainLayout } from './components/Layout/MainLayout';
import { AdminLayout } from './components/Admin/AdminLayout';

// Auth Components
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { LoginPage } from './components/Auth/LoginPage';
import { RegisterPage } from './components/Auth/RegisterPage';

// Public Pages
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailsPage } from './pages/ProductDetailsPage';
import { SearchPage } from './pages/SearchPage';
import { NewArrivalsPage } from './pages/NewArrivalsPage';
import { CartPage } from './pages/CartPage';
import { OrdersPage } from './pages/OrdersPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { PaymentPage } from './pages/PaymentPage';

// Profile Components
import { ProfileLayout } from './components/Profile/ProfileLayout';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { BackgroundProvider } from './context/BackgroundContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { PageLayoutProvider } from './context/PageLayoutContext';
import { ThemeProvider } from './components/ThemeProvider';

// Dynamic Store Component
import { DynamicStorePage } from './components/DynamicStorePage';
import { registerServiceWorker, subscribePush, sendTestPush } from './services/push';

function App() {
  // Hide dev push helpers by default; set VITE_SHOW_PUSH_UI=true to show
  const showPushTools = (import.meta as any)?.env?.VITE_SHOW_PUSH_UI === 'true';
  useEffect(() => { registerServiceWorker(); }, []);
  return (
    <StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <StoreProvider>
            <ThemeProvider>
              <CurrencyProvider>
                <BackgroundProvider>
                  <CartProvider>
                    <WishlistProvider>
                      <PageLayoutProvider>
                      {/* Theme Debug Component */}
                      
                      {/* Global Toast Notifications */}
                      <Toaster 
                        position="top-right"
                        toastOptions={{
                          duration: 3000,
                          style: {
                            background: '#363636',
                            color: '#fff',
                          },
                        }}
                      />

                      {/* Gift card quick button removed */}
                      {/* Optional dev push helpers (hidden by default) */}
                      {showPushTools && (
                        <>
                          <button
                            onClick={() => subscribePush()}
                            className="fixed bottom-6 right-40 z-[1100] rounded-full bg-emerald-600 text-white shadow-lg px-4 py-3 text-sm"
                            aria-label="Enable notifications"
                          >
                            Enable Notifications
                          </button>
                          <button
                            onClick={() => sendTestPush()}
                            className="fixed bottom-6 right-[220px] z-[1100] rounded-full bg-orange-600 text-white shadow-lg px-4 py-3 text-sm"
                            aria-label="Test push notification"
                          >
                            Test Push
                          </button>
                        </>
                      )}
                      {/* Gift card popup removed */}

                      {/* Application Routes */}
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/" element={
                        <MainLayout>
                          <DynamicStorePage />
                        </MainLayout>
                      } />

                      <Route path="/search" element={
                        <MainLayout>
                          <SearchPage />
                        </MainLayout>
                      } />

                      <Route path="/new-arrivals" element={
                        <MainLayout>
                          <NewArrivalsPage />
                        </MainLayout>
                      } />

                      <Route path="/cart" element={
                        <MainLayout>
                          <CartPage />
                        </MainLayout>
                      } />

                      <Route path="/checkout" element={
                        <MainLayout>
                          <CheckoutPage />
                        </MainLayout>
                      } />

                      <Route path="/payment" element={
                        <MainLayout>
                          <PaymentPage />
                        </MainLayout>
                      } />

                      <Route path="/products" element={
                        <MainLayout>
                          <ProductsPage />
                        </MainLayout>
                      } />

                      <Route path="/product/:id" element={
                        <MainLayout>
                          <ProductDetailsPage />
                        </MainLayout>
                      } />

                      {/* Auth Routes */}
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />

                      {/* Protected User Routes */}
                      <Route path="/orders" element={
                        <ProtectedRoute>
                          <MainLayout>
                            <OrdersPage />
                          </MainLayout>
                        </ProtectedRoute>
                      } />

                      <Route path="/profile/*" element={
                        <ProtectedRoute>
                          <MainLayout>
                            <ProfileLayout />
                          </MainLayout>
                        </ProtectedRoute>
                      } />

                      {/* Protected Admin Routes */}
                      <Route path="/admin/*" element={
                        <ProtectedRoute requireAdmin>
                          <AdminLayout />
                        </ProtectedRoute>
                      } />

                      {/* Catch-all Route */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                    </PageLayoutProvider>
                  </WishlistProvider>
                </CartProvider>
              </BackgroundProvider>
            </CurrencyProvider>
            </ThemeProvider>
          </StoreProvider>
        </AuthProvider>
      </BrowserRouter>
    </StrictMode>
  );
}

export default App;
