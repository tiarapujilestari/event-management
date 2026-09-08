"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.myPoints = exports.uploadAvatar = exports.updateProfile = void 0;
const db_1 = require("../config/db");
const asyncHandler_1 = require("../middleware/asyncHandler");
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const ApiError_1 = require("../utils/ApiError");
const hash_1 = require("../utils/hash");
// PUT /api/profile
exports.updateProfile = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { fullName, phone, address, cityId, bio } = req.body;
    const userId = req.user.userId;
    if (fullName) {
        await db_1.prisma.user.update({ where: { id: userId }, data: { fullName } });
    }
    const profile = await db_1.prisma.profile.upsert({
        where: { userId },
        update: { phone, address, cityId, bio },
        create: { userId, phone, address, cityId, bio },
    });
    res.json({ success: true, data: profile });
});
// POST /api/profile/avatar
exports.uploadAvatar = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const file = req.file;
    if (!file)
        return res
            .status(400)
            .json({ success: false, message: "No file uploaded" });
    const result = await new Promise((resolve, reject) => {
        const stream = cloudinary_1.default.uploader.upload_stream({ folder: "avatars" }, (err, result) => {
            if (err)
                reject(err);
            else
                resolve(result);
        });
        stream.end(file.buffer);
    });
    const profile = await db_1.prisma.profile.upsert({
        where: { userId: req.user.userId },
        update: { avatarUrl: result.secure_url },
        create: { userId: req.user.userId, avatarUrl: result.secure_url },
    });
    res.json({ success: true, data: profile });
});
// GET /api/profile/points
exports.myPoints = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const points = await db_1.prisma.referralPoint.findMany({
        where: { ownerId: req.user.userId, expiresAt: { gt: new Date() } },
    });
    const balance = points.reduce((sum, p) => sum + p.points, 0);
    const coupons = await db_1.prisma.coupon.findMany({
        where: {
            userId: req.user.userId,
            isUsed: false,
            expiresAt: { gt: new Date() },
        },
    });
    res.json({ success: true, data: { balance, coupons } });
});
// PUT /api/profile/change-password
exports.changePassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;
    const user = await db_1.prisma.user.findUnique({ where: { id: userId } });
    if (!user)
        throw ApiError_1.ApiError.notFound("User not found");
    const isValid = await (0, hash_1.comparePassword)(currentPassword, user.password);
    if (!isValid)
        throw ApiError_1.ApiError.badRequest("Current password is incorrect");
    const isSame = await (0, hash_1.comparePassword)(newPassword, user.password);
    if (isSame)
        throw ApiError_1.ApiError.badRequest("New password must be different from the current password");
    const hashed = await (0, hash_1.hashPassword)(newPassword);
    await db_1.prisma.user.update({
        where: { id: userId },
        data: { password: hashed, refreshToken: null },
    });
    res.json({
        success: true,
        message: "Password changed successfully. Please log in again.",
    });
});
//# sourceMappingURL=profile.controller.js.map