import React from 'react'
import { Dialog } from '@headlessui/react'
import { X, ShoppingCart, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button/Button'
import { useCart } from '@/hooks/cart/useCart'
import { CartItem } from '../cartItem/CartItem'
import { CartSummary } from '../cartSummary/CartSummary'

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
  onCheckout: () => void
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onCheckout,
}) => {
  const {
    items,
    totalItems,
    subtotal,
    tax,
    total,
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

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <Dialog.Panel className="w-screen max-w-md">
          <div className="flex h-full flex-col bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-6 border-b border-gray-200">
              <Dialog.Title className="text-lg font-medium text-gray-900">
                Shopping Cart ({totalItems})
              </Dialog.Title>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Your cart is empty
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Start shopping to add items to your cart.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <CartItem
                      key={item.id}
                      item={item}
                      onRemove={handleRemove}
                      onUpdateQuantity={handleUpdateQuantity}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-gray-200 px-4 py-6">
                <CartSummary
                  subtotal={subtotal}
                  tax={tax}
                  discount={0}
                  total={total}
                />
                
                <div className="mt-6 space-y-3">
                  <Button
                    onClick={onCheckout}
                    className="w-full"
                    disabled={totalItems === 0}
                  >
                    Proceed to Checkout
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={clearCart}
                    className="w-full"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear Cart
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}