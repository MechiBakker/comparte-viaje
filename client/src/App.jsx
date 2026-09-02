import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import TripDetail from './pages/TripDetail';
import CreateTrip from './pages/CreateTrip';
import EditTrip from './pages/EditTrip';
import MyTrips from './pages/MyTrips';
import Login from './pages/Login';
import Register from './pages/Register';

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/viajes/:id" element={<TripDetail />} />
          <Route path="/ingresar" element={<Login />} />
          <Route path="/registrarse" element={<Register />} />
          <Route
            path="/publicar"
            element={
              <ProtectedRoute>
                <CreateTrip />
              </ProtectedRoute>
            }
          />
          <Route
            path="/viajes/:id/editar"
            element={
              <ProtectedRoute>
                <EditTrip />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mis-viajes"
            element={
              <ProtectedRoute>
                <MyTrips />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </>
  );
}