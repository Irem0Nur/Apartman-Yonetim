import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const THEMES = [
  { id: "indigo", label: "Mor", color: "#4f46e5" },
  { id: "emerald", label: "Yeşil", color: "#059669" },
  { id: "blue", label: "Mavi", color: "#2563eb" },
  { id: "amber", label: "Turuncu", color: "#d97706" },
  { id: "rose", label: "Pembe", color: "#e11d48" },
];

const THEME_STORAGE_KEY = "app_theme";

function Sidebar({ active }) {
  const navigate = useNavigate();

  const [theme, setTheme] = useState(
    () => localStorage.getItem(THEME_STORAGE_KEY) || "indigo"
  );

  // Sayfa her açıldığında (ve tema her değiştiğinde)
  // seçili temayı <html> etiketine uygula.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  function handleLogout() {
    localStorage.removeItem("access_token");

    navigate("/", {
      replace: true,
    });
  }

  function menuClass(name) {
    return active === name
      ? "menu-item active"
      : "menu-item";
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          AY
        </div>

        <span>ApartmanYönet</span>
      </div>

      <nav className="sidebar-menu">

        <button
          className={menuClass("dashboard")}
          onClick={() => navigate("/dashboard")}
        >
          🏠 Dashboard
        </button>

        <div className="menu-title">
          APARTMAN
        </div>

        <button
          className={menuClass("apartment")}
          onClick={() =>
            navigate("/apartman-bilgileri")
          }
        >
          🏢 Apartman Bilgileri
        </button>

        <button
          className={menuClass("units")}
          onClick={() => navigate("/daireler")}
        >
          🚪 Daireler
        </button>

        <button
          className={menuClass("people")}
          onClick={() => navigate("/kisiler")}
        >
          👥 Kişiler
        </button>

        <div className="menu-title">
          FİNANS
        </div>

        <button
          className={menuClass("dues")}
          onClick={() => navigate("/aidatlar")}
        >
          💳 Aidatlar
        </button>

        <button
          className={menuClass("payments")}
          onClick={() => navigate("/odemeler")}
        >
          🕒 Ödemeler
        </button>

        <button
          className={menuClass("income-expense")}
          onClick={() =>
            navigate("/gelir-gider")
          }
        >
          📉 Gelir / Gider
        </button>

        <button
          className={menuClass("cash")}
          onClick={() =>
            navigate("/kasa")
          }
        >
          🏦 Kasa
        </button>

        <div className="menu-title">
          YÖNETİM
        </div>

      <button
        className={menuClass("decisions")}
        onClick={() =>
        navigate("/karar-defteri")
       }
      >
      📒 Karar Defteri
      </button>

      <button
  className="menu-item"
  onClick={() =>
    navigate("/isletme-defteri")
  }
>
  📒 İşletme Defteri
</button>

      <button
         className={menuClass("meetings")}
         onClick={() =>
      navigate("/toplantilar")
     }
>
      📅 Toplantılar
      </button>

      </nav>

      <div className="theme-picker">
        <span className="theme-picker-label">Tema</span>

        <div className="theme-picker-dots">
          {THEMES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={
                theme === item.id
                  ? "theme-dot active"
                  : "theme-dot"
              }
              style={{ backgroundColor: item.color }}
              title={item.label}
              aria-label={item.label}
              onClick={() => setTheme(item.id)}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        className="logout-button"
        onClick={handleLogout}
      >
        <span>🚪</span>
        <span>Oturumdan Çık</span>
      </button>

    </aside>
  );
}

export default Sidebar;