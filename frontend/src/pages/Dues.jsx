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

  getUnits,

  getPreviousPeriodDebts,
  createPreviousPeriodDebt,
  updatePreviousPeriodDebt,
  deletePreviousPeriodDebt,
  getPreviousPeriodDebtPayments,
  createPreviousPeriodDebtPayment,
  deletePreviousPeriodDebtPayment,
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


  // ==================================================
  // AYLIK AİDAT ÖDEME MODALI
  // ==================================================

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


  // ==================================================
  // ÖNCEKİ DÖNEM BORÇLARI
  // ==================================================

  const [previousDebts, setPreviousDebts] =
    useState([]);

  const [previousDebtTotals, setPreviousDebtTotals] =
    useState({
      amount: 0,
      paid: 0,
      remaining: 0,
    });

  const [previousDebtLoading, setPreviousDebtLoading] =
    useState(false);


  // Borç ekleme / düzenleme
  const [debtModalOpen, setDebtModalOpen] =
    useState(false);

  const [editingDebt, setEditingDebt] =
    useState(null);

  const [debtForm, setDebtForm] =
    useState({
      unit_id: "",
      amount: "",
      period: "",
      description: "",
    });

  const [debtFormLoading, setDebtFormLoading] =
    useState(false);

  const [debtFormError, setDebtFormError] =
    useState("");


  // Önceki dönem borcu ödeme modalı
  const [previousPaymentModalOpen, setPreviousPaymentModalOpen] =
    useState(false);

  const [selectedPreviousDebt, setSelectedPreviousDebt] =
    useState(null);

  const [previousDebtPayments, setPreviousDebtPayments] =
    useState([]);

  const [previousPaymentLoading, setPreviousPaymentLoading] =
    useState(false);

  const [previousPaymentError, setPreviousPaymentError] =
    useState("");

  const [previousPaymentForm, setPreviousPaymentForm] =
    useState({
      amount: "",
      payment_date:
        new Date().toISOString().slice(0, 10),
      payment_method: "cash",
      description: "",
    });


  // Daire listesi
  const [units, setUnits] =
    useState([]);


  // ==================================================
  // AYLIK AİDATLARI GETİR
  // ==================================================

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


  // ==================================================
  // ÖNCEKİ DÖNEM BORÇLARINI GETİR
  // ==================================================

  async function fetchPreviousDebts(
    selectedApartment
  ) {
    const token =
      localStorage.getItem("access_token");

    if (!token || !selectedApartment) {
      return;
    }

    const data =
      await getPreviousPeriodDebts(
        token,
        selectedApartment.id
      );

    setPreviousDebts(
      data.debts || []
    );

    setPreviousDebtTotals(
      data.totals || {
        amount: 0,
        paid: 0,
        remaining: 0,
      }
    );
  }


  // ==================================================
  // DAİRELERİ GETİR
  // ==================================================

  async function fetchUnits(
    selectedApartment
  ) {
    const token =
      localStorage.getItem("access_token");

    if (!token || !selectedApartment) {
      return;
    }

    const data =
      await getUnits(
        token,
        selectedApartment.id
      );

    setUnits(data || []);
  }


  // ==================================================
  // SAYFA İLK YÜKLENDİĞİNDE
  // ==================================================

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

        await fetchPreviousDebts(
          selectedApartment
        );

        await fetchUnits(
          selectedApartment
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


  // ==================================================
  // AY / YIL DEĞİŞİNCE AİDATLARI YENİLE
  // ==================================================

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


  // ==================================================
  // AİDAT OLUŞTUR
  // ==================================================

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


  // ==================================================
  // AYLIK AİDAT ÖDEME MODALI
  // ==================================================

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


  // ==================================================
  // ÖNCEKİ DÖNEM BORCU MODALI AÇ
  // ==================================================

  function openAddDebtModal() {
    setEditingDebt(null);

    setDebtForm({
      unit_id: "",
      amount: "",
      period: "",
      description: "",
    });

    setDebtFormError("");
    setDebtModalOpen(true);
  }


  function openEditDebtModal(debt) {
    setEditingDebt(debt);

    setDebtForm({
      unit_id: debt.unit_id,
      amount: debt.amount,
      period: debt.period || "",
      description: debt.description || "",
    });

    setDebtFormError("");
    setDebtModalOpen(true);
  }


  function closeDebtModal() {
    setDebtModalOpen(false);
    setEditingDebt(null);
    setDebtFormError("");

    setDebtForm({
      unit_id: "",
      amount: "",
      period: "",
      description: "",
    });
  }


  function handleDebtFormChange(event) {
    const {
      name,
      value,
    } = event.target;

    setDebtForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  }


  // ==================================================
  // ÖNCEKİ DÖNEM BORCU KAYDET
  // ==================================================

  async function handleDebtSubmit(event) {
    event.preventDefault();

    const token =
      localStorage.getItem(
        "access_token"
      );

    if (!token || !apartment) {
      return;
    }

    try {
      setDebtFormLoading(true);
      setDebtFormError("");

      if (!debtForm.unit_id) {
        throw new Error(
          "Lütfen bir daire seçin."
        );
      }

      if (
        !debtForm.amount ||
        Number(debtForm.amount) <= 0
      ) {
        throw new Error(
          "Geçerli bir borç tutarı girin."
        );
      }

      const debtData = {
        unit_id:
          Number(debtForm.unit_id),

        amount:
          debtForm.amount,

        period:
          debtForm.period,

        description:
          debtForm.description,
      };

      if (editingDebt) {
        await updatePreviousPeriodDebt(
          token,
          editingDebt.id,
          debtData
        );

        setMessage(
          "Önceki dönem borcu güncellendi."
        );

      } else {
        await createPreviousPeriodDebt(
          token,
          debtData
        );

        setMessage(
          "Önceki dönem borcu eklendi."
        );
      }

      await fetchPreviousDebts(
        apartment
      );

      closeDebtModal();

    } catch (err) {
      setDebtFormError(
        err.message
      );

    } finally {
      setDebtFormLoading(false);
    }
  }


  // ==================================================
  // ÖNCEKİ DÖNEM BORCU SİL
  // ==================================================

  async function handleDeleteDebt(debt) {
    const approved =
      window.confirm(
        `${debt.block_name || "-"} / Daire ${debt.unit_number} için önceki dönem borcunu silmek istediğinize emin misiniz?`
      );

    if (!approved) {
      return;
    }

    const token =
      localStorage.getItem(
        "access_token"
      );

    if (!token) {
      return;
    }

    try {
      setPreviousDebtLoading(true);
      setError("");

      await deletePreviousPeriodDebt(
        token,
        debt.id
      );

      await fetchPreviousDebts(
        apartment
      );

      setMessage(
        "Önceki dönem borcu silindi."
      );

    } catch (err) {
      setError(err.message);

    } finally {
      setPreviousDebtLoading(false);
    }
  }


  // ==================================================
  // ÖNCEKİ DÖNEM BORCU ÖDEME MODALI
  // ==================================================

  async function openPreviousPaymentModal(
    debt
  ) {
    const token =
      localStorage.getItem(
        "access_token"
      );

    if (!token) {
      navigate("/");
      return;
    }

    try {
      setPreviousPaymentLoading(true);
      setPreviousPaymentError("");

      setSelectedPreviousDebt(
        debt
      );

      setPreviousPaymentForm({
        amount: "",
        payment_date:
          new Date()
            .toISOString()
            .slice(0, 10),
        payment_method: "cash",
        description: "",
      });

      const data =
        await getPreviousPeriodDebtPayments(
          token,
          debt.id
        );

      setPreviousDebtPayments(
        data || []
      );

      setPreviousPaymentModalOpen(
        true
      );

    } catch (err) {
      setError(err.message);

    } finally {
      setPreviousPaymentLoading(false);
    }
  }


  function closePreviousPaymentModal() {
    setPreviousPaymentModalOpen(false);
    setSelectedPreviousDebt(null);
    setPreviousDebtPayments([]);
    setPreviousPaymentError("");
  }


  function handlePreviousPaymentChange(
    event
  ) {
    const {
      name,
      value,
    } = event.target;

    setPreviousPaymentForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  }


  // ==================================================
  // ÖNCEKİ DÖNEM BORCUNA ÖDEME EKLE
  // ==================================================

  async function handlePreviousPaymentSubmit(
    event
  ) {
    event.preventDefault();

    const token =
      localStorage.getItem(
        "access_token"
      );

    if (
      !token ||
      !selectedPreviousDebt
    ) {
      return;
    }

    try {
      setPreviousPaymentLoading(true);
      setPreviousPaymentError("");

      await createPreviousPeriodDebtPayment(
        token,
        selectedPreviousDebt.id,
        {
          amount:
            previousPaymentForm.amount,

          payment_date:
            previousPaymentForm.payment_date,

          payment_method:
            previousPaymentForm.payment_method,

          description:
            previousPaymentForm.description,
        }
      );

      const paymentList =
        await getPreviousPeriodDebtPayments(
          token,
          selectedPreviousDebt.id
        );

      setPreviousDebtPayments(
        paymentList
      );

      await fetchPreviousDebts(
        apartment
      );

      const updatedDebts =
        await getPreviousPeriodDebts(
          token,
          apartment.id
        );

      const updatedDebt =
        updatedDebts.debts?.find(
          (item) =>
            item.id ===
            selectedPreviousDebt.id
        );

      if (updatedDebt) {
        setSelectedPreviousDebt(
          updatedDebt
        );
      }

      setPreviousPaymentForm({
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
      setPreviousPaymentError(
        err.message
      );

    } finally {
      setPreviousPaymentLoading(false);
    }
  }


  // ==================================================
  // ÖNCEKİ DÖNEM ÖDEMESİ SİL
  // ==================================================

  async function handleDeletePreviousPayment(
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

    if (
      !token ||
      !selectedPreviousDebt
    ) {
      return;
    }

    try {
      setPreviousPaymentLoading(true);
      setPreviousPaymentError("");

      await deletePreviousPeriodDebtPayment(
        token,
        paymentId
      );

      const paymentList =
        await getPreviousPeriodDebtPayments(
          token,
          selectedPreviousDebt.id
        );

      setPreviousDebtPayments(
        paymentList
      );

      await fetchPreviousDebts(
        apartment
      );

      const updatedDebts =
        await getPreviousPeriodDebts(
          token,
          apartment.id
        );

      const updatedDebt =
        updatedDebts.debts?.find(
          (item) =>
            item.id ===
            selectedPreviousDebt.id
        );

      if (updatedDebt) {
        setSelectedPreviousDebt(
          updatedDebt
        );
      }

    } catch (err) {
      setPreviousPaymentError(
        err.message
      );

    } finally {
      setPreviousPaymentLoading(false);
    }
  }


  // ==================================================
  // HESAPLAMALAR
  // ==================================================

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


  // ==================================================
  // GEÇMİŞTEN GELEN BORÇLARI DAİRE BAZINDA TOPLA
  // ==================================================

  const previousDebtByUnit =
    useMemo(() => {
      const result = {};

      previousDebts.forEach(
        (debt) => {

          // Öncelikle unit_id üzerinden eşleştiriyoruz.
          if (debt.unit_id !== null &&
              debt.unit_id !== undefined) {

            const idKey =
              `id:${debt.unit_id}`;

            if (!result[idKey]) {
              result[idKey] = 0;
            }

            result[idKey] +=
              Number(
                debt.remaining_amount || 0
              );
          }


          // unit_id gelmezse blok + daire
          // üzerinden de eşleştirebilmek için
          // ikinci bir anahtar oluşturuyoruz.

          const block =
            String(
              debt.block_name || ""
            ).trim();

          const unitNumber =
            String(
              debt.unit_number || ""
            ).trim();

          const locationKey =
            `location:${block}__${unitNumber}`;

          if (!result[locationKey]) {
            result[locationKey] = 0;
          }

          result[locationKey] +=
            Number(
              debt.remaining_amount || 0
            );
        }
      );

      return result;

    }, [previousDebts]);


  // ==================================================
  // DAİRENİN GEÇMİŞTEN GELEN BORCUNU BUL
  // ==================================================

  function getPreviousDebtForDue(due) {

    // Önce unit_id varsa onu kullan.
    if (
      due.unit_id !== null &&
      due.unit_id !== undefined
    ) {

      const idKey =
        `id:${due.unit_id}`;

      if (
        previousDebtByUnit[idKey] !==
        undefined
      ) {
        return previousDebtByUnit[idKey];
      }
    }


    // unit_id yoksa blok + daire
    // üzerinden eşleştir.

    const block =
      String(
        due.block_name || ""
      ).trim();

    const unitNumber =
      String(
        due.unit_number || ""
      ).trim();

    const locationKey =
      `location:${block}__${unitNumber}`;

    return (
      previousDebtByUnit[
        locationKey
      ] || 0
    );
  }


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


  // ==================================================
  // YÜKLENİYOR
  // ==================================================

  if (loading && !apartment) {
    return (
      <div className="loading">
        Aidatlar yükleniyor...
      </div>
    );
  }


  // ==================================================
  // EKRAN
  // ==================================================

  return (
    <div className="app-layout">

      <Sidebar active="dues" />

      <main className="main-content">

        {/* ==================================================
            BAŞLIK
        ================================================== */}

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


        {/* ==================================================
            AY / YIL SEÇİMİ
        ================================================== */}

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


        {/* ==================================================
            MESAJLAR
        ================================================== */}

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


        {/* ==================================================
            AYLIK AİDAT ÖZETİ
        ================================================== */}

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


        {/* ==================================================
            AYLIK AİDAT TABLOSU
        ================================================== */}

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

                    <th>
                      Blok / Daire
                    </th>

                    <th>
                      Daire Sahibi
                    </th>

                    {/* YENİ SÜTUN */}
                    <th>
                      Geçmişten Gelen Borç
                    </th>

                    <th>
                      Dönem
                    </th>

                    <th>
                      Aidat
                    </th>

                    <th>
                      Ödenen
                    </th>

                    <th>
                      Kalan
                    </th>

                    <th>
                      Durum
                    </th>

                    <th>
                      İşlem
                    </th>

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


                        {/* ==================================================
                            GEÇMİŞTEN GELEN BORÇ
                        ================================================== */}

                        <td>

                          <strong>
                            {formatMoney(
                              getPreviousDebtForDue(
                                due
                              )
                            )}{" "}
                            TL
                          </strong>

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


        {/* ==================================================
            ÖNCEKİ DÖNEM BORÇLARI
        ================================================== */}

        <section
          className="panel units-panel"
          style={{
            marginTop: "24px",
          }}
        >

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "16px",
              marginBottom: "20px",
            }}
          >

            <div>

              <h2
                style={{
                  margin: 0,
                }}
              >
                Önceki Dönem Borçları
              </h2>

              <p
                style={{
                  marginTop: "6px",
                  marginBottom: 0,
                  color: "#6b7280",
                }}
              >
                Geçmiş dönemlerden devreden
                borçları buradan takip
                edebilirsiniz.
              </p>

            </div>


            <button
              className="primary-button"
              onClick={
                openAddDebtModal
              }
            >
              + Borç Ekle
            </button>

          </div>


          {/* ÖZET */}

          <section
            className="units-summary"
            style={{
              marginBottom: "20px",
            }}
          >

            <div className="mini-stat">

              <span>
                Devreden Borç
              </span>

              <strong>
                {formatMoney(
                  previousDebtTotals.amount
                )}{" "}
                TL
              </strong>

            </div>


            <div className="mini-stat">

              <span>
                Ödenen
              </span>

              <strong>
                {formatMoney(
                  previousDebtTotals.paid
                )}{" "}
                TL
              </strong>

            </div>


            <div className="mini-stat">

              <span>
                Kalan
              </span>

              <strong>
                {formatMoney(
                  previousDebtTotals.remaining
                )}{" "}
                TL
              </strong>

            </div>

          </section>


          {previousDebtLoading ? (

            <div className="loading">
              Önceki dönem borçları
              yükleniyor...
            </div>

          ) : previousDebts.length ===
            0 ? (

            <div
              className="empty-dashboard-state"
            >

              <span>📋</span>

              <strong>
                Önceki dönem borcu bulunmuyor
              </strong>

              <p>
                Bir daire için geçmiş
                dönemden devreden borç
                ekleyebilirsiniz.
              </p>

              <button
                className="primary-button"
                onClick={
                  openAddDebtModal
                }
              >
                İlk Borcu Ekle
              </button>

            </div>

          ) : (

            <div className="units-table-wrapper">

              <table className="units-table dues-table">

                <thead>

                  <tr>

                    <th>
                      Blok / Daire
                    </th>

                    <th>
                      Dairede Oturan
                    </th>

                    <th>
                      Dönem
                    </th>

                    <th>
                      Devreden Borç
                    </th>

                    <th>
                      Ödenen
                    </th>

                    <th>
                      Kalan
                    </th>

                    <th>
                      Durum
                    </th>

                    <th>
                      İşlem
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {previousDebts.map(
                    (debt) => (

                      <tr key={debt.id}>

                        <td>

                          <strong>
                            {debt.block_name ||
                              "-"}
                          </strong>

                          {" / "}

                          Daire{" "}
                          {debt.unit_number}

                        </td>


                        <td>

                          {debt.people?.length >
                          0 ? (

                            <div className="unit-person-list">

                              {debt.people.map(
                                (
                                  person,
                                  index
                                ) => (

                                  <span
                                    key={`${person}-${index}`}
                                  >
                                    {person}
                                  </span>

                                )
                              )}

                            </div>

                          ) : (

                            <span className="unit-person-empty">
                              Oturan eklenmedi
                            </span>

                          )}

                        </td>


                        <td>
                          {debt.period ||
                            "-"}
                        </td>


                        <td>
                          {formatMoney(
                            debt.amount
                          )}{" "}
                          TL
                        </td>


                        <td>
                          {formatMoney(
                            debt.paid_amount
                          )}{" "}
                          TL
                        </td>


                        <td>
                          {formatMoney(
                            debt.remaining_amount
                          )}{" "}
                          TL
                        </td>


                        <td>

                          <span
                            className={
                              `due-status ${debt.status}`
                            }
                          >
                            {getStatusLabel(
                              debt.status
                            )}
                          </span>

                        </td>


                        <td>

                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              flexWrap:
                                "wrap",
                            }}
                          >

                            <button
                              className="payment-button"
                              onClick={() =>
                                openPreviousPaymentModal(
                                  debt
                                )
                              }
                            >
                              {debt.status ===
                              "paid"
                                ? "Ödemeleri Gör"
                                : "+ Ödeme"}
                            </button>


                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() =>
                                openEditDebtModal(
                                  debt
                                )
                              }
                            >
                              Düzenle
                            </button>


                            <button
                              type="button"
                              className="danger-button"
                              onClick={() =>
                                handleDeleteDebt(
                                  debt
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


      {/* ==================================================
          AYLIK AİDAT ÖDEME MODALI
      ================================================== */}

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

                <span>
                  Aidat
                </span>

                <strong>
                  {formatMoney(
                    selectedDue.amount
                  )}{" "}
                  TL
                </strong>

              </div>


              <div>

                <span>
                  Ödenen
                </span>

                <strong>
                  {formatMoney(
                    selectedDue.paid_amount
                  )}{" "}
                  TL
                </strong>

              </div>


              <div>

                <span>
                  Kalan
                </span>

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

                      <span>
                        TL
                      </span>

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


      {/* ==================================================
          ÖNCEKİ DÖNEM BORCU EKLE / DÜZENLE MODALI
      ================================================== */}

      {debtModalOpen && (

        <div className="modal-overlay">

          <div className="modal-card">

            <div className="modal-header">

              <div>

                <h2>
                  {editingDebt
                    ? "Borcu Düzenle"
                    : "Önceki Dönem Borcu Ekle"}
                </h2>

                <p>
                  Borç daireye ait olacaktır.
                </p>

              </div>


              <button
                type="button"
                className="modal-close"
                onClick={
                  closeDebtModal
                }
              >
                ×
              </button>

            </div>


            <form
              onSubmit={
                handleDebtSubmit
              }
            >

              {!editingDebt && (

                <div className="form-group">

                  <label>
                    Daire *
                  </label>

                  <select
                    name="unit_id"
                    value={
                      debtForm.unit_id
                    }
                    onChange={
                      handleDebtFormChange
                    }
                    required
                  >

                    <option value="">
                      Daire seçin
                    </option>

                    {units.map(
                      (unit) => (

                        <option
                          key={unit.id}
                          value={unit.id}
                        >
                          {unit.block_name ||
                            "-"}
                          {" / "}
                          Daire{" "}
                          {unit.unit_number}
                        </option>

                      )
                    )}

                  </select>

                </div>

              )}


              {editingDebt && (

                <div className="form-group">

                  <label>
                    Daire
                  </label>

                  <input
                    type="text"
                    value={
                      `${editingDebt.block_name || "-"} / Daire ${editingDebt.unit_number}`
                    }
                    disabled
                  />

                </div>

              )}


              <div className="form-group">

                <label>
                  Borç Tutarı *
                </label>

                <div className="money-input">

                  <input
                    type="number"
                    name="amount"
                    min="0.01"
                    step="0.01"
                    value={
                      debtForm.amount
                    }
                    onChange={
                      handleDebtFormChange
                    }
                    placeholder="Örn. 2500"
                    required
                  />

                  <span>
                    TL
                  </span>

                </div>

              </div>


              <div className="form-group">

                <label>
                  Dönem
                </label>

                <input
                  type="text"
                  name="period"
                  value={
                    debtForm.period
                  }
                  onChange={
                    handleDebtFormChange
                  }
                  placeholder="Örn. 2025 yılı devreden borcu"
                />

              </div>


              <div className="form-group">

                <label>
                  Açıklama
                </label>

                <textarea
                  name="description"
                  value={
                    debtForm.description
                  }
                  onChange={
                    handleDebtFormChange
                  }
                  placeholder="İsteğe bağlı açıklama"
                  rows="3"
                />

              </div>


              {debtFormError && (

                <div className="error-message">
                  {debtFormError}
                </div>

              )}


              <div className="modal-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    closeDebtModal
                  }
                  disabled={
                    debtFormLoading
                  }
                >
                  Vazgeç
                </button>


                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    debtFormLoading
                  }
                >
                  {debtFormLoading
                    ? "Kaydediliyor..."
                    : editingDebt
                      ? "Değişiklikleri Kaydet"
                      : "Borcu Kaydet"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* ==================================================
          ÖNCEKİ DÖNEM BORCU ÖDEME MODALI
      ================================================== */}

      {previousPaymentModalOpen &&
        selectedPreviousDebt && (

        <div className="modal-overlay">

          <div className="modal-card payment-modal">

            <div className="modal-header">

              <div>

                <h2>
                  Önceki Dönem Borcu
                </h2>

                <p>
                  {selectedPreviousDebt.block_name ||
                    "-"}
                  {" / "}
                  Daire{" "}
                  {selectedPreviousDebt.unit_number}
                </p>

              </div>


              <button
                type="button"
                className="modal-close"
                onClick={
                  closePreviousPaymentModal
                }
              >
                ×
              </button>

            </div>


            <div className="payment-summary">

              <div>

                <span>
                  Devreden Borç
                </span>

                <strong>
                  {formatMoney(
                    selectedPreviousDebt.amount
                  )}{" "}
                  TL
                </strong>

              </div>


              <div>

                <span>
                  Ödenen
                </span>

                <strong>
                  {formatMoney(
                    selectedPreviousDebt.paid_amount
                  )}{" "}
                  TL
                </strong>

              </div>


              <div>

                <span>
                  Kalan
                </span>

                <strong>
                  {formatMoney(
                    selectedPreviousDebt.remaining_amount
                  )}{" "}
                  TL
                </strong>

              </div>

            </div>


            {selectedPreviousDebt.status !==
              "paid" && (

              <form
                onSubmit={
                  handlePreviousPaymentSubmit
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
                          selectedPreviousDebt
                            .remaining_amount
                        }
                        value={
                          previousPaymentForm.amount
                        }
                        onChange={
                          handlePreviousPaymentChange
                        }
                        placeholder="Örn. 1000"
                        required
                      />

                      <span>
                        TL
                      </span>

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
                        previousPaymentForm
                          .payment_date
                      }
                      onChange={
                        handlePreviousPaymentChange
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
                        previousPaymentForm
                          .payment_method
                      }
                      onChange={
                        handlePreviousPaymentChange
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
                        previousPaymentForm
                          .description
                      }
                      onChange={
                        handlePreviousPaymentChange
                      }
                      placeholder="Örn. Eski borç ödemesi"
                    />

                  </div>

                </div>


                {previousPaymentError && (

                  <div className="error-message">
                    {previousPaymentError}
                  </div>

                )}


                <div className="modal-actions">

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={
                      previousPaymentLoading
                    }
                  >
                    {previousPaymentLoading
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


              {previousPaymentLoading &&
              previousDebtPayments.length === 0 ? (

                <p>
                  Ödemeler yükleniyor...
                </p>

              ) : previousDebtPayments.length ===
                0 ? (

                <div className="payment-empty">
                  Henüz ödeme kaydı yok.
                </div>

              ) : (

                <div className="payment-history-list">

                  {previousDebtPayments.map(
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
                            handleDeletePreviousPayment(
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