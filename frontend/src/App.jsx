import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";

import Dashboard from "./pages/Dashboard";
import CreateApartment from "./pages/CreateApartment";
import ApartmentInfo from "./pages/ApartmentInfo";

import Units from "./pages/Units";
import People from "./pages/People";

import Dues from "./pages/Dues";
import Payments from "./pages/Payments";

import IncomeExpense from "./pages/IncomeExpense";
import Cash from "./pages/Cash";
import Decisions from "./pages/Decisions";
import Meetings from "./pages/Meetings";

import BusinessLedger from "./pages/BusinessLedger";


function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =========================
            AUTH
        ========================= */}

        <Route
          path="/"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/verify-email"
          element={<VerifyEmail />}
        />


        {/* =========================
            DASHBOARD
        ========================= */}

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />


        {/* =========================
            APARTMAN
        ========================= */}

        <Route
          path="/apartman-olustur"
          element={<CreateApartment />}
        />

        <Route
          path="/apartman-bilgileri"
          element={<ApartmentInfo />}
        />


        {/* =========================
            DAİRELER
        ========================= */}

        <Route
          path="/daireler"
          element={<Units />}
        />


        {/* =========================
            KİŞİLER
        ========================= */}

        <Route
          path="/kisiler"
          element={<People />}
        />


        {/* =========================
            AİDATLAR
        ========================= */}

        <Route
          path="/aidatlar"
          element={<Dues />}
        />


        {/* =========================
            ÖDEMELER
        ========================= */}

        <Route
          path="/odemeler"
          element={<Payments />}
        />


        {/* =========================
            GELİR / GİDER
        ========================= */}

        <Route
          path="/gelir-gider"
          element={<IncomeExpense />}
        />


        {/* =========================
            KASA
        ========================= */}

        <Route
          path="/kasa"
          element={<Cash />}
        />


        {/* =========================
            KARARLAR
        ========================= */}

        <Route
          path="/kararlar"
          element={<Decisions />}
        />


        {/* =========================
            TOPLANTILAR
        ========================= */}

        <Route
          path="/toplantilar"
          element={<Meetings />}
        />


        {/* =========================
            İŞLETME DEFTERİ
        ========================= */}

        <Route
          path="/isletme-defteri"
          element={<BusinessLedger />}
        />

      </Routes>
    </BrowserRouter>
  );
}


export default App;