import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";

import {
  getApartments,
  getUnits,
  getPeople,
  createPerson,
  updatePerson,
  deletePerson,
} from "../services/api";


const ROLE_LABELS = {
  owner: "Malik",
  tenant: "Kiracı",
  resident: "Oturan",
  family: "Aile Bireyi",
};


function People() {
  const navigate = useNavigate();

  const [apartment, setApartment] =
    useState(null);

  const [units, setUnits] =
    useState([]);

  const [people, setPeople] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [modalOpen, setModalOpen] =
    useState(false);

  const [
    editingRelation,
    setEditingRelation
  ] = useState(null);

  const [error, setError] =
    useState("");

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    unit_id: "",
    relationship_type: "owner",
    is_resident: false,
    notes: "",
  });


  useEffect(() => {
    async function loadPage() {
      const token =
        localStorage.getItem(
          "access_token"
        );

      if (!token) {
        navigate("/");
        return;
      }

      try {
        const apartments =
          await getApartments(token);

        if (!apartments.length) {
          navigate(
            "/apartman-olustur"
          );

          return;
        }

        const selectedApartment =
          apartments[0];

        setApartment(
          selectedApartment
        );

        const [
          unitData,
          peopleData
        ] = await Promise.all([
          getUnits(
            token,
            selectedApartment.id
          ),

          getPeople(
            token,
            selectedApartment.id
          ),
        ]);

        setUnits(unitData);
        setPeople(peopleData);

      } catch (err) {
        console.error(err);

        if (
          err.message
            .toLowerCase()
            .includes("token")
        ) {
          localStorage.removeItem(
            "access_token"
          );

          navigate("/");
        }

      } finally {
        setLoading(false);
      }
    }

    loadPage();

  }, [navigate]);


  async function refreshData() {
    const token =
      localStorage.getItem(
        "access_token"
      );

    if (!token || !apartment) {
      return;
    }

    const [
      peopleData,
      unitData
    ] = await Promise.all([
      getPeople(
        token,
        apartment.id
      ),

      getUnits(
        token,
        apartment.id
      ),
    ]);

    setPeople(peopleData);
    setUnits(unitData);
  }


  function openCreateModal() {
    setEditingRelation(null);

    setForm({
      first_name: "",
      last_name: "",
      phone: "",
      email: "",

      unit_id:
        units.length
          ? String(units[0].id)
          : "",

      relationship_type:
        "owner",

      is_resident:
        false,

      notes: "",
    });

    setError("");
    setModalOpen(true);
  }


  function openEditModal(relation) {
    setEditingRelation(relation);

    setForm({
      first_name:
        relation.person.first_name || "",

      last_name:
        relation.person.last_name || "",

      phone:
        relation.person.phone || "",

      email:
        relation.person.email || "",

      unit_id:
        String(relation.unit.id),

      relationship_type:
        relation.relationship_type,

      is_resident:
        Boolean(
          relation.is_resident
        ),

      notes:
        relation.person.notes || "",
    });

    setError("");
    setModalOpen(true);
  }


  function closeModal() {
    setModalOpen(false);
    setEditingRelation(null);
    setError("");
  }


  function handleChange(event) {
    const {
      name,
      value,
      type,
      checked
    } = event.target;

    setForm(
      (previous) => ({
        ...previous,

        [name]:
          type === "checkbox"
            ? checked
            : value,
      })
    );
  }


  function handleRoleChange(event) {
    const value =
      event.target.value;

    setForm(
      (previous) => ({
        ...previous,

        relationship_type:
          value,

        // Kiracı ve Oturan seçildiğinde
        // varsayılan olarak o dairede
        // yaşadığını kabul ediyoruz.
        is_resident:
          value === "tenant" ||
          value === "resident"
            ? true
            : previous.is_resident,
      })
    );
  }


  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    const token =
      localStorage.getItem(
        "access_token"
      );

    if (!token) {
      navigate("/");
      return;
    }

    if (!form.unit_id) {
      setError(
        "Lütfen bir daire seçin."
      );

      return;
    }

    try {
      setError("");

      const payload = {
        first_name:
          form.first_name.trim(),

        last_name:
          form.last_name.trim(),

        phone:
          form.phone.trim(),

        email:
          form.email.trim(),

        unit_id:
          Number(form.unit_id),

        relationship_type:
          form.relationship_type,

        is_resident:
          form.is_resident,

        notes:
          form.notes.trim(),
      };


      if (editingRelation) {
        await updatePerson(
          token,
          editingRelation.relation_id,
          payload
        );

      } else {
        await createPerson(
          token,
          payload
        );
      }

      await refreshData();

      closeModal();

    } catch (err) {
      setError(err.message);
    }
  }


  async function handleDelete(
    relationId
  ) {
    const approved =
      window.confirm(
        "Bu kişi ile daire arasındaki ilişkiyi silmek istediğinize emin misiniz?"
      );

    if (!approved) {
      return;
    }

    const token =
      localStorage.getItem(
        "access_token"
      );

    try {
      await deletePerson(
        token,
        relationId
      );

      await refreshData();

    } catch (err) {
      alert(err.message);
    }
  }


  function unitLabel(unit) {
    const block =
      unit.block_name
        ? `${unit.block_name} / `
        : "";

    return `${block}Daire ${unit.unit_number}`;
  }


  if (loading) {
    return (
      <div className="loading">
        Kişiler yükleniyor...
      </div>
    );
  }


  return (
    <div className="app-layout">

      <Sidebar active="people" />


      <main className="main-content">

        <header className="units-header">

          <div>

            <h1>
              Kişiler
            </h1>

            <p>
              {apartment?.name}
            </p>

          </div>


          <button
            className="primary-button"
            onClick={
              openCreateModal
            }
            disabled={
              units.length === 0
            }
          >
            + Yeni Kişi
          </button>

        </header>


        <section className="units-summary">

          <div className="mini-stat">

            <span>
              Toplam Kayıt
            </span>

            <strong>
              {people.length}
            </strong>

          </div>


          <div className="mini-stat">

            <span>
              Malik
            </span>

            <strong>
              {
                people.filter(
                  (person) =>
                    person.relationship_type ===
                    "owner"
                ).length
              }
            </strong>

          </div>


          <div className="mini-stat">

            <span>
              Dairede Oturan
            </span>

            <strong>
              {
                people.filter(
                  (person) =>
                    person.is_resident
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
                Önce daire eklemelisiniz
              </strong>

              <p>
                Bir kişiyi sisteme
                ekleyebilmek için önce
                kişinin bağlanacağı
                dairenin oluşturulması
                gerekiyor.
              </p>


              <button
                className="primary-button"
                onClick={() =>
                  navigate("/daireler")
                }
              >
                Dairelere Git
              </button>

            </div>

          ) : people.length === 0 ? (

            <div className="empty-dashboard-state">

              <span>
                👥
              </span>

              <strong>
                Henüz kişi eklenmedi
              </strong>

              <p>
                Malik, kiracı ve
                dairede yaşayan kişileri
                ekleyebilirsiniz.
              </p>


              <button
                className="primary-button"
                onClick={
                  openCreateModal
                }
              >
                İlk Kişiyi Ekle
              </button>

            </div>

          ) : (

            <div className="units-table-wrapper">

              <table className="units-table">

                <thead>

                  <tr>
                    <th>
                      Kişi
                    </th>

                    <th>
                      Blok
                    </th>

                    <th>
                      Daire
                    </th>

                    <th>
                      Rol
                    </th>

                    <th>
                      Oturuyor mu?
                    </th>

                    <th>
                      Telefon
                    </th>

                    <th>
                      İşlemler
                    </th>
                  </tr>

                </thead>


                <tbody>

                  {people.map(
                    (relation) => (

                      <tr
                        key={
                          relation.relation_id
                        }
                      >

                        <td>
                          <strong>
                            {
                              relation.person
                                .full_name
                            }
                          </strong>

                          {relation.person.email && (
                            <div className="person-email">
                              {
                                relation.person
                                  .email
                              }
                            </div>
                          )}
                        </td>


                        <td>
                          {
                            relation.unit
                              .block_name ||
                            "-"
                          }
                        </td>


                        <td>
                          Daire{" "}
                          {
                            relation.unit
                              .unit_number
                          }
                        </td>


                        <td>
                          <span className="role-badge">
                            {
                              ROLE_LABELS[
                                relation
                                  .relationship_type
                              ] ||
                              relation
                                .relationship_type
                            }
                          </span>
                        </td>


                        <td>

                          <span
                            className={
                              relation.is_resident
                                ? "status-badge occupied"
                                : "status-badge empty"
                            }
                          >
                            {
                              relation.is_resident
                                ? "Evet"
                                : "Hayır"
                            }
                          </span>

                        </td>


                        <td>
                          {
                            relation.person
                              .phone ||
                            "-"
                          }
                        </td>


                        <td>

                          <div className="table-actions">

                            <button
                              onClick={() =>
                                openEditModal(
                                  relation
                                )
                              }
                            >
                              Düzenle
                            </button>


                            <button
                              className="danger-button"
                              onClick={() =>
                                handleDelete(
                                  relation
                                    .relation_id
                                )
                              }
                            >
                              Sil
                            </button>

                          </div>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </main>


      {modalOpen && (

        <div className="modal-overlay">

          <div className="modal-card people-modal">

            <div className="modal-header">

              <div>

                <h2>
                  {
                    editingRelation
                      ? "Kişiyi Düzenle"
                      : "Yeni Kişi"
                  }
                </h2>

                <p>
                  {apartment?.name}
                </p>

              </div>


              <button
                type="button"
                className="modal-close"
                onClick={
                  closeModal
                }
              >
                ×
              </button>

            </div>


            <form
              onSubmit={
                handleSubmit
              }
            >

              <div className="setup-row">

                <div className="form-group">

                  <label>
                    Ad *
                  </label>

                  <input
                    name="first_name"
                    value={
                      form.first_name
                    }
                    onChange={
                      handleChange
                    }
                    required
                    placeholder="Örn. Ahmet"
                  />

                </div>


                <div className="form-group">

                  <label>
                    Soyad *
                  </label>

                  <input
                    name="last_name"
                    value={
                      form.last_name
                    }
                    onChange={
                      handleChange
                    }
                    required
                    placeholder="Örn. Yılmaz"
                  />

                </div>

              </div>


              <div className="setup-row">

                <div className="form-group">

                  <label>
                    Telefon
                  </label>

                  <input
                    name="phone"
                    value={
                      form.phone
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="05xx xxx xx xx"
                  />

                </div>


                <div className="form-group">

                  <label>
                    E-posta
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={
                      form.email
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="ornek@mail.com"
                  />

                </div>

              </div>


              <div className="form-group">

                <label>
                  Daire *
                </label>

                <select
                  name="unit_id"
                  value={
                    form.unit_id
                  }
                  onChange={
                    handleChange
                  }
                  required
                >

                  <option value="">
                    Daire seçin
                  </option>

                  {units.map(
                    (unit) => (

                      <option
                        key={
                          unit.id
                        }
                        value={
                          unit.id
                        }
                      >
                        {
                          unitLabel(
                            unit
                          )
                        }
                      </option>

                    )
                  )}

                </select>

              </div>


              <div className="form-group">

                <label>
                  Rol *
                </label>

                <select
                  name="relationship_type"
                  value={
                    form.relationship_type
                  }
                  onChange={
                    handleRoleChange
                  }
                >

                  <option value="owner">
                    Malik
                  </option>

                  <option value="tenant">
                    Kiracı
                  </option>

                  <option value="resident">
                    Oturan
                  </option>

                  <option value="family">
                    Aile Bireyi
                  </option>

                </select>

              </div>


              <label className="checkbox-field">

                <input
                  type="checkbox"
                  name="is_resident"
                  checked={
                    form.is_resident
                  }
                  onChange={
                    handleChange
                  }
                />

                <span>
                  Bu kişi şu anda bu
                  dairede oturuyor
                </span>

              </label>


              <div className="form-group">

                <label>
                  Not
                </label>

                <textarea
                  name="notes"
                  value={
                    form.notes
                  }
                  onChange={
                    handleChange
                  }
                  rows="3"
                  placeholder="Kişiyle ilgili not..."
                />

              </div>


              {error && (

                <div className="error-message">
                  {error}
                </div>

              )}


              <div className="modal-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    closeModal
                  }
                >
                  Vazgeç
                </button>


                <button
                  type="submit"
                  className="primary-button"
                >
                  {
                    editingRelation
                      ? "Değişiklikleri Kaydet"
                      : "Kişiyi Ekle"
                  }
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}


export default People;