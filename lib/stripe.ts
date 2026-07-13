import { loadStripe, Stripe } from "@stripe/stripe-js";
import { stripePublishableKey } from "@/lib/env";

let stripePromise: Promise<Stripe | null>;

const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublishableKey);
  }
  return stripePromise;
};

export default getStripe;
