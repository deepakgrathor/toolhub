import { User, Payment, CreditTransaction, Notification, UserSubscription, Plan } from "@toolhub/db";
import { getRedis } from "@toolhub/shared";
import { generateInvoiceNumber } from "@/lib/email/invoice-number";
import { sendEmail } from "@/lib/email/sender";
import { creditPurchaseEmail, planUpgradeEmail } from "@/lib/email/templates";
import type { IPayment } from "@toolhub/db";

export async function processCreditPackPayment(payment: IPayment) {
  await User.findByIdAndUpdate(payment.userId, {
    $inc: { credits: payment.credits },
  });

  const user = await User.findById(payment.userId);
  if (!user) return;

  await CreditTransaction.create({
    userId: payment.userId,
    type: "credit_purchase",
    amount: payment.credits,
    note: `Credit pack purchase — ${payment.credits} credits`,
    balanceAfter: user.credits,
    description: `${payment.credits} Credit Pack`,
  });

  const redis = getRedis();
  await redis.del(`balance:${payment.userId}`);
  await redis.del(`sidebar:${payment.userId}`);

  const invoiceNumber = await generateInvoiceNumber();
  payment.invoiceNumber = invoiceNumber;
  await payment.save();

  await Notification.create({
    userId: payment.userId,
    type: "purchase_success",
    title: "Credits Added!",
    message: `${payment.credits} credits have been added to your account.`,
    meta: { credits: payment.credits, invoiceNumber },
  });

  sendEmail({
    to: user.email,
    ...creditPurchaseEmail({
      name: user.name,
      credits: payment.credits,
      amount: payment.totalAmount,
      invoiceNumber,
      transactionId: payment.cashfreePaymentId || payment.orderId,
    }),
  }).catch(console.error);
}

export async function processPlanPayment(payment: IPayment) {
  const expiryDays = payment.billingCycle === "yearly" ? 365 : 30;
  const planExpiry = new Date(Date.now() + expiryDays * 86400000);

  const planValue = payment.planSlug as "free" | "lite" | "pro" | "business" | "enterprise";
  await User.findByIdAndUpdate(payment.userId, {
    plan: planValue,
    planExpiry: planExpiry,
    $inc: { credits: payment.credits },
  });

  await UserSubscription.findOneAndUpdate(
    { userId: payment.userId },
    {
      userId: payment.userId,
      planSlug: payment.planSlug,
      billingCycle: payment.billingCycle,
      creditsSelected: payment.credits,
      status: "active",
      currentPeriodStart: new Date(),
      currentPeriodEnd: planExpiry,
      cashfreeOrderId: payment.orderId,
      autoRenew: false,
    },
    { upsert: true, new: true }
  );

  const user = await User.findById(payment.userId);
  if (!user) return;

  await CreditTransaction.create({
    userId: payment.userId,
    type: "plan_upgrade",
    amount: payment.credits,
    note: `${payment.planSlug} plan — ${payment.billingCycle}`,
    balanceAfter: user.credits,
    description: `${(payment.planSlug || "").toUpperCase()} Plan Activation`,
  });

  const redis = getRedis();
  await redis.del(`balance:${payment.userId}`);
  await redis.del(`sidebar:${payment.userId}`);
  await redis.del(`plan:${payment.userId}`);
  await redis.del(`plan-limits:${payment.userId}`);

  const invoiceNumber = await generateInvoiceNumber();
  payment.invoiceNumber = invoiceNumber;
  await payment.save();

  const plan = await Plan.findOne({ slug: payment.planSlug });
  const planName = plan?.name || (payment.planSlug || "").toUpperCase();

  await Notification.create({
    userId: payment.userId,
    type: "purchase_success",
    title: "Plan Activated!",
    message: `Your ${planName} plan is now active.`,
    meta: { planSlug: payment.planSlug, invoiceNumber },
  });

  sendEmail({
    to: user.email,
    ...planUpgradeEmail({
      name: user.name,
      planName,
      credits: payment.credits,
      amount: payment.totalAmount,
      invoiceNumber,
    }),
  }).catch(console.error);
}
