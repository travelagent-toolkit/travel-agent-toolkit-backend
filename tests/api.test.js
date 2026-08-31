/**
 * Integration tests against a real PostgreSQL database.
 *
 * Requires DATABASE_URL (see .env / .env.example) to point at a database
 * that has already had migrations applied (`npm run migrate`). Tables are
 * truncated before the suite runs so it can be re-run safely.
 */
const request = require("supertest");
const app = require("../src/app");
const { pool } = require("../src/config/db");

const TABLES = [
  "usage",
  "itineraries",
  "quotation_items",
  "quotations",
  "customers",
  "subscriptions",
  "users",
  "agencies",
];

beforeAll(async () => {
  await pool.query(`TRUNCATE TABLE ${TABLES.join(", ")} RESTART IDENTITY CASCADE`);
});

afterAll(async () => {
  await pool.end();
});

function uniqueEmail(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
}

describe("Health check", () => {
  it("GET /health returns success", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: "Travel Agent Toolkit API is running" });
  });
});

describe("Auth", () => {
  const email = uniqueEmail("agent1");
  const password = "SuperSecret123";
  let token;

  it("registers a new user and agency", async () => {
    const res = await request(app).post("/api/auth/register").send({
      full_name: "Ranveer Joshi",
      agency_name: "RJ Holidays",
      email,
      phone: "+919876543210",
      password,
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(email);
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.data.token).toEqual(expect.any(String));
  });

  it("rejects duplicate email registration", async () => {
    const res = await request(app).post("/api/auth/register").send({
      full_name: "Someone Else",
      agency_name: "Other Agency",
      email,
      password: "AnotherPass123",
    });
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("CONFLICT");
  });

  it("rejects registration with a weak password", async () => {
    const res = await request(app).post("/api/auth/register").send({
      full_name: "Weak Pw",
      agency_name: "Weak Agency",
      email: uniqueEmail("weak"),
      password: "123",
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("logs in with correct credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({ email, password });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toEqual(expect.any(String));
    token = res.body.data.token;
  });

  it("rejects login with wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({ email, password: "wrong" });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns the current user for a valid token", async () => {
    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(email);
  });

  it("rejects requests with no token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("rejects requests with a garbage token", async () => {
    const res = await request(app).get("/api/auth/me").set("Authorization", "Bearer garbage.token.value");
    expect(res.status).toBe(401);
  });
});

describe("Customers, quotations, itineraries and cross-agency isolation", () => {
  let agency1Token;
  let agency2Token;
  let customerId;
  let quotationId;

  beforeAll(async () => {
    const reg1 = await request(app).post("/api/auth/register").send({
      full_name: "Agency One Owner",
      agency_name: "Agency One",
      email: uniqueEmail("agency1"),
      password: "Password123",
    });
    agency1Token = reg1.body.data.token;

    const reg2 = await request(app).post("/api/auth/register").send({
      full_name: "Agency Two Owner",
      agency_name: "Agency Two",
      email: uniqueEmail("agency2"),
      password: "Password123",
    });
    agency2Token = reg2.body.data.token;
  });

  it("creates a customer", async () => {
    const res = await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${agency1Token}`)
      .send({ name: "Rohan Mehta", destination: "Kashmir" });
    expect(res.status).toBe(201);
    customerId = res.body.data.id;
  });

  it("lists only the caller's customers", async () => {
    const res = await request(app).get("/api/customers").set("Authorization", `Bearer ${agency1Token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);

    const otherRes = await request(app).get("/api/customers").set("Authorization", `Bearer ${agency2Token}`);
    expect(otherRes.body.data.length).toBe(0);
  });

  it("creates a quotation and recalculates selling price server-side", async () => {
    const res = await request(app)
      .post("/api/quotations")
      .set("Authorization", `Bearer ${agency1Token}`)
      .send({
        customerId,
        destination: "Kashmir",
        nights: 5,
        days: 6,
        adults: 2,
        costPrice: 43000,
        markupPercentage: 20,
        sellingPrice: 1, // deliberately wrong — must be ignored
        items: [{ category: "Hotel", quantity: 5, unitPrice: 4000 }],
      });
    expect(res.status).toBe(201);
    expect(res.body.data.sellingPrice).toBe("51600.00");
    expect(res.body.data.quotationNumber).toEqual(expect.stringMatching(/^[A-Z]+-\d{4}-\d{6}$/));
    quotationId = res.body.data.id;
  });

  it("recalculates selling price on update", async () => {
    const res = await request(app)
      .put(`/api/quotations/${quotationId}`)
      .set("Authorization", `Bearer ${agency1Token}`)
      .send({ markupPercentage: 30 });
    expect(res.status).toBe(200);
    expect(res.body.data.sellingPrice).toBe("55900.00");
  });

  it("creates an itinerary with defaulted optional fields", async () => {
    const res = await request(app)
      .post("/api/itineraries")
      .set("Authorization", `Bearer ${agency1Token}`)
      .send({ destination: "Kashmir", duration: 5 });
    expect(res.status).toBe(201);
    expect(res.body.data.travelType).toBe("Leisure");
    expect(res.body.data.content).toEqual([]);
  });

  it("blocks cross-agency access to a customer (404, not 403)", async () => {
    const res = await request(app)
      .get(`/api/customers/${customerId}`)
      .set("Authorization", `Bearer ${agency2Token}`);
    expect(res.status).toBe(404);
  });

  it("blocks cross-agency access to a quotation", async () => {
    const res = await request(app)
      .get(`/api/quotations/${quotationId}`)
      .set("Authorization", `Bearer ${agency2Token}`);
    expect(res.status).toBe(404);
  });

  it("blocks cross-agency delete attempts", async () => {
    const res = await request(app)
      .delete(`/api/customers/${customerId}`)
      .set("Authorization", `Bearer ${agency2Token}`);
    expect(res.status).toBe(404);

    // still accessible to its real owner afterwards
    const stillThere = await request(app)
      .get(`/api/customers/${customerId}`)
      .set("Authorization", `Bearer ${agency1Token}`);
    expect(stillThere.status).toBe(200);
  });

  it("rejects a malformed UUID path parameter", async () => {
    const res = await request(app)
      .get("/api/customers/not-a-uuid")
      .set("Authorization", `Bearer ${agency1Token}`);
    expect(res.status).toBe(400);
  });

  it("deletes a quotation and then 404s on it", async () => {
    const del = await request(app)
      .delete(`/api/quotations/${quotationId}`)
      .set("Authorization", `Bearer ${agency1Token}`);
    expect(del.status).toBe(204);

    const get = await request(app)
      .get(`/api/quotations/${quotationId}`)
      .set("Authorization", `Bearer ${agency1Token}`);
    expect(get.status).toBe(404);
  });
});

describe("Agency and user profile", () => {
  let token;

  beforeAll(async () => {
    const reg = await request(app).post("/api/auth/register").send({
      full_name: "Profile Tester",
      agency_name: "Profile Agency",
      email: uniqueEmail("profile"),
      password: "Password123",
    });
    token = reg.body.data.token;
  });

  it("reads and updates the agency profile", async () => {
    const res = await request(app)
      .put("/api/agency")
      .set("Authorization", `Bearer ${token}`)
      .send({ phone: "+911234567890", address: "Dharamshala" });
    expect(res.status).toBe(200);
    expect(res.body.data.phone).toBe("+911234567890");
  });

  it("updates the user's own profile but ignores protected fields", async () => {
    const res = await request(app)
      .put("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({
        full_name: "New Name",
        agency_id: "11111111-1111-1111-1111-111111111111",
        password_hash: "hacked",
      });
    expect(res.status).toBe(200);
    expect(res.body.data.fullName).toBe("New Name");
    expect(res.body.data.passwordHash).toBeUndefined();
  });
});
