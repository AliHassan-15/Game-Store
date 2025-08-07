import React, { useState } from 'react'
import { useUser } from '@/hooks/user/useUser'
import { Button } from '@/components/ui/button/Button'
import { Card, CardContent } from '@/components/ui/card/Card'
import { AddressForm } from './AddressForm'
import { UserAddress } from '@/types/user/user'

export const AddressList: React.FC = () => {
  const { addresses, isLoading, deleteAddress } = useUser()
  const [showForm, setShowForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null)

  const handleEdit = (address: UserAddress) => {
    setEditingAddress(address)
    setShowForm(true)
  }

  const handleDelete = async (addressId: string) => {
    if (window.confirm('Delete this address?')) {
      await deleteAddress(addressId)
    }
  }

  if (showForm) {
    return (
      <AddressForm
        address={editingAddress || undefined}
        onSuccess={() => setShowForm(false)}
        onCancel={() => setShowForm(false)}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">My Addresses</h2>
        <Button onClick={() => setShowForm(true)}>Add Address</Button>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : addresses.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500 mb-4">No addresses found.</p>
            <Button onClick={() => setShowForm(true)}>Add Address</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {addresses.map((address) => (
            <Card key={address.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{address.firstName} {address.lastName}</h3>
                    <p className="text-gray-600">{address.addressLine1}</p>
                    <p className="text-gray-600">
                      {address.city}, {address.state} {address.postalCode}
                    </p>
                    <p className="text-gray-600">{address.phone}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(address)}>
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(address.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 