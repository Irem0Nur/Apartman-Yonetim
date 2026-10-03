import { useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  forgotPassword,
  resetPassword,
} from "../services/api";


function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const email =
    searchParams.get("email") || "";

  const [code, setCode] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

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
        "Sıfırlanacak e-posta adresi bulunamadı."
      );
      return;
    }

    if (code.length !== 6) {
      setError(
        "Lütfen 6 haneli doğrulama kodunu girin."
      );
      return;
    }

    if (newPassword.length < 6) {
      setError(
        "Şifre en az 6 karakter olmalıdır."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(
        "Şifreler birbiriyle uyuşmuyor."
      );
      return;
    }

    try {
      setLoading(true);

      await resetPassword(
        email,
        code,
        newPassword
      );

      navigate(
        "/",
        {
          replace: true,
          state: {
            resetSuccess: true,
          },
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

      await forgotPassword(
        email
      );

      setMessage(
        "Yeni şifre sıfırlama kodu gönderildi."
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
          🔑
        </div>


        <h1>
          Şifreni Sıfırla
        </h1>


        <p className="subtitle verify-subtitle">
          E-posta adresine gönderdiğimiz 6 haneli
          kodu ve yeni şifreni gir.
        </p>


        <div className="verify-email-box">

          <span className="verify-email-label">
            Sıfırlama kodu gönderildi
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


          <div className="form-group">

            <label>
              Yeni Şifre
            </label>

            <input
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              placeholder="Yeni şifrenizi girin"
              value={newPassword}
              onChange={(e) =>
                setNewPassword(
                  e.target.value
                )
              }
              autoComplete="new-password"
              required
            />

          </div>


          <div className="form-group">

            <label>
              Yeni Şifre (Tekrar)
            </label>

            <input
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              placeholder="Yeni şifrenizi tekrar girin"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(
                  e.target.value
                )
              }
              autoComplete="new-password"
              required
            />

          </div>


          <label className="show-password-row">

            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) =>
                setShowPassword(
                  e.target.checked
                )
              }
            />

            <span>
              Şifreleri göster
            </span>

          </label>


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
              ? "Sıfırlanıyor..."
              : "Şifreyi Sıfırla"}

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


export default ResetPassword;
