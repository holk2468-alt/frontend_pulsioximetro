// AdminDashboard.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { getUsers, getAlerts, deleteUser } from '../services/apiService';
import { FiBell } from 'react-icons/fi';
import './DoctorDashboard.css';

function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const cedulasRef = useRef([]); // <-- guarda cédulas actualizadas sin forzar re-render
  const [filters, setFilters] = useState({
    cedula: '',
    genero: '',
    rol: '',
    fecha_nacimiento_min: '',
    fecha_nacimiento_max: '',
  });
  const [alertsCount, setAlertsCount] = useState(0);
  const [alertsList, setAlertsList] = useState([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // --- run once on mount: auth + initial loads + single interval ---
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    let decoded;
    try {
      decoded = jwtDecode(token);
    } catch (err) {
      console.error('Token inválido', err);
      navigate('/');
      return;
    }

    if (decoded.rol !== 'admin') {
      navigate('/');
      return;
    }

    setUser(decoded);
    fetchUserData(token, decoded.sub);
    fetchUsuarios(token); // carga inicial de usuarios (sin filtros)

    // Interval para actualizar alertas: SE CREA SOLO UNA VEZ
    const intervalId = setInterval(() => {
      const cedulas = cedulasRef.current;
      // Si no hay cédulas, no hacemos la petición
      if (cedulas && cedulas.length > 0) {
        fetchAlerts(token, cedulas);
      }
    }, 30000); // 30s

    return () => {
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // --- debounce para recargar usuarios cuando cambian filtros (500ms) ---
  useEffect(() => {
    if (!loading) {
      const token = localStorage.getItem('token');
      const handler = setTimeout(() => {
        fetchUsuarios(token, filters);
      }, 500);

      return () => clearTimeout(handler);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, loading]);

  const fetchUserData = async (token, cedula) => {
    try {
      const profileResp = await getUsers(token, { cedula });
      if (profileResp?.data) {
        if (profileResp.data.usuario) {
          setProfile(profileResp.data.usuario);
        } else if (Array.isArray(profileResp.data.usuarios)) {
          const found = profileResp.data.usuarios.find(u => String(u.cedula) === String(cedula));
          setProfile(found || profileResp.data.usuarios[0]);
        }
      }
    } catch (err) {
      console.error('Error al obtener datos:', err);
      setError('No se pudo cargar la información. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsuarios = async (token, filters = {}) => {
    try {
      const resp = await getUsers(token, filters);
      if (resp?.data?.usuarios) {
        const listaUsuarios = resp.data.usuarios;
        setUsuarios(listaUsuarios);
        // actualizamos el ref con las cédulas actuales
        const cedulas = listaUsuarios.map(u => u.cedula);
        cedulasRef.current = cedulas;
        // Cargamos alertas una vez inmediatamente con esas cédulas
        if (cedulas.length > 0) fetchAlerts(token, cedulas);
      } else {
        setUsuarios([]);
        cedulasRef.current = [];
      }
    } catch (err) {
      console.error('Error cargando usuarios:', err);
      setUsuarios([]);
      cedulasRef.current = [];
    }
  };

  const fetchAlerts = async (token, cedulas) => {
    if (!cedulas || cedulas.length === 0) {
      setAlertsCount(0);
      setAlertsList([]);
      return;
    }
    try {
      const resp = await getAlerts(token);
      let alertsArray = [];

      if (Array.isArray(resp.data)) {
        alertsArray = resp.data;
      } else if (resp.data?.alertas && Array.isArray(resp.data.alertas)) {
        alertsArray = resp.data.alertas;
      }

      const filteredAlerts = alertsArray.filter(
        (a) => a.leida === false && cedulas.includes(a.cedula_paciente)
      );

      setAlertsCount(filteredAlerts.length);
      setAlertsList(filteredAlerts);
    } catch (err) {
      console.error('Error cargando alertas:', err);
    }
  };

  const handleChange = (e) => {
    setFilters(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      cedula: '',
      genero: '',
      rol: '',
      fecha_nacimiento_min: '',
      fecha_nacimiento_max: '',
    });
  };

  const handleDeleteUser = async (cedula) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const confirmDelete = window.confirm(`¿Eliminar usuario con cédula ${cedula}?`);
    if (!confirmDelete) return;

    try {
      await deleteUser(token, cedula);
      setUsuarios(prev => prev.filter(u => u.cedula !== cedula));
      // actualizar ref
      cedulasRef.current = cedulasRef.current.filter(c => String(c) !== String(cedula));
      alert('Usuario eliminado con éxito.');
    } catch (err) {
      console.error('Error eliminando usuario:', err);
      alert('No se pudo eliminar el usuario.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleEditProfile = () => {
    navigate('/edit-profile');
  };

  if (loading) return <div className="doctor-loading-container">Cargando...</div>;
  if (error) return <div className="doctor-error-message">{error}</div>;

  return (
    <div className="doctor-dashboard-container">
      <header className="doctor-dashboard-header">
        <div className="doctor-welcome-message">
          <h1>
            Bienvenido, Admin {profile?.nombre ?? user?.nombre} {profile?.apellido ?? ''}
          </h1>
        </div>

        <div className="doctor-header-actions">
          <div style={{ position: 'relative', marginRight: '10px' }}>
            <FiBell
              size={24}
              onClick={() => setShowAlerts(prev => !prev)}
              style={{ cursor: 'pointer' }}
            />
            {alertsCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                backgroundColor: 'red',
                color: 'white',
                borderRadius: '50%',
                padding: '2px 6px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {alertsCount}
              </span>
            )}
            {showAlerts && (
              <div style={{
                position: 'absolute',
                top: '30px',
                right: '0',
                width: '300px',
                maxHeight: '300px',
                overflowY: 'auto',
                backgroundColor: '#fff',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                borderRadius: '8px',
                zIndex: 1000,
                padding: '10px'
              }}>
                {alertsList.length > 0 ? (
                  alertsList.map(alert => (
                    <div key={alert.id} style={{ padding: '5px 0', borderBottom: '1px solid #eee' }}>
                      <p style={{ margin: 0 }}><strong>Cédula:</strong> {alert.cedula_paciente}</p>
                      <p style={{ margin: 0 }}>{alert.mensaje}</p>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', color: '#555', padding: '10px 0' }}>
                    No hay alertas
                  </div>
                )}
              </div>
            )}
          </div>

          <button onClick={handleLogout} className="doctor-logout-button">
            Cerrar Sesión
          </button>
          <Link to="/admin/register" className="doctor-create-patient-button">
              Crear Nuevo Usuario
          </Link>
        </div>
      </header>

      <div className="dashboard-content">
        {/* Perfil */}
        <section className="profile-section">
          <h2 className="profile-title">Mi Perfil</h2>
          {profile ? (
            <div className="profile-info">
              <p><strong>Cédula:</strong> {profile.cedula}</p>
              <p><strong>Nombre:</strong> {profile.nombre} {profile.apellido}</p>
              <p><strong>Género:</strong> {profile.genero}</p>
              <p><strong>Fecha de Nacimiento:</strong> {profile.fecha_nacimiento}</p>
              <p><strong>Rol:</strong> {profile.rol}</p>
            </div>
          ) : (
            <p className="doctor-no-data-message">
              No se encontró información completa del perfil.
            </p>
          )}
          <button onClick={handleEditProfile} className="edit-profile-button">
            Editar Perfil
          </button>
        </section>

        {/* Usuarios */}
        <section className="doctor-dashboard-section">
          <h2>Usuarios</h2>

          <div className="filter-form">
            <input
              type="text"
              name="cedula"
              placeholder="Cédula"
              value={filters.cedula}
              onChange={handleChange}
            />
            <select
              name="genero"
              value={filters.genero}
              onChange={handleChange}
            >
              <option value="">-- Género --</option>
              <option value="M">M</option>
              <option value="F">F</option>
            </select>

            <select
              name="rol"
              value={filters.rol}
              onChange={handleChange}
            >
              <option value="">-- Rol --</option>
              <option value="paciente">Paciente</option>
              <option value="medico">Médico</option>
              <option value="admin">Admin</option>
            </select>

            <label>Desde:</label>
            <input
              type="date"
              name="fecha_nacimiento_min"
              value={filters.fecha_nacimiento_min}
              onChange={handleChange}
            />
            <div className="filter-group">
              <label>Hasta:</label>
              <input
                type="date"
                name="fecha_nacimiento_max"
                value={filters.fecha_nacimiento_max}
                onChange={handleChange}
              />
            </div>
            <button type="button" onClick={clearFilters}>Limpiar</button>
          </div>

          {usuarios.length > 0 ? (
            <div className="doctor-table-responsive">
              <table className="doctor-data-table">
                <thead>
                  <tr>
                    <th>Cédula</th>
                    <th>Nombre Completo</th>
                    <th>Género</th>
                    <th>Fecha de Nacimiento</th>
                    <th>Rol</th>
                    <th>Ver</th>
                    <th>Eliminar</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map(u => (
                    <tr key={u.cedula}>
                      <td>{u.cedula}</td>
                      <td>{u.nombre} {u.apellido}</td>
                      <td>{u.genero}</td>
                      <td>{u.fecha_nacimiento}</td>
                      <td>{u.rol}</td>
                      <td>
                        <Link to={`/admin/usuario/${u.cedula}`} className="doctor-view-button">
                          Ver Detalles
                        </Link>
                      </td>
                      <td>
                        <button
                          className="doctor-delete-button"
                          onClick={() => handleDeleteUser(u.cedula)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="doctor-no-data-message">No se encontraron usuarios.</p>
          )}
        </section>
      </div>
    </div>
  );
}

export default AdminDashboard;
