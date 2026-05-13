import { Cashfree, CFEnvironment, CreateOrderRequest } from 'cashfree-pg'
import crypto from 'crypto'

export interface CashfreeCreateOrderParams {
  orderId: string
  amount: number
  currency?: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  orderNote: string
  returnUrl: string
}

export interface CashfreeOrderResponse {
  order_id: string
  payment_session_id: string
  order_status: string
}

export interface CashfreeOrderStatus {
  order_id: string
  order_status: string
  order_amount: number
  order_currency: string
  payment_session_id?: string
}

const environment =
  process.env.NEXT_PUBLIC_CASHFREE_MODE === 'production'
    ? CFEnvironment.PRODUCTION
    : CFEnvironment.SANDBOX

const cashfree = new Cashfree(
  environment,
  process.env.CASHFREE_APP_ID!,
  process.env.CASHFREE_SECRET_KEY!
)

export async function createCashfreeOrder(
  params: CashfreeCreateOrderParams
): Promise<CashfreeOrderResponse> {
  const {
    orderId,
    amount,
    currency = 'INR',
    customerName,
    customerEmail,
    customerPhone,
    orderNote,
    returnUrl,
  } = params

  const request: CreateOrderRequest = {
    order_id: orderId,
    order_amount: amount,
    order_currency: currency,
    order_note: orderNote,
    customer_details: {
      customer_id: customerEmail.replace(/[^a-zA-Z0-9]/g, '_'),
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone || '9999999999',
    },
    order_meta: {
      return_url: returnUrl,
      notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`,
    },
  }

  const response = await cashfree.PGCreateOrder(request)
  return response.data as CashfreeOrderResponse
}

export async function verifyCashfreeOrder(
  orderId: string
): Promise<CashfreeOrderStatus> {
  const response = await cashfree.PGFetchOrder(orderId)
  return response.data as CashfreeOrderStatus
}

export function verifyCashfreeWebhook(
  rawBody: string,
  timestamp: string,
  signature: string
): boolean {
  const signedPayload = timestamp + rawBody
  const expectedSignature = crypto
    .createHmac('sha256', process.env.CASHFREE_WEBHOOK_SECRET!)
    .update(signedPayload)
    .digest('base64')
  return expectedSignature === signature
}
