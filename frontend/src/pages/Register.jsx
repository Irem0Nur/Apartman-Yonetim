import {
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  register,
} from "../services/api";


function Register() {
  const navigate =
    useNavigate();

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [
    password,
    setPassword
  ] = useState("");

  const [
    passwordAgain,
    setPasswordAgain
  ] = useState("");

  const [
    showPassword,
    setShowPassword
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    setError("");

    const cleanName =
      name.trim();

    const cleanEmail =
      email.trim().toLowerCase();


    if (!cleanName) {
      setError(
        "Ad soyad alanını doldurun."
      );
      return;
    }


    if (!cleanEmail) {
      setError(
        "E-posta adresinizi girin."
      );
      return;
    }


    if (password.length < 8) {
      setError(
        "Şifre en az 8 karakter olmalıdır."
      );
      return;
    }


    if (
      !/[A-Za-zÇĞİÖŞÜçğıöşü]/
        .test(password)
    ) {
      setError(
        "Şifre en az bir harf içermelidir."
      );
      return;
    }


    if (!/\d/.test(password)) {
      setError(
        "Şifre en az bir rakam içermelidir."
      );
      return;
    }


    if (
      password !==
      passwordAgain
    ) {
      setError(
        "Şifreler eşleşmiyor."
      );
      return;
    }


    try {
      setLoading(true);

      await register(
        cleanName,
        cleanEmail,
        password
      );

      /*
       * Kayıt başarılı oldu.
       * Henüz token kaydetmiyoruz.
       *
       * Kullanıcı önce e-posta
       * doğrulama kodunu girecek.
       */
      navigate(
        `/email-dogrula?email=${encodeURIComponent(
          cleanEmail
        )}`,
        {
          replace: true,
        }
      );

    } catch (err) {
      setError(
        err.message
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
          Yönetici Hesabı Oluştur
        </h1>


        <p className="subtitle">
          Apartmanınızı dijital
          olarak yönetmeye başlayın
        </p>


        <form
          onSubmit={
            handleSubmit
          }
        >

          <div className="form-group">

            <label>
              Ad Soyad
            </label>

            <input
              type="text"
              placeholder="Örn. Ahmet Yılmaz"
              value={name}
              onChange={(e) =>
                setName(
                  e.target.value
                )
              }
              autoComplete="name"
              required
            />

          </div>


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
              placeholder="En az 8 karakter"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              autoComplete="new-password"
              required
            />

          </div>


          <div className="password-help">

            Şifreniz en az 8
            karakter, 1 harf ve
            1 rakam içermelidir.

          </div>


          <div className="form-group">

            <label>
              Şifre Tekrar
            </label>

            <input
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              placeholder="Şifrenizi tekrar girin"
              value={
                passwordAgain
              }
              onChange={(e) =>
                setPasswordAgain(
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
              checked={
                showPassword
              }
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


          {error && (

            <div className="error-message">
              {error}
            </div>

          )}


          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >

            {loading
              ? "Doğrulama kodu gönderiliyor..."
              : "Hesap Oluştur"}

          </button>

        </form>


        <div className="register-link">

          Zaten hesabınız var mı?
          {" "}

          <Link to="/">
            Giriş yap
          </Link>

        </div>

      </div>

    </div>
  );
}


export default Register;