import { useEffect, useMemo, useState } from "react";

import Sidebar from "../components/Sidebar";

import {
  getApartments,
  getPayments,
  getYearlyPaymentReport,
  deletePayment,
  getPreviousPeriodDebts,
  createPreviousPeriodDebt,
  deletePreviousPeriodDebt,
  getPreviousPeriodDebtPayments,
  createPreviousPeriodDebtPayment,
  deletePreviousPeriodDebtPayment,
} from "../services/api";


const MONTHS = [
  { value: 1, label: "Ocak", short: "Oca" },
  { value: 2, label: "Şubat", short: "Şub" },
  { value: 3, label: "Mart", short: "Mar" },
  { value: 4, label: "Nisan", short: "Nis" },
  { value: 5, label: "Mayıs", short: "May" },
  { value: 6, label: "Haziran", short: "Haz" },
  { value: 7, label: "Temmuz", short: "Tem" },
  { value: 8, label: "Ağustos", short: "Ağu" },
  { value: 9, label: "Eylül", short: "Eyl" },
  { value: 10, label: "Ekim", short: "Eki" },
  { value: 11, label: "Kasım", short: "Kas" },
  { value: 12, label: "Aralık", short: "Ara" },
];


function Payments() {
  const now = new Date();

  const token = localStorage.getItem("access_token");

  const [apartment, setApartment] = useState(null);

  const [activeTab, setActiveTab] = useState("yearly");

  const [payments, setPayments] = useState([]);

  const [yearlyReport, setYearlyReport] = useState({
    rows: [],
    totals: {
      required: 0,
      paid: 0,
      remaining: 0,
    },
  });

  // Önceki dönemden devreden borçlar (apartmanın tamamı)
  const [previousDebts, setPreviousDebts] = useState([]);

  const [previousDebtsTotals, setPreviousDebtsTotals] = useState({
    amount: 0,
    paid: 0,
    remaining: 0,
  });

  const [year, setYear] = useState(now.getFullYear());

  const [month, setMonth] = useState(
    now.getMonth() + 1
  );

  const [loading, setLoading] = useState(true);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  // Borç yönetimi modalı
  const [debtModalOpen, setDebtModalOpen] = useState(false);
  const [debtModalUnit, setDebtModalUnit] = useState(null);
  const [debtError, setDebtError] = useState("");

  const [newDebtForm, setNewDebtForm] = useState({
    amount: "",
    period: "",
    description: "",
  });

  // Bir borcun ödeme geçmişi açıldığında burada tutulur
  const [expandedDebtId, setExpandedDebtId] = useState(null);
  const [debtPaymentsMap, setDebtPaymentsMap] = useState({});

  // Hangi borca ödeme (tahsilat) giriliyor
  const [activePaymentDebtId, setActivePaymentDebtId] = useState(null);

  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    payment_date: now.toISOString().slice(0, 10),
    payment_method: "",
    description: "",
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
          await getApartments(token);

        if (
          !apartments ||
          apartments.length === 0
        ) {
          setError(
            "Henüz bir apartman/site oluşturulmamış."
          );
          return;
        }

        setApartment(apartments[0]);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadApartment();

  }, [token]);


  useEffect(() => {
    if (!apartment || !token) {
      return;
    }

    if (activeTab === "payments") {
      loadPayments();
    }

    if (activeTab === "yearly") {
      loadYearlyReport();
      loadPreviousDebts();
    }

  }, [
    apartment,
    activeTab,
    year,
    month,
  ]);


  async function loadPayments() {
    try {
      setLoading(true);
      setError("");

      const data = await getPayments(
        token,
        apartment.id,
        year,
        month
      );

      setPayments(data);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }


  async function loadYearlyReport() {
    try {
      setLoading(true);
      setError("");

      const data =
        await getYearlyPaymentReport(
          token,
          apartment.id,
          year
        );

      setYearlyReport(data);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }


  async function loadPreviousDebts() {
    try {
      const data = await getPreviousPeriodDebts(
        token,
        apartment.id
      );

      setPreviousDebts(data.debts || []);

      setPreviousDebtsTotals(
        data.totals || {
          amount: 0,
          paid: 0,
          remaining: 0,
        }
      );

    } catch (err) {
      setError(err.message);
    }
  }


  async function handleDelete(paymentId) {
    const confirmed = window.confirm(
      "Bu ödeme kaydını silmek istediğinize emin misiniz?\n\n" +
      "Ödeme silindiğinde ilgili dairenin kalan borcu tekrar artacaktır."
    );

    if (!confirmed) {
      return;
    }

    try {
      setMessage("");
      setError("");

      await deletePayment(
        token,
        paymentId
      );

      setMessage(
        "Ödeme kaydı başarıyla silindi."
      );

      await loadPayments();

    } catch (err) {
      setError(err.message);
    }
  }


  // ---------------------------------------------------
  // DEVREDEN BORÇ YARDIMCILARI
  // ---------------------------------------------------

  function getUnitDebts(unitId) {
    return previousDebts.filter(
      (debt) => debt.unit_id === unitId
    );
  }

  function getUnitDebtRemaining(unitId) {
    return getUnitDebts(unitId).reduce(
      (total, debt) =>
        total + Number(debt.remaining_amount || 0),
      0
    );
  }


  function openDebtModal(row) {
    setDebtModalUnit({
      id: row.unit_id,
      block_name: row.block_name,
      unit_number: row.unit_number,
      owners: row.owners,
    });

    setNewDebtForm({
      amount: "",
      period: "",
      description: "",
    });

    setExpandedDebtId(null);
    setActivePaymentDebtId(null);
    setDebtError("");
    setDebtModalOpen(true);
  }


  function closeDebtModal() {
    setDebtModalOpen(false);
    setDebtModalUnit(null);
    setDebtError("");
  }


  function handleNewDebtChange(event) {
    const { name, value } = event.target;

    setNewDebtForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }


  async function handleAddDebt(event) {
    event.preventDefault();

    if (!debtModalUnit) {
      return;
    }

    try {
      setDebtError("");

      await createPreviousPeriodDebt(token, {
        unit_id: debtModalUnit.id,
        amount: newDebtForm.amount,
        period: newDebtForm.period.trim(),
        description: newDebtForm.description.trim(),
      });

      setNewDebtForm({
        amount: "",
        period: "",
        description: "",
      });

      await loadPreviousDebts();

    } catch (err) {
      setDebtError(err.message);
    }
  }


  async function handleDeleteDebt(debtId) {
    const confirmed = window.confirm(
      "Bu borç kaydını (ve varsa üzerine yapılan ödemeleri) " +
      "silmek istediğinize emin misiniz?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDebtError("");

      await deletePreviousPeriodDebt(token, debtId);

      if (expandedDebtId === debtId) {
        setExpandedDebtId(null);
      }

      await loadPreviousDebts();

    } catch (err) {
      setDebtError(err.message);
    }
  }


  async function toggleDebtPayments(debtId) {
    if (expandedDebtId === debtId) {
      setExpandedDebtId(null);
      return;
    }

    try {
      setDebtError("");

      const data = await getPreviousPeriodDebtPayments(
        token,
        debtId
      );

      setDebtPaymentsMap((previous) => ({
        ...previous,
        [debtId]: data,
      }));

      setExpandedDebtId(debtId);

    } catch (err) {
      setDebtError(err.message);
    }
  }


  function openPaymentForm(debtId) {
    setActivePaymentDebtId(debtId);

    setPaymentForm({
      amount: "",
      payment_date: now.toISOString().slice(0, 10),
      payment_method: "",
      description: "",
    });

    setDebtError("");
  }


  function handlePaymentFormChange(event) {
    const { name, value } = event.target;

    setPaymentForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }


  async function handleSubmitDebtPayment(event, debtId) {
    event.preventDefault();

    try {
      setDebtError("");

      await createPreviousPeriodDebtPayment(
        token,
        debtId,
        {
          amount: paymentForm.amount,
          payment_date: paymentForm.payment_date,
          payment_method: paymentForm.payment_method,
          description: paymentForm.description.trim(),
        }
      );

      setActivePaymentDebtId(null);

      await loadPreviousDebts();

      // Ödeme geçmişi açıksa onu da tazele
      if (expandedDebtId === debtId) {
        const data = await getPreviousPeriodDebtPayments(
          token,
          debtId
        );

        setDebtPaymentsMap((previous) => ({
          ...previous,
          [debtId]: data,
        }));
      }

    } catch (err) {
      setDebtError(err.message);
    }
  }


  async function handleDeleteDebtPayment(paymentId, debtId) {
    const confirmed = window.confirm(
      "Bu tahsilat kaydını silmek istediğinize emin misiniz?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDebtError("");

      await deletePreviousPeriodDebtPayment(
        token,
        paymentId
      );

      await loadPreviousDebts();

      const data = await getPreviousPeriodDebtPayments(
        token,
        debtId
      );

      setDebtPaymentsMap((previous) => ({
        ...previous,
        [debtId]: data,
      }));

    } catch (err) {
      setDebtError(err.message);
    }
  }


  const totalCollected =
    useMemo(() => {

      return payments.reduce(
        (total, payment) =>
          total +
          Number(payment.amount || 0),
        0
      );

    }, [payments]);


  function formatMoney(value) {
    return Number(value || 0)
      .toLocaleString("tr-TR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
  }


  function formatTableMoney(value) {
    const number = Number(value || 0);

    if (number === 0) {
      return "-";
    }

    return number.toLocaleString(
      "tr-TR",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }
    );
  }


  function formatDate(value) {
    if (!value) {
      return "-";
    }

    const [
      yearValue,
      monthValue,
      dayValue
    ] = value.split("-");

    return `${dayValue}.${monthValue}.${yearValue}`;
  }


  function getMonthName(monthNumber) {
    return (
      MONTHS.find(
        (item) =>
          item.value ===
          Number(monthNumber)
      )?.label || monthNumber
    );
  }


  function getPaymentMethod(method) {
    switch (method) {
      case "cash":
        return "Nakit";

      case "bank":
        return "Banka / Havale";

      case "card":
        return "Kart";

      default:
        return method || "-";
    }
  }


  function handlePrint() {
    window.print();
  }


  const overallRemaining =
    Number(yearlyReport?.totals?.remaining || 0) +
    Number(previousDebtsTotals.remaining || 0);


  return (
    <div className="app-layout">

      <div className="no-print">
        <Sidebar active="payments" />
      </div>


      <main className="main-content payments-page">

        <div className="page-header no-print">

          <div>
            <h1>Ödemeler</h1>

            <p>
              Aidat tahsilatlarını,
              ödeme hareketlerini ve
              yıllık ödeme çizelgesini
              görüntüleyebilirsiniz.
            </p>
          </div>

        </div>


        {apartment && (
          <div className="page-apartment-info no-print">
            <strong>
              {apartment.name}
            </strong>
          </div>
        )}


        <div className="payments-tabs no-print">

          <button
            className={
              activeTab === "yearly"
                ? "payments-tab active"
                : "payments-tab"
            }
            onClick={() =>
              setActiveTab("yearly")
            }
          >
            12 Aylık Çizelge
          </button>


          <button
            className={
              activeTab === "payments"
                ? "payments-tab active"
                : "payments-tab"
            }
            onClick={() =>
              setActiveTab("payments")
            }
          >
            Ödeme Hareketleri
          </button>

        </div>


        <div className="payment-toolbar no-print">

          <div className="filter-group">

            <label>
              Yıl
            </label>

            <select
              value={year}
              onChange={(e) =>
                setYear(
                  Number(e.target.value)
                )
              }
            >

              {Array.from(
                { length: 9 },
                (_, index) => {

                  const value =
                    now.getFullYear() -
                    4 +
                    index;

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

          </div>


          {activeTab === "payments" && (

            <div className="filter-group">

              <label>
                Ay
              </label>

              <select
                value={month}
                onChange={(e) =>
                  setMonth(
                    Number(e.target.value)
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

          )}


          {activeTab === "yearly" && (

            <button
              className="print-button"
              onClick={handlePrint}
            >
              🖨 Yazdır
            </button>

          )}

        </div>


        {message && (
          <div className="success-message no-print">
            {message}
          </div>
        )}


        {error && (
          <div className="error-message no-print">
            {error}
          </div>
        )}


        {activeTab === "yearly" && (

          <div className="print-area">

            <div className="print-report-header">

              <h2>
                {apartment?.name || ""}
              </h2>

              <h3>
                {year} Yılı Ödeme Çizelgesi
              </h3>

              <p>
                Rapor Tarihi:{" "}
                {new Date()
                  .toLocaleDateString(
                    "tr-TR"
                  )}
              </p>

            </div>


            <div className="yearly-summary">

              <div className="yearly-summary-card">

                <span>
                  Toplam Ödenmesi Gereken
                </span>

                <strong>
                  {formatMoney(
                    yearlyReport
                      ?.totals
                      ?.required
                  )}{" "}
                  TL
                </strong>

              </div>


              <div className="yearly-summary-card">

                <span>
                  Toplam Tahsil Edilen
                </span>

                <strong>
                  {formatMoney(
                    yearlyReport
                      ?.totals
                      ?.paid
                  )}{" "}
                  TL
                </strong>

              </div>


              <div className="yearly-summary-card">

                <span>
                  Devreden Borç (Önceki Yıllar)
                </span>

                <strong>
                  {formatMoney(
                    previousDebtsTotals.remaining
                  )}{" "}
                  TL
                </strong>

              </div>


              <div className="yearly-summary-card">

                <span>
                  Genel Toplam Kalan Borç
                </span>

                <strong>
                  {formatMoney(
                    overallRemaining
                  )}{" "}
                  TL
                </strong>

              </div>

            </div>


            {loading ? (

              <p>
                Yıllık ödeme çizelgesi
                yükleniyor...
              </p>

            ) : (
              <div className="yearly-table-wrapper">

                <table className="yearly-payment-table">

                  <thead>

                    <tr>

                      <th>
                        Blok / Daire
                      </th>

                      <th>
                        Daire Sahibi
                      </th>

                      {MONTHS.map(
                        (item) => (

                          <th key={item.value}>
                            {item.short}
                          </th>

                        )
                      )}

                      <th>
                        Ödenmesi
                        <br />
                        Gereken
                      </th>

                      <th>
                        Ödenen
                        <br />
                        Toplam
                      </th>

                      <th>
                        Kalan
                        <br />
                        Borç
                      </th>

                      <th>
                        Devreden
                        <br />
                        Borç
                      </th>

                      <th>
                        Genel
                        <br />
                        Toplam
                      </th>

                      <th className="no-print">
                        İşlem
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {yearlyReport?.rows?.length ===
                    0 ? (

                      <tr>

                        <td
                          colSpan="20"
                          className="empty-table-cell"
                        >
                          Bu yıl için
                          ödeme kaydı
                          bulunmuyor.
                        </td>

                      </tr>

                    ) : (

                      yearlyReport.rows.map(
                        (row) => {

                          const carriedRemaining =
                            getUnitDebtRemaining(
                              row.unit_id
                            );

                          const rowOverallRemaining =
                            Number(row.remaining || 0) +
                            carriedRemaining;

                          return (

                          <tr key={row.unit_id}>

                            <td className="unit-cell">

                              <strong>
                                {row.block_name ||
                                  "-"}
                              </strong>

                              {" / "}

                              Daire{" "}
                              {row.unit_number}

                            </td>


                            <td className="owner-cell">

                              {row.owners?.length
                                ? row.owners.join(
                                    ", "
                                  )
                                : "Malik eklenmedi"}

                            </td>


                            {MONTHS.map(
                              (item) => {

                                const paid =
                                  row
                                    .monthly_payments?.[
                                    String(
                                      item.value
                                    )
                                  ] || 0;

                                return (

                                  <td
                                    key={
                                      item.value
                                    }
                                    className={
                                      paid > 0
                                        ? "month-paid"
                                        : "month-empty"
                                    }
                                  >
                                    {formatTableMoney(
                                      paid
                                    )}
                                  </td>

                                );
                              }
                            )}


                            <td className="money-total required-total">

                              {formatMoney(
                                row.total_required
                              )}

                            </td>


                            <td className="money-total paid-total">

                              {formatMoney(
                                row.total_paid
                              )}

                            </td>


                            <td
                              className={
                                Number(
                                  row.remaining
                                ) > 0
                                  ? "money-total remaining-total"
                                  : "money-total fully-paid-total"
                              }
                            >

                              {formatMoney(
                                row.remaining
                              )}

                            </td>


                            <td
                              className={
                                carriedRemaining > 0
                                  ? "money-total remaining-total"
                                  : "money-total fully-paid-total"
                              }
                            >

                              {formatMoney(
                                carriedRemaining
                              )}

                            </td>


                            <td
                              className={
                                rowOverallRemaining > 0
                                  ? "money-total remaining-total"
                                  : "money-total fully-paid-total"
                              }
                            >

                              {formatMoney(
                                rowOverallRemaining
                              )}

                            </td>


                            <td className="no-print">

                              <button
                                className="table-action-button"
                                onClick={() =>
                                  openDebtModal(row)
                                }
                              >
                                Ek Borç
                              </button>

                            </td>

                          </tr>

                          );
                        }
                      )

                    )}

                  </tbody>


                  {yearlyReport?.rows?.length >
                    0 && (

                    <tfoot>

                      <tr>

                        <td colSpan="14">
                          GENEL TOPLAM
                        </td>

                        <td>
                          {formatMoney(
                            yearlyReport
                              ?.totals
                              ?.required
                          )}
                        </td>

                        <td>
                          {formatMoney(
                            yearlyReport
                              ?.totals
                              ?.paid
                          )}
                        </td>

                        <td>
                          {formatMoney(
                            yearlyReport
                              ?.totals
                              ?.remaining
                          )}
                        </td>

                        <td>
                          {formatMoney(
                            previousDebtsTotals.remaining
                          )}
                        </td>

                        <td>
                          {formatMoney(
                            overallRemaining
                          )}
                        </td>

                        <td className="no-print" />

                      </tr>

                    </tfoot>

                  )}

                </table>

              </div>
            )}

          </div>

        )}


        {activeTab === "payments" && (

          <>

            <div className="payment-summary-card">

              <div>

                <span>
                  Seçili Dönemde
                  Tahsil Edilen
                </span>

                <strong>
                  {formatMoney(
                    totalCollected
                  )}{" "}
                  TL
                </strong>

              </div>


              <div>

                <span>
                  Ödeme Hareketi
                </span>

                <strong>
                  {payments.length}
                </strong>

              </div>

            </div>


            <div className="content-card">

              {loading ? (

                <p>
                  Ödemeler yükleniyor...
                </p>

              ) : payments.length === 0 ? (

                <div className="empty-state">

                  <h3>
                    Bu dönemde ödeme
                    bulunmuyor.
                  </h3>

                  <p>
                    Aidatlar bölümünden
                    ödeme girildiğinde
                    tahsilatlar burada
                    görüntülenecektir.
                  </p>

                </div>

              ) : (

                <div className="table-wrapper">

                  <table className="data-table">

                    <thead>

                      <tr>

                        <th>Tarih</th>

                        <th>
                          Blok / Daire
                        </th>

                        <th>
                          Daire Sahibi
                        </th>

                        <th>
                          Aidat Dönemi
                        </th>

                        <th>
                          Tutar
                        </th>

                        <th>
                          Ödeme Yöntemi
                        </th>

                        <th>
                          Açıklama
                        </th>

                        <th>
                          İşlem
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {payments.map(
                        (payment) => (

                          <tr
                            key={
                              payment.id
                            }
                          >

                            <td>
                              {formatDate(
                                payment.payment_date
                              )}
                            </td>


                            <td>

                              <strong>
                                {payment.block_name ||
                                  "-"}
                              </strong>

                              {" / "}

                              Daire{" "}
                              {
                                payment.unit_number
                              }

                            </td>


                            <td>

                              {payment
                                .owners
                                ?.length
                                ? payment.owners.join(
                                    ", "
                                  )
                                : "Malik eklenmedi"}

                            </td>


                            <td>

                              {getMonthName(
                                payment.month
                              )}{" "}
                              {payment.year}

                            </td>


                            <td>

                              <strong>
                                {formatMoney(
                                  payment.amount
                                )}{" "}
                                TL
                              </strong>

                            </td>


                            <td>

                              {getPaymentMethod(
                                payment.payment_method
                              )}

                            </td>


                            <td>

                              {payment.description ||
                                "-"}

                            </td>


                            <td>

                              <button
                                className="danger-button small-button"
                                onClick={() =>
                                  handleDelete(
                                    payment.id
                                  )
                                }
                              >
                                Sil
                              </button>

                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>

              )}

            </div>

          </>

        )}

      </main>


      {debtModalOpen && debtModalUnit && (

        <div className="modal-overlay no-print">

          <div className="modal-card debt-modal">

            <div className="modal-header">

              <div>

                <h2>
                  Devreden Borç —{" "}
                  {debtModalUnit.block_name
                    ? `${debtModalUnit.block_name} / `
                    : ""}
                  Daire {debtModalUnit.unit_number}
                </h2>

                <p>
                  {debtModalUnit.owners?.length
                    ? debtModalUnit.owners.join(", ")
                    : "Malik eklenmedi"}
                </p>

              </div>


              <button
                type="button"
                className="modal-close"
                onClick={closeDebtModal}
              >
                ×
              </button>

            </div>


            {debtError && (
              <div className="error-message">
                {debtError}
              </div>
            )}


            {/* Mevcut borç kayıtları */}

            <div className="debt-list">

              {getUnitDebts(debtModalUnit.id).length === 0 ? (

                <p className="debt-empty-note">
                  Bu daire için henüz devreden borç
                  kaydı bulunmuyor.
                </p>

              ) : (

                getUnitDebts(debtModalUnit.id).map(
                  (debt) => (

                    <div
                      key={debt.id}
                      className="debt-item"
                    >

                      <div className="debt-item-top">

                        <div>

                          <strong>
                            {formatMoney(debt.amount)} TL
                          </strong>

                          {debt.period && (
                            <span className="debt-period">
                              {" "}
                              — {debt.period}
                            </span>
                          )}

                          {debt.description && (
                            <div className="debt-description">
                              {debt.description}
                            </div>
                          )}

                        </div>


                        <span
                          className={
                            debt.status === "paid"
                              ? "due-status paid"
                              : debt.status === "partial"
                              ? "due-status partial"
                              : "due-status unpaid"
                          }
                        >
                          {debt.status === "paid"
                            ? "Ödendi"
                            : debt.status === "partial"
                            ? "Kısmi Ödendi"
                            : "Ödenmedi"}
                        </span>

                      </div>


                      <div className="debt-item-figures">

                        <span>
                          Ödenen:{" "}
                          <strong>
                            {formatMoney(debt.paid_amount)} TL
                          </strong>
                        </span>

                        <span>
                          Kalan:{" "}
                          <strong>
                            {formatMoney(debt.remaining_amount)} TL
                          </strong>
                        </span>

                      </div>


                      <div className="debt-item-actions">

                        <button
                          className="table-action-button"
                          onClick={() =>
                            toggleDebtPayments(debt.id)
                          }
                        >
                          {expandedDebtId === debt.id
                            ? "Ödemeleri Gizle"
                            : `Ödemeleri Gör (${debt.payment_count})`}
                        </button>


                        {debt.remaining_amount > 0 && (

                          <button
                            className="table-action-button"
                            onClick={() =>
                              openPaymentForm(debt.id)
                            }
                          >
                            Tahsil Et
                          </button>

                        )}


                        <button
                          className="table-delete-button"
                          onClick={() =>
                            handleDeleteDebt(debt.id)
                          }
                        >
                          Sil
                        </button>

                      </div>


                      {activePaymentDebtId === debt.id && (

                        <form
                          className="debt-payment-form"
                          onSubmit={(event) =>
                            handleSubmitDebtPayment(
                              event,
                              debt.id
                            )
                          }
                        >

                          <div className="form-group">

                            <label>
                              Tutar
                            </label>

                            <input
                              type="number"
                              name="amount"
                              min="0.01"
                              step="0.01"
                              max={debt.remaining_amount}
                              value={paymentForm.amount}
                              onChange={
                                handlePaymentFormChange
                              }
                              required
                            />

                          </div>


                          <div className="form-group">

                            <label>
                              Tarih
                            </label>

                            <input
                              type="date"
                              name="payment_date"
                              value={
                                paymentForm.payment_date
                              }
                              onChange={
                                handlePaymentFormChange
                              }
                              required
                            />

                          </div>


                          <div className="form-group">

                            <label>
                              Yöntem
                            </label>

                            <select
                              name="payment_method"
                              value={
                                paymentForm.payment_method
                              }
                              onChange={
                                handlePaymentFormChange
                              }
                            >
                              <option value="">
                                Seçiniz
                              </option>
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


                          <div className="form-group full">

                            <label>
                              Açıklama
                            </label>

                            <input
                              name="description"
                              value={
                                paymentForm.description
                              }
                              onChange={
                                handlePaymentFormChange
                              }
                              placeholder="İsteğe bağlı"
                            />

                          </div>


                          <div className="debt-payment-form-actions">

                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() =>
                                setActivePaymentDebtId(null)
                              }
                            >
                              Vazgeç
                            </button>

                            <button
                              type="submit"
                              className="primary-button"
                            >
                              Tahsilatı Kaydet
                            </button>

                          </div>

                        </form>

                      )}


                      {expandedDebtId === debt.id && (

                        <div className="debt-payment-history">

                          {!debtPaymentsMap[debt.id] ||
                          debtPaymentsMap[debt.id].length === 0 ? (

                            <p className="debt-empty-note">
                              Bu borca ait tahsilat
                              bulunmuyor.
                            </p>

                          ) : (

                            debtPaymentsMap[debt.id].map(
                              (payment) => (

                                <div
                                  key={payment.id}
                                  className="debt-payment-row"
                                >

                                  <span>
                                    {formatDate(
                                      payment.payment_date
                                    )}
                                  </span>

                                  <span>
                                    <strong>
                                      {formatMoney(
                                        payment.amount
                                      )}{" "}
                                      TL
                                    </strong>
                                  </span>

                                  <span>
                                    {getPaymentMethod(
                                      payment.payment_method
                                    )}
                                  </span>

                                  <span>
                                    {payment.description ||
                                      "-"}
                                  </span>

                                  <button
                                    className="table-delete-button small-button"
                                    onClick={() =>
                                      handleDeleteDebtPayment(
                                        payment.id,
                                        debt.id
                                      )
                                    }
                                  >
                                    Sil
                                  </button>

                                </div>

                              )
                            )

                          )}

                        </div>

                      )}

                    </div>

                  )
                )

              )}

            </div>


            {/* Yeni borç ekleme formu */}

            <form
              className="debt-add-form"
              onSubmit={handleAddDebt}
            >

              <h3>
                Yeni Devreden Borç Ekle
              </h3>

              <div className="setup-row">

                <div className="form-group">

                  <label>
                    Tutar *
                  </label>

                  <input
                    type="number"
                    name="amount"
                    min="0.01"
                    step="0.01"
                    value={newDebtForm.amount}
                    onChange={handleNewDebtChange}
                    placeholder="0.00"
                    required
                  />

                </div>


                <div className="form-group">

                  <label>
                    Dönem
                  </label>

                  <input
                    name="period"
                    value={newDebtForm.period}
                    onChange={handleNewDebtChange}
                    placeholder="Örn. 2025 yılı öncesi"
                  />

                </div>

              </div>


              <div className="form-group">

                <label>
                  Açıklama
                </label>

                <input
                  name="description"
                  value={newDebtForm.description}
                  onChange={handleNewDebtChange}
                  placeholder="İsteğe bağlı"
                />

              </div>


              <div className="modal-actions">

                <button
                  type="submit"
                  className="primary-button"
                >
                  Borcu Ekle
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}


export default Payments;