import { Notification } from '../models/Notification.js';

export const getNotifications = async (req, res, next) => {
  try {
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
