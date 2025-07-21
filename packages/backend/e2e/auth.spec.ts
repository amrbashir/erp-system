import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { generateRandomOrgData, useTestingApp } from "./utils";

describe("Auth E2E", async () => {
  const { appUrl, runApp, closeApp } = await useTestingApp();
  beforeAll(runApp);
  afterAll(closeApp);

  const orgData = generateRandomOrgData();

  let cookies: string[];

  describe("Organization Creation", () => {
    it("should create an organization successfully", async () => {
      const response = await fetch(appUrl + "/orgs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orgData),
      });

      expect(response.status).toBe(201);
    });
  });

  describe("Login", () => {
    it("should login successfully with valid credentials", async () => {
      const response = await fetch(appUrl + "/orgs/" + orgData.slug + "/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: orgData.username,
          password: orgData.password,
        }),
      });

      expect(response.status).toBe(200);

      cookies = response.headers.getSetCookie() || [];
    });

    it("should fail with invalid credentials", async () => {
      await fetch(appUrl + "/orgs/" + orgData.slug + "/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: orgData.username,
          password: "wrongpassword",
        }),
      });
    });
  });

  describe("Logout", () => {
    it("should logout successfully with valid access token", async () => {
      const response = await fetch(appUrl + "/orgs/" + orgData.slug + "/auth/logout", {
        headers: { Cookie: cookies.join("; ") },
      });
      expect(response.status).toBe(200);
    });
  });
});
