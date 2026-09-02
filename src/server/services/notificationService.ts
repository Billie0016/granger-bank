import "server-only";
import { prisma } from "../db";
import { ForbiddenError, NotFoundError } from "../security/errors";

export async function listNotifications(userId: string, limit = 50) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function markNotificationRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notification) throw new NotFoundError("Notification not found.");
  if (notification.userId !== userId) throw new ForbiddenError();

  return prisma.notification.update({ where: { id: notificationId }, data: { readAt: new Date() } });
}

export async function markAllNotificationsRead(userId: string) {
  await prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
}

export async function createNotification(params: { userId: string; type: string; title: string; body: string }) {
  return prisma.notification.create({ data: params });
}
