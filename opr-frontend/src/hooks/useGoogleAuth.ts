import { useGoogleLogin } from "@react-oauth/google";

export function useGoogleAccessTokenLogin() {
  return useGoogleLogin({
    scope: "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/gmail.send",
    prompt: "consent",
    onSuccess: (tokenResponse) => {
      const token = tokenResponse.access_token;
      if (token) {
        localStorage.setItem("__Google_Access_Token__", token);
      }
    },
    onError: (errorResponse) => {
      console.error("❌ Google login failed", errorResponse);
    },
  });
}
