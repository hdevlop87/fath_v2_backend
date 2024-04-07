import bcrypt from 'bcryptjs';

export const hashPassword = async (password) => {
    if (!password) return
    return await bcrypt.hash(password, 10);
};

export const comparePassword = async (password, hashedPassword) => {
    if (!password || !hashedPassword) return;
    return await bcrypt.compare(password, hashedPassword);
};

export function parseDuration(duration) {
    const unit = duration.slice(-1);
    const value = parseInt(duration, 10); // Ensure base 10 is used for parsing
    let multiplier;

    switch (unit) {
        case 's': // Seconds
            multiplier = 1000; // 1000 milliseconds in a second
            break;
        case 'm': // Minutes
            multiplier = 60 * 1000; // 60 seconds in a minute
            break;
        case 'h': // Hours
            multiplier = 3600 * 1000; // 3600 seconds in an hour
            break;
        case 'd': // Days
            multiplier = 24 * 3600 * 1000; // 24 hours in a day
            break;
        case 'w': // Weeks
            multiplier = 7 * 24 * 3600 * 1000; // 7 days in a week
            break;
        case 'M': // Months, changed from 'm' to 'M' to avoid conflict with minutes
            multiplier = 30 * 24 * 3600 * 1000; // Approx. 30 days in a month
            break;
        case 'y': // Years
            multiplier = 365 * 24 * 3600 * 1000; // 365 days in a year
            break;
        default:
            throw new Error('Unsupported time unit');
    }

    return value * multiplier;
}

export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}