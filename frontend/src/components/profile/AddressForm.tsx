import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button/Button'
import { Input } from '@/components/ui/input/Input'
import { UserAddress } from '@/types/user/user'
import { useUser } from '@/hooks/user/useUser'

const addressSchema = z.object({
  type: z.enum(['billing', 'shipping']),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  addressLine1: z.string().min(1, 'Address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
  phone: z.string().optional(),
  isDefault: z.boolean(),
})

type AddressFormData = z.infer<typeof addressSchema>

interface AddressFormProps {
  address?: UserAddress
  onSuccess?: () => void
  onCancel?: () => void
}

export const AddressForm: React.FC<AddressFormProps> = ({
  address,
  onSuccess,
  onCancel,
}) => {
  const { isLoading, error, createAddress, updateAddress } = useUser()
  const [formData] = useState<AddressFormData>({
    type: address?.type || 'shipping',
    firstName: address?.firstName || '',
    lastName: address?.lastName || '',
    addressLine1: address?.addressLine1 || '',
    addressLine2: address?.addressLine2 || '',
    city: address?.city || '',
    state: address?.state || '',
    postalCode: address?.postalCode || '',
    country: address?.country || '',
    phone: address?.phone || '',
    isDefault: address?.isDefault || false,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: formData,
  })

  const onSubmit = async (data: AddressFormData) => {
    try {
      if (address) {
        await updateAddress(address.id, data)
      } else {
        await createAddress(data)
      }
      onSuccess?.()
    } catch (error) {
      console.error('Failed to save address:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address Type
        </label>
        <select
          {...register('type')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        >
          <option value="shipping">Shipping Address</option>
          <option value="billing">Billing Address</option>
        </select>
        {errors.type && (
          <p className="text-sm text-red-500 mt-1">{errors.type.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name
          </label>
          <Input
            {...register('firstName')}
            placeholder="John"
            disabled={isLoading}
          />
          {errors.firstName && (
            <p className="text-sm text-red-500 mt-1">{errors.firstName.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name
          </label>
          <Input
            {...register('lastName')}
            placeholder="Doe"
            disabled={isLoading}
          />
          {errors.lastName && (
            <p className="text-sm text-red-500 mt-1">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address Line 1
        </label>
        <Input
          {...register('addressLine1')}
          placeholder="123 Main St"
          disabled={isLoading}
        />
        {errors.addressLine1 && (
          <p className="text-sm text-red-500 mt-1">{errors.addressLine1.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address Line 2 (Optional)
        </label>
        <Input
          {...register('addressLine2')}
          placeholder="Apt 4B"
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City
          </label>
          <Input
            {...register('city')}
            placeholder="New York"
            disabled={isLoading}
          />
          {errors.city && (
            <p className="text-sm text-red-500 mt-1">{errors.city.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            State
          </label>
          <Input
            {...register('state')}
            placeholder="NY"
            disabled={isLoading}
          />
          {errors.state && (
            <p className="text-sm text-red-500 mt-1">{errors.state.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Postal Code
          </label>
          <Input
            {...register('postalCode')}
            placeholder="10001"
            disabled={isLoading}
          />
          {errors.postalCode && (
            <p className="text-sm text-red-500 mt-1">{errors.postalCode.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Country
          </label>
          <Input
            {...register('country')}
            placeholder="United States"
            disabled={isLoading}
          />
          {errors.country && (
            <p className="text-sm text-red-500 mt-1">{errors.country.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone (Optional)
          </label>
          <Input
            {...register('phone')}
            placeholder="+1 (555) 123-4567"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          {...register('isDefault')}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label className="ml-2 block text-sm text-gray-900">
          Set as default address
        </label>
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : address ? 'Update Address' : 'Add Address'}
        </Button>
      </div>
    </form>
  )
} 