import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Sidebar from "../components/Sidebar";

import {
  getApartments,
  getDecisions,
  createDecision,
  updateDecision,
  deleteDecision,
} from "../services/api";


const DECISION_TYPES = [
  "Kat Malikleri Kurulu",
  "Yönetim Kurulu",
  "Olağanüstü Toplantı",
  "Yönetici Kararı",
  "Diğer",
];


function Decisions() {
  const now = new Date();

  const token =
    localStorage.getItem(
      "access_token"
    );

  const today =
    now.toISOString()
      .split("T")[0];


  const [apartment, setApartment] =
    useState(null);

  const [decisions, setDecisions] =
    useState([]);

  const [year, setYear] =
    useState(
      now.getFullYear()
    );

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [
    editingDecision,
    setEditingDecision
  ] = useState(null);


  const [form, setForm] =
    useState({
      decision_number: "",
      decision_date: today,
      decision_type:
        "Kat Malikleri Kurulu",
      title: "",
      description: "",
      notes: "",
    });


  useEffect(() => {

    async function loadApartment() {

      try {
        setLoading(true);
        setError("");

        if (!token) {
          setError(
            "Oturum bulunamadı. Lütfen tekrar giriş yapın."
          );
          return;
        }

        const apartments =
          await getApartments(
            token
          );

        if (
          !apartments ||
          apartments.length === 0
        ) {
          setError(
            "Henüz apartman/site oluşturulmamış."
          );

          return;
        }

        setApartment(
          apartments[0]
        );

      } catch (err) {

        setError(
          err.message
        );

      } finally {

        setLoading(false);

      }
    }

    loadApartment();

  }, [token]);


  useEffect(() => {

    if (
      !apartment?.id ||
      !token
    ) {
      return;
    }

    loadDecisions();

  }, [
    apartment,
    year,
    token,
  ]);


  async function loadDecisions(
    searchValue = search
  ) {

    if (
      !apartment?.id ||
      !token
    ) {
      return;
    }

    try {

      setLoading(true);
      setError("");

      const data =
        await getDecisions(
          token,
          apartment.id,
          year,
          searchValue
        );

      setDecisions(
        data
      );

    } catch (err) {

      setError(
        err.message
      );

    } finally {

      setLoading(false);

    }
  }


  function resetForm() {

    setForm({
      decision_number: "",
      decision_date: today,
      decision_type:
        "Kat Malikleri Kurulu",
      title: "",
      description: "",
      notes: "",
    });

    setEditingDecision(
      null
    );

    setShowForm(
      false
    );
  }


  function handleNewDecision() {

    setMessage("");
    setError("");

    setEditingDecision(
      null
    );

    setForm({
      decision_number: "",
      decision_date: today,
      decision_type:
        "Kat Malikleri Kurulu",
      title: "",
      description: "",
      notes: "",
    });

    setShowForm(
      true
    );
  }


  function handleEdit(
    decision
  ) {

    setMessage("");
    setError("");

    setEditingDecision(
      decision
    );

    setForm({
      decision_number:
        decision.decision_number
        || "",

      decision_date:
        decision.decision_date
        || today,

      decision_type:
        decision.decision_type
        || "Kat Malikleri Kurulu",

      title:
        decision.title
        || "",

      description:
        decision.description
        || "",

      notes:
        decision.notes
        || "",
    });

    setShowForm(
      true
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }


  async function handleSubmit(
    event
  ) {

    event.preventDefault();

    if (!apartment?.id) {
      setError(
        "Apartman bilgisi yüklenemedi."
      );
      return;
    }

    if (
      !form.decision_number.trim()
    ) {
      setError(
        "Karar numarası zorunludur."
      );
      return;
    }

    if (
      !form.title.trim()
    ) {
      setError(
        "Karar konusu zorunludur."
      );
      return;
    }

    if (
      !form.description.trim()
    ) {
      setError(
        "Karar metni zorunludur."
      );
      return;
    }


    try {

      setLoading(true);
      setError("");
      setMessage("");

      const payload = {

        apartment_id:
          apartment.id,

        decision_number:
          form.decision_number,

        decision_date:
          form.decision_date,

        decision_type:
          form.decision_type,

        title:
          form.title,

        description:
          form.description,

        notes:
          form.notes,
      };


      if (
        editingDecision
      ) {

        await updateDecision(
          token,
          editingDecision.id,
          payload
        );

        setMessage(
          "Karar başarıyla güncellendi."
        );

      } else {

        await createDecision(
          token,
          payload
        );

        setMessage(
          "Karar başarıyla kaydedildi."
        );
      }


      resetForm();

      await loadDecisions();

    } catch (err) {

      setError(
        err.message
      );

    } finally {

      setLoading(false);

    }
  }


  async function handleDelete(
    decision
  ) {

    const confirmed =
      window.confirm(
        `${decision.decision_number} numaralı kararı silmek istediğinize emin misiniz?`
      );

    if (!confirmed) {
      return;
    }


    try {

      setError("");
      setMessage("");

      await deleteDecision(
        token,
        decision.id
      );

      setMessage(
        "Karar başarıyla silindi."
      );

      await loadDecisions();

    } catch (err) {

      setError(
        err.message
      );

    }
  }


  function handleSearch(
    event
  ) {

    event.preventDefault();

    loadDecisions(
      search
    );
  }


  function formatDate(
    value
  ) {

    if (!value) {
      return "-";
    }

    const [
      yearValue,
      monthValue,
      dayValue,
    ] = value.split("-");

    return (
      `${dayValue}.` +
      `${monthValue}.` +
      `${yearValue}`
    );
  }


  const sortedDecisions =
    useMemo(
      () => decisions,
      [decisions]
    );


  return (

    <div className="app-layout">

      <Sidebar
        active="decisions"
      />


      <main className="main-content">

        <div className="page-header">

          <div>

            <h1>
              Karar Defteri
            </h1>

            <p>
              Apartman ve site
              yönetiminde alınan
              kararları kayıt altında
              tutun.
            </p>

          </div>


          <div className="decision-header-actions">

            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                window.print()
              }
            >
              🖨️ Yazdır
            </button>


            <button
              type="button"
              className="primary-button"
              onClick={
                handleNewDecision
              }
            >
              + Yeni Karar
            </button>

          </div>

        </div>


        {apartment && (

          <div className="page-apartment-info">

            <strong>
              {apartment.name}
            </strong>

          </div>

        )}


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


        {showForm && (

          <div className="content-card decision-form-card">

            <div className="decision-form-header">

              <div>

                <h2>

                  {editingDecision
                    ? "Kararı Düzenle"
                    : "Yeni Karar Ekle"}

                </h2>

                <p>
                  Karar defterine
                  kaydedilecek bilgileri
                  eksiksiz girin.
                </p>

              </div>


              <button
                type="button"
                className="decision-close-button"
                onClick={
                  resetForm
                }
              >
                ✕
              </button>

            </div>


            <form
              className="decision-form"
              onSubmit={
                handleSubmit
              }
            >

              <div className="form-group">

                <label>
                  Karar No
                </label>

                <input
                  type="text"
                  required
                  value={
                    form.decision_number
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,

                      decision_number:
                        e.target.value,
                    })
                  }
                  placeholder="Örn: 2026/01"
                />

              </div>


              <div className="form-group">

                <label>
                  Karar Tarihi
                </label>

                <input
                  type="date"
                  required
                  value={
                    form.decision_date
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,

                      decision_date:
                        e.target.value,
                    })
                  }
                />

              </div>


              <div className="form-group">

                <label>
                  Karar Türü
                </label>

                <select
                  value={
                    form.decision_type
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,

                      decision_type:
                        e.target.value,
                    })
                  }
                >

                  {DECISION_TYPES.map(
                    (type) => (

                      <option
                        key={type}
                        value={type}
                      >
                        {type}
                      </option>

                    )
                  )}

                </select>

              </div>


              <div className="form-group decision-title-field">

                <label>
                  Karar Konusu
                </label>

                <input
                  type="text"
                  required
                  value={
                    form.title
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,

                      title:
                        e.target.value,
                    })
                  }
                  placeholder="Kararın konusu"
                />

              </div>


              <div className="form-group decision-full-field">

                <label>
                  Karar Metni
                </label>

                <textarea
                  required
                  rows="7"
                  value={
                    form.description
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,

                      description:
                        e.target.value,
                    })
                  }
                  placeholder="Alınan kararı detaylı olarak yazın..."
                />

              </div>


              <div className="form-group decision-full-field">

                <label>
                  Notlar
                </label>

                <textarea
                  rows="3"
                  value={
                    form.notes
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,

                      notes:
                        e.target.value,
                    })
                  }
                  placeholder="Varsa ek notlar..."
                />

              </div>


              <div className="decision-form-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    resetForm
                  }
                >
                  İptal
                </button>


                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    loading
                  }
                >

                  {editingDecision
                    ? "Değişiklikleri Kaydet"
                    : "Kararı Kaydet"}

                </button>

              </div>

            </form>

          </div>

        )}


        <div className="content-card">

          <div className="decision-filter-row">

            <div>

              <h2>
                Karar Kayıtları
              </h2>

              <p>
                {decisions.length}
                {" "}
                karar görüntüleniyor
              </p>

            </div>


            <form
              className="decision-search"
              onSubmit={
                handleSearch
              }
            >

              <select
                value={year}
                onChange={(e) =>
                  setYear(
                    Number(
                      e.target.value
                    )
                  )
                }
              >

                {Array.from(
                  {
                    length: 11,
                  },
                  (_, index) => {

                    const value =
                      now.getFullYear()
                      - 5
                      + index;

                    return (

                      <option
                        key={value}
                        value={value}
                      >
                        {value}
                      </option>

                    );
                  }
                )}

              </select>


              <input
                type="search"
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Karar ara..."
              />


              <button
                type="submit"
                className="secondary-button"
              >
                Ara
              </button>

            </form>

          </div>


          {loading ? (

            <p>
              Kararlar yükleniyor...
            </p>

          ) : sortedDecisions.length ===
            0 ? (

            <div className="empty-state">

              <h3>
                Henüz karar kaydı yok.
              </h3>

              <p>
                Yeni Karar butonunu
                kullanarak ilk kararınızı
                ekleyebilirsiniz.
              </p>

            </div>

          ) : (

            <div className="decision-list">

              {sortedDecisions.map(
                (decision) => (

                  <article
                    className="decision-card"
                    key={
                      decision.id
                    }
                  >

                    <div className="decision-card-top">

                      <div className="decision-number">

                        Karar No:
                        {" "}

                        <strong>
                          {decision.decision_number}
                        </strong>

                      </div>


                      <div className="decision-card-actions">

                        <button
                          type="button"
                          className="secondary-button small-button"
                          onClick={() =>
                            handleEdit(
                              decision
                            )
                          }
                        >
                          Düzenle
                        </button>


                        <button
                          type="button"
                          className="danger-button small-button"
                          onClick={() =>
                            handleDelete(
                              decision
                            )
                          }
                        >
                          Sil
                        </button>

                      </div>

                    </div>


                    <div className="decision-meta">

                      <span>
                        📅
                        {" "}
                        {formatDate(
                          decision.decision_date
                        )}
                      </span>

                      <span>
                        📒
                        {" "}
                        {decision.decision_type}
                      </span>

                    </div>


                    <h3>
                      {decision.title}
                    </h3>


                    <div className="decision-description">

                      {decision.description}

                    </div>


                    {decision.notes && (

                      <div className="decision-notes">

                        <strong>
                          Not:
                        </strong>

                        {" "}

                        {decision.notes}

                      </div>

                    )}

                  </article>

                )
              )}

            </div>

          )}

        </div>

      </main>

    </div>
  );
}


export default Decisions;