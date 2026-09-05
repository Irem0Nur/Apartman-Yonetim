import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";

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


function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ========================= */}
        {/* PUBLIC SAYFALAR */}
        {/* ========================= */}

        <Route
          path="/"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/email-dogrula"
          element={<VerifyEmail />}
        />


        {/* ========================= */}
        {/* KORUMALI SAYFALAR */}
        {/* ========================= */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/apartman-olustur"
          element={
            <ProtectedRoute>
              <CreateApartment />
            </ProtectedRoute>
          }
        />

        <Route
          path="/apartman-bilgileri"
          element={
            <ProtectedRoute>
              <ApartmentInfo />
            </ProtectedRoute>
          }
        />

        <Route
          path="/daireler"
          element={
            <ProtectedRoute>
              <Units />
            </ProtectedRoute>
          }
        />

        <Route
          path="/kisiler"
          element={
            <ProtectedRoute>
              <People />
            </ProtectedRoute>
          }
        />

        <Route
          path="/aidatlar"
          element={
            <ProtectedRoute>
              <Dues />
            </ProtectedRoute>
          }
        />

        <Route
          path="/odemeler"
          element={
            <ProtectedRoute>
              <Payments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/gelir-gider"
          element={
            <ProtectedRoute>
              <IncomeExpense />
            </ProtectedRoute>
          }
        />

        <Route
          path="/kasa"
          element={
            <ProtectedRoute>
              <Cash />
            </ProtectedRoute>
          }
        />

        <Route
          path="/karar-defteri"
          element={
            <ProtectedRoute>
              <Decisions />
            </ProtectedRoute>
          }
        />

        <Route
          path="/toplantilar"
          element={
            <ProtectedRoute>
              <Meetings />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}


export default App;