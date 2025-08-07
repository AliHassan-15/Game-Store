import React from 'react'
import { Trash2, Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button/Button'
import { CartItem as CartItemType } from '@/types/cart/cart'
import { formatCurrency } from '@/lib/utils'

interface CartItemProps {
  item: CartItemType
  onRemove: (cartItemId: string) => void
  onUpdateQuantity: (cartItemId: string, quantity: number) => void
}

export const CartItem: React.FC<CartItemProps> = ({
  item,
  onRemove,
  onUpdateQuantity,
}) => {
  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= item.product.stockQuantity) {
      onUpdateQuantity(item.id, newQuantity)
    }
  }

  const handleRemove = () => {
    onRemove(item.id)
  }

  return (
    <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
      {/* Product Image */}
      <div className="flex-shrink-0">
        <img
          src={item.product.thumbnail || item.product.images?.[0] || '/placeholder-product.jpg'}
          alt={item.product.name}
          className="w-16 h-16 object-cover rounded-md"
        />
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 truncate">
          {item.product.name}
        </h3>
        <p className="text-sm text-gray-500">
          {item.product.category?.name}
        </p>
        <p className="text-sm font-medium text-gray-900">
          {formatCurrency(item.unitPrice)}
        </p>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuantityChange(item.quantity - 1)}
          disabled={item.quantity <= 1}
          className="w-8 h-8 p-0"
        >
          <Minus className="w-3 h-3" />
        </Button>
        
        <span className="w-8 text-center text-sm font-medium">
          {item.quantity}
        </span>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuantityChange(item.quantity + 1)}
          disabled={item.quantity >= item.product.stockQuantity}
          className="w-8 h-8 p-0"
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      {/* Total Price */}
      <div className="text-right">
        <p className="font-medium text-gray-900">
          {formatCurrency(item.totalPrice)}
        </p>
        {item.quantity > 1 && (
          <p className="text-xs text-gray-500">
            {formatCurrency(item.unitPrice)} each
          </p>
        )}
      </div>

      {/* Remove Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRemove}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  )
}