"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = sendMail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
async function sendMail({ to, subject, html }) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log(`[mailer] SMTP not configured. Skipping email to ${to}: ${subject}`);
        return;
    }
    return transporter.sendMail({
        from: process.env.SMTP_FROM || '"Event Platform" <no-reply@eventplatform.com>',
        to,
        subject,
        html,
    });
}
//# sourceMappingURL=mailer.js.map