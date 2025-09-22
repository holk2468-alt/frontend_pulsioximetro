import React, { useState } from 'react';
import { register, createUser } from '../services/apiService';
import { useNavigate } from 'react-router-dom';
import './RegisterPage.css';

function AdminRegisterUser() {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [genero, setGenero] = useState('');
  const [rol, setRol] = useState('paciente');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (genero !== 'M' && genero !== 'F') {
      setError('El género debe ser "M" o "F".');
      return;
    }

    try {
      const userData = {
        nombre,
        apellido,
        cedula,
        password,
        fecha_nacimiento: fechaNacimiento,
        genero,
        rol,
      };

      if (rol === 'paciente') {
        await register(userData);
      } else {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No estás autenticado para realizar esta acción.');
          return;
        }
        await createUser(token, userData);
      }

      setSuccess('Usuario registrado con éxito. Regresando al dashboard...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (err) {
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          setError(err.response.data.detail[0].msg);
        } else {
          setError(err.response.data.detail);
        }
      } else {
        setError('Ocurrió un error inesperado en el registro. Por favor, inténtalo de nuevo.');
      }
      console.error(err);
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <h1 className="register-title">Registrar Nuevo Usuario</h1>
        <form className="register-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Apellido"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Cédula"
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <label>Fecha de Nacimiento:</label>
          <input
            type="date"
            value={fechaNacimiento}
            onChange={(e) => setFechaNacimiento(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Género (M/F)"
            value={genero}
            onChange={(e) => setGenero(e.target.value.toUpperCase())}
            required
          />
          <label>Rol:</label>
          <div className="role-buttons">
            <button
              type="button"
              className={`role-button ${rol === 'paciente' ? 'active' : ''}`}
              onClick={() => setRol('paciente')}
            >
              Paciente
            </button>
            <button
              type="button"
              className={`role-button ${rol === 'medico' ? 'active' : ''}`}
              onClick={() => setRol('medico')}
            >
              Médico
            </button>
            <button
              type="button"
              className={`role-button ${rol === 'admin' ? 'active' : ''}`}
              onClick={() => setRol('admin')}
            >
              Admin
            </button>
          </div>
          <button type="submit" className="register-button">Registrar</button>
          {/* 🚨 Botón para cancelar */}
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="register-button cancel-button"
          >
            Cancelar
          </button>
        </form>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
      </div>
    </div>
  );
}

export default AdminRegisterUser;