import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../services/api";

function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    async function checkAuthentication() {
      const token = localStorage.getItem("access_token");

      // Geçersiz token değerlerini de temizle
      if (
        !token ||
        token === "null" ||
        token === "undefined" ||
        token.trim() === ""
      ) {
        localStorage.removeItem("access_token");
        setAuthenticated(false);
        setLoading(false);
        return;
      }

      try {
        await getCurrentUser(token);
        setAuthenticated(true);
      } catch (error) {
        console.error("Oturum kontrolü:", error);

        localStorage.removeItem("access_token");
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    }

    checkAuthentication();
  }, []);

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  if (!authenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;