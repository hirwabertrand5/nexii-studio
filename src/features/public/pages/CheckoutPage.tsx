import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Label } from "@/shared/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import { ImageWithFallback } from "@/shared/components/ImageWithFallback";
import { ArrowLeft, CheckCircle, CreditCard, Smartphone, Building, Banknote, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { http } from "@/shared/api/http";
import { useAuth } from "@/features/auth/context/AuthContext";
import {
  formatPlanCategoryLabel,
  publicPlansApi,
  resolvePlanImageUrl,
  type PublicPlanSummary
} from "@/features/public/api/plansApi";

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

type StripePaymentFormProps = {
  orderId: string;
  currency: string;
  price: number;
  user?: {
    fullName?: string;
    email?: string;
  } | null;
  onNavigateSuccess: (url: string) => void;
  setPaymentError: (message: string | null) => void;
  setStripeLoading: (loading: boolean) => void;
};

function StripePaymentForm({
  orderId,
  currency,
  price,
  user,
  onNavigateSuccess,
  setPaymentError,
  setStripeLoading
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [name, setName] = useState(user?.fullName ?? "");
  const [loadingLocal, setLoadingLocal] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [paymentElementMounted, setPaymentElementMounted] = useState(false);
  const [paymentState, setPaymentState] = useState<"idle" | "processing" | "succeeded" | "failed">("idle");
  const confirmingRef = useRef(false);

  useEffect(() => {
    console.log("[stripe] stripe", stripe);
    console.log("[stripe] elements", elements);
  }, [stripe, elements]);

  useEffect(() => {
    return () => {
      console.log("[stripe] PaymentElement unmounted");
    };
  }, []);

  const handleStripePayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (confirmingRef.current) return;
    setPaymentError(null);
    console.log("[stripe] confirmPayment()", {
      stripe,
      elements,
      paymentElementMounted
    });

    if (!stripe || !elements) {
      setPaymentError("Payment system not ready");
      return;
    }

    if (!paymentElementMounted) {
      setPaymentError("Secure card form is still loading. Please wait a moment and try again.");
      return;
    }

    confirmingRef.current = true;
    setLoadingLocal(true);
    setStripeLoading(true);
    setPaymentState("processing");
    try {
      const submitResult = await elements.submit();
      if (submitResult.error) {
        console.log("[stripe] element validation error", submitResult.error);
        throw new Error(submitResult.error.message ?? "Please complete your card details.");
      }

      if (!paymentComplete) {
        throw new Error("Please complete the secure card form before submitting.");
      }

      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success?gateway=stripe&orderId=${orderId}`,
          payment_method_data: {
            billing_details: {
              name: name || undefined,
              email: user?.email || undefined
            }
          }
        },
        redirect: "if_required"
      });

      if (result.error) {
        console.log("[stripe] confirmPayment error", result.error);
        throw new Error(result.error.message ?? "Card payment failed");
      }

      const paymentIntent = result.paymentIntent;
      if (!paymentIntent) {
        throw new Error("Stripe did not return a payment result");
      }

      console.log("[stripe] confirmPayment result", {
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status
      });

      if (paymentIntent.id) {
        const verification = await http("/api/payments/stripe/verify", {
          method: "POST",
          body: JSON.stringify({ paymentIntentId: paymentIntent.id, orderId })
        });

        if ((verification as any)?.pending) {
          toast.info("Stripe is still processing your payment");
        }
      }

      if (paymentIntent.status === "succeeded") {
        setPaymentState("succeeded");
        toast.success("Payment successful");
        onNavigateSuccess(`/payment/success?gateway=stripe&orderId=${orderId}`);
        return;
      }

      if (paymentIntent.status === "processing") {
        setPaymentState("succeeded");
        toast.success("Payment is processing");
        onNavigateSuccess(`/payment/success?gateway=stripe&orderId=${orderId}`);
        return;
      }

      if (paymentIntent.status === "requires_action") {
        toast.info("Stripe needs one more authentication step to complete this payment.");
        return;
      }

      throw new Error(`Stripe payment ended with status ${paymentIntent.status}`);
    } catch (err) {
      const m = err instanceof Error ? err.message : String(err);
      setPaymentState("failed");
      setPaymentError(m);
      toast.error(m);
    } finally {
      confirmingRef.current = false;
      setLoadingLocal(false);
      setStripeLoading(false);
    }
  };

  return (
    <form className="mt-4 space-y-4" onSubmit={handleStripePayment}>
      <div>
        <Label>Cardholder name</Label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded px-2 py-1 mt-1"
          placeholder="Jane Doe"
        />
      </div>
      <div className="border rounded p-4">
        <Label className="text-sm mb-2 block">Card details</Label>
        <PaymentElement
          onReady={() => {
            console.log("[stripe] PaymentElement mounted");
            setPaymentElementMounted(true);
          }}
          onChange={(event) => {
            setPaymentComplete(event.complete);
            if (event.error) {
              setPaymentError(event.error.message);
            } else {
              setPaymentError(null);
            }
          }}
        />
        {!paymentComplete && (
          <p className="mt-2 text-xs text-muted-foreground">
            Complete the secure Stripe card form to continue.
          </p>
        )}
      </div>
      {paymentState === "processing" && (
        <div className="flex items-center gap-2 rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
          <Loader2 className="h-4 w-4 animate-spin" />
          Securely processing your card payment...
        </div>
      )}
      {paymentState === "succeeded" && (
        <div className="flex items-center gap-2 rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          <CheckCircle className="h-4 w-4" />
          Payment confirmed. Unlocking your plan...
        </div>
      )}
      {paymentState === "failed" && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Payment was not completed. Review your card details and try again.
        </div>
      )}
      <Button
        type="submit"
        disabled={loadingLocal || !paymentElementMounted || !paymentComplete}
        className="w-full mt-4"
      >
        {loadingLocal ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing payment...
          </span>
        ) : paymentState === "failed" ? (
          `Retry Stripe Payment • ${currency} ${price.toLocaleString()}`
        ) : (
          `Pay with Stripe • ${currency} ${price.toLocaleString()}`
        )}
      </Button>
    </form>
  );
}

type StripePaymentSectionProps = {
  existingOrderId?: string;
  planId: string;
  currency: string;
  price: number;
  stripePromise: ReturnType<typeof loadStripe> | null;
  user?: StripePaymentFormProps["user"];
  onNavigateSuccess: (url: string) => void;
  setPaymentError: (message: string | null) => void;
  setStripeLoading: (loading: boolean) => void;
};

function StripePaymentSection({
  existingOrderId,
  planId,
  currency,
  price,
  stripePromise,
  user,
  onNavigateSuccess,
  setPaymentError,
  setStripeLoading
}: StripePaymentSectionProps) {
  const [stripeOrderId, setStripeOrderId] = useState(existingOrderId ?? "");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const initStartedRef = useRef(false);
  const initialCheckoutRef = useRef({ existingOrderId, planId, currency });

  useEffect(() => {
    let alive = true;

    const initStripeCheckout = async () => {
      if (initStartedRef.current) return;
      initStartedRef.current = true;
      setInitializing(true);
      setInitializationError(null);

      try {
        const checkout = initialCheckoutRef.current;
        const orderId = checkout.existingOrderId ?? await createStripeOrderOnServer(checkout.planId, checkout.currency);
        const init = await http("/api/payments/stripe/create-intent", {
          method: "POST",
          body: JSON.stringify({ orderId })
        });
        const secret = (init as any)?.payment?.clientSecret;
        if (!secret) throw new Error("Unable to initialize Stripe payment");

        console.log("[stripe] initialized checkout", {
          orderId,
          paymentIntentId: (init as any)?.payment?.paymentIntentId,
          status: (init as any)?.payment?.status,
          clientSecret: secret
        });
        console.log("[stripe] clientSecret", secret);

        if (!alive) return;
        setStripeOrderId(orderId);
        setClientSecret(secret);
      } catch (err) {
        if (!alive) return;
        setInitializationError(err instanceof Error ? err.message : String(err));
      } finally {
        if (alive) setInitializing(false);
      }
    };

    initStripeCheckout();

    return () => {
      alive = false;
    };
  }, []);

  const elementsOptions = useMemo(
    () =>
      clientSecret
        ? {
            clientSecret,
            appearance: {
              theme: "stripe" as const,
              variables: {
                colorPrimary: "#0f172a",
                colorText: "#0f172a",
                colorDanger: "#ef4444",
                borderRadius: "10px"
              }
            }
          }
        : undefined,
    [clientSecret]
  );

  if (initializing) {
    return (
      <div className="mt-4 rounded-lg border border-border bg-muted/30 p-6 text-center">
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Preparing secure Stripe checkout...</p>
      </div>
    );
  }

  if (initializationError) {
    return (
      <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {initializationError}
      </div>
    );
  }

  if (!stripePromise || !clientSecret || !elementsOptions) {
    return (
      <div className="mt-4 rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Stripe is not configured yet. Add `VITE_STRIPE_PUBLIC_KEY` to your frontend `.env` file to enable card payments.
      </div>
    );
  }

  const checkoutCurrency = initialCheckoutRef.current.currency;

  return (
    <Elements stripe={stripePromise} options={elementsOptions}>
      <StripePaymentForm
        orderId={stripeOrderId || existingOrderId || ""}
        currency={checkoutCurrency}
        price={price}
        user={user}
        onNavigateSuccess={onNavigateSuccess}
        setPaymentError={setPaymentError}
        setStripeLoading={setStripeLoading}
      />
    </Elements>
  );
}

async function createStripeOrderOnServer(planId: string, currency: string) {
  const payload = await http("/api/orders/checkout", {
    method: "POST",
    body: JSON.stringify({ plans: [planId], paymentMethod: "card", currency })
  });
  const orderId = (payload as any)?.order?._id ?? (payload as any)?.order?.id;
  if (!orderId) throw new Error("Order not created");
  return orderId as string;
}

export default function Checkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const stripePromise = useMemo(() => (stripePublicKey ? loadStripe(stripePublicKey) : null), []);
  const [plan, setPlan] = useState<PublicPlanSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [currency, setCurrency] = useState("USD");
  const [isProcessing, setIsProcessing] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [paypalLoading, setPaypalLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const loadPlan = async () => {
      if (!id) {
        setError("Plan not found");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await publicPlansApi.getPlanById(id);
        if (!alive) return;
        setPlan(response.plan);
      } catch (err) {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "Failed to load plan");
      } finally {
        if (alive) setLoading(false);
      }
    };

    loadPlan();

    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl mb-4">{error || "Plan not found"}</h2>
          <Link to="/catalog">
            <Button>Back to Catalog</Button>
          </Link>
        </div>
      </div>
    );
  }

  async function createOrderOnServer(method: string) {
    const payload = await http("/api/orders/checkout", {
      method: "POST",
      body: JSON.stringify({ plans: [plan._id], paymentMethod: method, currency })
    });
    const orderId = (payload as any)?.order?._id ?? (payload as any)?.order?.id;
    if (!orderId) throw new Error("Order not created");
    return orderId as string;
  }

  async function handleCreatePayPalOrder(): Promise<{ orderId: string; paypalOrderId: string }> {
    const orderId = await createOrderOnServer("paypal");
    setPendingOrderId(orderId);
    const res = await http("/api/payments/paypal/create-order", {
      method: "POST",
      body: JSON.stringify({ orderId })
    });
    const paypalOrderId = (res as any)?.payment?.paypalOrderId;
    if (!paypalOrderId) throw new Error("Unable to create PayPal order");
    return { orderId, paypalOrderId };
  }

  const paymentMethods = [
    {
      id: "card",
      name: "Credit/Debit Card",
      description: "Powered by Stripe / Paystack International",
      icon: CreditCard,
    },
    {
      id: "paypal",
      name: "PayPal",
      description: "Pay with PayPal",
      icon: Building,
    },
    {
      id: "mobile-money",
      name: "Mobile Money",
      description: "MTN, Airtel, Vodafone (Flutterwave / Paystack)",
      icon: Smartphone,
    },
    {
      id: "bank-transfer",
      name: "Bank Transfer",
      description: "Local bank integrations",
      icon: Banknote,
    }
  ];

  const primaryActionLabel =
    paymentMethod === "card"
      ? `Pay with Stripe • ${currency} ${plan.price.toLocaleString()}`
      : paymentMethod === "paypal"
        ? `Pay with PayPal • ${currency} ${plan.price.toLocaleString()}`
        : paymentMethod === "mobile-money"
          ? `Pay with Mobile Money • ${currency} ${plan.price.toLocaleString()}`
          : `Pay via Bank Transfer • ${currency} ${plan.price.toLocaleString()}`;

  return (
    <div className="min-h-screen bg-muted">
      <div className="bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to={`/plan/${plan._id}`}>
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
                      if (currency === "USD" && (method.id === "mobile-money" || method.id === "bank-transfer")) {
                        return null;
                      }
                      return (
                        <div
                          key={method.id}
                          className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                            paymentMethod === method.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
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

                {paymentMethod === "bank-transfer" && (
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

                {paymentMethod === "card" && (
                  <div className="mt-6">
                    {stripePromise ? (
                      <StripePaymentSection
                        planId={plan._id}
                        currency={currency}
                        price={plan.price}
                        stripePromise={stripePromise}
                        user={user}
                        onNavigateSuccess={navigate}
                        setPaymentError={setPaymentError}
                        setStripeLoading={setStripeLoading}
                      />
                    ) : (
                      <div className="mt-4 rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                        Stripe is not configured yet. Add `VITE_STRIPE_PUBLIC_KEY` to your frontend `.env` file to enable card payments.
                      </div>
                    )}
                    {paymentError && <p className="text-sm text-red-600 mt-2">{paymentError}</p>}
                  </div>
                )}

                {paymentMethod === "paypal" && (
                  <PayPalScriptProvider options={{ clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID ?? "sb", currency }}>
                    <div className="mt-6">
                      <div className="mb-3 rounded border border-border bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
                        {primaryActionLabel}
                      </div>
                      <PayPalButtons
                        style={{ layout: "vertical" }}
                        createOrder={async () => {
                          try {
                            setPaypalLoading(true);
                            const { paypalOrderId } = await handleCreatePayPalOrder();
                            return paypalOrderId;
                          } finally {
                            setPaypalLoading(false);
                          }
                        }}
                        onApprove={async (data) => {
                          try {
                            setPaypalLoading(true);
                            const orderId = pendingOrderId ?? (await createOrderOnServer("paypal"));
                            await http("/api/payments/paypal/capture-order", {
                              method: "POST",
                              body: JSON.stringify({ paypalOrderId: data.orderID })
                            });
                            toast.success("Payment captured");
                            navigate(`/payment/success?gateway=paypal&orderId=${orderId}`);
                          } catch (err) {
                            toast.error((err as Error).message ?? "PayPal capture failed");
                          } finally {
                            setPaypalLoading(false);
                          }
                        }}
                        onError={(err) => {
                          toast.error("PayPal error: " + String(err));
                        }}
                      />
                    </div>
                  </PayPalScriptProvider>
                )}

                {(paymentMethod === "mobile-money" || paymentMethod === "bank-transfer") && (
                  <Button
                    onClick={async () => {
                      setPaymentError(null);
                      setIsProcessing(true);
                      try {
                        if (paymentMethod === "mobile-money") {
                          const orderId = await createOrderOnServer("mobile-money");
                          const res = await http("/api/payments/flutterwave/initialize", {
                            method: "POST",
                            body: JSON.stringify({ orderId })
                          });
                          const authUrl = (res as any)?.payment?.authorizationUrl;
                          if (authUrl) window.location.href = authUrl;
                          else toast.success("Mobile money initialized. Follow provider flow.");
                        } else {
                          toast.success("Please follow the bank transfer instructions shown on the page.");
                        }
                      } catch (err) {
                        toast.error((err as Error).message ?? "Payment initialization failed");
                      } finally {
                        setIsProcessing(false);
                      }
                    }}
                    disabled={isProcessing}
                    size="lg"
                    className="w-full mt-6"
                  >
                    {isProcessing ? "Processing..." : primaryActionLabel}
                  </Button>
                )}
              </CardContent>
            </Card>

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

          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-[4/3] bg-muted rounded-lg mb-4 overflow-hidden">
                  <ImageWithFallback
                    src={resolvePlanImageUrl(plan.images?.[0] ?? plan.previewImages?.[0])}
                    alt={plan.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <h3 className="font-semibold mb-2">{plan.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {formatPlanCategoryLabel(plan.category)}
                </p>

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
                  <h4 className="font-semibold mb-3 text-sm">What You&apos;ll Get</h4>
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
