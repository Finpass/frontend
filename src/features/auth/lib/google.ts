interface TokenResponse {
  access_token?: string;
  error?: string;
}

interface TokenClient {
  requestAccessToken: () => void;
}

interface GoogleOAuth {
  initTokenClient: (cfg: {
    client_id: string;
    scope: string;
    callback: (r: TokenResponse) => void;
    error_callback: () => void;
  }) => TokenClient;
}

declare global {
  interface Window {
    google?: { accounts: { oauth2: GoogleOAuth } };
  }
}

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

let loading: Promise<void> | null = null;

export function loadGoogle(): Promise<void> {
  if (window.google) return Promise.resolve();
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      loading = null;
      reject(new Error("Could not load Google sign-in"));
    };
    document.head.appendChild(s);
  });
  return loading;
}

// must run inside a click handler after loadGoogle() resolved, or the popup gets blocked
export function requestGoogleAccessToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    const oauth = window.google?.accounts.oauth2;
    if (!oauth) return reject(new Error("Google sign-in is still loading, try again"));
    oauth
      .initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: "openid email profile",
        callback: (r) => (r.access_token ? resolve(r.access_token) : reject(new Error(r.error ?? "Google sign-in failed"))),
        error_callback: () => reject(new Error("Google sign-in was cancelled")),
      })
      .requestAccessToken();
  });
}
