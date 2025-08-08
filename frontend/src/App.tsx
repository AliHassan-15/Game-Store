import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Elements } from '@stripe/react-stripe-js'

import { Header } from './components/layout/header/Header'
import { AuthPage } from './pages/auth/AuthPage'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage'
import { GoogleCallbackPage } from './pages/auth/GoogleCallbackPage'
import { ProductListPage } from './pages/products/ProductListPage'
import { ProductDetailPage } from './pages/products/ProductDetailPage'
import { CartPage } from './pages/cart/CartPage'
import { CheckoutPage } from './pages/checkout/CheckoutPage'
import { OrderListPage } from './pages/orders/OrderListPage'
import { OrderDetailPage } from './pages/orders/OrderDetailPage'
import { OrderConfirmationPage } from './pages/orders/OrderConfirmationPage'
import { ProfilePage } from './pages/profile/ProfilePage'
import { AddressesPage } from './pages/profile/AddressesPage'
import { PaymentsPage } from './pages/profile/PaymentsPage'
import { AdminLayout } from './components/admin/AdminLayout'
import { DashboardPage } from './pages/admin/DashboardPage'
import { ProductsPage } from './pages/admin/ProductsPage'
import { UsersPage } from './pages/admin/UsersPage'
import { OrdersPage } from './pages/admin/OrdersPage'
import { CategoriesPage } from './pages/admin/categories/CategoriesPage'
import { ReviewsPage } from './pages/admin/reviews/ReviewsPage'
import { AnalyticsPage } from './pages/admin/AnalyticsPage'
import { SettingsPage } from './pages/admin/SettingsPage'
import { AuthProvider } from './components/providers/AuthProvider'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { ErrorBoundary } from './components/ErrorBoundary'

// Initialize Stripe (temporarily disabled to avoid warnings)
const stripePromise = Promise.resolve(null)

function App() {
  return (
    <AuthProvider>
      <Elements stripe={stripePromise}>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={
                <>
                  <Header />
                  <main>
                    <ProductListPage />
                  </main>
                </>
              } />
              <Route path="/products" element={
                <>
                  <Header />
                  <main>
                    <ProductListPage />
                  </main>
                </>
              } />
              <Route path="/products/:slug" element={
                <>
                  <Header />
                  <main>
                    <ProductDetailPage />
                  </main>
                </>
              } />
              <Route path="/categories" element={
                <>
                  <Header />
                  <main>
                    <ProductListPage />
                  </main>
                </>
              } />
              <Route path="/categories/:slug" element={
                <>
                  <Header />
                  <main>
                    <ProductListPage />
                  </main>
                </>
              } />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/auth/callback" element={<GoogleCallbackPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              {/* Protected routes */}
              <Route path="/cart" element={
                <ProtectedRoute requireAuth={true}>
                  <>
                    <Header />
                    <main>
                      <CartPage />
                    </main>
                  </>
                </ProtectedRoute>
              } />
              <Route path="/checkout" element={
                <ProtectedRoute requireAuth={true}>
                  <>
                    <Header />
                    <main>
                      <CheckoutPage />
                    </main>
                  </>
                </ProtectedRoute>
              } />
              <Route path="/orders" element={
                <ProtectedRoute requireAuth={true}>
                  <>
                    <Header />
                    <main>
                      <OrderListPage />
                    </main>
                  </>
                </ProtectedRoute>
              } />
              <Route path="/orders/:id" element={
                <ProtectedRoute requireAuth={true}>
                  <>
                    <Header />
                    <main>
                      <OrderDetailPage />
                    </main>
                  </>
                </ProtectedRoute>
              } />
              <Route path="/orders/confirmation" element={
                <ProtectedRoute requireAuth={true}>
                  <>
                    <Header />
                    <main>
                      <OrderConfirmationPage />
                    </main>
                  </>
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute requireAuth={true}>
                  <>
                    <Header />
                    <main>
                      <ProfilePage />
                    </main>
                  </>
                </ProtectedRoute>
              } />
              <Route path="/profile/addresses" element={
                <ProtectedRoute requireAuth={true}>
                  <>
                    <Header />
                    <main>
                      <AddressesPage />
                    </main>
                  </>
                </ProtectedRoute>
              } />
              <Route path="/profile/payments" element={
                <ProtectedRoute requireAuth={true}>
                  <>
                    <Header />
                    <main>
                      <PaymentsPage />
                    </main>
                  </>
                </ProtectedRoute>
              } />

              {/* Admin routes */}
              <Route path="/admin" element={
                <ProtectedRoute requireAuth={true} requireAdmin={true}>
                  <AdminLayout />
                </ProtectedRoute>
              }>
                <Route path="dashboard" element={<ErrorBoundary><DashboardPage /></ErrorBoundary>} />
                <Route path="products" element={<ErrorBoundary><ProductsPage /></ErrorBoundary>} />
                <Route path="categories" element={<ErrorBoundary><CategoriesPage /></ErrorBoundary>} />
                <Route path="orders" element={<ErrorBoundary><OrdersPage /></ErrorBoundary>} />
                <Route path="users" element={<ErrorBoundary><UsersPage /></ErrorBoundary>} />
                <Route path="reviews" element={<ErrorBoundary><ReviewsPage /></ErrorBoundary>} />
                <Route path="analytics" element={<ErrorBoundary><AnalyticsPage /></ErrorBoundary>} />
                <Route path="settings" element={<ErrorBoundary><SettingsPage /></ErrorBoundary>} />
                <Route index element={<ErrorBoundary><DashboardPage /></ErrorBoundary>} />
              </Route>
            </Routes>
          </div>
        </Router>
      </Elements>
    </AuthProvider>
  )
}

export default App
