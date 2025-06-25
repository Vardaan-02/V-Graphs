import { googleLogout } from "@react-oauth/google";

const GOOGLE_TOKEN_KEY = "__Google_Access_Token__";

export function getGoogleToken(): string | null {
  return localStorage.getItem(GOOGLE_TOKEN_KEY);
}

export function clearGoogleToken() {
  localStorage.removeItem(GOOGLE_TOKEN_KEY);
  googleLogout();
}
