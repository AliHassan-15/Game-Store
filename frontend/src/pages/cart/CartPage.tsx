import React from 'react'
import { useCart } from '@/hooks/cart/useCart'
import { CartItem } from '@/components/cart/cartItem/CartItem'
import { CartSummary } from '@/components/cart/cartSummary/CartSummary'
import { Button } from '@/components/ui/button/Button'

export const CartPage: React.FC = () => {
  const {
    items,
    subtotal,
    tax,
    total,
    isLoading,
    error,
    removeItem,
    updateItem,
    clearCart,
  } = useCart()

  const handleUpdateQuantity = (cartItemId: string, quantity: number) => {
    updateItem({ cartItemId, quantity })
  }

  const handleRemove = (cartItemId: string) => {
    removeItem({ cartItemId })
  }

  const handleClearCart = () => {
    clearCart()
  }

  const handleCheckout = () => {
    // TODO: Implement checkout navigation
    alert('Proceed to checkout')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Shopping Cart</h1>
      {error && (
        <div className="mb-4 text-red-600">{error}</div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          {items.length > 0 ? (
            <div className="space-y-4">
              {items.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.35 2.7A2 2 0 008.48 19h7.04a2 2 0 001.83-1.3L17 13M7 13V6h13" />
              </svg>
              <p>Your cart is empty.</p>
            </div>
          )}
        </div>
        {/* Cart Summary */}
        <div>
          <CartSummary
            subtotal={subtotal}
            discount={0} // Assuming discount is 0 for now
            tax={tax}
            total={total}
            currency="USD" // Assuming currency is USD for now
          />
          <div className="mt-6 flex gap-2">
            <Button
              className="flex-1"
              disabled={items.length === 0 || isLoading}
              onClick={handleCheckout}
            >
              Checkout
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              disabled={items.length === 0 || isLoading}
              onClick={handleClearCart}
            >
              Clear Cart
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}