export const STORED_STRIPE_CHECKOUT_URL_KEY = "ghc_stripe_checkout_url";

export function storeStripeCheckoutUrl(
  url: string,
  transactionId?: number | string | null,
): void {
  try {
    sessionStorage.setItem(STORED_STRIPE_CHECKOUT_URL_KEY, url);
    if (transactionId != null && transactionId !== "") {
      sessionStorage.setItem(
        `${STORED_STRIPE_CHECKOUT_URL_KEY}_${transactionId}`,
        url,
      );
    }
  } catch {
    // sessionStorage may be unavailable
  }
}

export function getStoredStripeCheckoutUrl(
  transactionId?: number | null,
): string | null {
  try {
    if (transactionId != null) {
      const byTransaction = sessionStorage.getItem(
        `${STORED_STRIPE_CHECKOUT_URL_KEY}_${transactionId}`,
      );
      if (byTransaction) return byTransaction;
    }
    return sessionStorage.getItem(STORED_STRIPE_CHECKOUT_URL_KEY);
  } catch {
    return null;
  }
}
