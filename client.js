// Replace with your own publishable key
const stripe = Stripe('');
const elements = stripe.elements({
  mode: 'payment',
  amount: 1000,
  currency: 'usd',
  paymentMethodCreation: 'manual',
  appearance: {
    theme: 'stripe',
  },
});

const cardElement = elements.create('card');
cardElement.mount('#card-element');

const form = document.getElementById('payment-form');
const paymentMessage = document.getElementById('payment-message');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  paymentMessage.classList.add('hidden');
  const { paymentMethod, error } = await stripe.createPaymentMethod({
    elements,
    params: {
      billing_details: {
        name: 'Huynh Phu',
      },
    },
  });

  if (error) {
    showMessage(error.message);
    return;
  }

  // Create a payment intent on the server
  const { paymentIntent, error: createPaymentIntentError } =
    await createPaymentIntent(paymentMethod.id);

  if (createPaymentIntentError) {
    showMessage(createPaymentIntentError.message);
  } else {
    showMessage(`Payment successful! PaymentIntent ID: ${paymentIntent.id}`);
  }
});

async function createPaymentIntent(paymentMethodId) {
  try {
    const response = await fetch(
      'http://localhost:3000/create-payment-intent',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId }),
      }
    );
    return await response.json();
  } catch (error) {
    return { error };
  }
}

function showMessage(message) {
  paymentMessage.textContent = message;
  paymentMessage.classList.remove('hidden');
}
