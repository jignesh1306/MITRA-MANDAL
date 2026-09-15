import { Notification } from '../models/Notification.js';

export const createNotification = async ({ userId, groupId, type, title, message }) => {
  return await Notification.create({
    userId,
    groupId,
    type,
    title,
    message,
    read: false
  });
};
