"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReferralCode = generateReferralCode;
exports.generateInvoiceNumber = generateInvoiceNumber;
exports.generateCouponCode = generateCouponCode;
exports.generateSlug = generateSlug;
function generateReferralCode(fullName) {
    const prefix = fullName.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase().padEnd(4, 'X');
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `${prefix}${random}`;
}
function generateInvoiceNumber() {
    const date = new Date();
    const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `INV-${ymd}-${random}`;
}
function generateCouponCode() {
    return `WELCOME-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}
function generateSlug(title) {
    return (title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') +
        '-' +
        Math.random().toString(36).slice(2, 6));
}
//# sourceMappingURL=generators.js.map