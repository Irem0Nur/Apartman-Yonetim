import {
  useEffect,
  useState,
} from "react";

import Sidebar from "../components/Sidebar";

import {
  getApartments,
  getCash,
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


function Cash() {
  const now = new Date();

  const token =
    localStorage.getItem(
      "access_token"
    );

  const [apartment, setApartment] =
    useState(null);

  const [year, setYear] =
    useState(
      now.getFullYear()
    );

  const [month, setMonth] =
    useState(
      now.getMonth() + 1
    );

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

      movement_count: 0,

      movements: [],
    });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


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

    loadCashData(
      apartment
    );

  }, [
    apartment,
    year,
    month,
    token,
  ]);


  async function loadCashData(
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

      const data =
        await getCash(
          token,
          apartmentData.id,
          year,
          month
        );

      setCashData(
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


  function formatMoney(value) {
    return Number(
      value || 0
    ).toLocaleString(
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

    return (
      `${dayValue}.` +
      `${monthValue}.` +
      `${yearValue}`
    );
  }


  function getMovementLabel(
    movement
  ) {
    if (
      movement.movement_type ===
      "income"
    ) {
      return "Giriş";
    }

    return "Çıkış";
  }


  return (
    <div className="app-layout">

      <Sidebar active="cash" />


      <main className="main-content">

        <div className="page-header">

          <div>

            <h1>
              Kasa
            </h1>

            <p>
              Tüm para girişlerini,
              çıkışlarını ve mevcut
              kasa bakiyesini takip edin.
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
                  Number(
                    e.target.value
                  )
                )
              }
            >

              {Array.from(
                {
                  length: 9,
                },
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
                  Number(
                    e.target.value
                  )
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


        {error && (

          <div className="error-message">
            {error}
          </div>

        )}


        <div className="cash-balance-card">

          <div>

            <span>
              Güncel Kasa Bakiyesi
            </span>

            <p>
              Tüm zamanlardaki tahsilat,
              diğer gelir ve giderlerin
              toplam sonucu
            </p>

          </div>


          <strong
            className={
              Number(
                cashData.cash_balance
              ) < 0
                ? "negative-balance"
                : "positive-balance"
            }
          >

            {formatMoney(
              cashData.cash_balance
            )} TL

          </strong>

        </div>


        <div className="finance-summary cash-summary">

          <div className="finance-card">

            <span>
              Aidat Tahsilatı
            </span>

            <strong>
              {formatMoney(
                cashData.period
                  ?.dues_income
              )} TL
            </strong>

          </div>


          <div className="finance-card income-card">

            <span>
              Diğer Gelir
            </span>

            <strong>
              {formatMoney(
                cashData.period
                  ?.other_income
              )} TL
            </strong>

          </div>


          <div className="finance-card income-card">

            <span>
              Dönem Girişi
            </span>

            <strong>
              {formatMoney(
                cashData.period
                  ?.total_income
              )} TL
            </strong>

          </div>


          <div className="finance-card expense-card">

            <span>
              Dönem Çıkışı
            </span>

            <strong>
              {formatMoney(
                cashData.period
                  ?.total_expense
              )} TL
            </strong>

          </div>


          <div className="finance-card balance-card">

            <span>
              Dönem Net
            </span>

            <strong
              className={
                Number(
                  cashData.period
                    ?.net
                ) < 0
                  ? "negative-balance"
                  : "positive-balance"
              }
            >

              {formatMoney(
                cashData.period
                  ?.net
              )} TL

            </strong>

          </div>

        </div>


        <div className="content-card">

          <div className="cash-table-header">

            <div>

              <h2>
                Kasa Hareketleri
              </h2>

              <p>
                Seçilen dönemdeki
                aidat tahsilatları,
                diğer gelirler ve
                giderler.
              </p>

            </div>


            <div className="cash-movement-count">

              {
                cashData.movement_count
                || 0
              }

              {" "}hareket

            </div>

          </div>


          {loading ? (

            <p>
              Kasa hareketleri
              yükleniyor...
            </p>

          ) : (
            cashData.movements
              ?.length === 0
          ) ? (

            <div className="empty-state">

              <h3>
                Bu dönemde kasa
                hareketi yok.
              </h3>

              <p>
                Aidat tahsilatı veya
                gelir/gider kaydı
                oluşturulduğunda burada
                görünecek.
              </p>

            </div>

          ) : (

            <div className="table-wrapper">

              <table className="data-table">

                <thead>

                  <tr>

                    <th>
                      Tarih
                    </th>

                    <th>
                      Hareket
                    </th>

                    <th>
                      Kaynak
                    </th>

                    <th>
                      Kategori
                    </th>

                    <th>
                      Açıklama
                    </th>

                    <th>
                      Tutar
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {cashData.movements.map(
                    (movement) => (

                      <tr
                        key={
                          movement.id
                        }
                      >

                        <td>
                          {formatDate(
                            movement.date
                          )}
                        </td>


                        <td>

                          <span
                            className={
                              movement
                                .movement_type ===
                              "income"
                                ? "transaction-type income"
                                : "transaction-type expense"
                            }
                          >

                            {getMovementLabel(
                              movement
                            )}

                          </span>

                        </td>


                        <td>

                          {movement
                            .source_type ===
                          "payment"
                            ? "Aidat"
                            : "Gelir / Gider"}

                        </td>


                        <td>
                          {
                            movement.category
                          }
                        </td>


                        <td>
                          {
                            movement.description
                            || "-"
                          }
                        </td>


                        <td>

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
                            )} TL

                          </strong>

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


export default Cash;