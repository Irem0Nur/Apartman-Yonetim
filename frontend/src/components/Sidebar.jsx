import { useNavigate } from "react-router-dom";

function Sidebar({ active }) {
  const navigate = useNavigate();

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
          className={`menu-item ${
           active === "payments" ? "active" : ""
         }`}
        onClick={() => navigate("/odemeler")}
>
          🕒 Ödemeler
        </button>
          
        

        <button
          className={menuClass("income-expense")}
          disabled
          title="Yakında eklenecek"
        >
          📉 Gelir / Gider
        </button>

        <button
          className={menuClass("cash")}
          disabled
          title="Yakında eklenecek"
        >
          🏦 Kasa
        </button>

        <div className="menu-title">
          YÖNETİM
        </div>

        <button
          className={menuClass("decisions")}
          disabled
          title="Yakında eklenecek"
        >
          📒 Karar Defteri
        </button>

        <button
          className={menuClass("meetings")}
          disabled
          title="Yakında eklenecek"
        >
          📅 Toplantılar
        </button>

        <button
          className={menuClass("tasks")}
          disabled
          title="Yakında eklenecek"
        >
          ✅ Yapılacaklar
        </button>

      </nav>
    </aside>
  );
}

export default Sidebar;