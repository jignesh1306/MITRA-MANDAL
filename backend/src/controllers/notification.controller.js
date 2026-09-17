import { Notification } from '../models/Notification.js';
import { PushSubscription } from '../models/PushSubscription.js';
import { VAPID_PUBLIC_KEY } from '../config/webPush.js';

export const getNotifications = async (req, res, next) => {
  try {
    // Permanently delete notifications older than 2 days (48 hours)
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    await Notification.deleteMany({ userId: req.user._id, createdAt: { $lt: twoDaysAgo } });

    const list = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 });
    const unreadCount = list.filter(n => !n.read).length;
    res.json({ notifications: list, unreadCount });
  } catch (error) {
    next(error);
  }
};

export const markRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id === 'all') {
      await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
      return res.json({ message: 'All notifications marked as read.' });
    }
    const notif = await Notification.findOne({ _id: id, userId: req.user._id });
    if (!notif) return res.status(404).json({ message: 'Notification not found.' });

    notif.read = true;
    await notif.save();
    res.json(notif);
  } catch (error) {
    next(error);
  }
};

export const getVapidKey = async (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
};

export const subscribePush = async (req, res, next) => {
  try {
    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ message: 'Invalid push subscription payload.' });
    }

    await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        userId: req.user._id,
        endpoint: subscription.endpoint,
        keys: subscription.keys
      },
      { upsert: true, new: true }
    );

    res.status(201).json({ message: 'Push subscription saved successfully.' });
  } catch (error) {
    next(error);
  }
};

export const unsubscribePush = async (req, res, next) => {
  try {
    const { endpoint } = req.body;
    if (endpoint) {
      await PushSubscription.deleteOne({ endpoint, userId: req.user._id });
    }
    res.json({ message: 'Unsubscribed from push notifications.' });
  } catch (error) {
    next(error);
  }
};
