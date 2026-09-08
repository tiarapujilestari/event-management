"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const zod_1 = require("zod");
const ApiError_1 = require("../utils/ApiError");
function validate(schema) {
    return (req, res, next) => {
        try {
            schema.parse({ body: req.body, query: req.query, params: req.params });
            next();
        }
        catch (err) {
            if (err instanceof zod_1.ZodError) {
                return next(ApiError_1.ApiError.badRequest('Validation failed', err.errors.map((e) => ({ path: e.path.join('.'), message: e.message }))));
            }
            next(err);
        }
    };
}
//# sourceMappingURL=validate.middleware.js.map