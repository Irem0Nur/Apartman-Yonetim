import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";

import {
  getApartments,
  getDues,
  generateDues,
  getDuePayments,
  createPayment,
  deletePayment,
} from "../services/api";


const MONTHS = [
  { value: 1, label: "Ocak" },
  { value: 2, label: "Şubat" },
  { value: 3, label: "Mart" },
  { value: 4, label: "Nisan" },
  { value: 5, label: "Mayıs" },
  { value: 6, label: "Haziran" },
  { value: 7, label: "Temmuz" },
  { value: 8, label: "Ağustos" },
  { value: 9, label: "Eylül" },
  { value: 10, label: "Ekim" },
  { value: 11, label: "Kasım" },
  { value: 12, label: "Aralık" },
];


function formatMoney(value) {
  return Number(value || 0).toLocaleString(
    "tr-TR",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  );
}


function Dues() {
  const navigate = useNavigate();
  const now = new Date();

  const [apartment, setApartment] =
    useState(null);

  const [dues, setDues] =
    useState([]);

  const [year, setYear] =
    useState(now.getFullYear());

  const [month, setMonth] =
    useState(now.getMonth() + 1);

  const [loading, setLoading] =
    useState(true);

  const [generating, setGenerating] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");


  // ÖDEME MODALI
  const [paymentModalOpen, setPaymentModalOpen] =
    useState(false);

  const [selectedDue, setSelectedDue] =
    useState(null);

  const [payments, setPayments] =
    useState([]);

  const [paymentLoading, setPaymentLoading] =
    useState(false);

  const [paymentError, setPaymentError] =
    useState("");

  const [paymentForm, setPaymentForm] =
    useState({
      amount: "",
      payment_date:
        new Date().toISOString().slice(0, 10),
      payment_method: "cash",
      description: "",
    });


  async function fetchDues(
    selectedApartment,
    selectedYear,
    selectedMonth
  ) {
    const token =
      localStorage.getItem("access_token");

    if (!token || !selectedApartment) {
      return;
    }

    const data = await getDues(
      token,
      selectedApartment.id,
      selectedYear,
      selectedMonth
    );

    setDues(data);
  }


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
        setLoading(true);
        setError("");

        const apartments =
          await getApartments(token);

        if (!apartments?.length) {
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

        await fetchDues(
          selectedApartment,
          year,
          month
        );
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadPage();
  }, [navigate]);


  useEffect(() => {
    if (!apartment) {
      return;
    }

    async function reload() {
      try {
        setLoading(true);
        setError("");
        setMessage("");

        await fetchDues(
          apartment,
          year,
          month
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    reload();

  }, [
    apartment,
    year,
    month,
  ]);


  async function handleGenerate() {
    const token =
      localStorage.getItem(
        "access_token"
      );

    if (!token || !apartment) {
      return;
    }

    try {
      setGenerating(true);
      setError("");
      setMessage("");

      const result =
        await generateDues(
          token,
          apartment.id,
          year,
          month
        );

      const created =
        result.created_count || 0;

      const skipped =
        result.skipped_count || 0;

      setMessage(
        `${created} aidat oluşturuldu.` +
        (
          skipped > 0
            ? ` ${skipped} kayıt zaten vardı.`
            : ""
        )
      );

      await fetchDues(
        apartment,
        year,
        month
      );

    } catch (err) {
      setError(err.message);

    } finally {
      setGenerating(false);
    }
  }


  async function openPaymentModal(due) {
    const token =
      localStorage.getItem(
        "access_token"
      );

    if (!token) {
      navigate("/");
      return;
    }

    try {
      setPaymentLoading(true);
      setPaymentError("");

      setSelectedDue(due);

      setPaymentForm({
        amount: "",
        payment_date:
          new Date()
            .toISOString()
            .slice(0, 10),
        payment_method: "cash",
        description: "",
      });

      const data =
        await getDuePayments(
          token,
          due.id
        );

      setPayments(data);

      setPaymentModalOpen(true);

    } catch (err) {
      setError(err.message);

    } finally {
      setPaymentLoading(false);
    }
  }


  function closePaymentModal() {
    setPaymentModalOpen(false);
    setSelectedDue(null);
    setPayments([]);
    setPaymentError("");
  }


  function handlePaymentChange(event) {
    const {
      name,
      value,
    } = event.target;

    setPaymentForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  }


  async function handlePaymentSubmit(
    event
  ) {
    event.preventDefault();

    const token =
      localStorage.getItem(
        "access_token"
      );

    if (!token || !selectedDue) {
      return;
    }

    try {
      setPaymentLoading(true);
      setPaymentError("");

      await createPayment(
        token,
        {
          due_id: selectedDue.id,

          amount:
            paymentForm.amount,

          payment_date:
            paymentForm.payment_date,

          payment_method:
            paymentForm.payment_method,

          description:
            paymentForm.description,
        }
      );

      const paymentList =
        await getDuePayments(
          token,
          selectedDue.id
        );

      setPayments(paymentList);

      await fetchDues(
        apartment,
        year,
        month
      );

      setPaymentForm({
        amount: "",
        payment_date:
          new Date()
            .toISOString()
            .slice(0, 10),
        payment_method: "cash",
        description: "",
      });

      setMessage(
        "Ödeme başarıyla kaydedildi."
      );

    } catch (err) {
      setPaymentError(
        err.message
      );

    } finally {
      setPaymentLoading(false);
    }
  }


  async function handleDeletePayment(
    paymentId
  ) {
    const approved =
      window.confirm(
        "Bu ödeme kaydını silmek istediğinize emin misiniz?"
      );

    if (!approved) {
      return;
    }

    const token =
      localStorage.getItem(
        "access_token"
      );

    if (!token || !selectedDue) {
      return;
    }

    try {
      setPaymentLoading(true);
      setPaymentError("");

      await deletePayment(
        token,
        paymentId
      );

      const paymentList =
        await getDuePayments(
          token,
          selectedDue.id
        );

      setPayments(paymentList);

      await fetchDues(
        apartment,
        year,
        month
      );

    } catch (err) {
      setPaymentError(
        err.message
      );

    } finally {
      setPaymentLoading(false);
    }
  }


  const monthName =
    MONTHS.find(
      (item) =>
        item.value ===
        Number(month)
    )?.label || "";


  const totals =
    useMemo(() => {

      const totalAmount =
        dues.reduce(
          (sum, due) =>
            sum +
            Number(
              due.amount || 0
            ),
          0
        );

      const totalPaid =
        dues.reduce(
          (sum, due) =>
            sum +
            Number(
              due.paid_amount || 0
            ),
          0
        );

      const remaining =
        dues.reduce(
          (sum, due) =>
            sum +
            Number(
              due.remaining_amount || 0
            ),
          0
        );

      return {
        totalAmount,
        totalPaid,
        remaining,
      };

    }, [dues]);


  function getStatusLabel(status) {
    if (status === "paid") {
      return "Ödendi";
    }

    if (status === "partial") {
      return "Kısmi Ödendi";
    }

    return "Ödenmedi";
  }


  function getPaymentMethodLabel(method) {
    if (method === "bank") {
      return "Banka / Havale";
    }

    if (method === "card") {
      return "Kart";
    }

    return "Nakit";
  }


  if (loading && !apartment) {
    return (
      <div className="loading">
        Aidatlar yükleniyor...
      </div>
    );
  }


  return (
    <div className="app-layout">

      <Sidebar active="dues" />

      <main className="main-content">

        <header className="dues-header">

          <div>
            <h1>Aidatlar</h1>
            <p>{apartment?.name}</p>
          </div>

          <button
            className="primary-button"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating
              ? "Oluşturuluyor..."
              : "Bu Ayın Aidatlarını Oluştur"}
          </button>

        </header>


        <section className="dues-toolbar">

          <div className="dues-period-field">
            <label>Ay</label>

            <select
              value={month}
              onChange={(event) =>
                setMonth(
                  Number(
                    event.target.value
                  )
                )
              }
            >
              {MONTHS.map(
                (item) => (
                  <option
                    key={item.value}
                    value={item.value}
                  >
                    {item.label}
                  </option>
                )
              )}
            </select>
          </div>


          <div className="dues-period-field">
            <label>Yıl</label>

            <input
              type="number"
              min="2020"
              max="2100"
              value={year}
              onChange={(event) =>
                setYear(
                  Number(
                    event.target.value
                  )
                )
              }
            />
          </div>


          <div className="dues-period-title">
            {monthName} {year}
          </div>

        </section>


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


        <section className="units-summary">

          <div className="mini-stat">
            <span>
              Toplam Tahakkuk
            </span>

            <strong>
              {formatMoney(
                totals.totalAmount
              )}{" "}
              TL
            </strong>
          </div>


          <div className="mini-stat">
            <span>
              Tahsil Edilen
            </span>

            <strong>
              {formatMoney(
                totals.totalPaid
              )}{" "}
              TL
            </strong>
          </div>


          <div className="mini-stat">
            <span>
              Kalan Borç
            </span>

            <strong>
              {formatMoney(
                totals.remaining
              )}{" "}
              TL
            </strong>
          </div>

        </section>


        <section className="panel units-panel">

          {loading ? (

            <div className="loading">
              Aidatlar yükleniyor...
            </div>

          ) : dues.length === 0 ? (

            <div className="empty-dashboard-state">

              <span>💳</span>

              <strong>
                Bu dönem için aidat bulunmuyor
              </strong>

              <p>
                {monthName} {year}
                {" "}dönemi için aidat
                kayıtlarını oluşturabilirsiniz.
              </p>

              <button
                className="primary-button"
                onClick={handleGenerate}
                disabled={generating}
              >
                Aidatları Oluştur
              </button>

            </div>

          ) : (

            <div className="units-table-wrapper">

              <table className="units-table dues-table">

                <thead>
                  <tr>
                    <th>Blok / Daire</th>
                    <th>Daire Sahibi</th>
                    <th>Dönem</th>
                    <th>Aidat</th>
                    <th>Ödenen</th>
                    <th>Kalan</th>
                    <th>Durum</th>
                    <th>İşlem</th>
                  </tr>
                </thead>


                <tbody>

                  {dues.map(
                    (due) => (

                      <tr key={due.id}>

                        <td>
                          <strong>
                            {due.block_name ||
                              "-"}
                          </strong>

                          {" / "}

                          Daire{" "}
                          {due.unit_number}
                        </td>


                        <td>

                          {due.owners?.length >
                          0 ? (

                            <div className="unit-person-list">

                              {due.owners.map(
                                (
                                  owner,
                                  index
                                ) => (
                                  <span
                                    key={`${owner}-${index}`}
                                  >
                                    {owner}
                                  </span>
                                )
                              )}

                            </div>

                          ) : (

                            <span className="unit-person-empty">
                              Malik eklenmedi
                            </span>

                          )}

                        </td>


                        <td>
                          {monthName} {year}
                        </td>


                        <td>
                          {formatMoney(
                            due.amount
                          )}{" "}
                          TL
                        </td>


                        <td>
                          {formatMoney(
                            due.paid_amount
                          )}{" "}
                          TL
                        </td>


                        <td>
                          {formatMoney(
                            due.remaining_amount
                          )}{" "}
                          TL
                        </td>


                        <td>
                          <span
                            className={
                              `due-status ${due.status}`
                            }
                          >
                            {getStatusLabel(
                              due.status
                            )}
                          </span>
                        </td>


                        <td>
                          <button
                            className="payment-button"
                            onClick={() =>
                              openPaymentModal(
                                due
                              )
                            }
                          >
                            {due.status ===
                            "paid"
                              ? "Ödemeleri Gör"
                              : "+ Ödeme Gir"}
                          </button>
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


      {paymentModalOpen &&
        selectedDue && (

        <div className="modal-overlay">

          <div className="modal-card payment-modal">

            <div className="modal-header">

              <div>
                <h2>
                  Ödeme İşlemleri
                </h2>

                <p>
                  {selectedDue.block_name ||
                    "-"}
                  {" / "}
                  Daire{" "}
                  {selectedDue.unit_number}
                </p>
              </div>


              <button
                type="button"
                className="modal-close"
                onClick={
                  closePaymentModal
                }
              >
                ×
              </button>

            </div>


            <div className="payment-summary">

              <div>
                <span>Aidat</span>

                <strong>
                  {formatMoney(
                    selectedDue.amount
                  )}{" "}
                  TL
                </strong>
              </div>


              <div>
                <span>Ödenen</span>

                <strong>
                  {formatMoney(
                    selectedDue.paid_amount
                  )}{" "}
                  TL
                </strong>
              </div>


              <div>
                <span>Kalan</span>

                <strong>
                  {formatMoney(
                    selectedDue.remaining_amount
                  )}{" "}
                  TL
                </strong>
              </div>

            </div>


            {selectedDue.status !==
              "paid" && (

              <form
                onSubmit={
                  handlePaymentSubmit
                }
              >

                <div className="setup-row">

                  <div className="form-group">
                    <label>
                      Ödeme Tutarı *
                    </label>

                    <div className="money-input">

                      <input
                        type="number"
                        name="amount"
                        min="0.01"
                        step="0.01"
                        max={
                          selectedDue
                            .remaining_amount
                        }
                        value={
                          paymentForm.amount
                        }
                        onChange={
                          handlePaymentChange
                        }
                        placeholder="Örn. 500"
                        required
                      />

                      <span>TL</span>

                    </div>
                  </div>


                  <div className="form-group">

                    <label>
                      Ödeme Tarihi *
                    </label>

                    <input
                      type="date"
                      name="payment_date"
                      value={
                        paymentForm
                          .payment_date
                      }
                      onChange={
                        handlePaymentChange
                      }
                      required
                    />

                  </div>

                </div>


                <div className="setup-row">

                  <div className="form-group">

                    <label>
                      Ödeme Yöntemi
                    </label>

                    <select
                      name="payment_method"
                      value={
                        paymentForm
                          .payment_method
                      }
                      onChange={
                        handlePaymentChange
                      }
                    >
                      <option value="cash">
                        Nakit
                      </option>

                      <option value="bank">
                        Banka / Havale
                      </option>

                      <option value="card">
                        Kart
                      </option>
                    </select>

                  </div>


                  <div className="form-group">

                    <label>
                      Açıklama
                    </label>

                    <input
                      type="text"
                      name="description"
                      value={
                        paymentForm
                          .description
                      }
                      onChange={
                        handlePaymentChange
                      }
                      placeholder="Örn. Eylül aidatı"
                    />

                  </div>

                </div>


                {paymentError && (
                  <div className="error-message">
                    {paymentError}
                  </div>
                )}


                <div className="modal-actions">

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={
                      paymentLoading
                    }
                  >
                    {paymentLoading
                      ? "Kaydediliyor..."
                      : "Ödemeyi Kaydet"}
                  </button>

                </div>

              </form>

            )}


            <div className="payment-history">

              <h3>
                Ödeme Geçmişi
              </h3>


              {paymentLoading &&
              payments.length === 0 ? (

                <p>
                  Ödemeler yükleniyor...
                </p>

              ) : payments.length ===
                0 ? (

                <div className="payment-empty">
                  Henüz ödeme kaydı yok.
                </div>

              ) : (

                <div className="payment-history-list">

                  {payments.map(
                    (payment) => (

                      <div
                        className="payment-history-item"
                        key={payment.id}
                      >

                        <div>

                          <strong>
                            {formatMoney(
                              payment.amount
                            )}{" "}
                            TL
                          </strong>

                          <span>
                            {payment.payment_date}
                            {" • "}
                            {getPaymentMethodLabel(
                              payment.payment_method
                            )}
                          </span>

                          {payment.description && (
                            <small>
                              {
                                payment.description
                              }
                            </small>
                          )}

                        </div>


                        <button
                          type="button"
                          className="danger-button"
                          onClick={() =>
                            handleDeletePayment(
                              payment.id
                            )
                          }
                        >
                          Sil
                        </button>

                      </div>

                    )
                  )}

                </div>

              )}

            </div>

          </div>

        </div>

      )}

    </div>
  );
}


export default Dues;