
import { describe, it, expect } from "@jest/globals";
import request from "supertest";
import app from "../src/app.js";

describe("GET /api/health", () => {
  it("returns a successful response", async () => {
    const response = await request(app)
      .get("/api/health");

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      status: "success",
      message: "Movie API is running"
    });
  });
});
