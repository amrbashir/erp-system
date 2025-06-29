const authUserUsernameKey = "auth.user.username";
const authUserAccessTokenKey = "auth.user.accessToken";
const authUserRoleKey = "auth.user.role";

export interface AuthUser {
  username: string;
  accessToken: string;
  role: string;
}

export function getStoredUser(): AuthUser | null {
  const username = localStorage.getItem(authUserUsernameKey);
  const accessToken = localStorage.getItem(authUserAccessTokenKey);
  const role = localStorage.getItem(authUserRoleKey);
  if (!username || !accessToken || !role) return null;
  return { username, accessToken, role };
}

export function setStoredUser(user: AuthUser | null) {
  if (user) {
    localStorage.setItem(authUserUsernameKey, user.username);
    localStorage.setItem(authUserAccessTokenKey, user.accessToken);
    localStorage.setItem(authUserRoleKey, user.role);
  } else {
    localStorage.removeItem(authUserUsernameKey);
    localStorage.removeItem(authUserAccessTokenKey);
    localStorage.removeItem(authUserRoleKey);
  }
}

export function isStorageKeyForUser(key: string | null): boolean {
  return key === authUserUsernameKey || key === authUserAccessTokenKey;
}
