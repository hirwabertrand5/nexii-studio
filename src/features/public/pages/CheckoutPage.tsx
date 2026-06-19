import { useState } from 'react';
import type { ComponentProps } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Label } from '@/shared/ui/label';
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group';
import { ImageWithFallback } from '@/shared/components/ImageWithFallback';
import { housePlans } from '@/shared/data/mockData';
import { ArrowLeft, CheckCircle, CreditCard, Smartphone, Building, Banknote } from 'lucide-react';
import { toast } from 'sonner';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { http } from '@/shared/api/http';
import { useAuth } from '@/features/auth/context/AuthContext';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY ?? '');
type ElementsStripeProp = ComponentProps<typeof Elements>['stripe'];

export default function Checkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const plan = housePlans.find(p => p.id === id);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [currency, setCurrency] = useState('USD');
  const [isProcessing, setIsProcessing] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [paypalLoading, setPaypalLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl mb-4">Plan not found</h2>
          <Link to="/catalog">
            <Button>Back to Catalog</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Create an order on the backend (requires authentication)
  async function createOrderOnServer(method: string) {
    const payload = await http('/api/orders/checkout', {
      method: 'POST',
      body: JSON.stringify({ plans: [plan!.id], paymentMethod: method, currency })
    });
    const orderId = (payload as any)?.order?._id ?? (payload as any)?.order?.id;
    if (!orderId) throw new Error('Order not created');
    return orderId as string;
  }

  // Stripe card form handler component (uses Elements context)
  function StripeCardForm({ existingOrderId }: { existingOrderId?: string }) {
    const stripe = useStripe();
    const elements = useElements();
    const [name, setName] = useState(user?.fullName ?? "");
    const [loading, setLoadingLocal] = useState(false);

    const CARD_OPTIONS = {
      style: {
        base: { fontSize: '16px', color: '#0f172a', '::placeholder': { color: '#94a3b8' } },
        invalid: { color: '#ef4444' }
      }
    };

    const handleStripePayment = async () => {
      setPaymentError(null);
      if (!stripe || !elements) {
        setPaymentError('Payment system not ready');
        return;
      }
      setLoadingLocal(true);
      setStripeLoading(true);
      try {
        const orderId = existingOrderId ?? (await createOrderOnServer('card'));

        const init = await http('/api/payments/stripe/create-intent', {
          method: 'POST',
          body: JSON.stringify({ orderId })
        });
        const clientSecret = (init as any)?.payment?.clientSecret;
        if (!clientSecret) throw new Error('Unable to initialize Stripe payment');

        const card = elements.getElement(CardElement);
        if (!card) throw new Error('Card input not found');

        const result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: { card, billing_details: { name: name || undefined, email: user?.email || undefined } }
        });

        if (result.error) {
          throw new Error(result.error.message ?? 'Card was declined');
        }

        // PaymentIntent succeeded or requires capture; navigate to success page and rely on webhook to finalize
        toast.success('Payment successful');
        navigate(`/payment/success?gateway=stripe&orderId=${orderId}`);
      } catch (err) {
        const m = err instanceof Error ? err.message : String(err);
        setPaymentError(m);
        toast.error(m);
      } finally {
        setLoadingLocal(false);
        setStripeLoading(false);
      }
    };

    return (
      <div className="mt-4">
        <Label>Cardholder name</Label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded px-2 py-1 mt-1" />
        <div className="mt-4 p-3 border rounded">
          <CardElement options={CARD_OPTIONS} />
        </div>
        {paymentError && <p className="text-sm text-red-600 mt-2">{paymentError}</p>}
        <Button onClick={handleStripePayment} disabled={loading || stripeLoading} className="w-full mt-4">
          {loading || stripeLoading ? 'Processing...' : `Pay ${currency} ${plan?.price.toLocaleString()}`}
        </Button>
      </div>
    );
  }

  // PayPal create/capture callbacks
  async function handleCreatePayPalOrder(): Promise<string> {
    // create internal order first
    const orderId = await createOrderOnServer('paypal');
    const res = await http('/api/payments/paypal/create-order', {
      method: 'POST',
      body: JSON.stringify({ orderId })
    });
    const paypalOrderId = (res as any)?.payment?.paypalOrderId;
    if (!paypalOrderId) throw new Error('Unable to create PayPal order');
    return paypalOrderId;
  }


  const paymentMethods = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      description: 'Powered by Stripe / Paystack International',
      icon: CreditCard,
    },
    {
      id: 'paypal',
      name: 'PayPal',
      description: 'Pay with PayPal',
      icon: Building,
    },
    {
      id: 'mobile-money',
      name: 'Mobile Money',
      description: 'MTN, Airtel, Vodafone (Flutterwave / Paystack)',
      icon: Smartphone,
    },
    {
      id: 'bank-transfer',
      name: 'Bank Transfer',
      description: 'Local bank integrations',
      icon: Banknote,
    }
  ];

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to={`/plan/${plan.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Plan
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Method Selection */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Select Payment Method</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred payment method for this purchase
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 items-center mb-4">
                  <Label className="text-sm">Currency</Label>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="border rounded px-2 py-1">
                    <option value="USD">USD</option>
                    <option value="NGN">NGN</option>
                    <option value="KES">KES</option>
                    <option value="GHS">GHS</option>
                  </select>
                </div>

                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="space-y-3">
                    {paymentMethods.map((method) => {
                      const Icon = method.icon;
                      // Hide mobile-money and bank-transfer when currency is USD
                      if (currency === 'USD' && (method.id === 'mobile-money' || method.id === 'bank-transfer')) {
                        return null;
                      }
                      return (
                        <div
                          key={method.id}
                          className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                            paymentMethod === method.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => setPaymentMethod(method.id)}
                        >
                          <RadioGroupItem value={method.id} id={method.id} className="mt-1" />
                          <div className="flex-1">
                            <Label htmlFor={method.id} className="flex items-center gap-3 cursor-pointer">
                              <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                                <Icon className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-semibold">{method.name}</p>
                                <p className="text-sm text-muted-foreground">{method.description}</p>
                              </div>
                            </Label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </RadioGroup>

                {paymentMethod === 'bank-transfer' && (
                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-3">Bank Transfer Details</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Bank Name:</strong> First Bank of Nigeria</p>
                      <p><strong>Account Name:</strong> NEXii Architectural Services</p>
                      <p><strong>Account Number:</strong> 1234567890</p>
                      <p><strong>Swift Code:</strong> FBNINGLA</p>
                      <p className="text-muted-foreground mt-4">
                        Please use your email as payment reference
                      </p>
                    </div>
                  </div>
                )}

                {/* Payment provider UIs (Stripe Elements + PayPal) */}
                <PayPalScriptProvider options={{ clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID ?? 'sb', currency }}>
                  <Elements stripe={stripePromise as unknown as ElementsStripeProp}>
                    {paymentMethod === 'card' && (
                      <div className="mt-6">
                        <StripeCardForm />
                      </div>
                    )}

                    {paymentMethod === 'paypal' && (
                      <div className="mt-6">
                        <PayPalButtons
                          style={{ layout: 'vertical' }}
                          createOrder={async (_data, _actions) => {
                            try {
                              setPaypalLoading(true);
                              const paypalOrderId = await handleCreatePayPalOrder();
                              return paypalOrderId;
                            } finally {
                              setPaypalLoading(false);
                            }
                          }}
                          onApprove={async (data, _actions) => {
                            try {
                              setPaypalLoading(true);
                              await http('/api/payments/paypal/capture-order', {
                                method: 'POST',
                                body: JSON.stringify({ paypalOrderId: data.orderID })
                              });
                              toast.success('Payment captured');
                              navigate(`/payment/success?gateway=paypal&orderId=${data.orderID}`);
                            } catch (err) {
                              toast.error((err as Error).message ?? 'PayPal capture failed');
                            } finally {
                              setPaypalLoading(false);
                            }
                          }}
                          onError={(err) => {
                            toast.error('PayPal error: ' + String(err));
                          }}
                        />
                      </div>
                    )}
                  </Elements>
                </PayPalScriptProvider>

                {/* Mobile money and bank flows fallback button */}
                {(paymentMethod === 'mobile-money' || paymentMethod === 'bank-transfer') && (
                  <Button
                    onClick={async () => {
                      setPaymentError(null);
                      setIsProcessing(true);
                      try {
                        if (paymentMethod === 'mobile-money') {
                          const orderId = await createOrderOnServer('mobile-money');
                          const res = await http('/api/payments/flutterwave/initialize', {
                            method: 'POST',
                            body: JSON.stringify({ orderId })
                          });
                          const authUrl = (res as any)?.payment?.authorizationUrl;
                          if (authUrl) window.location.href = authUrl;
                          else toast.success('Mobile money initialized. Follow provider flow.');
                        } else {
                          toast.success('Please follow the bank transfer instructions shown on the page.');
                        }
                      } catch (err) {
                        toast.error((err as Error).message ?? 'Payment initialization failed');
                      } finally {
                        setIsProcessing(false);
                      }
                    }}
                    disabled={isProcessing}
                    size="lg"
                    className="w-full mt-6"
                  >
                    {isProcessing ? 'Processing...' : `Pay ${currency} ${plan.price.toLocaleString()}`}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-white rounded-lg border border-border">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold mb-1">Secure Payment</p>
                  <p className="text-muted-foreground">
                    Your payment is secured with industry-standard encryption. We never store your payment details.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-[4/3] bg-muted rounded-lg mb-4 overflow-hidden">
                  <ImageWithFallback
                    src={`https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80`}
                    alt={plan.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <h3 className="font-semibold mb-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{plan.category}</p>

                <div className="space-y-3 py-4 border-t border-b border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Plan Price</span>
                    <span className="font-semibold">${plan.price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Processing Fee</span>
                    <span className="font-semibold">$0</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <span className="font-semibold">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    ${plan.price.toLocaleString()}
                  </span>
                </div>

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-3 text-sm">What You'll Get</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span>Complete architectural plans</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span>CAD drawings (DWG)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span>Structural drawings</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span>Instant download</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span>Lifetime access</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
