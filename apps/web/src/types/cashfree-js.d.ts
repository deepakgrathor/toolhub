declare module '@cashfreepayments/cashfree-js' {
  interface CashfreeOptions {
    mode: 'sandbox' | 'production'
  }

  interface CheckoutOptions {
    paymentSessionId: string
    redirectTarget?: '_self' | '_blank' | '_modal'
  }

  interface CashfreeInstance {
    checkout(options: CheckoutOptions): void
  }

  export function load(options: CashfreeOptions): Promise<CashfreeInstance>
}
