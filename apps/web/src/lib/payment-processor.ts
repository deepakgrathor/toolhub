import { User, Payment, Notification, UserSubscription, Plan, CreditService } from "@toolhub/db";
import { getRedis } from "@toolhub/shared";
import { invalidateBalance } from "@/lib/credit-cache";
import { generateInvoiceNumber } from "@/lib/email/invoice-number";
import { sendEmail } from "@/lib/email/sender";
import { creditPurchaseEmail, planUpgradeEmail } from "@/lib/email/templates";
import type { IPayment } from "@toolhub/db";

export async function processCreditPackPayment(payment: IPayment) {
  await CreditService.addCredits(
    payment.userId.toString(),
    payment.credits,
    "credit_purchase",
    { paymentId: payment._id }
  );
  await invalidateBalance(payment.userId.toString());

  const user = await User.findById(payment.userId);
  if (!user) return;

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
  });

  await CreditService.addCredits(
    payment.userId.toString(),
    payment.credits,
    "plan_upgrade",
    { planSlug: payment.planSlug, billingCycle: payment.billingCycle }
  );
  await invalidateBalance(payment.userId.toString());

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

  // Bust plan-related caches (not credit cache — invalidateBalance handles that)
  try {
    const redis = getRedis();
    await Promise.all([
      redis.del(`plan:${payment.userId}`),
      redis.del(`plan-limits:${payment.userId}`),
    ]);
  } catch {
    // silent
  }

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
