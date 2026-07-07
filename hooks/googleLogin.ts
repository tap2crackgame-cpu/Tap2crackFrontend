import { useCallback, useState } from "react";


export function useGoogleAuth() {
  const [loading, setLoading] = useState(false);

  const login = useCallback(() => {
    setLoading(true);

    const clientId =
      process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
      "766084167251-dk65biv9ur2jqh699o4au44jp8ppgru4.apps.googleusercontent.com";

    const finalRedirectUri = window.location.origin;
    
    console.log("Redirect URI being sent to Google:", finalRedirectUri);

    const scope = "openid email profile";

    const url =
      "https://accounts.google.com/o/oauth2/v2/auth" +
      `?client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(finalRedirectUri)}` + 
      `&response_type=code` + 
      `&scope=${encodeURIComponent(scope)}` +
      `&access_type=offline` +
      `&prompt=consent`;

    window.location.href = url;
  }, []);

  return { login, loading };
}