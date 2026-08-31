import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getApartments,
  getUnits,
  createUnit,
  updateUnit,
  deleteUnit,
} from "../services/api";

function Units() {
  const navigate = useNavigate();

  const [apartment, setApartment] = useState(null);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);

  const [error, setError] = useState("");

  const [form, setForm] = useState({
    unit_number: "",
    block_name: "",
    floor: "",
    due_amount: "",
    is_occupied: true,
  });

  useEffect(() => {
    async function loadPage() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        navigate("/");
        return;
      }

      try {
        const apartments = await getApartments(token);

        if (!apartments || apartments.length === 0) {
          navigate("/apartman-olustur");
          return;
        }

        const selectedApartment = apartments[0];

        setApartment(selectedApartment);

        const unitData = await getUnits(
          token,
          selectedApartment.id
        );

        setUnits(unitData);
      } catch (err) {
        console.error(err);

        if (
          err.message === "Apartmanlar alınamadı" ||
          err.message.toLowerCase().includes("yetki")
        ) {
          localStorage.removeItem("access_token");
          navigate("/");
        }
      } finally {
        setLoading(false);
      }
    }

    loadPage();
  }, [navigate]);

  function openCreateModal() {
    setEditingUnit(null);

    setForm({
      unit_number: "",
      block_name: "",
      floor: "",
      due_amount: apartment?.default_due_amount || "",
      is_occupied: true,
    });

    setError("");
    setModalOpen(true);
  }

  function openEditModal(unit) {
    setEditingUnit(unit);

    setForm({
      unit_number: unit.unit_number || "",
      block_name: unit.block_name || "",
      floor: unit.floor ?? "",
      due_amount: unit.due_amount ?? "",
      is_occupied: Boolean(unit.is_occupied),
    });

    setError("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingUnit(null);
    setError("");
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function refreshUnits() {
    const token = localStorage.getItem("access_token");

    if (!token || !apartment) {
      return;
    }

    const refreshed = await getUnits(
      token,
      apartment.id
    );

    setUnits(refreshed);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const token = localStorage.getItem("access_token");

    if (!token || !apartment) {
      return;
    }

    try {
      setError("");

      const payload = {
        apartment_id: apartment.id,
        unit_number: form.unit_number.trim(),
        block_name: form.block_name.trim(),
        floor: form.floor,
        due_amount: form.due_amount,
        is_occupied: form.is_occupied,
      };

      if (editingUnit) {
        await updateUnit(
          token,
          editingUnit.id,
          payload
        );
      } else {
        await createUnit(
          token,
          payload
        );
      }

      await refreshUnits();
      closeModal();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(unitId) {
    const approved = window.confirm(
      "Bu daireyi silmek istediğinize emin misiniz?"
    );

    if (!approved) {
      return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/");
      return;
    }

    try {
      await deleteUnit(token, unitId);
      await refreshUnits();
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) {
    return (
      <div className="loading">
        Daireler yükleniyor...
      </div>
    );
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            AY
          </div>

          <span>
            ApartmanYönet
          </span>
        </div>

        <nav className="sidebar-menu">
          <button
            className="menu-item"
            onClick={() => navigate("/dashboard")}
          >
            🏠 Dashboard
          </button>

          <div className="menu-title">
            APARTMAN
          </div>

          <button className="menu-item">
            🏢 Apartman Bilgileri
          </button>

          <button className="menu-item active">
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

          <div className="menu-title">
            FİNANS
          </div>

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

          <div className="menu-title">
            YÖNETİM
          </div>

          <button className="menu-item">
            📒 Karar Defteri
          </button>

          <button className="menu-item">
            📅 Toplantılar
          </button>

          <button className="menu-item">
            ✅ Yapılacaklar
          </button>
        </nav>
      </aside>

      <main className="main-content">
        <header className="units-header">
          <div>
            <h1>
              Daireler
            </h1>

            <p>
              {apartment?.name}
            </p>
          </div>

          <button
            className="primary-button"
            onClick={openCreateModal}
          >
            + Yeni Daire
          </button>
        </header>

        <section className="units-summary">
          <div className="mini-stat">
            <span>
              Toplam Daire
            </span>

            <strong>
              {units.length}
            </strong>
          </div>

          <div className="mini-stat">
            <span>
              Dolu
            </span>

            <strong>
              {
                units.filter(
                  (unit) => unit.is_occupied
                ).length
              }
            </strong>
          </div>

          <div className="mini-stat">
            <span>
              Boş
            </span>

            <strong>
              {
                units.filter(
                  (unit) => !unit.is_occupied
                ).length
              }
            </strong>
          </div>
        </section>

        <section className="panel units-panel">
          {units.length === 0 ? (
            <div className="empty-dashboard-state">
              <span>
                🚪
              </span>

              <strong>
                Henüz daire eklenmedi
              </strong>

              <p>
                Apartmanınızdaki daireleri
                sisteme ekleyerek yönetmeye
                başlayabilirsiniz.
              </p>

              <button
                className="primary-button"
                onClick={openCreateModal}
              >
                İlk Daireyi Ekle
              </button>
            </div>
          ) : (
            <div className="units-table-wrapper">
              <table className="units-table">
                <thead>
                  <tr>
                    <th>
                      Blok
                    </th>

                    <th>
                      Daire
                    </th>

                    <th>
                      Kat
                    </th>

                    <th>
                      Aidat
                    </th>

                    <th>
                      Durum
                    </th>

                    <th>
                      İşlemler
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {units.map((unit) => (
                    <tr key={unit.id}>
                      <td>
                        <strong>
                          {unit.block_name || "-"}
                        </strong>
                      </td>

                      <td>
                        Daire {unit.unit_number}
                      </td>

                      <td>
                        {unit.floor ?? "-"}
                      </td>

                      <td>
                        {Number(
                          unit.due_amount || 0
                        ).toLocaleString("tr-TR")}{" "}
                        TL
                      </td>

                      <td>
                        <span
                          className={
                            unit.is_occupied
                              ? "status-badge occupied"
                              : "status-badge empty"
                          }
                        >
                          {unit.is_occupied
                            ? "Dolu"
                            : "Boş"}
                        </span>
                      </td>

                      <td>
                        <div className="table-actions">
                          <button
                            onClick={() =>
                              openEditModal(unit)
                            }
                          >
                            Düzenle
                          </button>

                          <button
                            className="danger-button"
                            onClick={() =>
                              handleDelete(unit.id)
                            }
                          >
                            Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h2>
                  {editingUnit
                    ? "Daireyi Düzenle"
                    : "Yeni Daire"}
                </h2>

                <p>
                  {apartment?.name}
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeModal}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="setup-row">
                <div className="form-group">
                  <label>
                    Blok Adı
                  </label>

                  <input
                    type="text"
                    name="block_name"
                    value={form.block_name}
                    onChange={handleChange}
                    placeholder="Örn. A Blok"
                  />
                </div>

                <div className="form-group">
                  <label>
                    Daire Numarası *
                  </label>

                  <input
                    type="text"
                    name="unit_number"
                    value={form.unit_number}
                    onChange={handleChange}
                    placeholder="Örn. 12"
                    required
                  />
                </div>
              </div>

              <div className="setup-row">
                <div className="form-group">
                  <label>
                    Kat
                  </label>

                  <input
                    type="number"
                    name="floor"
                    value={form.floor}
                    onChange={handleChange}
                    placeholder="Örn. 3"
                  />
                </div>

                <div className="form-group">
                  <label>
                    Aylık Aidat
                  </label>

                  <div className="money-input">
                    <input
                      type="number"
                      name="due_amount"
                      min="0"
                      step="0.01"
                      value={form.due_amount}
                      onChange={handleChange}
                      placeholder="1000"
                    />

                    <span>
                      TL
                    </span>
                  </div>
                </div>
              </div>

              <label className="checkbox-field">
                <input
                  type="checkbox"
                  name="is_occupied"
                  checked={form.is_occupied}
                  onChange={handleChange}
                />

                <span>
                  Daire şu anda dolu
                </span>
              </label>

              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeModal}
                >
                  Vazgeç
                </button>

                <button
                  type="submit"
                  className="primary-button"
                >
                  {editingUnit
                    ? "Değişiklikleri Kaydet"
                    : "Daireyi Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Units;