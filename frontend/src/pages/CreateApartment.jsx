import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createApartment } from "../services/api";

function CreateApartment() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    address: "",
    block_count: 1,
    floor_count: "",
    unit_count: "",
    default_due_amount: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/");
      return;
    }

    try {
      setLoading(true);

      await createApartment(token, {
        name: form.name,
        address: form.address,
        block_count: Number(form.block_count),
        floor_count: Number(form.floor_count),
        unit_count: Number(form.unit_count),
        default_due_amount: Number(form.default_due_amount),
      });

      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="create-apartment-page">
      <div className="create-apartment-card">

        <div className="setup-logo">AY</div>

        <div className="setup-heading">
          <span>Başlangıç Ayarları</span>
          <h1>İlk apartmanınızı oluşturun</h1>

          <p>
            Yönetim panelinizi kullanmaya başlamak için
            apartmanınızın temel bilgilerini girin.
          </p>
        </div>

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label>Apartman Adı *</label>

            <input
              name="name"
              type="text"
              placeholder="Örn. Güneş Apartmanı"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Adres</label>

            <textarea
              name="address"
              placeholder="Apartmanın açık adresi"
              value={form.address}
              onChange={handleChange}
              rows="3"
            />
          </div>

          <div className="setup-row">
            <div className="form-group">
              <label>Blok Sayısı</label>

              <input
                name="block_count"
                type="number"
                min="1"
                value={form.block_count}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Kat Sayısı</label>

              <input
                name="floor_count"
                type="number"
                min="0"
                placeholder="5"
                value={form.floor_count}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="setup-row">
            <div className="form-group">
              <label>Daire Sayısı</label>

              <input
                name="unit_count"
                type="number"
                min="0"
                placeholder="20"
                value={form.unit_count}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Aylık Aidat</label>

              <div className="money-input">
                <input
                  name="default_due_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="1500"
                  value={form.default_due_amount}
                  onChange={handleChange}
                />

                <span>TL</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            className="setup-button"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Apartman oluşturuluyor..."
              : "Apartmanı Oluştur"}
          </button>

        </form>

        <div className="setup-note">
          Bu bilgileri daha sonra Apartman Bilgileri
          bölümünden değiştirebilirsiniz.
        </div>

      </div>
    </div>
  );
}

export default CreateApartment;