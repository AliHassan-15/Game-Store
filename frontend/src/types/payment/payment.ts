export interface PaymentIntent {
  id: string
  amount: number
  currency: string
  status: string
  clientSecret: string
  created: number
}

export interface PaymentMethod {
  id: string
  type: string
  card?: {
    brand: string
    last4: string
    expMonth: number
    expYear: number
  }
  billingDetails?: {
    name: string
    email: string
    address: {
      line1: string
      city: string
      state: string
      postalCode: string
      country: string
    }
  }
}

export interface CreatePaymentIntentData {
  amount: number
  currency: string
  paymentMethodTypes: string[]
  metadata?: Record<string, string>
}

export interface ConfirmPaymentData {
  paymentIntentId: string
  paymentMethodId: string
}

export interface PaymentResponse {
  success: boolean
  data: {
    paymentIntent: PaymentIntent
  }
}

export interface PaymentMethodResponse {
  success: boolean
  data: {
    paymentMethods: PaymentMethod[]
  }
}

export interface PaymentError {
  type: string
  code: string
  message: string
} 