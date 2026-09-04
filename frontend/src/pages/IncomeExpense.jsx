import { useEffect, useState } from "react";

import Sidebar from "../components/Sidebar";

import {
  getApartments,
  getTransactions,
  getFinancialSummary,
  createTransaction,
  deleteTransaction,
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


const CATEGORIES = {
  income: [
    "Diğer Gelir",
    "Kira Geliri",
    "Bağış",
    "Faiz Geliri",
    "Ortak Alan Geliri",
  ],

  expense: [
    "Elektrik",
    "Su",
    "Doğalgaz",
    "Temizlik",
    "Asansör",
    "Bakım / Onarım",
    "Güvenlik",
    "Personel",
    "Bahçe",
    "Sigorta",
    "Vergi",
    "Diğer Gider",
  ],
};


function IncomeExpense() {
  const now = new Date();

  const token =
    localStorage.getItem("access_token");

  const [apartment, setApartment] =
    useState(null);

  const [transactions, setTransactions] =
    useState([]);

  const [summary, setSummary] =
    useState({
      dues_income: 0,
      other_income: 0,
      total_income: 0,
      total_expense: 0,
      net_balance: 0,
      payment_count: 0,
    });

  const [year, setYear] =
    useState(now.getFullYear());

  const [month, setMonth] =
    useState(now.getMonth() + 1);

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [form, setForm] =
    useState({
      transaction_type: "expense",
      category: "Elektrik",
      amount: "",
      transaction_date:
        now.toISOString().split("T")[0],
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
            "Henüz apartman/site oluşturulmamış."
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
    if (!apartment?.id || !token) {
      return;
    }

    loadPageData(apartment);

  }, [
    apartment,
    year,
    month,
    token,
  ]);


  async function loadPageData(
    apartmentData = apartment
  ) {
    if (
      !apartmentData?.id ||
      !token
    ) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [
        transactionsData,
        summaryData,
      ] = await Promise.all([
        getTransactions(
          token,
          apartmentData.id,
          year,
          month
        ),

        getFinancialSummary(
          token,
          apartmentData.id,
          year,
          month
        ),
      ]);

      setTransactions(
        transactionsData
      );

      setSummary(
        summaryData
      );

    } catch (err) {
      setError(err.message);

    } finally {
      setLoading(false);
    }
  }


  function handleTypeChange(event) {
    const type =
      event.target.value;

    setForm({
      ...form,
      transaction_type: type,
      category:
        CATEGORIES[type][0],
    });
  }


  async function handleSubmit(event) {
    event.preventDefault();

    if (!apartment?.id) {
      setError(
        "Apartman bilgisi henüz yüklenmedi."
      );
      return;
    }

    if (!form.amount) {
      setError(
        "Lütfen geçerli bir tutar girin."
      );
      return;
    }

    try {
      setMessage("");
      setError("");

      await createTransaction(
        token,
        {
          apartment_id:
            apartment.id,

          transaction_type:
            form.transaction_type,

          category:
            form.category,

          amount:
            Number(form.amount),

          transaction_date:
            form.transaction_date,

          description:
            form.description,
        }
      );

      setMessage(
        "Gelir/Gider kaydı başarıyla eklendi."
      );

      setForm({
        ...form,
        amount: "",
        description: "",
      });

      await loadPageData(
        apartment
      );

    } catch (err) {
      setError(err.message);
    }
  }


  async function handleDelete(id) {
    const confirmed =
      window.confirm(
        "Bu kaydı silmek istediğinize emin misiniz?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      await deleteTransaction(
        token,
        id
      );

      setMessage(
        "Kayıt başarıyla silindi."
      );

      await loadPageData(
        apartment
      );

    } catch (err) {
      setError(err.message);
    }
  }


  function formatMoney(value) {
    return Number(value || 0)
      .toLocaleString(
        "tr-TR",
        {
          minimumFractionDigits: 2,
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
      dayValue,
    ] = value.split("-");

    return `${dayValue}.${monthValue}.${yearValue}`;
  }


  return (
    <div className="app-layout">

      <Sidebar active="income-expense" />

      <main className="main-content">

        <div className="page-header">

          <div>
            <h1>
              Gelir / Gider
            </h1>

            <p>
              Aidat tahsilatları,
              diğer gelirler ve
              giderleri takip edin.
            </p>
          </div>

        </div>


        {apartment && (
          <div className="page-apartment-info">
            <strong>
              {apartment.name}
            </strong>
          </div>
        )}


        <div className="finance-filter-row">

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
                    now.getFullYear()
                    - 4
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

          </div>


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

        </div>


        <div className="finance-summary finance-summary-five">

          <div className="finance-card income-card">

            <span>
              Aidat Tahsilatı
            </span>

            <strong>
              {formatMoney(
                summary.dues_income
              )} TL
            </strong>

            <small>
              {summary.payment_count || 0}
              {" "}
              ödeme hareketi
            </small>

          </div>


          <div className="finance-card income-card">

            <span>
              Diğer Gelirler
            </span>

            <strong>
              {formatMoney(
                summary.other_income
              )} TL
            </strong>

          </div>


          <div className="finance-card income-card">

            <span>
              Toplam Gelir
            </span>

            <strong>
              {formatMoney(
                summary.total_income
              )} TL
            </strong>

          </div>


          <div className="finance-card expense-card">

            <span>
              Toplam Gider
            </span>

            <strong>
              {formatMoney(
                summary.total_expense
              )} TL
            </strong>

          </div>


          <div className="finance-card balance-card">

            <span>
              Net Sonuç
            </span>

            <strong
              className={
                Number(
                  summary.net_balance
                ) < 0
                  ? "negative-balance"
                  : "positive-balance"
              }
            >
              {formatMoney(
                summary.net_balance
              )} TL
            </strong>

          </div>

        </div>


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


        <div className="content-card">

          <h2>
            Yeni Gelir / Gider Ekle
          </h2>

          <p className="finance-note">
            Aidat tahsilatlarını buraya
            tekrar eklemeyin. Aidatlar
            bölümünde girilen ödemeler
            otomatik olarak gelir
            hesabına dahil edilir.
          </p>


          <form
            className="finance-form"
            onSubmit={handleSubmit}
          >

            <div className="form-group">

              <label>
                İşlem Türü
              </label>

              <select
                value={
                  form.transaction_type
                }
                onChange={
                  handleTypeChange
                }
              >

                <option value="income">
                  Gelir
                </option>

                <option value="expense">
                  Gider
                </option>

              </select>

            </div>


            <div className="form-group">

              <label>
                Kategori
              </label>

              <select
                value={
                  form.category
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    category:
                      e.target.value,
                  })
                }
              >

                {CATEGORIES[
                  form.transaction_type
                ].map(
                  (category) => (

                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>

                  )
                )}

              </select>

            </div>


            <div className="form-group">

              <label>
                Tutar
              </label>

              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={
                  form.amount
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    amount:
                      e.target.value,
                  })
                }
                placeholder="0,00"
              />

            </div>


            <div className="form-group">

              <label>
                Tarih
              </label>

              <input
                type="date"
                required
                value={
                  form.transaction_date
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    transaction_date:
                      e.target.value,
                  })
                }
              />

            </div>


            <div className="form-group form-description">

              <label>
                Açıklama
              </label>

              <input
                type="text"
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
                placeholder="İsteğe bağlı açıklama"
              />

            </div>


            <button
              type="submit"
              className="primary-button"
              disabled={
                !apartment?.id ||
                loading
              }
            >
              Kaydet
            </button>

          </form>

        </div>


        <div className="content-card">

          <h2>
            Diğer Gelir / Gider Hareketleri
          </h2>

          <p className="finance-note">
            Aidat tahsilatlarının ayrıntıları
            Ödemeler bölümünden görüntülenir.
          </p>


          {loading ? (

            <p>
              Kayıtlar yükleniyor...
            </p>

          ) : transactions.length === 0 ? (

            <div className="empty-state">

              <h3>
                Bu dönemde manuel kayıt yok.
              </h3>

              <p>
                Yeni gelir veya gider
                kaydı ekleyebilirsiniz.
              </p>

            </div>

          ) : (

            <div className="table-wrapper">

              <table className="data-table">

                <thead>

                  <tr>
                    <th>Tarih</th>
                    <th>Tür</th>
                    <th>Kategori</th>
                    <th>Tutar</th>
                    <th>Açıklama</th>
                    <th>İşlem</th>
                  </tr>

                </thead>


                <tbody>

                  {transactions.map(
                    (transaction) => (

                      <tr
                        key={
                          transaction.id
                        }
                      >

                        <td>
                          {formatDate(
                            transaction.transaction_date
                          )}
                        </td>


                        <td>

                          <span
                            className={
                              transaction.transaction_type ===
                              "income"
                                ? "transaction-type income"
                                : "transaction-type expense"
                            }
                          >

                            {transaction.transaction_type ===
                            "income"
                              ? "Gelir"
                              : "Gider"}

                          </span>

                        </td>


                        <td>
                          {transaction.category}
                        </td>


                        <td>
                          <strong>
                            {formatMoney(
                              transaction.amount
                            )} TL
                          </strong>
                        </td>


                        <td>
                          {transaction.description || "-"}
                        </td>


                        <td>

                          <button
                            className="danger-button small-button"
                            onClick={() =>
                              handleDelete(
                                transaction.id
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

      </main>

    </div>
  );
}


export default IncomeExpense;