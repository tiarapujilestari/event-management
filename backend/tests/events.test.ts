import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/db';

describe('Events API', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('lists published events with pagination metadata', async () => {
    const res = await request(app).get('/api/events?page=1&limit=5');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toHaveProperty('total');
  });

  it('rejects event creation without auth', async () => {
    const res = await request(app).post('/api/events').send({ title: 'No Auth Event' });
    expect(res.status).toBe(401);
  });

  it('returns 404 for unknown event slug', async () => {
    const res = await request(app).get('/api/events/non-existent-slug-xyz');
    expect(res.status).toBe(404);
  });
});
