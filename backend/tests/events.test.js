"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../src/app"));
const db_1 = require("../src/config/db");
describe('Events API', () => {
    afterAll(async () => {
        await db_1.prisma.$disconnect();
    });
    it('lists published events with pagination metadata', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/events?page=1&limit=5');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.pagination).toHaveProperty('total');
    });
    it('rejects event creation without auth', async () => {
        const res = await (0, supertest_1.default)(app_1.default).post('/api/events').send({ title: 'No Auth Event' });
        expect(res.status).toBe(401);
    });
    it('returns 404 for unknown event slug', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/events/non-existent-slug-xyz');
        expect(res.status).toBe(404);
    });
});
//# sourceMappingURL=events.test.js.map