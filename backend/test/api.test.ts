import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import zlib from "node:zlib";
import { createApp } from "../src/app.js";

const app = createApp();
const api = (path: string) => `/api/v1${path}`;

/** Build a tiny valid PNG so uploads exercise the real code path. */
function png(): Buffer {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (b: Buffer) => { let c = 0xffffffff; for (const x of b) c = crcTable[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(2, 0); ihdr.writeUInt32BE(1, 4); ihdr[8] = 8; ihdr[9] = 2;
  const raw = Buffer.from([0, 255, 255, 255, 0, 0, 0]);
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

const birth = { name: "Arjun", gender: "male", birthDate: "1990-08-15", birthTime: "06:30", placeName: "Pune, Maharashtra", latitude: 18.5204, longitude: 73.8567, timezone: "Asia/Kolkata" };
const vastu = { title: "Our flat", northAngle: 0, aspectRatio: 2, center: { x: 0.5, y: 0.5 }, rooms: [
  { type: "kitchen", x: 0.9, y: 0.9 }, { type: "toilet", x: 0.9, y: 0.1 }, { type: "masterBedroom", x: 0.1, y: 0.9 }, { type: "entrance", x: 0.5, y: 0.02 },
] };

let token = "";
const auth = () => ({ Authorization: `Bearer ${token}` });

describe("API", () => {
  beforeAll(async () => {
    const r = await request(app).post(api("/auth/register")).send({ email: "Devotee@Example.com", password: "om-namah-shivaya", name: "Devotee", language: "hi" });
    expect(r.status).toBe(201);
    token = r.body.token;
  });

  it("lists enabled login providers", async () => {
    const r = await request(app).get(api("/auth/providers"));
    expect(r.body).toMatchObject({ email: true, demo: true, google: false, facebook: false, apple: false });
  });

  it("handles email login, duplicate signup and bad passwords", async () => {
    expect((await request(app).post(api("/auth/login")).send({ email: "devotee@example.com", password: "om-namah-shivaya" })).status).toBe(200);
    expect((await request(app).post(api("/auth/login")).send({ email: "devotee@example.com", password: "wrong" })).status).toBe(401);
    expect((await request(app).post(api("/auth/register")).send({ email: "devotee@example.com", password: "12345678", name: "X" })).status).toBe(409);
    expect((await request(app).get(api("/me"))).status).toBe(401);
  });

  it("rejects social logins when providers are not configured", async () => {
    const r = await request(app).post(api("/auth/google")).send({ idToken: "x".repeat(20) });
    expect(r.status).toBe(503);
  });

  it("creates, lists, reads (localised) and deletes a kundali", async () => {
    const created = await request(app).post(api("/kundalis")).set(auth()).send(birth);
    expect(created.status).toBe(201);
    expect(created.body.report.lang).toBe("hi"); // user's preferred language
    const id = created.body.id;

    const list = await request(app).get(api("/kundalis")).set(auth());
    expect(list.body.items[0]).toMatchObject({ id, name: "Arjun", lagnaSign: 4 });

    const mr = await request(app).get(api(`/kundalis/${id}?lang=mr`)).set(auth());
    expect(mr.body.report.summary.lagna).toBe("सिंह");
    expect(mr.body.aiAvailable).toBe(false);

    expect((await request(app).post(api(`/kundalis/${id}/ai-reading`)).set(auth()).send({})).status).toBe(503);
    expect((await request(app).post(api("/kundalis")).set(auth()).send({ ...birth, timezone: "Mars/Olympus" })).status).toBe(400);
    expect((await request(app).delete(api(`/kundalis/${id}`)).set(auth())).status).toBe(204);
    expect((await request(app).get(api(`/kundalis/${id}`)).set(auth())).status).toBe(404);
  });

  it("uploads a floor plan and returns a 16-zone analysis", async () => {
    const r = await request(app).post(api("/vastu?lang=en")).set(auth()).field("data", JSON.stringify(vastu)).attach("plan", png(), { filename: "plan.png", contentType: "image/png" });
    expect(r.status).toBe(201);
    expect(r.body.report.sectors).toHaveLength(16);
    expect(r.body.report.findings.find((f: { type: string }) => f.type === "toilet").zone).toBe("ENE"); // 2:1 plan: top-right is ~63° from north

    const img = await request(app).get(api(`/vastu/${r.body.id}/image`)).set(auth());
    expect(img.status).toBe(200);
    expect(img.headers["content-type"]).toContain("image/png");

    const bad = await request(app).post(api("/vastu")).set(auth()).field("data", JSON.stringify(vastu)).attach("plan", Buffer.from("not an image"), "x.png");
    expect(bad.status).toBe(415);
  });

  it("runs a combined astro + vastu consultation", async () => {
    const r = await request(app).post(api("/consultations/both")).set(auth()).field("data", JSON.stringify({ birth, vastu })).attach("plan", png(), "plan.png");
    expect(r.status).toBe(201);
    const c = await request(app).get(api(`/consultations/${r.body.id}?lang=en`)).set(auth());
    expect(c.body.kind).toBe("both");
    expect(c.body.kundali.report.sections.length).toBeGreaterThan(5);
    expect(c.body.vastu.report.score).toBeGreaterThan(0);
    expect(c.body.combined.favourableZones.length).toBeGreaterThan(0);

    const list = await request(app).get(api("/consultations")).set(auth());
    expect(list.body.items.map((i: { kind: string }) => i.kind)).toEqual(expect.arrayContaining(["astro", "vastu", "both"]));
  });

  it("records an activity timeline and isolates users", async () => {
    const a = await request(app).get(api("/activity?limit=100")).set(auth());
    const actions = a.body.items.map((i: { action: string }) => i.action);
    expect(actions).toEqual(expect.arrayContaining(["auth.signup", "auth.login", "kundali.create", "kundali.view", "kundali.delete", "vastu.create", "consultation.create"]));

    const other = await request(app).post(api("/auth/demo")).send({ name: "Other" });
    const theirs = await request(app).get(api("/vastu")).set({ Authorization: `Bearer ${other.body.token}` });
    expect(theirs.body.items).toHaveLength(0);
  });

  it("searches birth places offline", async () => {
    const r = await request(app).get(api("/geo/search?q=nash")).set(auth());
    expect(r.body.items[0]).toMatchObject({ name: "Nashik", timezone: "Asia/Kolkata" });
  });

  it("updates profile language and deletes the account", async () => {
    const p = await request(app).patch(api("/me")).set(auth()).send({ language: "mr" });
    expect(p.body.user.language).toBe("mr");
    expect((await request(app).delete(api("/me")).set(auth())).status).toBe(204);
    expect((await request(app).get(api("/me")).set(auth())).status).toBe(401);
  });
});
