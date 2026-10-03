import { useState } from "react";
import {
  useNavigate,
  useLocation,
  Link,
} from "react-router-dom";

import {
  login,
  getApartments,
} from "../services/api";


function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message] =
    useState(
      location.state?.resetSuccess
        ? "Şifreniz başarıyla güncellendi. Yeni şifrenizle giriş yapabilirsiniz."
        : ""
    );

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

    if (!password) {
      setError(
        "Şifrenizi girin."
      );
      return;
    }

    try {
      setLoading(true);

      /*
       * Burada gerçek giriş isteği
       * backend'e gönderilir.
       */
      const data =
        await login(
          cleanEmail,
          password
        );

      /*
       * Login başarılı olmadan
       * token kaydedilmez.
       */
      localStorage.setItem(
        "access_token",
        data.access_token
      );

      /*
       * Kullanıcının kendisine ait
       * apartmanı var mı kontrol ediyoruz.
       */
      const apartments =
        await getApartments(
          data.access_token
        );

      if (
        Array.isArray(apartments) &&
        apartments.length > 0
      ) {
        navigate(
          "/dashboard",
          {
            replace: true,
          }
        );
      } else {
        navigate(
          "/apartman-olustur",
          {
            replace: true,
          }
        );
      }

    } catch (err) {
      /*
       * Başarısız girişte varsa eski
       * token da temizlenir.
       */
      localStorage.removeItem(
        "access_token"
      );

      setError(
        err.message ||
        "Giriş yapılamadı."
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
          ApartmanYönet
        </h1>

        <p className="subtitle">
          Apartmanınızı kolayca yönetin
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
              required
            />

          </div>


          <div className="form-group">

            <label>
              Şifre
            </label>

            <input
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              placeholder="Şifrenizi girin"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              autoComplete="current-password"
              required
            />

          </div>


          <div className="login-options-row">

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
                Şifreyi göster
              </span>

            </label>

            <Link
              to="/sifremi-unuttum"
              className="forgot-password-link"
            >
              Şifremi unuttum
            </Link>

          </div>


          {message && (
            <div className="success-message">
              {message}
            </div>
          )}


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
              ? "Giriş yapılıyor..."
              : "Giriş Yap"}
          </button>

        </form>


        <div className="register-link">

          Hesabınız yok mu?
          {" "}

          <Link to="/register">
            Yönetici hesabı oluştur
          </Link>

        </div>

      </div>

    </div>
  );
}


export default Login;