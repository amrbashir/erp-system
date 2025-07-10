import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { generateRandomOrgData, useTestingApp } from "./utils";

describe("UserDeletion", async () => {
  const { appUrl, runApp, closeApp } = await useTestingApp();

  const orgData = generateRandomOrgData();

  beforeAll(runApp);
  afterAll(closeApp);

  let accessToken: string;
  let cookies: string[] = [];

  beforeAll(async () => {
    // create organization and login to get access token
    await fetch(appUrl + "/org/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orgData),
    });

    const response = await fetch(appUrl + "/org/" + orgData.slug + "/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: orgData.username,
        password: orgData.password,
      }),
    });

    const data = (await response.json()) as { accessToken: string };
    accessToken = data.accessToken;
  });

  it("should delete a user successfully", async () => {
    // create a user to delete
    const createResponse = await fetch(appUrl + "/org/" + orgData.slug + "/user/create", {
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

    // delete the created user
    const response = await fetch(appUrl + "/org/" + orgData.slug + "/user/delete", {
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
    // Attempt to delete the current user (admin)
    const response = await fetch(appUrl + "/org/" + orgData.slug + "/user/delete", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        Cookie: cookies.join("; "),
      },
      body: JSON.stringify({
        username: orgData.username,
      }),
    });

    expect(response.status).toBe(403);
  });
});
