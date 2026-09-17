import webpush from 'web-push';

export const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BKqcFVwN4U0_FzTxwFiv--Z28XNCWRTK6YPPgPBmz8oJeHnwcmtDG87xdCM_1LAHJs8QVB5NO8oDYl5qDOi1_5I';
export const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'UEN5rv3NZ_MbsstJlSfv4eJkdoV3Ejy0g-g7qSu3_7k';
export const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@mitramandal.org';

webpush.setVapidDetails(
  VAPID_SUBJECT,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export default webpush;
