import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import Sidebar from "../components/Sidebar";

import {
  getCurrentUser,
  getApartments,
  getDues,
  getCash,
  getMeetings,
} from "../services/api";


function Dashboard() {
  const navigate = useNavigate();

  const now = new Date();

  const currentYear =
    now.getFullYear();

  const currentMonth =
    now.getMonth() + 1;


  const [user, setUser] =
    useState(null);

  const [apartment, setApartment] =
    useState(null);

  const [dues, setDues] =
    useState([]);

  const [cashData, setCashData] =
    useState({
      cash_balance: 0,

      period: {
        dues_income: 0,
        other_income: 0,
        total_income: 0,
        total_expense: 0,
        net: 0,
      },

      movements: [],
    });

  const [
    upcomingMeetings,
    setUpcomingMeetings
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  useEffect(() => {
    async function loadDashboard() {
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

        /*
         * =================================================
         * KULLANICI + APARTMAN
         * =================================================
         */

        const [
          userData,
          apartments,
        ] = await Promise.all([
          getCurrentUser(token),
          getApartments(token),
        ]);

        setUser(userData);

        if (
          !apartments ||
          apartments.length === 0
        ) {
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


        /*
         * =================================================
         * DASHBOARD VERİLERİ
         * =================================================
         */

        const [
          duesData,
          cashResponse,
          meetingsThisYear,
          meetingsNextYear,
        ] = await Promise.all([
          getDues(
            token,
            selectedApartment.id,
            currentYear,
            currentMonth
          ),

          getCash(
            token,
            selectedApartment.id,
            currentYear,
            currentMonth
          ),

          getMeetings(
            token,
            selectedApartment.id,
            currentYear,
            "",
            "planned"
          ),

          getMeetings(
            token,
            selectedApartment.id,
            currentYear + 1,
            "",
            "planned"
          ),
        ]);


        setDues(
          Array.isArray(duesData)
            ? duesData
            : []
        );

        setCashData(
          cashResponse || {
            cash_balance: 0,

            period: {
              dues_income: 0,
              other_income: 0,
              total_income: 0,
              total_expense: 0,
              net: 0,
            },

            movements: [],
          }
        );


        /*
         * =================================================
         * YAKLAŞAN TOPLANTILAR
         * =================================================
         */

        const allMeetings = [
          ...(
            Array.isArray(
              meetingsThisYear
            )
              ? meetingsThisYear
              : []
          ),

          ...(
            Array.isArray(
              meetingsNextYear
            )
              ? meetingsNextYear
              : []
          ),
        ];


        const upcoming =
          allMeetings
            .filter((meeting) => {
              if (
                !meeting.meeting_date
              ) {
                return false;
              }

              const meetingDate =
                new Date(
                  meeting.meeting_date
                );

              return (
                meetingDate >=
                new Date()
              );
            })
            .sort(
              (a, b) =>
                new Date(
                  a.meeting_date
                ) -
                new Date(
                  b.meeting_date
                )
            )
            .slice(0, 5);


        setUpcomingMeetings(
          upcoming
        );

      } catch (error) {
        console.error(
          "Dashboard yüklenemedi:",
          error
        );

        setError(
          error.message ||
          "Dashboard verileri yüklenemedi."
        );

      } finally {
        setLoading(false);
      }
    }

    loadDashboard();

  }, [
    navigate,
    currentYear,
    currentMonth,
  ]);


  /*
   * =====================================================
   * AİDAT HESAPLAMALARI
   * =====================================================
   */

  const dueSummary =
    useMemo(() => {
      const today =
        new Date();

      today.setHours(
        0,
        0,
        0,
        0
      );


      let totalDue = 0;
      let totalPaid = 0;
      let remaining = 0;

      let paidCount = 0;
      let waitingCount = 0;
      let overdueCount = 0;
      let debtorCount = 0;


      dues.forEach((due) => {
        const amount =
          Number(
            due.amount || 0
          );

        const paidAmount =
          Number(
            due.paid_amount || 0
          );

        const remainingAmount =
          Number(
            due.remaining_amount ??
            Math.max(
              amount -
              paidAmount,
              0
            )
          );


        totalDue += amount;
        totalPaid += paidAmount;
        remaining +=
          remainingAmount;


        if (
          remainingAmount <= 0
        ) {
          paidCount += 1;
          return;
        }


        debtorCount += 1;


        let overdue = false;

        if (due.due_date) {
          const dueDate =
            new Date(
              `${due.due_date}T00:00:00`
            );

          overdue =
            dueDate < today;
        }


        if (overdue) {
          overdueCount += 1;
        } else {
          waitingCount += 1;
        }
      });


      const collectionRate =
        totalDue > 0
          ? (
              totalPaid /
              totalDue
            ) * 100
          : 0;


      return {
        totalDue,
        totalPaid,
        remaining,

        paidCount,
        waitingCount,
        overdueCount,
        debtorCount,

        collectionRate:
          Math.min(
            100,
            Math.max(
              0,
              collectionRate
            )
          ),
      };

    }, [dues]);


  /*
   * =====================================================
   * BU AY GİDER SAYISI
   * =====================================================
   */

  const expenseCount =
    useMemo(() => {
      const movements =
        cashData.movements || [];

      return movements.filter(
        (movement) =>
          movement.movement_type ===
          "expense"
      ).length;

    }, [cashData]);


  /*
   * =====================================================
   * SON HAREKETLER
   * =====================================================
   */

  const recentMovements =
    useMemo(() => {
      return [
        ...(
          cashData.movements || []
        ),
      ]
        .sort(
          (a, b) =>
            new Date(
              b.date || 0
            ) -
            new Date(
              a.date || 0
            )
        )
        .slice(0, 5);

    }, [cashData]);


  function formatMoney(value) {
    return Number(
      value || 0
    ).toLocaleString(
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

    return new Date(
      `${value}T00:00:00`
    ).toLocaleDateString(
      "tr-TR"
    );
  }


  function formatMeetingDate(
    value
  ) {
    if (!value) {
      return "-";
    }

    return new Date(
      value
    ).toLocaleString(
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


  function getMovementTitle(
    movement
  ) {
    if (
      movement.source_type ===
      "payment"
    ) {
      return "Aidat Tahsilatı";
    }

    return (
      movement.category ||
      (
        movement.movement_type ===
        "income"
          ? "Gelir"
          : "Gider"
      )
    );
  }


  function logout() {
    localStorage.removeItem(
      "access_token"
    );

    navigate("/");
  }


  if (loading) {
    return (
      <div className="loading">
        Yönetim paneli
        yükleniyor...
      </div>
    );
  }


  if (
    !user ||
    !apartment
  ) {
    return null;
  }


  return (
    <div className="app-layout">

      <Sidebar
        active="dashboard"
      />


      <main className="main-content">

        <header className="topbar">

          <div>

            <h1>
              Dashboard
            </h1>

            <p>
              Apartmanınızın genel
              durumunu buradan takip
              edin.
            </p>

          </div>


          <div className="apartment-selector">

            🏢 {apartment.name}

          </div>

        </header>


        {error && (

          <div className="error-message">
            {error}
          </div>

        )}


        <section className="welcome-section">

          <h2>
            Hoş geldiniz,
            {" "}
            {user.name}
            {" "}
            👋
          </h2>

          <p>
            Bugünkü apartman yönetimi
            özetiniz hazır.
          </p>

        </section>


        {/* ==========================================
            ÜST İSTATİSTİKLER
        ========================================== */}

        <section className="stats-grid">

          <div className="stat-card">

            <span>
              Bu Ay Aidat
            </span>

            <strong>
              {formatMoney(
                dueSummary.totalDue
              )} TL
            </strong>

            <small>
              {dues.length}
              {" "}
              aidat kaydı
            </small>

          </div>


          <div className="stat-card">

            <span>
              Tahsil Edilen
            </span>

            <strong>
              {formatMoney(
                dueSummary.totalPaid
              )} TL
            </strong>

            <small>
              %
              {Math.round(
                dueSummary.collectionRate
              )}
              {" "}
              tahsilat
            </small>

          </div>


          <div className="stat-card">

            <span>
              Kalan Borç
            </span>

            <strong>
              {formatMoney(
                dueSummary.remaining
              )} TL
            </strong>

            <small>
              {
                dueSummary.debtorCount
              }
              {" "}
              borçlu daire
            </small>

          </div>


          <div className="stat-card">

            <span>
              Bu Ay Gider
            </span>

            <strong>
              {formatMoney(
                cashData.period
                  ?.total_expense
              )} TL
            </strong>

            <small>
              {expenseCount}
              {" "}
              işlem
            </small>

          </div>

        </section>


        <section className="dashboard-grid">

          {/* ==========================================
              AİDAT DURUMU
          ========================================== */}

          <div className="panel">

            <div className="panel-header">

              <h3>
                Aidat Durumu
              </h3>

              <span>
                %
                {Math.round(
                  dueSummary.collectionRate
                )}
              </span>

            </div>


            <div className="progress-bar">

              <div
                className="progress-value"
                style={{
                  width:
                    `${dueSummary.collectionRate}%`,
                }}
              />

            </div>


            <div className="status-row">

              <div>

                <strong>
                  {
                    dueSummary.paidCount
                  }
                </strong>

                <span>
                  Ödendi
                </span>

              </div>


              <div>

                <strong>
                  {
                    dueSummary.waitingCount
                  }
                </strong>

                <span>
                  Bekliyor
                </span>

              </div>


              <div>

                <strong>
                  {
                    dueSummary.overdueCount
                  }
                </strong>

                <span>
                  Gecikmiş
                </span>

              </div>

            </div>

          </div>


          {/* ==========================================
              HIZLI İŞLEMLER
          ========================================== */}

          <div className="panel">

            <div className="panel-header">

              <h3>
                Hızlı İşlemler
              </h3>

            </div>


            <div className="quick-actions">

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/aidatlar"
                  )
                }
              >
                + Aidat Oluştur
              </button>


              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/aidatlar"
                  )
                }
              >
                + Ödeme Ekle
              </button>


              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/gelir-gider"
                  )
                }
              >
                + Gider Ekle
              </button>


              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/karar-defteri"
                  )
                }
              >
                + Karar Ekle
              </button>


              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/daireler"
                  )
                }
              >
                + Daire Ekle
              </button>


              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/kisiler"
                  )
                }
              >
                + Kişi Ekle
              </button>

            </div>

          </div>


          {/* ==========================================
              SON İŞLEMLER
          ========================================== */}

          <div className="panel">

            <div className="panel-header">

              <h3>
                Son İşlemler
              </h3>

              {recentMovements.length >
                0 && (

                <button
                  type="button"
                  className="dashboard-link-button"
                  onClick={() =>
                    navigate(
                      "/kasa"
                    )
                  }
                >
                  Tümünü Gör
                </button>

              )}

            </div>


            {recentMovements.length ===
            0 ? (

              <div className="empty-dashboard-state">

                <span>
                  📋
                </span>

                <strong>
                  Bu ay henüz işlem
                  bulunmuyor
                </strong>

                <p>
                  Aidat tahsilatı,
                  gelir veya gider
                  eklendiğinde burada
                  görüntülenecek.
                </p>

              </div>

            ) : (

              <div className="dashboard-movement-list">

                {recentMovements.map(
                  (movement) => (

                    <div
                      className="dashboard-movement-item"
                      key={
                        movement.id
                      }
                    >

                      <div className="dashboard-movement-left">

                        <div
                          className={
                            movement
                              .movement_type ===
                            "income"
                              ? "dashboard-movement-icon income"
                              : "dashboard-movement-icon expense"
                          }
                        >

                          {movement
                            .movement_type ===
                          "income"
                            ? "↑"
                            : "↓"}

                        </div>


                        <div>

                          <strong>
                            {getMovementTitle(
                              movement
                            )}
                          </strong>

                          <span>
                            {movement.description ||
                              "-"}
                          </span>

                          <small>
                            {formatDate(
                              movement.date
                            )}
                          </small>

                        </div>

                      </div>


                      <strong
                        className={
                          movement
                            .movement_type ===
                          "income"
                            ? "positive-balance"
                            : "negative-balance"
                        }
                      >

                        {movement
                          .movement_type ===
                        "income"
                          ? "+"
                          : "-"}

                        {formatMoney(
                          movement.amount
                        )}
                        {" "}
                        TL

                      </strong>

                    </div>

                  )
                )}

              </div>

            )}

          </div>


          {/* ==========================================
              YAKLAŞAN TOPLANTILAR
          ========================================== */}

          <div className="panel">

            <div className="panel-header">

              <h3>
                Yaklaşan Toplantılar
              </h3>


              {upcomingMeetings.length >
                0 && (

                <button
                  type="button"
                  className="dashboard-link-button"
                  onClick={() =>
                    navigate(
                      "/toplantilar"
                    )
                  }
                >
                  Tümünü Gör
                </button>

              )}

            </div>


            {upcomingMeetings.length ===
            0 ? (

              <div className="empty-dashboard-state">

                <span>
                  📅
                </span>

                <strong>
                  Yaklaşan toplantı yok
                </strong>

                <p>
                  Planlanan toplantılar
                  burada
                  görüntülenecek.
                </p>

              </div>

            ) : (

              <div className="dashboard-meeting-list">

                {upcomingMeetings.map(
                  (meeting) => (

                    <button
                      type="button"
                      className="dashboard-meeting-item"
                      key={
                        meeting.id
                      }
                      onClick={() =>
                        navigate(
                          "/toplantilar"
                        )
                      }
                    >

                      <div className="dashboard-meeting-date">

                        📅

                      </div>


                      <div>

                        <strong>
                          {meeting.title}
                        </strong>

                        <span>
                          {formatMeetingDate(
                            meeting.meeting_date
                          )}
                        </span>

                        <small>
                          📍
                          {" "}
                          {meeting.location ||
                            "Yer belirtilmedi"}
                        </small>

                      </div>

                    </button>

                  )
                )}

              </div>

            )}

          </div>

        </section>


        {/* ==========================================
            APARTMAN BİLGİLERİ
        ========================================== */}

        <section className="apartment-summary">

          <div className="panel">

            <div className="panel-header">

              <h3>
                Apartman Bilgileri
              </h3>


              <button
                type="button"
                className="dashboard-link-button"
                onClick={() =>
                  navigate(
                    "/apartman-bilgileri"
                  )
                }
              >
                Detayları Gör
              </button>

            </div>


            <div className="apartment-info-grid">

              <div>

                <span>
                  Apartman
                </span>

                <strong>
                  {apartment.name}
                </strong>

              </div>


              <div>

                <span>
                  Blok Sayısı
                </span>

                <strong>
                  {apartment.block_count ||
                    1}
                </strong>

              </div>


              <div>

                <span>
                  Kat Sayısı
                </span>

                <strong>
                  {apartment.floor_count ||
                    "-"}
                </strong>

              </div>


              <div>

                <span>
                  Daire Sayısı
                </span>

                <strong>
                  {apartment.unit_count ||
                    0}
                </strong>

              </div>


              <div>

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


              <div>

                <span>
                  Adres
                </span>

                <strong>
                  {apartment.address ||
                    "-"}
                </strong>

              </div>

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}


export default Dashboard;