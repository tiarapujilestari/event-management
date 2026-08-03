import request from "supertest";
import app from "../src/app";
import { prisma } from "../src/config/db";

describe("Orders / Checkout API", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("rejects checkout without authentication", async () => {
    const res = await request(app)
      .post("/api/orders/checkout")
      .send({
        eventId: "fake-id",
        items: [{ ticketTypeId: "fake-ticket-id", quantity: 1 }],
      });
    expect(res.status).toBe(401);
  });

  it("rejects checkout with invalid body shape", async () => {
    const login = await request(app).post("/api/auth/login").send({
      email: "customer@eventplatform.com",
      password: "Customer123!",
    });

    if (login.status !== 200) return;

    const token = login.body.data.accessToken;
    const res = await request(app)
      .post("/api/orders/checkout")
      .set("Authorization", `Bearer ${token}`)
      .send({ items: [] });

    expect(res.status).toBe(400);
  });
});
