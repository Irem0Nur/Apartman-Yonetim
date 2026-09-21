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

        {/* Giriş */}
        <Route
          path="/"
          element={<Login />}
        />

        {/* Kayıt */}
        <Route
          path="/register"
          element={<Register />}
        />

        {/* E-posta doğrulama */}
        <Route
          path="/verify-email"
          element={<VerifyEmail />}
        />

        {/* Ana sayfa */}
        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        {/* Apartman */}
        <Route
          path="/apartman-olustur"
          element={<CreateApartment />}
        />

        <Route
          path="/apartman-bilgileri"
          element={<ApartmentInfo />}
        />

        {/* Daireler */}
        <Route
          path="/daireler"
          element={<Units />}
        />

        {/* Kişiler */}
        <Route
          path="/kisiler"
          element={<People />}
        />

        {/* Aidatlar */}
        <Route
          path="/aidatlar"
          element={<Dues />}
        />

        {/* Ödemeler */}
        <Route
          path="/odemeler"
          element={<Payments />}
        />

        {/* Gelir / Gider */}
        <Route
          path="/gelir-gider"
          element={<IncomeExpense />}
        />

        {/* Kasa */}
        <Route
          path="/kasa"
          element={<Cash />}
        />

        {/* Kararlar */}
        <Route
          path="/kararlar"
          element={<Decisions />}
        />

        {/* Toplantılar */}
        <Route
          path="/toplantilar"
          element={<Meetings />}
        />

        {/* İşletme Defteri */}
        <Route
          path="/isletme-defteri"
          element={<BusinessLedger />}
        />

      </Routes>

    </BrowserRouter>
  );
}


export default App;