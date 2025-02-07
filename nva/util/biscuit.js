import Cookies from "js-cookie";

export const getAccessToken = async () => {
    const accessToken = Cookies.get("access_token");
    const refreshToken = Cookies.get("refresh_token");
  
    if (accessToken) {
      // Si l'access_token est disponible, le retourner directement
      return accessToken;
    }
  
    if (refreshToken) {
      // Si l'access_token n'existe pas, essayer d'utiliser le refresh_token
      try {
        const response = await fetch(`${apiUrl}/token/refresh/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            refresh: refreshToken,
          }),
        });
  
        if (!response.ok) {
          throw new Error("Échec du rafraîchissement du token.");
        }
  
        const data = await response.json();
  
        // Stocker le nouveau access_token dans les cookies
        Cookies.set("access_token", data.access, { secure: true, httpOnly: false });
  
        // Retourner le nouveau access_token
        return data.access;
      } catch (err) {
        console.error("Erreur lors du rafraîchissement du token :", err);
        // Gérer l'erreur, comme rediriger l'utilisateur vers la page de login
        return null;
      }
    }
  
    // Si ni l'access_token ni le refresh_token n'existent, retourner null
    return null;
  };
  export const setCookies = (data) => {
    // Définir la durée de vie du access_token à 5 minutes (1/288 jour)
    Cookies.set("access_token", data.access_token, {
      secure: true,
      httpOnly: false,
      expires: 1 , // 5 minutes
    });
  
    // Définir la durée de vie du refresh_token à 1 journée
    Cookies.set("refresh_token", data.refresh_token, {
      secure: true,
      httpOnly: false,
      expires: 1, // 1 jour
    });
  };