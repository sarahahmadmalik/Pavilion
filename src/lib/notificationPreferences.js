const STORAGE_KEY = 'pavilion_notification_prefs';

const DEFAULT_PREFS = {
  inAppNotifications: true,
  browserNotifications: false,
  systemBellSound: true,
  chatSound: true
};

export function getNotificationPreferences() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function saveNotificationPreferences(prefs) {
  const merged = { ...getNotificationPreferences(), ...prefs };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // ignore storage errors
  }
  return merged;
}

export async function requestBrowserNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  if (Notification.permission === 'granted') return 'granted';
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

export function showBrowserNotification(title, body) {
  try {
    const prefs = getNotificationPreferences();
    if (!prefs.browserNotifications) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    new Notification(title || 'PAVILION', {
      body: body || '',
      icon: '/favicon.svg'
    });
  } catch {
    // fail silently if browser blocks notifications
  }
}
