"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// @ts-ignore
const xss_clean_1 = __importDefault(require("xss-clean"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const event_routes_1 = __importDefault(require("./routes/event.routes"));
const order_routes_1 = __importDefault(require("./routes/order.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const review_routes_1 = __importDefault(require("./routes/review.routes"));
const voucher_routes_1 = __importDefault(require("./routes/voucher.routes"));
const misc_routes_1 = __importDefault(require("./routes/misc.routes"));
const organizer_routes_1 = __importDefault(require("./routes/organizer.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const profile_routes_1 = __importDefault(require("./routes/profile.routes"));
const error_middleware_1 = require("./middleware/error.middleware");
const swagger_1 = require("./docs/swagger");
const app = (0, express_1.default)();
// Security & core middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        console.log("Incoming origin:", origin);
        const allowed = [
            "https://festifyid.vercel.app",
            "https://festify-psi.vercel.app",
            "http://localhost:5173",
        ];
        if (!origin || allowed.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
}));
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.use((0, xss_clean_1.default)());
app.use((0, morgan_1.default)(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use((0, express_rate_limit_1.default)({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 200,
    standardHeaders: true,
    legacyHeaders: false,
}));
// Health check
app.get("/health", (_req, res) => res.json({ success: true, message: "API is healthy" }));
// API docs
app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec));
// Routes
app.use("/api/auth", auth_routes_1.default);
app.use("/api/events", event_routes_1.default);
app.use("/api/orders", order_routes_1.default);
app.use("/api/payments", payment_routes_1.default);
app.use("/api/reviews", review_routes_1.default);
app.use("/api/vouchers", voucher_routes_1.default);
app.use("/api", misc_routes_1.default); // /api/wishlist/*, /api/notifications/*
app.use("/api/organizer", organizer_routes_1.default);
app.use("/api/admin", admin_routes_1.default);
app.use("/api/profile", profile_routes_1.default);
// Error handling
app.use(error_middleware_1.notFoundHandler);
app.use(error_middleware_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map