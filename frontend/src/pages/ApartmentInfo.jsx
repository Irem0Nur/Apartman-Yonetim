import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import Sidebar from "../components/Sidebar";

import {
  getApartments,
  updateApartment,
} from "../services/api";


function formatMoney(value) {
  return Number(
    value || 0
  ).toLocaleString(
    "tr-TR",
    {
      maximumFractionDigits: 2,
    }
  );
}


function ApartmentInfo() {
  const navigate =
    useNavigate();

  const token =
    localStorage.getItem(
      "access_token"
    );

  const [
    apartment,
    setApartment
  ] = useState(null);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    saving,
    setSaving
  ] = useState(false);

  const [
    editing,
    setEditing
  ] = useState(false);

  const [
    error,
    setError
  ] = useState("");

  const [
    message,
    setMessage
  ] = useState("");

  const [
    form,
    setForm
  ] = useState({
    name: "",
    address: "",
    block_count: 1,
    floor_count: 0,
    unit_count: 0,
    default_due_amount: 0,
  });


  useEffect(() => {
    async function loadApartment() {
      if (!token) {
        navigate("/");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const apartments =
          await getApartments(
            token
          );

        if (
          !apartments?.length
        ) {
          navigate(
            "/apartman-olustur"
          );

          return;
        }

        const selected =
          apartments[0];

        setApartment(
          selected
        );

        setForm({
          name:
            selected.name || "",

          address:
            selected.address || "",

          block_count:
            selected.block_count ?? 1,

          floor_count:
            selected.floor_count ?? 0,

          unit_count:
            selected.unit_count ?? 0,

          default_due_amount:
            selected.default_due_amount ??
            0,
        });

      } catch (err) {
        console.error(
          err
        );

        setError(
          err.message ||
          "Apartman bilgileri alınamadı."
        );

      } finally {
        setLoading(
          false
        );
      }
    }

    loadApartment();

  }, [
    navigate,
    token,
  ]);


  function handleEdit() {
    if (!apartment) {
      return;
    }

    setError("");
    setMessage("");

    setForm({
      name:
        apartment.name || "",

      address:
        apartment.address || "",

      block_count:
        apartment.block_count ?? 1,

      floor_count:
        apartment.floor_count ?? 0,

      unit_count:
        apartment.unit_count ?? 0,

      default_due_amount:
        apartment.default_due_amount ??
        0,
    });

    setEditing(
      true
    );
  }


  function handleCancel() {
    setEditing(
      false
    );

    setError("");

    if (!apartment) {
      return;
    }

    setForm({
      name:
        apartment.name || "",

      address:
        apartment.address || "",

      block_count:
        apartment.block_count ?? 1,

      floor_count:
        apartment.floor_count ?? 0,

      unit_count:
        apartment.unit_count ?? 0,

      default_due_amount:
        apartment.default_due_amount ??
        0,
    });
  }


  function handleChange(
    event
  ) {
    const {
      name,
      value,
    } = event.target;

    setForm(
      (prev) => ({
        ...prev,

        [name]:
          value,
      })
    );
  }


  async function handleSave(
    event
  ) {
    event.preventDefault();

    if (
      !apartment?.id
    ) {
      return;
    }

    if (
      !form.name.trim()
    ) {
      setError(
        "Apartman / site adı zorunludur."
      );

      return;
    }

    try {
      setSaving(
        true
      );

      setError("");
      setMessage("");

      const payload = {
        name:
          form.name.trim(),

        address:
          form.address.trim(),

        block_count:
          Number(
            form.block_count
          ),

        floor_count:
          Number(
            form.floor_count
          ),

        unit_count:
          Number(
            form.unit_count
          ),

        default_due_amount:
          Number(
            form.default_due_amount
          ),
      };

      const result =
        await updateApartment(
          token,
          apartment.id,
          payload
        );

      setApartment(
        result.apartment
      );

      setForm({
        name:
          result.apartment.name || "",

        address:
          result.apartment.address ||
          "",

        block_count:
          result.apartment.block_count ??
          1,

        floor_count:
          result.apartment.floor_count ??
          0,

        unit_count:
          result.apartment.unit_count ??
          0,

        default_due_amount:
          result.apartment
            .default_due_amount ?? 0,
      });

      setEditing(
        false
      );

      setMessage(
        "Apartman bilgileri başarıyla güncellendi."
      );

    } catch (err) {
      setError(
        err.message
      );

    } finally {
      setSaving(
        false
      );
    }
  }


  if (loading) {
    return (
      <div className="loading">
        Apartman bilgileri
        yükleniyor...
      </div>
    );
  }


  return (
    <div className="app-layout">

      <Sidebar
        active="apartment"
      />


      <main className="main-content">

        <header className="units-header">

          <div>

            <h1>
              Apartman Bilgileri
            </h1>

            <p>
              Site veya apartmanınıza
              ait temel bilgiler
            </p>

          </div>


          {!editing && apartment && (

            <button
              type="button"
              className="primary-button"
              onClick={
                handleEdit
              }
            >
              ✏️ Düzenle
            </button>

          )}

        </header>


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


        {apartment && !editing && (

          <section className="panel">

            <div className="apartment-info-grid">

              <div className="apartment-info-item">

                <span>
                  Apartman / Site Adı
                </span>

                <strong>
                  {apartment.name ||
                    "-"}
                </strong>

              </div>


              <div className="apartment-info-item">

                <span>
                  Adres
                </span>

                <strong>
                  {apartment.address ||
                    "-"}
                </strong>

              </div>


              <div className="apartment-info-item">

                <span>
                  Blok Sayısı
                </span>

                <strong>
                  {apartment.block_count ??
                    "-"}
                </strong>

              </div>


              <div className="apartment-info-item">

                <span>
                  Kat Sayısı
                </span>

                <strong>
                  {apartment.floor_count ??
                    "-"}
                </strong>

              </div>


              <div className="apartment-info-item">

                <span>
                  Tanımlı Daire Sayısı
                </span>

                <strong>
                  {apartment.unit_count ??
                    "-"}
                </strong>

              </div>


              <div className="apartment-info-item">

                <span>
                  Varsayılan Aidat
                </span>

                <strong>
                  {formatMoney(
                    apartment
                      .default_due_amount
                  )}
                  {" "}
                  TL
                </strong>

              </div>

            </div>

          </section>

        )}


        {apartment && editing && (

          <section className="panel">

            <form
              className="apartment-edit-form"
              onSubmit={
                handleSave
              }
            >

              <div className="apartment-edit-grid">

                <div className="form-group">

                  <label>
                    Apartman / Site Adı
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={
                      form.name
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />

                </div>


                <div className="form-group">

                  <label>
                    Adres
                  </label>

                  <input
                    type="text"
                    name="address"
                    value={
                      form.address
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Blok Sayısı
                  </label>

                  <input
                    type="number"
                    name="block_count"
                    min="1"
                    value={
                      form.block_count
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Kat Sayısı
                  </label>

                  <input
                    type="number"
                    name="floor_count"
                    min="0"
                    value={
                      form.floor_count
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Tanımlı Daire Sayısı
                  </label>

                  <input
                    type="number"
                    name="unit_count"
                    min="0"
                    value={
                      form.unit_count
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Varsayılan Aidat
                  </label>

                  <input
                    type="number"
                    name="default_due_amount"
                    min="0"
                    step="0.01"
                    value={
                      form.default_due_amount
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

              </div>


              <div className="apartment-edit-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    handleCancel
                  }
                  disabled={
                    saving
                  }
                >
                  İptal
                </button>


                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    saving
                  }
                >
                  {saving
                    ? "Kaydediliyor..."
                    : "Değişiklikleri Kaydet"}
                </button>

              </div>

            </form>

          </section>

        )}

      </main>

    </div>
  );
}


export default ApartmentInfo;