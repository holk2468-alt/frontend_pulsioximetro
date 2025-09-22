import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { getUsers, getAlerts } from '../services/apiService';
import { FiBell } from 'react-icons/fi';
import './DoctorDashboard.css';

function DoctorDashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [patients, setPatients] = useState([]);
  // ✅ Nuevo: Usa useRef para las cédulas de los pacientes
  const patientCedulasRef = useRef([]);
  const [filters, setFilters] = useState({
    cedula: '',
    genero: '',
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

    if (decoded.rol !== 'medico') {
      navigate('/');
      return;
    }

    setUser(decoded);
    fetchUserData(token, decoded.sub);
    fetchPatients(token); // Carga inicial de pacientes

    // Interval para actualizar alertas: SE CREA SOLO UNA VEZ
    const intervalId = setInterval(() => {
      // ✅ Accede a la lista de cédulas a través del ref
      const cedulas = patientCedulasRef.current;
      if (cedulas && cedulas.length > 0) {
        fetchAlerts(token, cedulas);
      }
    }, 30000); // Actualizar alertas cada 30 segundos

    return () => clearInterval(intervalId);
  }, [navigate]); // ✅ Dependencia limpia: Solo se ejecuta una vez

  // --- debounce para recargar pacientes cuando cambian filtros (500ms) ---
  useEffect(() => {
    if (!loading) {
      const token = localStorage.getItem('token');
      const handler = setTimeout(() => {
        fetchPatients(token, filters);
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

  const fetchPatients = async (token, filters = {}) => {
    try {
      const resp = await getUsers(token, filters);
      if (resp?.data?.usuarios) {
        const patientList = resp.data.usuarios.filter(u => u.rol === 'paciente');
        setPatients(patientList);
        // ✅ Guardamos las cédulas en la referencia
        const newCedulas = patientList.map(p => p.cedula);
        patientCedulasRef.current = newCedulas;
        // Y aquí, llamamos a fetchAlerts con las cédulas
        fetchAlerts(token, newCedulas);
      } else {
        setPatients([]);
        patientCedulasRef.current = [];
        fetchAlerts(token, []);
      }
    } catch (err) {
      console.error('Error cargando pacientes:', err);
      setPatients([]);
      patientCedulasRef.current = [];
      fetchAlerts(token, []);
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

      const patientAlerts = alertsArray.filter(
        (a) => a.leida === false && cedulas.includes(a.cedula_paciente)
      );
      
      setAlertsCount(patientAlerts.length);
      setAlertsList(patientAlerts);
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
      fecha_nacimiento_min: '',
      fecha_nacimiento_max: '',
    });
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
            Bienvenido, Dr. {profile?.nombre ?? user?.nombre} {profile?.apellido ?? ''}
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
          <Link to="/doctor/register" className="doctor-create-patient-button">
              Crear Nuevo Paciente
          </Link>
        </div>
      </header>
      <div className="dashboard-content">
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
              No se encontró información completa del perfil. Puedes editar tu perfil para completarla.
            </p>
          )}
          <button onClick={handleEditProfile} className="edit-profile-button">
            Editar Perfil
          </button>
        </section>
        <section className="doctor-dashboard-section">
          <h2>Pacientes</h2>
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
          {patients.length > 0 ? (
            <div className="doctor-table-responsive">
              <table className="doctor-data-table">
                <thead>
                  <tr>
                    <th>Cédula</th>
                    <th>Nombre Completo</th>
                    <th>Género</th>
                    <th>Fecha de Nacimiento</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map(p => (
                    <tr key={p.cedula}>
                      <td>{p.cedula}</td>
                      <td>{p.nombre} {p.apellido}</td>
                      <td>{p.genero}</td>
                      <td>{p.fecha_nacimiento}</td>
                      <td>
                        <Link to={`/doctor/paciente/${p.cedula}`} className="doctor-view-button">
                          Ver Detalles
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="doctor-no-data-message">No se encontraron pacientes.</p>
          )}
        </section>
      </div>
    </div>
  );
}

export default DoctorDashboard;