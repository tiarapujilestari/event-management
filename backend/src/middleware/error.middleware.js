"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = notFoundHandler;
exports.errorHandler = errorHandler;
const ApiError_1 = require("../utils/ApiError");
function notFoundHandler(req, res) {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
    });
}
function errorHandler(err, req, res, next) {
    if (err instanceof ApiError_1.ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            details: err.details,
        });
    }
    // Prisma errors
    if (err.code === "P2002") {
        return res.status(409).json({
            success: false,
            message: `Duplicate value for field: ${err.meta?.target}`,
        });
    }
    if (err.code === "P2025") {
        return res
            .status(404)
            .json({ success: false, message: "Record not found" });
    }
    console.error("Unhandled error:", err);
    return res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === "production"
            ? "Internal server error"
            : err.message,
    });
}
//# sourceMappingURL=error.middleware.js.map