"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        fullName: zod_1.z.string().min(2, "Full name must be at least 2 characters"),
        email: zod_1.z.string().email("Invalid email address"),
        password: zod_1.z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(/[A-Z]/, "Password must contain an uppercase letter")
            .regex(/[0-9]/, "Password must contain a number"),
        role: zod_1.z.enum(["CUSTOMER", "ORGANIZER"]).optional(),
        referralCode: zod_1.z.string().optional(),
    }),
});
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email("Invalid email address"),
        password: zod_1.z.string().min(1, "Password is required"),
        rememberMe: zod_1.z.boolean().optional(),
    }),
});
exports.forgotPasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email("Invalid email address"),
    }),
});
exports.resetPasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        token: zod_1.z.string().min(1, "Token is required"),
        password: zod_1.z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(/[A-Z]/, "Password must contain an uppercase letter")
            .regex(/[0-9]/, "Password must contain a number"),
    }),
});
exports.changePasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        currentPassword: zod_1.z.string().min(1, "Current password is required"),
        newPassword: zod_1.z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(/[A-Z]/, "Password must contain an uppercase letter")
            .regex(/[0-9]/, "Password must contain a number"),
    }),
});
//# sourceMappingURL=auth.validator.js.map