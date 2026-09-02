import { useEffect, useMemo, useState } from "react";

import Sidebar from "../components/Sidebar";

import {
  getApartments,
  getPayments,
  getYearlyPaymentReport,
  deletePayment,
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

  const [year, setYear] = useState(now.getFullYear());

  const [month, setMonth] = useState(
    now.getMonth() + 1
  );

  const [loading, setLoading] = useState(true);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");


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
                  Toplam Kalan Borç
                </span>

                <strong>
                  {formatMoney(
                    yearlyReport
                      ?.totals
                      ?.remaining
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

                    </tr>

                  </thead>


                  <tbody>

                    {yearlyReport?.rows?.length ===
                    0 ? (

                      <tr>

                        <td
                          colSpan="17"
                          className="empty-table-cell"
                        >
                          Bu yıl için
                          ödeme kaydı
                          bulunmuyor.
                        </td>

                      </tr>

                    ) : (

                      yearlyReport.rows.map(
                        (row) => (

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

                          </tr>

                        )
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

    </div>
  );
}


export default Payments;