import { connectDB, Notification } from "@toolhub/db";
import type { INotification } from "@toolhub/db";

const MAX_NOTIFICATIONS = 10;

type NotificationType = INotification["type"];

export async function createNotification({
  userId,
  type,
  title,
  message,
  meta,
}: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    await connectDB();

    await Notification.create({ userId, type, title, message, meta });

    // Keep only the most recent MAX_NOTIFICATIONS per user
    const count = await Notification.countDocuments({ userId });
    if (count > MAX_NOTIFICATIONS) {
      const oldest = await Notification.find({ userId })
        .sort({ createdAt: 1 })
        .limit(count - MAX_NOTIFICATIONS)
        .select("_id");
      const ids = oldest.map((n) => n._id);
      await Notification.deleteMany({ _id: { $in: ids } });
    }
  } catch (err) {
    console.error("[createNotification]", err);
  }
}
