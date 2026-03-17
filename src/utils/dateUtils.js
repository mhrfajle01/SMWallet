/**
 * Returns the current date in Local ISO format (YYYY-MM-DD)
 * @param {Date} [date] - Optional date to format, defaults to now
 * @returns {string} - YYYY-MM-DD
 */
export const getLocalISO = (date = new Date()) => {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().split('T')[0];
};

/**
 * Safely converts a Firestore timestamp or JS Date to Local ISO string
 * @param {any} timestamp - Firestore timestamp or Date
 * @returns {string|null} - YYYY-MM-DD or null
 */
export const formatTimestampLocal = (timestamp) => {
    if (!timestamp) return null;
    try {
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return getLocalISO(date);
    } catch (e) {
        return null;
    }
};
