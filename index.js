const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const Stripe = require('stripe');
const { stripeSecretKey, endpointSecret } = require('./config');

const stripe = Stripe(stripeSecretKey, { apiVersion: '2020-08-27' });
const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post('/create-payment-intent', async (req, res) => {
  const { paymentMethodId } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1000,
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true,
      mandate_data: {
        customer_acceptance: {
          type: 'online',
          online: {
            ip_address: req.ip,
            user_agent: req.get('user-agent'),
          },
        },
      },
    });

    res.status(200).send(paymentIntent);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.post(
  '/webhook',
  bodyParser.raw({ type: 'application/json' }),
  (req, res) => {
    const sig = req.headers['stripe-signature'];

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('PaymentIntent was successful!', paymentIntent);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  }
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
