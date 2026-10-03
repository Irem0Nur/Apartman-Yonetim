import { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  forgotPassword,
} from "../services/api";


function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    const cleanEmail =
      email.trim().toLowerCase();

    if (!cleanEmail) {
      setError(
        "E-posta adresinizi girin."
      );
      return;
    }

    try {
      setLoading(true);

      await forgotPassword(
        cleanEmail
      );

      navigate(
        `/sifre-sifirla?email=${encodeURIComponent(cleanEmail)}`,
        {
          replace: true,
        }
      );

    } catch (err) {
      setError(
        err.message ||
        "Şifre sıfırlama kodu gönderilemedi."
      );

    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="auth-page">

      <div className="auth-card">

        <div className="logo">
          AY
        </div>

        <h1>
          Şifremi Unuttum
        </h1>

        <p className="subtitle">
          E-posta adresinizi girin, size şifre
          sıfırlama kodu gönderelim.
        </p>


        <form
          onSubmit={handleSubmit}
        >

          <div className="form-group">

            <label>
              E-posta
            </label>

            <input
              type="email"
              placeholder="yonetici@example.com"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
              autoComplete="email"
              autoFocus
              required
            />

          </div>


          {error && (
            <div className="error-message">
              {error}
            </div>
          )}


          <button
            className="login-button"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Gönderiliyor..."
              : "Sıfırlama Kodu Gönder"}
          </button>

        </form>


        <div className="register-link">

          <Link to="/">
            ← Giriş ekranına dön
          </Link>

        </div>

      </div>

    </div>
  );
}


export default ForgotPassword;
