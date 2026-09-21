import { useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import {
  getApartments,
  getTransactions,
  getPayments,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../services/api";

import "../ledger-book.css";


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

const MIN_ROWS = 14; // kağıt defterdeki gibi boş çizgili satırlar kalsın


function formatMoney(value) {
  return Number(value || 0).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}


function formatDate(value) {
  if (!value) {
    return "";
  }

  return new Date(`${value}T00:00:00`).toLocaleDateString("tr-TR");
}


function BusinessLedger() {
  const navigate = useNavigate();

  const now = new Date();

  const [apartment, setApartment] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [payments, setPayments] = useState([]);

  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [activeTab, setActiveTab] = useState("expense");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const [form, setForm] = useState({
    transaction_type: "expense",
    category: "",
    amount: "",
    transaction_date: now.toISOString().slice(0, 10),
    document_number: "",
    payment_method: "",
    description: "",
  });


  async function loadLedger(selectedApartment, selectedYear, selectedMonth) {
    const token = localStorage.getItem("access_token");

    if (!token || !selectedApartment) {
      return;
    }

    const [transactionData, paymentData] = await Promise.all([
      getTransactions(
        token,
        selectedApartment.id,
        selectedYear,
        selectedMonth
      ),

      getPayments(
        token,
        selectedApartment.id,
        selectedYear,
        selectedMonth
      ),
    ]);

    setTransactions(transactionData || []);
    setPayments(paymentData || []);
  }


  useEffect(() => {
    async function loadPage() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        navigate("/");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const apartments = await getApartments(token);

        if (!apartments || apartments.length === 0) {
          navigate("/apartman-olustur");
          return;
        }

        const selectedApartment = apartments[0];

        setApartment(selectedApartment);

        await loadLedger(selectedApartment, year, month);
      } catch (err) {
        console.error(err);
        setError(err.message || "İşletme defteri yüklenemedi.");
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

        await loadLedger(apartment, year, month);
      } catch (err) {
        console.error(err);
        setError(err.message || "Kayıtlar alınamadı.");
      } finally {
        setLoading(false);
      }
    }

    reload();
  }, [apartment, year, month]);


  function openCreateModal(type) {
    setEditingTransaction(null);

    setForm({
      transaction_type: type,
      category: "",
      amount: "",
      transaction_date: `${year}-${String(month).padStart(2, "0")}-01`,
      document_number: "",
      payment_method: "",
      description: "",
    });

    setError("");
    setModalOpen(true);
  }


  function openEditModal(transaction) {
    setEditingTransaction(transaction);

    setForm({
      transaction_type: transaction.transaction_type || "expense",
      category: transaction.category || "",
      amount: transaction.amount ?? "",
      transaction_date: transaction.transaction_date || "",
      document_number: transaction.document_number || "",
      payment_method: transaction.payment_method || "",
      description: transaction.description || "",
    });

    setError("");
    setModalOpen(true);
  }


  function closeModal() {
    setModalOpen(false);
    setEditingTransaction(null);
  }


  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }


  async function refreshLedger() {
    if (!apartment) {
      return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/");
      return;
    }

    await loadLedger(apartment, year, month);
  }


  async function handleSubmit(event) {
    event.preventDefault();

    const token = localStorage.getItem("access_token");

    if (!token || !apartment) {
      return;
    }

    try {
      setError("");
      setMessage("");

      const payload = {
        apartment_id: apartment.id,
        transaction_type: form.transaction_type,
        category: form.category.trim(),
        amount: form.amount,
        transaction_date: form.transaction_date,
        document_number: form.document_number.trim(),
        payment_method: form.payment_method.trim(),
        description: form.description.trim(),
      };

      if (editingTransaction) {
        await updateTransaction(token, editingTransaction.id, payload);
        setMessage("Kayıt güncellendi.");
      } else {
        await createTransaction(token, payload);
        setMessage("Kayıt eklendi.");
      }

      closeModal();

      await refreshLedger();
    } catch (err) {
      setError(err.message || "Kayıt kaydedilemedi.");
    }
  }


  async function handleDelete(transactionId) {
    const approved = window.confirm(
      "Bu kaydı silmek istediğinize emin misiniz?"
    );

    if (!approved) {
      return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/");
      return;
    }

    try {
      setError("");

      await deleteTransaction(token, transactionId);

      await refreshLedger();

      setMessage("Kayıt silindi.");
    } catch (err) {
      setError(err.message || "Kayıt silinemedi.");
    }
  }


  const incomeRows = useMemo(() => {
    const manualIncome = transactions
      .filter((item) => item.transaction_type === "income")
      .map((item) => ({
        ...item,
        source: "manual",
      }));

    const automaticIncome = payments.map((payment) => ({
      id: `payment-${payment.id}`,
      transaction_type: "income",
      category: "Aidat Tahsilatı",
      amount: Number(payment.amount || 0),
      transaction_date: payment.payment_date,
      document_number: payment.document_number || "",
      payment_method: payment.payment_method || "",
      description: payment.description || "Aidat ödemesi",
      source: "payment",
    }));

    return [...manualIncome, ...automaticIncome].sort((a, b) =>
      String(b.transaction_date || "").localeCompare(
        String(a.transaction_date || "")
      )
    );
  }, [transactions, payments]);


  const expenseRows = useMemo(
    () =>
      transactions
        .filter((item) => item.transaction_type === "expense")
        .map((item) => ({
          ...item,
          source: "manual",
        })),
    [transactions]
  );


  const totalIncome = incomeRows.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const totalExpense = expenseRows.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const netCash = totalIncome - totalExpense;

  const monthName =
    MONTHS.find((item) => item.value === Number(month))?.label || "";


  function printLedger() {
    window.print();
  }


  if (loading && !apartment) {
    return <div className="loading">İşletme defteri yükleniyor...</div>;
  }


  return (
    <div className="app-layout">

      <aside className="sidebar">

        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">AY</div>
          <span>ApartmanYönet</span>
        </div>

        <nav className="sidebar-menu">

          <button
            className="menu-item"
            onClick={() => navigate("/dashboard")}
          >
            🏠 Dashboard
          </button>

          <div className="menu-title">APARTMAN</div>

          <button className="menu-item">🏢 Apartman Bilgileri</button>

          <button
            className="menu-item"
            onClick={() => navigate("/daireler")}
          >
            🚪 Daireler
          </button>

          <button
            className="menu-item"
            onClick={() => navigate("/kisiler")}
          >
            👥 Kişiler
          </button>

          <div className="menu-title">FİNANS</div>

          <button
            className="menu-item"
            onClick={() => navigate("/aidatlar")}
          >
            💳 Aidatlar
          </button>

          <button className="menu-item">💰 Ödemeler</button>

          <button className="menu-item">📉 Gelir / Gider</button>

          <button className="menu-item">🏦 Kasa</button>

          <button
            className="menu-item active"
            onClick={() => navigate("/isletme-defteri")}
          >
            📒 İşletme Defteri
          </button>

          <div className="menu-title">YÖNETİM</div>

          <button className="menu-item">📒 Karar Defteri</button>

          <button className="menu-item">📅 Toplantılar</button>

          <button className="menu-item">✅ Yapılacaklar</button>

        </nav>

      </aside>


      <main className="main-content business-ledger-page">

        <header className="ledger-header">

          <div>
            <h1>İşletme Defteri</h1>

            <p>
              {apartment?.name || "Apartman"}
              {apartment?.block_name ? ` • ${apartment.block_name}` : ""}
            </p>
          </div>

          <div className="ledger-header-actions">
            <button className="secondary-button" onClick={printLedger}>
              🖨️ Yazdır / PDF
            </button>
          </div>

        </header>


        <section className="ledger-toolbar">

          <div className="dues-period-field">
            <label>Ay</label>

            <select
              value={month}
              onChange={(event) => setMonth(Number(event.target.value))}
            >
              {MONTHS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="dues-period-field">
            <label>Yıl</label>

            <input
              type="number"
              min="2020"
              max="2100"
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
            />
          </div>

          <div className="ledger-period">
            {monthName} {year}
          </div>

        </section>


        {message && <div className="success-message">{message}</div>}

        {error && <div className="error-message">{error}</div>}


        <section className="ledger-summary">

          <div className="ledger-stat income">
            <span>Toplam Gelir</span>
            <strong>{formatMoney(totalIncome)} TL</strong>
          </div>

          <div className="ledger-stat expense">
            <span>Toplam Gider</span>
            <strong>{formatMoney(totalExpense)} TL</strong>
          </div>

          <div className="ledger-stat net">
            <span>Net Kasa</span>
            <strong>{formatMoney(netCash)} TL</strong>
          </div>

        </section>


        <div className="ledger-mobile-tabs">

          <button
            className={activeTab === "expense" ? "active" : ""}
            onClick={() => setActiveTab("expense")}
          >
            Giderler
          </button>

          <button
            className={activeTab === "income" ? "active" : ""}
            onClick={() => setActiveTab("income")}
          >
            Gelirler
          </button>

        </div>


        <section className="kd-kitap">

          <div className="kd-baslik">
            <span>{apartment?.name}</span>
            <h2>İŞLETME HESABI DEFTERİ</h2>
            <span>
              {monthName} {year}
            </span>
          </div>

          <div className="kd-sayfalar">

            <LedgerTable
              title="GİDER"
              type="expense"
              rows={expenseRows}
              mobileHidden={activeTab !== "expense"}
              onAdd={() => openCreateModal("expense")}
              onEdit={openEditModal}
              onDelete={handleDelete}
            />

            <LedgerTable
              title="GELİR"
              type="income"
              rows={incomeRows}
              mobileHidden={activeTab !== "income"}
              onAdd={() => openCreateModal("income")}
              onEdit={openEditModal}
              onDelete={handleDelete}
            />

          </div>

        </section>

      </main>


      {modalOpen && (

        <div
          className="ledger-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >

          <div className="ledger-modal">

            <div className="ledger-modal-header">

              <div>
                <h2>
                  {editingTransaction
                    ? "Kaydı Düzenle"
                    : form.transaction_type === "income"
                    ? "Gelir Ekle"
                    : "Gider Ekle"}
                </h2>

                <p>İşletme defterine kayıt ekleyin.</p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeModal}
              >
                ×
              </button>

            </div>


            <form onSubmit={handleSubmit}>

              <div className="ledger-form-grid">

                <div className="form-group">
                  <label>Tür</label>

                  <select
                    name="transaction_type"
                    value={form.transaction_type}
                    onChange={handleChange}
                  >
                    <option value="expense">Gider</option>
                    <option value="income">Gelir</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Tür / Kategori</label>

                  <input
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    placeholder={
                      form.transaction_type === "income"
                        ? "Diğer gelir"
                        : "Elektrik faturası"
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Tarih</label>

                  <input
                    type="date"
                    name="transaction_date"
                    value={form.transaction_date}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Tutar</label>

                  <input
                    type="number"
                    name="amount"
                    min="0.01"
                    step="0.01"
                    value={form.amount}
                    onChange={handleChange}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Ödeme / Tahsilat Türü</label>

                  <select
                    name="payment_method"
                    value={form.payment_method}
                    onChange={handleChange}
                  >
                    <option value="">Seçiniz</option>
                    <option value="Nakit">Nakit</option>
                    <option value="Banka">Banka</option>
                    <option value="EFT/Havale">EFT / Havale</option>
                    <option value="Kart">Kart</option>
                    <option value="Diğer">Diğer</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Belge No</label>

                  <input
                    name="document_number"
                    value={form.document_number}
                    onChange={handleChange}
                    placeholder="Fatura / makbuz no"
                  />
                </div>

                <div className="form-group full">
                  <label>Açıklama / Not</label>

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows="4"
                    placeholder="İşlemle ilgili not..."
                  />
                </div>

              </div>


              <div className="ledger-modal-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeModal}
                >
                  Vazgeç
                </button>

                <button type="submit" className="primary-button">
                  {editingTransaction ? "Güncelle" : "Kaydet"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}


function LedgerTable({
  title,
  type,
  rows,
  mobileHidden,
  onAdd,
  onEdit,
  onDelete,
}) {
  // Defterde kayıtlar eskiden yeniye sıralanır
  const sortedRows = [...rows].sort((a, b) =>
    String(a.transaction_date || "").localeCompare(
      String(b.transaction_date || "")
    )
  );

  const emptyCount = Math.max(MIN_ROWS - sortedRows.length, 0);

  const total = sortedRows.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  return (
    <section
      className={`kd-sayfa kd-${type} ${
        mobileHidden ? "kd-mobile-hidden" : ""
      }`}
    >

      <div className="kd-sayfa-ust">

        <h2>{title}</h2>

        <button
          className="primary-button small kd-no-print"
          onClick={onAdd}
        >
          + {type === "income" ? "Gelir" : "Gider"} Ekle
        </button>

      </div>


      <table className="kd-tablo">

        <thead>
          <tr>
            <th className="kd-c-sira">
              Sıra
              <br />
              No
            </th>
            <th className="kd-c-tarih">Tarih</th>
            <th className="kd-c-belge">
              Belge
              <br />
              No
            </th>
            <th className="kd-c-aciklama">Açıklama</th>
            <th className="kd-c-odeme">
              Ödeme
              <br />
              Türü
            </th>
            <th className="kd-c-tutar">Tutar</th>
            <th className="kd-c-islem kd-no-print">İşlem</th>
          </tr>
        </thead>

        <tbody>

          {sortedRows.map((row, index) => (

            <tr
              key={row.source === "payment" ? row.id : `manual-${row.id}`}
            >

              <td className="kd-ort">{index + 1}</td>

              <td className="kd-ort">
                {formatDate(row.transaction_date)}
              </td>

              <td className="kd-ort">{row.document_number || ""}</td>

              <td title={row.description || ""}>

                <strong>{row.category || ""}</strong>

                {row.description && (
                  <small className="kd-not"> — {row.description}</small>
                )}

                {row.source === "payment" && (
                  <span className="ledger-auto-badge kd-no-print">
                    Otomatik
                  </span>
                )}

              </td>

              <td className="kd-ort">{row.payment_method || ""}</td>

              <td className="kd-sag">{formatMoney(row.amount)}</td>

              <td className="kd-ort kd-no-print">

                {row.source === "manual" ? (

                  <div className="kd-islem">

                    <button type="button" onClick={() => onEdit(row)}>
                      Düzenle
                    </button>

                    <button
                      type="button"
                      className="danger"
                      onClick={() => onDelete(row.id)}
                    >
                      Sil
                    </button>

                  </div>

                ) : (

                  <span className="ledger-auto-text">Sistem</span>

                )}

              </td>

            </tr>

          ))}


          {Array.from({ length: emptyCount }).map((_, i) => (

            <tr key={`bos-${i}`} className="kd-bos">

              <td className="kd-ort">{sortedRows.length + i + 1}</td>
              <td />
              <td />
              <td />
              <td />
              <td />
              <td className="kd-no-print" />

            </tr>

          ))}

        </tbody>

        <tfoot>
          <tr>
            <td colSpan={5} className="kd-toplam-etiket">
              Toplam
            </td>
            <td className="kd-sag kd-toplam-deger">
              {formatMoney(total)}
            </td>
            <td className="kd-no-print" />
          </tr>
        </tfoot>

      </table>

    </section>
  );
}


export default BusinessLedger;