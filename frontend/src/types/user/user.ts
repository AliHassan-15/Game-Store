export interface UserAddress {
  id: string
  userId: string
  type: 'billing' | 'shipping'
  firstName: string
  lastName: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
  country: string
  phone?: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface UserAddressCreate {
  type: 'billing' | 'shipping'
  firstName: string
  lastName: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
  country: string
  phone?: string
  isDefault?: boolean
}

export interface UserAddressUpdate extends Partial<UserAddressCreate> {
  id: string
}

export interface UserPayment {
  id: string
  userId: string
  type: 'card' | 'paypal' | 'stripe'
  provider: string
  last4?: string
  brand?: string
  expMonth?: number
  expYear?: number
  isDefault: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface UserPaymentCreate {
  type: 'card' | 'paypal' | 'stripe'
  provider: string
  last4?: string
  brand?: string
  expiryMonth?: number
  expiryYear?: number
  isDefault?: boolean
}

export interface UserPaymentUpdate extends Partial<UserPaymentCreate> {
  id: string
}

export interface UserProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  avatar?: string
  role: 'admin' | 'buyer'
  isVerified: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface UserProfileUpdate {
  firstName?: string
  lastName?: string
  phone?: string
  avatar?: string
}

export interface UserAddressListResponse {
  success: boolean
  data: {
    addresses: UserAddress[]
  }
}

export interface UserPaymentMethodListResponse {
  success: boolean
  data: {
    paymentMethods: UserPayment[]
  }
}

export interface UserProfileResponse {
  success: boolean
  data: {
    user: UserProfile
  }
}