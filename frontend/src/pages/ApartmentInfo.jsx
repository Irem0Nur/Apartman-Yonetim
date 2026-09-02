import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import { getApartments } from "../services/api";

function formatMoney(value) {
  return Number(value || 0).toLocaleString(
    "tr-TR",
    {
      maximumFractionDigits: 2,
    }
  );
}

function ApartmentInfo() {
  const navigate = useNavigate();

  const [apartment, setApartment] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadApartment() {
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
          navigate("/apartman-olustur");
          return;
        }

        setApartment(apartments[0]);
      } catch (err) {
        console.error(err);

        if (
          err.message ===
          "Apartmanlar alınamadı"
        ) {
          setError(
            "Apartman bilgileri alınamadı."
          );
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    }

    loadApartment();
  }, [navigate]);

  if (loading) {
    return (
      <div className="loading">
        Apartman bilgileri yükleniyor...
      </div>
    );
  }

  return (
    <div className="app-layout">

      <Sidebar active="apartment" />

      <main className="main-content">

        <header className="units-header">
          <div>
            <h1>Apartman Bilgileri</h1>

            <p>
              Site veya apartmanınıza ait
              temel bilgiler
            </p>
          </div>
        </header>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {apartment && (
          <section className="panel">

            <div className="apartment-info-grid">

              <div className="apartment-info-item">
                <span>
                  Apartman / Site Adı
                </span>

                <strong>
                  {apartment.name || "-"}
                </strong>
              </div>

              <div className="apartment-info-item">
                <span>Adres</span>

                <strong>
                  {apartment.address || "-"}
                </strong>
              </div>

              <div className="apartment-info-item">
                <span>Blok Sayısı</span>

                <strong>
                  {apartment.block_count ??
                    "-"}
                </strong>
              </div>

              <div className="apartment-info-item">
                <span>Kat Sayısı</span>

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
                    apartment.default_due_amount
                  )}{" "}
                  TL
                </strong>
              </div>

            </div>

          </section>
        )}

      </main>

    </div>
  );
}

export default ApartmentInfo;