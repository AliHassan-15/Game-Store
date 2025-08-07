import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { Header } from './components/layout/header/Header'
import { AuthPage } from './pages/auth/AuthPage'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage'
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
import { DashboardPage } from './pages/admin/dashboard/DashboardPage'
import { AuthProvider } from './components/providers/AuthProvider'

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key_here')

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
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              {/* Protected routes */}
              <Route path="/cart" element={
                <>
                  <Header />
                  <main>
                    <CartPage />
                  </main>
                </>
              } />
              <Route path="/checkout" element={
                <>
                  <Header />
                  <main>
                    <CheckoutPage />
                  </main>
                </>
              } />
              <Route path="/orders" element={
                <>
                  <Header />
                  <main>
                    <OrderListPage />
                  </main>
                </>
              } />
              <Route path="/orders/:id" element={
                <>
                  <Header />
                  <main>
                    <OrderDetailPage />
                  </main>
                </>
              } />
              <Route path="/orders/confirmation" element={
                <>
                  <Header />
                  <main>
                    <OrderConfirmationPage />
                  </main>
                </>
              } />
              <Route path="/profile" element={
                <>
                  <Header />
                  <main>
                    <ProfilePage />
                  </main>
                </>
              } />
              <Route path="/profile/addresses" element={
                <>
                  <Header />
                  <main>
                    <AddressesPage />
                  </main>
                </>
              } />
              <Route path="/profile/payments" element={
                <>
                  <Header />
                  <main>
                    <PaymentsPage />
                  </main>
                </>
              } />

              {/* Admin routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="products" element={<div>Products Management</div>} />
                <Route path="orders" element={<div>Orders Management</div>} />
                <Route path="users" element={<div>Users Management</div>} />
                <Route path="analytics" element={<div>Analytics</div>} />
                <Route path="settings" element={<div>Settings</div>} />
                <Route index element={<DashboardPage />} />
              </Route>
            </Routes>
          </div>
        </Router>
      </Elements>
    </AuthProvider>
  )
}

export default App
