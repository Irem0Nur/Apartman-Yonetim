import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCurrentUser,
  getApartments,
} from "../services/api";

function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [apartment, setApartment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        navigate("/");
        return;
      }

      try {
        const userData = await getCurrentUser(token);
        setUser(userData);

        const apartments = await getApartments(token);

        if (!apartments || apartments.length === 0) {
          navigate("/apartman-olustur");
          return;
        }

        setApartment(apartments[0]);
      } catch (error) {
        console.error("Dashboard yüklenemedi:", error);
        localStorage.removeItem("access_token");
        navigate("/");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [navigate]);

  function logout() {
    localStorage.removeItem("access_token");
    navigate("/");
  }

  if (loading) {
    return (
      <div className="loading">
        Yönetim paneli yükleniyor...
      </div>
    );
  }

  if (!user || !apartment) {
    return null;
  }

  return (
    <div className="app-layout">

      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">AY</div>
          <span>ApartmanYönet</span>
        </div>

        <nav className="sidebar-menu">
          <button
            className="menu-item active"
            onClick={() => navigate("/dashboard")}
          >
            🏠 Dashboard
          </button>

          <div className="menu-title">APARTMAN</div>

          <button className="menu-item">
            🏢 Apartman Bilgileri
          </button>

         <button className="menu-item" onClick={() =>  navigate("/daireler")}>
            🚪 Daireler
        </button>

      <button
  className="menu-item"
  onClick={() =>
    navigate("/kisiler")
  }
>
  👥 Kişiler
</button>

          <div className="menu-title">FİNANS</div>

          <button className="menu-item">
            💳 Aidatlar
          </button>

          <button className="menu-item">
            💰 Ödemeler
          </button>

          <button className="menu-item">
            📉 Gelir / Gider
          </button>

          <button className="menu-item">
            🏦 Kasa
          </button>

          <div className="menu-title">YÖNETİM</div>

          <button className="menu-item">
            📒 Karar Defteri
          </button>

          <button className="menu-item">
            📅 Toplantılar
          </button>

          <button className="menu-item">
            ✅ Yapılacaklar
          </button>

          <div className="menu-title">DİĞER</div>

          <button className="menu-item">
            📁 Belgeler
          </button>

          <button className="menu-item">
            📊 Raporlar
          </button>

          <button className="menu-item">
            ⚙️ Ayarlar
          </button>
        </nav>

        <div className="sidebar-footer">
          <div>
            <strong>{user.name}</strong>
            <span>Yönetici</span>
          </div>

          <button onClick={logout}>
            Çıkış
          </button>
        </div>
      </aside>

      <main className="main-content">

        <header className="topbar">
          <div>
            <h1>Dashboard</h1>

            <p>
              Apartmanınızın genel durumunu buradan takip edin.
            </p>
          </div>

          <div className="apartment-selector">
            🏢 {apartment.name}
          </div>
        </header>

        <section className="welcome-section">
          <h2>
            Hoş geldiniz, {user.name} 👋
          </h2>

          <p>
            Bugünkü apartman yönetimi özetiniz hazır.
          </p>
        </section>

        <section className="stats-grid">

          <div className="stat-card">
            <span>Bu Ay Aidat</span>
            <strong>0 TL</strong>
            <small>{apartment.unit_count || 0} daire</small>
          </div>

          <div className="stat-card">
            <span>Tahsil Edilen</span>
            <strong>0 TL</strong>
            <small>%0 tahsilat</small>
          </div>

          <div className="stat-card">
            <span>Kalan Borç</span>
            <strong>0 TL</strong>
            <small>0 borçlu daire</small>
          </div>

          <div className="stat-card">
            <span>Bu Ay Gider</span>
            <strong>0 TL</strong>
            <small>0 işlem</small>
          </div>

        </section>

        <section className="dashboard-grid">

          <div className="panel">
            <div className="panel-header">
              <h3>Aidat Durumu</h3>
              <span>%0</span>
            </div>

            <div className="progress-bar">
              <div
                className="progress-value"
                style={{ width: "0%" }}
              />
            </div>

            <div className="status-row">
              <div>
                <strong>0</strong>
                <span>Ödendi</span>
              </div>

              <div>
                <strong>0</strong>
                <span>Bekliyor</span>
              </div>

              <div>
                <strong>0</strong>
                <span>Gecikmiş</span>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3>Hızlı İşlemler</h3>
            </div>

            <div className="quick-actions">
              <button>+ Aidat Oluştur</button>
              <button>+ Ödeme Ekle</button>
              <button>+ Gider Ekle</button>
              <button>+ Karar Ekle</button>
              <button>+ Daire Ekle</button>
              <button>+ Kişi Ekle</button>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3>Son İşlemler</h3>
            </div>

            <div className="empty-dashboard-state">
              <span>📋</span>

              <strong>
                Henüz işlem bulunmuyor
              </strong>

              <p>
                Aidat, ödeme veya gider eklediğinizde
                son işlemler burada görüntülenecek.
              </p>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3>Yaklaşan İşler</h3>
            </div>

            <div className="empty-dashboard-state">
              <span>✅</span>

              <strong>
                Yaklaşan görev yok
              </strong>

              <p>
                Yeni bir yapılacak eklediğinizde
                burada görüntülenecek.
              </p>
            </div>
          </div>

        </section>

        <section className="apartment-summary">
          <div className="panel">

            <div className="panel-header">
              <h3>Apartman Bilgileri</h3>
            </div>

            <div className="apartment-info-grid">

              <div>
                <span>Apartman</span>
                <strong>{apartment.name}</strong>
              </div>

              <div>
                <span>Blok Sayısı</span>
                <strong>{apartment.block_count || 1}</strong>
              </div>

              <div>
                <span>Kat Sayısı</span>
                <strong>{apartment.floor_count || "-"}</strong>
              </div>

              <div>
                <span>Daire Sayısı</span>
                <strong>{apartment.unit_count || 0}</strong>
              </div>

              <div>
                <span>Varsayılan Aidat</span>

                <strong>
                  {Number(
                    apartment.default_due_amount || 0
                  ).toLocaleString("tr-TR")}{" "}
                  TL
                </strong>
              </div>

              <div>
                <span>Adres</span>
                <strong>{apartment.address || "-"}</strong>
              </div>

            </div>
          </div>
        </section>

      </main>

    </div>
  );
}

export default Dashboard;