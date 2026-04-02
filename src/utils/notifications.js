/**
 * Utility for Browser-based Push Notifications
 */

export const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
        console.warn("This browser does not support desktop notification");
        return false;
    }

    if (Notification.permission === "granted") return true;

    const permission = await Notification.requestPermission();
    return permission === "granted";
};

export const sendNotification = (title, options = {}) => {
    if (Notification.permission === "granted") {
        const defaultOptions = {
            icon: './vite.svg',
            badge: './vite.svg',
            vibrate: [200, 100, 200]
        };
        new Notification(title, { ...defaultOptions, ...options });
    }
};

export const scheduleReminder = (title, message, timeInMs) => {
    setTimeout(() => {
        sendNotification(title, { body: message });
    }, timeInMs);
};
