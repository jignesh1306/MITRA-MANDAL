import { Notification } from '../models/Notification.js';
import { PushSubscription } from '../models/PushSubscription.js';
import webpush from '../config/webPush.js';

export const createNotification = async ({ userId, groupId, type, title, message }) => {
  const notif = await Notification.create({
    userId,
    groupId,
    type,
    title,
    message,
    read: false
  });

  // Asynchronously dispatch mobile web push notification
  sendPushNotification(userId, { title, message, type }).catch(err => {
    console.warn('Web push notification send warning:', err.message);
  });

  return notif;
};

const sendPushNotification = async (userId, payload) => {
  const subscriptions = await PushSubscription.find({ userId });
  if (!subscriptions || subscriptions.length === 0) return;

  const pushPayload = JSON.stringify({
    title: payload.title || 'Mitra-Mandal Alert',
    body: payload.message || '',
    icon: '/logo.png',
    badge: '/logo.png',
    data: {
      type: payload.type,
      url: '/member/notifications'
    }
  });

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification({
        endpoint: sub.endpoint,
        keys: sub.keys
      }, pushPayload);
    } catch (error) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        // Expired subscription, remove from DB
        await PushSubscription.deleteOne({ _id: sub._id });
      }
    }
  }
};
