import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { useTestingApp } from "./utils";

describe("UserDeletion", async () => {
  const { appUrl, runApp, closeApp } = await useTestingApp();

  beforeAll(runApp);
  afterAll(closeApp);

  let accessToken: string;
  let orgCounter: number = 0;
  let cookies: string[] = [];

  beforeEach(async () => {
    orgCounter++;

    await fetch(appUrl + "/org/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Organization",
        username: "admin",
        password: "12345678",
        slug: "testorg" + orgCounter,
      }),
    });

    const response = await fetch(appUrl + "/org/" + "testorg" + orgCounter + "/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "admin",
        password: "12345678",
      }),
    });

    const data = (await response.json()) as { accessToken: string };
    accessToken = data.accessToken;
  });

  afterEach(async () => {
    accessToken = "";
  });

  it("should delete a user successfully", async () => {
    const createResponse = await fetch(appUrl + "/org/" + "testorg" + orgCounter + "/user/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        Cookie: cookies.join("; "),
      },
      body: JSON.stringify({
        username: "testuser",
        password: "testpassword",
        role: "USER",
      }),
    });

    expect(createResponse.status).toBe(201);

    const response = await fetch(appUrl + "/org/" + "testorg" + orgCounter + "/user/delete", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        Cookie: cookies.join("; "),
      },
      body: JSON.stringify({
        username: "testuser",
      }),
    });

    expect(response.status).toBe(200);
  });

  it("should not delete current user", async () => {
    const response = await fetch(appUrl + "/org/" + "testorg" + orgCounter + "/user/delete", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        Cookie: cookies.join("; "),
      },
      body: JSON.stringify({
        username: "admin",
      }),
    });

    expect(response.status).toBe(403);
  });
});
