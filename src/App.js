import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage'; 
import EditProfile from './components/EditProfile';
import EditUserProfile from './components/EditUserProfile';
import PatientDetails from './pages/PatientDetails'; 
import DoctorRegisterUser from './pages/DoctorRegisterUser';
import AdminRegisterUser from './pages/AdminRegisterUser';
import UserDetails from './pages/UserDetails'; 



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/edit-user/:cedula" element={<EditUserProfile />} />
        <Route path="/doctor/register" element={<DoctorRegisterUser />} />
        <Route path="/admin/register" element={<AdminRegisterUser />} />
        <Route path="/doctor/paciente/:cedula" element={<PatientDetails />} />
        <Route path="/admin/usuario/:cedula" element={<UserDetails />} /> 
      </Routes>
    </Router>
  );
}

export default App;
