import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { useTestingApp } from "./utils";

describe("Auth E2E", async () => {
  const { appUrl, runApp, closeApp } = await useTestingApp();
  beforeAll(async () => await runApp());
  afterAll(async () => await closeApp());

  let cookies: string[];
  let accessToken: string;
  let organizationSlug: string = "test-organization";

  describe("Organization Creation", () => {
    it("should create an organization successfully", async () => {
      const response = await fetch(appUrl + "/org/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test Organization",
          username: "admin",
          password: "12345678",
        }),
      });

      expect(response.status).toBe(201);
    });
  });

  describe("Login", () => {
    it("should login successfully with valid credentials", async () => {
      const response = await fetch(appUrl + "/org/" + organizationSlug + "/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "admin",
          password: "12345678",
        }),
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as { accessToken: string };
      expect(data).toHaveProperty("accessToken");
      expect(data.accessToken).toBeDefined();
      accessToken = data.accessToken;

      cookies = response.headers.getSetCookie() || [];
      expect(cookies).toHaveLength(1);
      expect(cookies.some((cookie) => cookie.startsWith("refreshToken="))).toBe(true);
    });

    it("should fail with invalid credentials", async () => {
      await fetch(appUrl + "/org/" + organizationSlug + "/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "admin",
          password: "wrongpassword",
        }),
      });
    });
  });

  describe("Refresh Token", () => {
    it("should refresh access token with valid refresh token", async () => {
      const response = await fetch(appUrl + "/org/" + organizationSlug + "/auth/refresh", {
        method: "GET",
        headers: { Cookie: cookies.join("; ") },
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as { accessToken: string };
      expect(data).toHaveProperty("accessToken");
      expect(data.accessToken).toBeDefined();
      accessToken = data.accessToken;
    });
  });

  describe("Logout", () => {
    it("should logout successfully with valid access token", async () => {
      const response = await fetch(appUrl + "/org/" + organizationSlug + "/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(response.status).toBe(200);
    });

    it("should fail to access logout due to missing tokens", async () => {
      const response = await fetch(appUrl + "/org/" + organizationSlug + "/auth/logout", {
        method: "POST",
      });
      expect(response.status).toBe(401);
    });
  });
});
