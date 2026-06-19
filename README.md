# nexii-studio

## Webhooks and Local Testing (Stripe & PayPal)

When developing payments locally you will usually run the frontend on `http://localhost:3001` and the backend on `http://localhost:5000`.

1) Expose your local backend to provider webhooks using `ngrok` (or similar). Example:

```bash
# start an http tunnel to your local server (port 5000)
ngrok http 5000
```

Take the HTTPS `Forwarding` URL returned by ngrok (for example `https://abcd1234.ngrok.io`) and configure your provider webhooks to point at:

- `https://abcd1234.ngrok.io/api/webhooks/stripe`
- `https://abcd1234.ngrok.io/api/webhooks/paypal`

2) Environment variables (local)

Set these values in your `server/.env` (DO NOT commit real secrets):

- `FRONTEND_URL=http://localhost:3001`
- `CORS_ORIGIN=http://localhost:3001,http://localhost:5173`
- `STRIPE_SECRET_KEY=sk_test_...` (your Stripe test secret)
- `STRIPE_WEBHOOK_SECRET=whsec_...` (from webhook endpoint in Stripe)
- `PAYPAL_CLIENT_ID=...` (sandbox client id)
- `PAYPAL_CLIENT_SECRET=...` (sandbox secret)
- `PAYPAL_WEBHOOK_ID=...` (configure webhook id in PayPal)

3) Stripe test cards (use in Stripe Elements)

- Successful card: `4242 4242 4242 4242` — any valid future expiry and any CVC
- Card declined: `4000 0000 0000 9995`
- Authentication required (3DS): `4000 0025 0000 3155`

For more Stripe test numbers see: https://stripe.com/docs/testing#cards

4) PayPal sandbox

- Use your PayPal developer account to create sandbox test buyer accounts and sandbox client IDs.
- The PayPal SDK will accept `client-id` for sandbox. You can also use `sb` for an unauthenticated sandbox quick test.

5) Notes

- The backend must allow your frontend origin in `CORS_ORIGIN` (see `server/.env`). Duplicate entries may override earlier values — keep a single comma-separated list.
- Use the provided endpoints in the backend to create orders and initialize payments:
	- `POST /api/orders/checkout` — create platform order (requires auth)
	- `POST /api/payments/stripe/create-intent` — returns `{ payment: { clientSecret } }`
	- `POST /api/payments/paypal/create-order` — returns PayPal order id
	- `POST /api/payments/paypal/capture-order` — capture PayPal payment

If you want, I can also run the dev servers here to verify CORS and test the payment flows locally.

