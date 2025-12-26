'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';
import { Loader } from 'lucide-react';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

export default function PaymentForm({ amount, description, onSuccess }) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm amount={amount} description={description} onSuccess={onSuccess} />
    </Elements>
  );
}

function CheckoutForm({ amount, description, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setLoading(true);
    const toastId = toast.loading('Processing payment...');

    try {
      // Create payment intent from server
      const response = await fetch('/api/payment/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency: 'usd',
          description,
        }),
      });

      const { clientSecret, paymentIntentId } = await response.json();

      if (!clientSecret) {
        throw new Error('Failed to create payment intent');
      }

      // Confirm payment with card element
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {},
          },
        }
      );

      if (error) {
        toast.error(error.message, { id: toastId });
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        toast.success('Payment successful!', { id: toastId });
        onSuccess?.(paymentIntent);
      }
    } catch (err) {
      toast.error(err.message, { id: toastId });
      console.error('Payment error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border border-gray-300 rounded-lg bg-white">
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
                color: '#fa755a',
              },
            },
          }}
        />
      </div>

      <div className="text-center">
        <p className="text-gray-600 mb-2">
          Test Amount: <strong>${amount.toFixed(2)}</strong>
        </p>
        {description && (
          <p className="text-sm text-gray-500">{description}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
      >
        {loading && <Loader className="w-4 h-4 animate-spin" />}
        {loading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </button>

      <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
        💡 <strong>Test Mode:</strong> Use card 4242 4242 4242 4242 with any future expiry and any 3-digit CVC
      </div>
    </form>
  );
}
