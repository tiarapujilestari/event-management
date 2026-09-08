"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../src/app"));
const db_1 = require("../src/config/db");
describe("Orders / Checkout API", () => {
    afterAll(async () => {
        await db_1.prisma.$disconnect();
    });
    it("rejects checkout without authentication", async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post("/api/orders/checkout")
            .send({
            eventId: "fake-id",
            items: [{ ticketTypeId: "fake-ticket-id", quantity: 1 }],
        });
        expect(res.status).toBe(401);
    });
    it("rejects checkout with invalid body shape", async () => {
        const login = await (0, supertest_1.default)(app_1.default).post("/api/auth/login").send({
            email: "customer@eventplatform.com",
            password: "Customer123!",
        });
        if (login.status !== 200)
            return;
        const token = login.body.data.accessToken;
        const res = await (0, supertest_1.default)(app_1.default)
            .post("/api/orders/checkout")
            .set("Authorization", `Bearer ${token}`)
            .send({ items: [] });
        expect(res.status).toBe(400);
    });
});
//# sourceMappingURL=orders.test.js.map