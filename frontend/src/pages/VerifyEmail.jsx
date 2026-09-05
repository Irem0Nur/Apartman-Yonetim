import { useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  verifyEmail,
  resendVerification,
} from "../services/api";


function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const email =
    searchParams.get("email") || "";

  const [code, setCode] =
    useState("");

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [resending, setResending] =
    useState(false);


  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!email) {
      setError(
        "Doğrulanacak e-posta adresi bulunamadı."
      );
      return;
    }

    if (code.length !== 6) {
      setError(
        "Lütfen 6 haneli doğrulama kodunu girin."
      );
      return;
    }

    try {
      setLoading(true);

      const data = await verifyEmail(
        email,
        code
      );

      localStorage.setItem(
        "access_token",
        data.access_token
      );

      navigate(
        "/apartman-olustur",
        {
          replace: true,
        }
      );

    } catch (err) {
      setError(err.message);

    } finally {
      setLoading(false);
    }
  }


  async function handleResend() {
    if (!email) {
      setError(
        "E-posta adresi bulunamadı."
      );
      return;
    }

    try {
      setResending(true);
      setError("");
      setMessage("");

      const data =
        await resendVerification(
          email
        );

      setMessage(
        data.message ||
        "Yeni doğrulama kodu gönderildi."
      );

    } catch (err) {
      setError(err.message);

    } finally {
      setResending(false);
    }
  }


  return (
    <div className="auth-page">

      <div className="auth-card verify-card">

        <div className="logo">
          AY
        </div>


        <div className="verify-icon">
          ✉
        </div>


        <h1>
          E-postanı Doğrula
        </h1>


        <p className="subtitle verify-subtitle">
          Hesabını kullanmaya başlamak için
          e-posta adresine gönderdiğimiz
          6 haneli doğrulama kodunu gir.
        </p>


        <div className="verify-email-box">

          <span className="verify-email-label">
            Doğrulama kodu gönderildi
          </span>

          <strong>
            {email}
          </strong>

        </div>


        <form
          onSubmit={handleSubmit}
        >

          <div className="form-group">

            <label>
              Doğrulama Kodu
            </label>

            <input
              className="verification-code-input"
              type="text"
              value={code}
              maxLength={6}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              onChange={(event) => {
                const value =
                  event.target.value.replace(
                    /\D/g,
                    ""
                  );

                setCode(value);
              }}
              autoFocus
            />

          </div>


          <div className="verification-info">

            <span>
              ⏱
            </span>

            <p>
              Doğrulama kodunun geçerlilik
              süresi 10 dakikadır.
            </p>

          </div>


          {error && (

            <div className="error-message">
              {error}
            </div>

          )}


          {message && (

            <div className="success-message">
              {message}
            </div>

          )}


          <button
            type="submit"
            className="login-button"
            disabled={
              loading ||
              code.length !== 6
            }
          >

            {loading
              ? "Doğrulanıyor..."
              : "E-postayı Doğrula"}

          </button>

        </form>


        <div className="verify-resend">

          <span>
            Kod gelmedi mi?
          </span>

          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="resend-button"
          >

            {resending
              ? "Gönderiliyor..."
              : "Kodu tekrar gönder"}

          </button>

        </div>


        <div className="register-link">

          <Link to="/">
            ← Giriş ekranına dön
          </Link>

        </div>

      </div>

    </div>
  );
}


export default VerifyEmail;