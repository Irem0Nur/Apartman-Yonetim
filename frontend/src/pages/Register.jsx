import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../services/api";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (password !== passwordAgain) {
      setError("Şifreler eşleşmiyor");
      return;
    }

    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır");
      return;
    }

    try {
      setLoading(true);

      await register(name, email, password);

      navigate("/");
    } catch (err) {
      setError(err.message);
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

        <h1>Yönetici Hesabı Oluştur</h1>

        <p className="subtitle">
          Apartmanınızı dijital olarak yönetmeye başlayın
        </p>

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label>Ad Soyad</label>

            <input
              type="text"
              placeholder="Örn. Ahmet Yılmaz"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>E-posta</label>

            <input
              type="email"
              placeholder="yonetici@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Şifre</label>

            <input
              type="password"
              placeholder="En az 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Şifre Tekrar</label>

            <input
              type="password"
              placeholder="Şifrenizi tekrar girin"
              value={passwordAgain}
              onChange={(e) => setPasswordAgain(e.target.value)}
              required
            />
          </div>

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
              ? "Hesap oluşturuluyor..."
              : "Hesap Oluştur"}
          </button>

        </form>

        <div className="register-link">
          Zaten hesabınız var mı?{" "}
          <Link to="/">
            Giriş yap
          </Link>
        </div>

      </div>
    </div>
  );
}

export default Register;