import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { generateRandomOrgData, useTestingApp } from "./utils";

describe("Auth E2E", async () => {
  const { appUrl, runApp, closeApp } = await useTestingApp();
  beforeAll(runApp);
  afterAll(closeApp);

  const orgData = generateRandomOrgData();

  let cookies: string[];
  let accessToken: string;

  describe("Organization Creation", () => {
    it("should create an organization successfully", async () => {
      const response = await fetch(appUrl + "/org/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orgData),
      });

      expect(response.status).toBe(201);
    });
  });

  describe("Login", () => {
    it("should login successfully with valid credentials", async () => {
      const response = await fetch(appUrl + "/org/" + orgData.slug + "/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: orgData.username,
          password: orgData.password,
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
      await fetch(appUrl + "/org/" + orgData.slug + "/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: orgData.username,
          password: "wrongpassword",
        }),
      });
    });
  });

  describe("Refresh Token", () => {
    it("should refresh access token with valid refresh token", async () => {
      const response = await fetch(appUrl + "/org/" + orgData.slug + "/auth/refresh", {
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
      const response = await fetch(appUrl + "/org/" + orgData.slug + "/auth/logout", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(response.status).toBe(200);
    });

    it("should fail to access logout due to missing tokens", async () => {
      const response = await fetch(appUrl + "/org/" + orgData.slug + "/auth/logout");
      expect(response.status).toBe(401);
    });
  });
});
