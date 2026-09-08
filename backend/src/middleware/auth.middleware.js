"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.authorize = authorize;
const jwt_1 = require("../utils/jwt");
const ApiError_1 = require("../utils/ApiError");
function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : req.cookies?.accessToken;
        if (!token)
            throw ApiError_1.ApiError.unauthorized('Access token is missing');
        const payload = (0, jwt_1.verifyAccessToken)(token);
        req.user = payload;
        next();
    }
    catch (err) {
        next(ApiError_1.ApiError.unauthorized('Invalid or expired access token'));
    }
}
function authorize(...roles) {
    return (req, res, next) => {
        if (!req.user)
            return next(ApiError_1.ApiError.unauthorized());
        if (!roles.includes(req.user.role)) {
            return next(ApiError_1.ApiError.forbidden('You do not have permission to perform this action'));
        }
        next();
    };
}
//# sourceMappingURL=auth.middleware.js.map