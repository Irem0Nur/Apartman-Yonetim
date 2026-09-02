import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CreateApartment from "./pages/CreateApartment";
import ApartmentInfo from "./pages/ApartmentInfo";
import Units from "./pages/Units";
import People from "./pages/People";
import Dues from "./pages/Dues";
import Payments from "./pages/Payments";


function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/apartman-olustur"
          element={<CreateApartment />}
        />

        <Route
          path="/apartman-bilgileri"
          element={<ApartmentInfo />}
        />

        <Route
          path="/daireler"
          element={<Units />}
        />

        <Route
          path="/kisiler"
          element={<People />}
        />

        <Route
          path="/aidatlar"
          element={<Dues />}
        />

        <Route
          path="/odemeler"
          element={<Payments />}
        />

      </Routes>

    </BrowserRouter>
  );
}


export default App;