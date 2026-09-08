"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../src/app"));
const db_1 = require("../src/config/db");
const testEmail = `test_${Date.now()}@example.com`;
describe('Auth API', () => {
    afterAll(async () => {
        await db_1.prisma.user.deleteMany({ where: { email: testEmail } });
        await db_1.prisma.$disconnect();
    });
    it('registers a new user', async () => {
        const res = await (0, supertest_1.default)(app_1.default).post('/api/auth/register').send({
            fullName: 'Test User',
            email: testEmail,
            password: 'Password123',
        });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.email).toBe(testEmail);
    });
    it('rejects duplicate registration', async () => {
        const res = await (0, supertest_1.default)(app_1.default).post('/api/auth/register').send({
            fullName: 'Test User',
            email: testEmail,
            password: 'Password123',
        });
        expect(res.status).toBe(409);
    });
    it('rejects login with wrong password', async () => {
        const res = await (0, supertest_1.default)(app_1.default).post('/api/auth/login').send({
            email: testEmail,
            password: 'WrongPassword1',
        });
        expect(res.status).toBe(401);
    });
    it('rejects weak password on registration', async () => {
        const res = await (0, supertest_1.default)(app_1.default).post('/api/auth/register').send({
            fullName: 'Weak Pw',
            email: `weak_${Date.now()}@example.com`,
            password: '123',
        });
        expect(res.status).toBe(400);
    });
});
//# sourceMappingURL=auth.test.js.map