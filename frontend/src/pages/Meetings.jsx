import {
  useEffect,
  useState,
} from "react";

import Sidebar from "../components/Sidebar";

import {
  getApartments,
  getMeetings,
  createMeeting,
  updateMeeting,
  deleteMeeting,
} from "../services/api";


const MEETING_TYPES = [
  "Olağan Toplantı",
  "Olağanüstü Toplantı",
  "Yönetim Kurulu",
  "Kat Malikleri Kurulu",
  "Diğer",
];


const STATUS_OPTIONS = [
  {
    value: "planned",
    label: "Planlandı",
  },
  {
    value: "completed",
    label: "Tamamlandı",
  },
  {
    value: "cancelled",
    label: "İptal Edildi",
  },
];


function Meetings() {
  const now =
    new Date();

  const token =
    localStorage.getItem(
      "access_token"
    );

  const defaultDate =
    new Date(
      now.getTime()
      - now.getTimezoneOffset()
      * 60000
    )
      .toISOString()
      .slice(0, 16);


  const [apartment, setApartment] =
    useState(null);

  const [meetings, setMeetings] =
    useState([]);

  const [year, setYear] =
    useState(
      now.getFullYear()
    );

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
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
    editingMeeting,
    setEditingMeeting
  ] = useState(null);


  const [form, setForm] =
    useState({
      title: "",
      meeting_type:
        "Olağan Toplantı",
      meeting_date:
        defaultDate,
      location: "",
      agenda: "",
      notes: "",
      status: "planned",
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

    loadMeetings();

  }, [
    apartment,
    year,
    statusFilter,
    token,
  ]);


  async function loadMeetings(
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
        await getMeetings(
          token,
          apartment.id,
          year,
          searchValue,
          statusFilter
        );

      setMeetings(
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
      title: "",
      meeting_type:
        "Olağan Toplantı",
      meeting_date:
        defaultDate,
      location: "",
      agenda: "",
      notes: "",
      status: "planned",
    });

    setEditingMeeting(
      null
    );

    setShowForm(
      false
    );
  }


  function handleNewMeeting() {
    setError("");
    setMessage("");

    setEditingMeeting(
      null
    );

    setForm({
      title: "",
      meeting_type:
        "Olağan Toplantı",
      meeting_date:
        defaultDate,
      location: "",
      agenda: "",
      notes: "",
      status: "planned",
    });

    setShowForm(
      true
    );
  }


  function handleEdit(meeting) {
    setError("");
    setMessage("");

    setEditingMeeting(
      meeting
    );

    setForm({
      title:
        meeting.title || "",

      meeting_type:
        meeting.meeting_type ||
        "Olağan Toplantı",

      meeting_date:
        meeting.meeting_date
          ? meeting.meeting_date.slice(
              0,
              16
            )
          : defaultDate,

      location:
        meeting.location || "",

      agenda:
        meeting.agenda || "",

      notes:
        meeting.notes || "",

      status:
        meeting.status || "planned",
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

    if (!form.title.trim()) {
      setError(
        "Toplantı başlığı zorunludur."
      );
      return;
    }

    if (!form.agenda.trim()) {
      setError(
        "Toplantı gündemi zorunludur."
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

        title:
          form.title,

        meeting_type:
          form.meeting_type,

        meeting_date:
          form.meeting_date,

        location:
          form.location,

        agenda:
          form.agenda,

        notes:
          form.notes,

        status:
          form.status,
      };


      if (editingMeeting) {
        await updateMeeting(
          token,
          editingMeeting.id,
          payload
        );

        setMessage(
          "Toplantı başarıyla güncellendi."
        );

      } else {
        await createMeeting(
          token,
          payload
        );

        setMessage(
          "Toplantı başarıyla kaydedildi."
        );
      }

      resetForm();

      await loadMeetings();

    } catch (err) {
      setError(
        err.message
      );

    } finally {
      setLoading(false);
    }
  }


  async function handleDelete(
    meeting
  ) {
    const confirmed =
      window.confirm(
        `"${meeting.title}" toplantısını silmek istediğinize emin misiniz?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      await deleteMeeting(
        token,
        meeting.id
      );

      setMessage(
        "Toplantı başarıyla silindi."
      );

      await loadMeetings();

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

    loadMeetings(
      search
    );
  }


  function formatDateTime(value) {
    if (!value) {
      return "-";
    }

    const date =
      new Date(value);

    return date.toLocaleString(
      "tr-TR",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }


  function getStatusLabel(status) {
    return (
      STATUS_OPTIONS.find(
        (item) =>
          item.value === status
      )?.label ||
      status
    );
  }


  return (
    <div className="app-layout">

      <Sidebar
        active="meetings"
      />


      <main className="main-content">

        <div className="page-header">

          <div>

            <h1>
              Toplantılar
            </h1>

            <p>
              Apartman ve site
              toplantılarını planlayın,
              gündem ve toplantı
              sonuçlarını kayıt altında
              tutun.
            </p>

          </div>


          <button
            type="button"
            className="primary-button"
            onClick={
              handleNewMeeting
            }
          >
            + Yeni Toplantı
          </button>

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

          <div className="content-card meeting-form-card">

            <div className="meeting-form-header">

              <div>

                <h2>

                  {editingMeeting
                    ? "Toplantıyı Düzenle"
                    : "Yeni Toplantı"}

                </h2>

                <p>
                  Toplantı bilgilerini
                  eksiksiz girin.
                </p>

              </div>


              <button
                type="button"
                className="meeting-close-button"
                onClick={
                  resetForm
                }
              >
                ✕
              </button>

            </div>


            <form
              className="meeting-form"
              onSubmit={
                handleSubmit
              }
            >

              <div className="form-group meeting-title-field">

                <label>
                  Toplantı Başlığı
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
                  placeholder="Örn: Eylül Ayı Kat Malikleri Toplantısı"
                />

              </div>


              <div className="form-group">

                <label>
                  Toplantı Türü
                </label>

                <select
                  value={
                    form.meeting_type
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      meeting_type:
                        e.target.value,
                    })
                  }
                >

                  {MEETING_TYPES.map(
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


              <div className="form-group">

                <label>
                  Tarih / Saat
                </label>

                <input
                  type="datetime-local"
                  required
                  value={
                    form.meeting_date
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      meeting_date:
                        e.target.value,
                    })
                  }
                />

              </div>


              <div className="form-group">

                <label>
                  Durum
                </label>

                <select
                  value={
                    form.status
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status:
                        e.target.value,
                    })
                  }
                >

                  {STATUS_OPTIONS.map(
                    (item) => (

                      <option
                        key={
                          item.value
                        }
                        value={
                          item.value
                        }
                      >
                        {item.label}
                      </option>

                    )
                  )}

                </select>

              </div>


              <div className="form-group meeting-full-field">

                <label>
                  Toplantı Yeri
                </label>

                <input
                  type="text"
                  value={
                    form.location
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      location:
                        e.target.value,
                    })
                  }
                  placeholder="Örn: Site toplantı salonu"
                />

              </div>


              <div className="form-group meeting-full-field">

                <label>
                  Gündem
                </label>

                <textarea
                  required
                  rows="6"
                  value={
                    form.agenda
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      agenda:
                        e.target.value,
                    })
                  }
                  placeholder="Toplantıda görüşülecek maddeleri yazın..."
                />

              </div>


              <div className="form-group meeting-full-field">

                <label>
                  Toplantı Notları / Sonuç
                </label>

                <textarea
                  rows="5"
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
                  placeholder="Toplantı sonrası alınan notlar..."
                />

              </div>


              <div className="meeting-form-actions">

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

                  {editingMeeting
                    ? "Değişiklikleri Kaydet"
                    : "Toplantıyı Kaydet"}

                </button>

              </div>

            </form>

          </div>

        )}


        <div className="content-card">

          <div className="meeting-filter-row">

            <div>

              <h2>
                Toplantı Kayıtları
              </h2>

              <p>
                {meetings.length}
                {" "}
                toplantı görüntüleniyor
              </p>

            </div>


            <form
              className="meeting-search"
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


              <select
                value={
                  statusFilter
                }
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value
                  )
                }
              >

                <option value="">
                  Tüm Durumlar
                </option>

                {STATUS_OPTIONS.map(
                  (item) => (

                    <option
                      key={
                        item.value
                      }
                      value={
                        item.value
                      }
                    >
                      {item.label}
                    </option>

                  )
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
                placeholder="Toplantı ara..."
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
              Toplantılar yükleniyor...
            </p>

          ) : meetings.length === 0 ? (

            <div className="empty-state">

              <h3>
                Henüz toplantı kaydı yok.
              </h3>

              <p>
                Yeni Toplantı butonunu
                kullanarak ilk toplantıyı
                oluşturabilirsiniz.
              </p>

            </div>

          ) : (

            <div className="meeting-list">

              {meetings.map(
                (meeting) => (

                  <article
                    className="meeting-card"
                    key={
                      meeting.id
                    }
                  >

                    <div className="meeting-card-top">

                      <div>

                        <div className="meeting-status-row">

                          <span
                            className={`meeting-status ${meeting.status}`}
                          >
                            {getStatusLabel(
                              meeting.status
                            )}
                          </span>

                          <span className="meeting-type">
                            {
                              meeting.meeting_type
                            }
                          </span>

                        </div>


                        <h3>
                          {meeting.title}
                        </h3>

                      </div>


                      <div className="meeting-card-actions">

                        <button
                          type="button"
                          className="secondary-button small-button"
                          onClick={() =>
                            handleEdit(
                              meeting
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
                              meeting
                            )
                          }
                        >
                          Sil
                        </button>

                      </div>

                    </div>


                    <div className="meeting-meta">

                      <span>
                        📅
                        {" "}
                        {formatDateTime(
                          meeting.meeting_date
                        )}
                      </span>

                      <span>
                        📍
                        {" "}
                        {meeting.location ||
                          "Yer belirtilmedi"}
                      </span>

                    </div>


                    <div className="meeting-section">

                      <strong>
                        Gündem
                      </strong>

                      <p>
                        {meeting.agenda}
                      </p>

                    </div>


                    {meeting.notes && (

                      <div className="meeting-section meeting-notes">

                        <strong>
                          Toplantı Notları
                        </strong>

                        <p>
                          {meeting.notes}
                        </p>

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


export default Meetings;