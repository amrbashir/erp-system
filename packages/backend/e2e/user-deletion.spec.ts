import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { generateRandomOrgData, useTestingApp } from "./utils";

describe("UserDeletion", async () => {
  const { appUrl, runApp, closeApp } = await useTestingApp();

  let orgData: ReturnType<typeof generateRandomOrgData>;

  beforeAll(runApp);
  afterAll(closeApp);

  let cookies: string[];

  beforeEach(async () => {
    orgData = generateRandomOrgData();

    // create organization and login to get access token
    await fetch(appUrl + "/orgs/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orgData),
    });

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

  it("should delete a user successfully", async () => {
    // Create a user to delete
    const createResponse = await fetch(appUrl + "/orgs/" + orgData.slug + "/users/create", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookies.join("; ") },
      body: JSON.stringify({
        username: "testuser",
        password: "testpassword",
        role: "USER",
      }),
    });

    expect(createResponse.status).toBe(201);

    // Get the list of users
    const usersResponse = await fetch(appUrl + "/orgs/" + orgData.slug + "/users", {
      method: "GET",
      headers: { "Content-Type": "application/json", Cookie: cookies.join("; ") },
    });
    const users = (await usersResponse.json()) as { id: string }[];

    // Delete the created user
    const response = await fetch(appUrl + "/orgs/" + orgData.slug + "/users/" + users[0].id, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Cookie: cookies.join("; ") },
    });

    expect(response.status).toBe(200);
  });

  it("should not delete current user", async () => {
    // Create a user just so that there is more than one user in the org
    const createResponse = await fetch(appUrl + "/orgs/" + orgData.slug + "/users/create", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookies.join("; ") },
      body: JSON.stringify({
        username: "testuser",
        password: "testpassword",
        role: "USER",
      }),
    });
    expect(createResponse.status).toBe(201);

    // Get the list of users
    const usersResponse = await fetch(appUrl + "/orgs/" + orgData.slug + "/users", {
      method: "GET",
      headers: { "Content-Type": "application/json", Cookie: cookies.join("; ") },
    });
    const users = (await usersResponse.json()) as { id: string }[];

    // Attempt to delete the current user
    const response = await fetch(appUrl + "/orgs/" + orgData.slug + "/users/" + users[1].id, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Cookie: cookies.join("; ") },
    });

    expect(response.status).toBe(403);
  });
});
