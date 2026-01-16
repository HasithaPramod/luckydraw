# NowPayments.io Integration Setup Guide

## Step 1: Get Your API Keys

1. Sign up or log in to [NowPayments.io](https://nowpayments.io)
2. Go to your [Dashboard](https://nowpayments.io/dashboard)
3. Navigate to **Settings** → **API Keys**
4. Copy your:
   - **API Key** (Secret Key)
   - **Public Key**

## Step 2: Configure Environment Variables

Create a `.env` file in the root of your project (or update existing one):

```env
# NowPayments.io Configuration
VITE_NOWPAYMENTS_API_KEY=your_api_key_here
VITE_NOWPAYMENTS_PUBLIC_KEY=your_public_key_here
VITE_IPN_URL=https://yourdomain.com/api/webhooks/nowpayments
```

**Important Security Notes:**
- ⚠️ **Never commit your `.env` file to version control**
- ⚠️ The API key should ideally be used on a backend server, not in client-side code
- ⚠️ For production, create a backend API endpoint to handle payment creation

## Step 3: Set Up IPN (Instant Payment Notification) Webhook

1. In your NowPayments dashboard, go to **Settings** → **IPN Settings**
2. Set your IPN URL (e.g., `https://yourdomain.com/api/webhooks/nowpayments`)
3. This URL should point to a backend endpoint that:
   - Verifies the payment signature
   - Updates payment status in your database
   - Releases/reserves ticket numbers based on payment status

## Step 4: Test the Integration

1. Start your development server: `npm run dev`
2. Go to the purchase page
3. Select numbers and click "Purchase"
4. The payment modal should open
5. Complete a test payment

## Current Implementation

The integration includes:

- ✅ Payment creation via NowPayments API
- ✅ Payment modal with redirect to NowPayments
- ✅ Payment status polling (checks every 5 seconds)
- ✅ Automatic ticket creation on successful payment
- ✅ Number locking/releasing based on payment status
- ✅ Fallback to demo mode if API keys are not configured

## Backend Webhook Example (Recommended)

For production, you should create a backend endpoint to handle IPN callbacks:

```javascript
// Example Node.js/Express endpoint
app.post('/api/webhooks/nowpayments', async (req, res) => {
  const { payment_id, payment_status, order_id } = req.body;
  
  // Verify signature (NowPayments provides this)
  // Update payment status in database
  // Release or reserve ticket numbers based on status
  
  res.status(200).send('OK');
});
```

## Support

- NowPayments Documentation: https://documenter.getpostman.com/view/7907941/T1LJjU52
- NowPayments Support: https://nowpayments.io/help
