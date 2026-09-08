"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = __importDefault(require("./app"));
const scheduler_1 = require("./utils/scheduler");
const PORT = process.env.PORT || 8000;
app_1.default.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`API docs available at http://localhost:${PORT}/api-docs`);
    (0, scheduler_1.startSchedulers)();
});
//# sourceMappingURL=index.js.map