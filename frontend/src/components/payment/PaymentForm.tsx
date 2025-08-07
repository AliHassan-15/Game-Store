import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button/Button'
import { Input } from '@/components/ui/input/Input'
import { Card, CardContent } from '@/components/ui/card/Card'

// Payment form validation schema
const paymentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'ZIP code is required'),
})

type PaymentFormData = z.infer<typeof paymentSchema>

interface PaymentFormProps {
  amount: number
  onPaymentSuccess: (paymentIntentId: string) => void
  onPaymentError: (error: string) => void
  isLoading?: boolean
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  amount,
  onPaymentSuccess,
  onPaymentError,
  isLoading = false,
}) => {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
  })

  const onSubmit = async (data: PaymentFormData) => {
    if (!stripe || !elements) {
      onPaymentError('Stripe has not loaded yet')
      return
    }

    setProcessing(true)

    try {
      // Create payment intent
      const response = await fetch('/api/v1/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency: 'usd',
          payment_method_types: ['card'],
        }),
      })

      const { clientSecret } = await response.json()

      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            name: data.name,
            email: data.email,
            address: {
              line1: data.address,
              city: data.city,
              state: data.state,
              postal_code: data.zipCode,
            },
          },
        },
      })

      if (error) {
        onPaymentError(error.message || 'Payment failed')
      } else if (paymentIntent?.status === 'succeeded') {
        onPaymentSuccess(paymentIntent.id)
      }
    } catch (error) {
      onPaymentError('Payment failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4">Payment Information</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Billing Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <Input
                {...register('name')}
                placeholder="John Doe"
                disabled={isLoading || processing}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                {...register('email')}
                type="email"
                placeholder="john@example.com"
                disabled={isLoading || processing}
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <Input
              {...register('address')}
              placeholder="123 Main St"
              disabled={isLoading || processing}
            />
            {errors.address && (
              <p className="text-sm text-red-500 mt-1">{errors.address.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <Input
                {...register('city')}
                placeholder="New York"
                disabled={isLoading || processing}
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
                disabled={isLoading || processing}
              />
              {errors.state && (
                <p className="text-sm text-red-500 mt-1">{errors.state.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ZIP Code
              </label>
              <Input
                {...register('zipCode')}
                placeholder="10001"
                disabled={isLoading || processing}
              />
              {errors.zipCode && (
                <p className="text-sm text-red-500 mt-1">{errors.zipCode.message}</p>
              )}
            </div>
          </div>

          {/* Card Information */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Card Information
            </label>
            <div className="border border-gray-300 rounded-md p-3">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                    invalid: {
                      color: '#9e2146',
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={!stripe || isLoading || processing}
          >
            {processing ? 'Processing...' : `Pay $${(amount / 100).toFixed(2)}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
} 