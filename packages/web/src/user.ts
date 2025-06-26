const authUserUsernameKey = "auth.user.username";
const authUserAccessTokenKey = "auth.user.accessToken";

export interface AuthUser {
  username: string;
  accessToken: string;
}

export function getStoredUser(): AuthUser | null {
  const username = localStorage.getItem(authUserUsernameKey);
  const accessToken = localStorage.getItem(authUserAccessTokenKey);
  if (!username || !accessToken) return null;
  return { username, accessToken };
}

export function setStoredUser(user: AuthUser | null) {
  if (user) {
    localStorage.setItem(authUserUsernameKey, user.username);
    localStorage.setItem(authUserAccessTokenKey, user.accessToken);
  } else {
    localStorage.removeItem(authUserUsernameKey);
    localStorage.removeItem(authUserAccessTokenKey);
  }
}

export function isStorageKeyForUser(key: string | null): boolean {
  return key === authUserUsernameKey || key === authUserAccessTokenKey;
}
