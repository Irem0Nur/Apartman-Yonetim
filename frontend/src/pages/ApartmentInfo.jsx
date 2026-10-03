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
  getCurrentUser,
  updateName,
  changeEmail,
  changePassword,
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


  // -------------------------------------------------------
  // HESAP BİLGİLERİ (ad soyad / e-posta / şifre)
  // -------------------------------------------------------

  const [user, setUser] =
    useState(null);

  const [nameForm, setNameForm] =
    useState("");

  const [nameSaving, setNameSaving] =
    useState(false);

  const [nameError, setNameError] =
    useState("");

  const [nameMessage, setNameMessage] =
    useState("");


  const [emailForm, setEmailForm] =
    useState({
      new_email: "",
      current_password: "",
    });

  const [emailSaving, setEmailSaving] =
    useState(false);

  const [emailError, setEmailError] =
    useState("");

  const [emailMessage, setEmailMessage] =
    useState("");


  const [passwordForm, setPasswordForm] =
    useState({
      current_password: "",
      new_password: "",
      confirm_password: "",
    });

  const [passwordSaving, setPasswordSaving] =
    useState(false);

  const [passwordError, setPasswordError] =
    useState("");

  const [passwordMessage, setPasswordMessage] =
    useState("");


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


  useEffect(() => {
    async function loadUser() {
      if (!token) {
        return;
      }

      try {
        const userData =
          await getCurrentUser(
            token
          );

        setUser(userData);

        setNameForm(
          userData.name || ""
        );

      } catch (err) {
        console.error(err);
      }
    }

    loadUser();

  }, [token]);


  async function handleNameSave(
    event
  ) {
    event.preventDefault();

    setNameError("");
    setNameMessage("");

    if (!nameForm.trim()) {
      setNameError(
        "Ad soyad zorunludur."
      );
      return;
    }

    try {
      setNameSaving(true);

      const result =
        await updateName(
          token,
          nameForm.trim()
        );

      setUser(result.user);

      setNameForm(
        result.user.name || ""
      );

      setNameMessage(
        "Ad soyad güncellendi."
      );

    } catch (err) {
      setNameError(err.message);

    } finally {
      setNameSaving(false);
    }
  }


  function handleEmailFormChange(
    event
  ) {
    const { name, value } =
      event.target;

    setEmailForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }


  async function handleEmailSave(
    event
  ) {
    event.preventDefault();

    setEmailError("");
    setEmailMessage("");

    const newEmail =
      emailForm.new_email
        .trim()
        .toLowerCase();

    if (!newEmail) {
      setEmailError(
        "Yeni e-posta adresi zorunludur."
      );
      return;
    }

    if (!emailForm.current_password) {
      setEmailError(
        "Mevcut şifrenizi girin."
      );
      return;
    }

    try {
      setEmailSaving(true);

      const result =
        await changeEmail(
          token,
          newEmail,
          emailForm.current_password
        );

      setUser(result.user);

      setEmailForm({
        new_email: "",
        current_password: "",
      });

      setEmailMessage(
        "E-posta adresi güncellendi. "+
        "Bir sonraki girişte yeni " +
        "e-posta adresinizi kullanın."
      );

    } catch (err) {
      setEmailError(err.message);

    } finally {
      setEmailSaving(false);
    }
  }


  function handlePasswordFormChange(
    event
  ) {
    const { name, value } =
      event.target;

    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }


  async function handlePasswordSave(
    event
  ) {
    event.preventDefault();

    setPasswordError("");
    setPasswordMessage("");

    if (
      !passwordForm.current_password ||
      !passwordForm.new_password
    ) {
      setPasswordError(
        "Mevcut ve yeni şifre zorunludur."
      );
      return;
    }

    if (passwordForm.new_password.length < 6) {
      setPasswordError(
        "Yeni şifre en az 6 karakter olmalıdır."
      );
      return;
    }

    if (
      passwordForm.new_password !==
      passwordForm.confirm_password
    ) {
      setPasswordError(
        "Yeni şifreler birbiriyle uyuşmuyor."
      );
      return;
    }

    try {
      setPasswordSaving(true);

      await changePassword(
        token,
        passwordForm.current_password,
        passwordForm.new_password
      );

      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });

      setPasswordMessage(
        "Şifreniz güncellendi."
      );

    } catch (err) {
      setPasswordError(err.message);

    } finally {
      setPasswordSaving(false);
    }
  }


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


        <section className="panel account-settings-panel">

          <h2>
            Hesap Bilgileri
          </h2>

          <p className="subtitle">
            Kendi yönetici hesabınıza
            ait ad soyad, e-posta ve
            şifre bilgilerinizi buradan
            güncelleyebilirsiniz.
          </p>


          <div className="account-settings-grid">

            <form
              className="account-settings-form"
              onSubmit={handleNameSave}
            >

              <h3>
                Ad Soyad
              </h3>

              <div className="form-group">

                <input
                  type="text"
                  value={nameForm}
                  onChange={(e) =>
                    setNameForm(
                      e.target.value
                    )
                  }
                  required
                />

              </div>

              {nameError && (
                <div className="error-message">
                  {nameError}
                </div>
              )}

              {nameMessage && (
                <div className="success-message">
                  {nameMessage}
                </div>
              )}

              <button
                type="submit"
                className="primary-button"
                disabled={nameSaving}
              >
                {nameSaving
                  ? "Kaydediliyor..."
                  : "Ad Soyadı Güncelle"}
              </button>

            </form>


            <form
              className="account-settings-form"
              onSubmit={handleEmailSave}
            >

              <h3>
                E-posta Adresi
              </h3>

              <p className="field-hint">
                Şu anki e-posta:
                {" "}
                <strong>
                  {user?.email || "-"}
                </strong>
              </p>

              <div className="form-group">

                <label>
                  Yeni E-posta
                </label>

                <input
                  type="email"
                  name="new_email"
                  value={
                    emailForm.new_email
                  }
                  onChange={
                    handleEmailFormChange
                  }
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Mevcut Şifre
                </label>

                <input
                  type="password"
                  name="current_password"
                  value={
                    emailForm.current_password
                  }
                  onChange={
                    handleEmailFormChange
                  }
                  autoComplete="current-password"
                  required
                />

              </div>

              {emailError && (
                <div className="error-message">
                  {emailError}
                </div>
              )}

              {emailMessage && (
                <div className="success-message">
                  {emailMessage}
                </div>
              )}

              <button
                type="submit"
                className="primary-button"
                disabled={emailSaving}
              >
                {emailSaving
                  ? "Kaydediliyor..."
                  : "E-postayı Güncelle"}
              </button>

            </form>


            <form
              className="account-settings-form"
              onSubmit={handlePasswordSave}
            >

              <h3>
                Şifre Değiştir
              </h3>

              <div className="form-group">

                <label>
                  Mevcut Şifre
                </label>

                <input
                  type="password"
                  name="current_password"
                  value={
                    passwordForm.current_password
                  }
                  onChange={
                    handlePasswordFormChange
                  }
                  autoComplete="current-password"
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Yeni Şifre
                </label>

                <input
                  type="password"
                  name="new_password"
                  value={
                    passwordForm.new_password
                  }
                  onChange={
                    handlePasswordFormChange
                  }
                  autoComplete="new-password"
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Yeni Şifre (Tekrar)
                </label>

                <input
                  type="password"
                  name="confirm_password"
                  value={
                    passwordForm.confirm_password
                  }
                  onChange={
                    handlePasswordFormChange
                  }
                  autoComplete="new-password"
                  required
                />

              </div>

              {passwordError && (
                <div className="error-message">
                  {passwordError}
                </div>
              )}

              {passwordMessage && (
                <div className="success-message">
                  {passwordMessage}
                </div>
              )}

              <button
                type="submit"
                className="primary-button"
                disabled={passwordSaving}
              >
                {passwordSaving
                  ? "Kaydediliyor..."
                  : "Şifreyi Güncelle"}
              </button>

            </form>

          </div>

        </section>

      </main>

    </div>
  );
}


export default ApartmentInfo;