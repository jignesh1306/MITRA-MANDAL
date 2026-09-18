import api from './api';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const registerAndSubscribePush = async () => {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Web Push is not supported in this browser.');
      return false;
    }

    // 1. Register Service Worker safely
    let registration;
    try {
      registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
    } catch (swErr) {
      console.warn('Service worker registration bypassed:', swErr.message);
      return false;
    }

    // 2. Check or Request Permission
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      return false;
    }

    // 3. Get VAPID Public Key from backend
    const res = await api.get('/notifications/vapid-public-key');
    const publicKey = res.data?.publicKey;
    if (!publicKey) return false;

    // 4. Check existing subscription
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      const convertedKey = urlBase64ToUint8Array(publicKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey
      });
    }

    // 5. Send subscription to backend
    await api.post('/notifications/subscribe', { subscription: subscription.toJSON() });
    console.log('Successfully subscribed to Mobile Push Notifications!');
    return true;
  } catch (error) {
    console.warn('Push subscription bypassed:', error.message);
    return false;
  }
};
