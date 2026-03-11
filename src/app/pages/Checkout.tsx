import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { housePlans } from '../data/mockData';
import { ArrowLeft, CheckCircle, CreditCard, Smartphone, Building, Banknote } from 'lucide-react';
import { toast } from 'sonner';

export default function Checkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const plan = housePlans.find(p => p.id === id);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleCheckout = async () => {
    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      toast.success('Payment successful! Redirecting to your dashboard...');
      setTimeout(() => navigate('/dashboard/purchased'), 2000);
    }, 2000);
  };

  const paymentMethods = [
    {
      id: 'card',
      name: 'Card Payment',
      description: 'Visa, Mastercard, or Verve',
      icon: CreditCard,
    },
    {
      id: 'mobile-money',
      name: 'Mobile Money',
      description: 'MTN, Airtel, Vodafone, etc.',
      icon: Smartphone,
    },
    {
      id: 'paystack',
      name: 'Paystack',
      description: 'All payment methods',
      icon: Building,
    },
    {
      id: 'flutterwave',
      name: 'Flutterwave',
      description: 'All payment methods',
      icon: Building,
    },
    {
      id: 'bank-transfer',
      name: 'Bank Transfer',
      description: 'Direct bank deposit',
      icon: Banknote,
    },
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
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="space-y-3">
                    {paymentMethods.map((method) => {
                      const Icon = method.icon;
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

                <Button
                  onClick={handleCheckout}
                  disabled={isProcessing || !paymentMethod}
                  size="lg"
                  className="w-full mt-6"
                >
                  {isProcessing ? 'Processing...' : `Pay $${plan.price.toLocaleString()}`}
                </Button>
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
