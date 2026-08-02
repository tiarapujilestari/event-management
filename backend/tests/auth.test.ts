import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/db';

const testEmail = `test_${Date.now()}@example.com`;

describe('Auth API', () => {
  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
  });

  it('registers a new user', async () => {
    const res = await request(app).post('/api/auth/register').send({
      fullName: 'Test User',
      email: testEmail,
      password: 'Password123',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testEmail);
  });

  it('rejects duplicate registration', async () => {
    const res = await request(app).post('/api/auth/register').send({
      fullName: 'Test User',
      email: testEmail,
      password: 'Password123',
    });
    expect(res.status).toBe(409);
  });

  it('rejects login with wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testEmail,
      password: 'WrongPassword1',
    });
    expect(res.status).toBe(401);
  });

  it('rejects weak password on registration', async () => {
    const res = await request(app).post('/api/auth/register').send({
      fullName: 'Weak Pw',
      email: `weak_${Date.now()}@example.com`,
      password: '123',
    });
    expect(res.status).toBe(400);
  });
});
