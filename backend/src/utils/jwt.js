"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.signRefreshToken = signRefreshToken;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret';
function signAccessToken(payload) {
    return jsonwebtoken_1.default.sign(payload, ACCESS_SECRET, {
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    });
}
function signRefreshToken(payload, rememberMe = false) {
    const expiresIn = rememberMe
        ? process.env.JWT_REFRESH_EXPIRES_IN_REMEMBER || '30d'
        : process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    return jsonwebtoken_1.default.sign(payload, REFRESH_SECRET, { expiresIn });
}
function verifyAccessToken(token) {
    return jsonwebtoken_1.default.verify(token, ACCESS_SECRET);
}
function verifyRefreshToken(token) {
    return jsonwebtoken_1.default.verify(token, REFRESH_SECRET);
}
//# sourceMappingURL=jwt.js.map