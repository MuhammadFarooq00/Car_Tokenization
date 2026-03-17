import { Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type { NotificationType } from '@prisma/client';
import { paginate } from '../../shared/utils/index';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    // Optional so the service still works in tests / contexts without the gateway
    @Optional() private readonly gateway: NotificationsGateway,
  ) {}

  async send(
    userId: string,
    title: string,
    message: string,
    type: NotificationType = 'info',
  ) {
    // 1. Persist to DB
    const notification = await this.prisma.notification.create({
      data: { userId, title, message, type },
    });

    // 2. Push in real-time via WebSocket (if client is connected)
    try {
      this.gateway?.emitToUser(userId, notification);
    } catch (e) {
      this.logger.warn(`Failed to emit notification to ${userId}: ${e?.message}`);
    }

    this.logger.log(`Notification sent to ${userId}: ${title}`);
    return notification;
  }

  async getForUser(userId: string, page = 1, limit = 20) {
    const where = { userId };
    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);
    return paginate(notifications, total, page, limit);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, read: false },
    });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  async markOneRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true },
    });
  }
}
