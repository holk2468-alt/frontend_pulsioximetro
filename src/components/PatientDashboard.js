import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getMeasurements, getAlerts, getUsers } from '../services/apiService';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './PatientDashboard.css';

function PatientDashboard() {
    const [user, setUser] = useState(null);
    const [patientProfile, setPatientProfile] = useState(null);
    const [measurements, setMeasurements] = useState([]);
    const [alerts, setAlerts] = useState([]);

    // Estados de toggle para ocultar/mostrar
    const [showMeasurements, setShowMeasurements] = useState(true);
    const [showAlerts, setShowAlerts] = useState(true);

    // Estados para filtros de mediciones
    const [measurementStartDateFilter, setMeasurementStartDateFilter] = useState('');
    const [measurementEndDateFilter, setMeasurementEndDateFilter] = useState('');
    const [bpmMinFilter, setBpmMinFilter] = useState('');
    const [bpmMaxFilter, setBpmMaxFilter] = useState('');
    const [spo2MinFilter, setSpo2MinFilter] = useState('');
    const [spo2MaxFilter, setSpo2MaxFilter] = useState('');

    // Estados para filtros de alertas
    const [alertStartDateFilter, setAlertStartDateFilter] = useState('');
    const [alertEndDateFilter, setAlertEndDateFilter] = useState('');
    const [alertTypeFilter, setAlertTypeFilter] = useState('');
    const [alertStateFilter, setAlertStateFilter] = useState('');

    const navigate = useNavigate();

    // Efecto inicial para cargar datos del usuario y perfil completo
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                setUser(decodedToken);
                fetchPatientProfile(token, decodedToken.sub);
            } catch (error) {
                console.error('Error al decodificar el token:', error);
                navigate('/');
            }
        } else {
            navigate('/');
        }
    }, [navigate]);

    const fetchPatientProfile = async (token, userId) => {
        try {
            const response = await getUsers(token, { cedula: userId });
            if (response.data.usuario) {
                setPatientProfile(response.data.usuario);
            } else {
                const fetchedUsers = response.data.usuarios || [];
                const foundPatient = fetchedUsers.find(u => u.cedula.toString() === userId.toString());
                setPatientProfile(foundPatient);
            }
        } catch (error) {
            console.error('Error al obtener el perfil del paciente:', error);
        }
    };

    useEffect(() => {
        if (user) {
            const token = localStorage.getItem('token');
            const filters = {};
            if (measurementStartDateFilter) filters.fecha_min = measurementStartDateFilter;
            if (measurementEndDateFilter) filters.fecha_max = measurementEndDateFilter;
            if (bpmMinFilter) filters.ritmo_min = parseInt(bpmMinFilter, 10);
            if (bpmMaxFilter) filters.ritmo_max = parseInt(bpmMaxFilter, 10);
            if (spo2MinFilter) filters.spo2_min = parseInt(spo2MinFilter, 10);
            if (spo2MaxFilter) filters.spo2_max = parseInt(spo2MaxFilter, 10);

            fetchMeasurements(token, user.sub, filters);
        }
    }, [user, measurementStartDateFilter, measurementEndDateFilter, bpmMinFilter, bpmMaxFilter, spo2MinFilter, spo2MaxFilter]);

    useEffect(() => {
        if (user) {
            const token = localStorage.getItem('token');
            const filters = {};
            if (alertStartDateFilter) filters.fecha_min = alertStartDateFilter;
            if (alertEndDateFilter) filters.fecha_max = alertEndDateFilter;
            if (alertTypeFilter) filters.tipo_alerta = alertTypeFilter.toUpperCase();
            if (alertStateFilter === 'leida') filters.leida = true;
            if (alertStateFilter === 'no leida') filters.leida = false;

            fetchAlerts(token, user.sub, filters);
        }
    }, [user, alertStartDateFilter, alertEndDateFilter, alertTypeFilter, alertStateFilter]);

    const fetchMeasurements = async (token, userId, filters = {}) => {
        try {
            const response = await getMeasurements(token, { ...filters, cedula: userId });
            const fetchedMeasurements = response.data.mediciones || [];
            setMeasurements(fetchedMeasurements);
        } catch (error) {
            console.error('Error al obtener las mediciones:', error);
        }
    };

    const fetchAlerts = async (token, userId, filters = {}) => {
        try {
            const response = await getAlerts(token, { ...filters, cedula: userId });
            const fetchedAlerts = response.data.alertas || [];
            setAlerts(fetchedAlerts);
        } catch (error) {
            console.error('Error al obtener las alertas:', error.response ? error.response.data : error.message);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    const handleEditProfile = () => {
        navigate('/edit-profile');
    };

    const formatDataForChart = (data) => {
        const chartData = [...data].sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));
        return chartData.map(item => ({
            ...item,
            fecha: new Date(item.fecha_hora).toLocaleString(),
        }));
    };

    const clearMeasurementFilters = () => {
        setMeasurementStartDateFilter('');
        setMeasurementEndDateFilter('');
        setBpmMinFilter('');
        setBpmMaxFilter('');
        setSpo2MinFilter('');
        setSpo2MaxFilter('');
    };

    const clearAlertFilters = () => {
        setAlertStartDateFilter('');
        setAlertEndDateFilter('');
        setAlertTypeFilter('');
        setAlertStateFilter('');
    };

    const getAlertTypeClass = (type) => {
        if (!type) return '';
        const normalizedType = type.toLowerCase();
        if (normalizedType === 'roja') return 'alert-type-badge roja';
        if (normalizedType === 'amarilla') return 'alert-type-badge amarilla';
        return 'alert-type-badge';
    };

    const getAlertStatus = (isRead) => {
        if (isRead === true) return 'Leída';
        if (isRead === false) return 'No Leída';
        return 'N/A';
    };

    if (!user || !patientProfile) {
        return <div className="loading-container">Cargando...</div>;
    }

    return (
        <div className="patient-dashboard-container">
            <header className="dashboard-header">
                <h1 className="welcome-message">
                    Bienvenido, Paciente: {patientProfile.nombre} {patientProfile.apellido} - {user.sub}
                </h1>
                <button onClick={handleLogout} className="logout-button">Cerrar Sesión</button>
            </header>

            <div className="dashboard-content">
                <section className="profile-section">
                    <h2 className="profile-title">Tu Perfil</h2>
                    <div className="profile-info">
                        <p><strong>Cédula:</strong> {user.sub}</p>
                        <p><strong>Nombre:</strong> {patientProfile ? patientProfile.nombre : 'Cargando...'} {patientProfile ? patientProfile.apellido : 'Cargando...'}</p>
                        <p><strong>Género:</strong> {patientProfile ? patientProfile.genero : 'Cargando...'}</p>
                        <p><strong>Fecha de Nacimiento:</strong> {patientProfile ? patientProfile.fecha_nacimiento : 'Cargando...'}</p>
                        <p><strong>Rol:</strong> {user.rol}</p>
                    </div>
                    <button onClick={handleEditProfile} className="edit-profile-button">
                        Editar Perfil
                    </button>
                </section>

                <section className="data-section">
                    <h2 className="data-title">Gráfico de Mediciones</h2>
                    <div className="chart-container">
                        {measurements.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={formatDataForChart(measurements)}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="fecha" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="ritmo_cardiaco" stroke="#8884d8" name="BPM" />
                                    <Line type="monotone" dataKey="spo2" stroke="#82ca9d" name="SpO2" />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <h4>No hay mediciones para mostrar.</h4>
                        )}
                    </div>
                </section>
            </div>

            {/* Sección Historial de Mediciones con colapso */}
            <section className="measurements-table-section">
                <h2
                    className="section-title toggle-title"
                    onClick={() => setShowMeasurements(!showMeasurements)}
                >
                    Historial de Mediciones {showMeasurements ? '▲' : '▼'}
                </h2>
                <AnimatePresence>
                    {showMeasurements && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            <div className="filters-container">
                                {/* filtros de mediciones */}
                                <label htmlFor="measurementStartDate">Fecha Inicio:</label>
                                <input
                                    type="date"
                                    id="measurementStartDate"
                                    value={measurementStartDateFilter}
                                    onChange={(e) => setMeasurementStartDateFilter(e.target.value)}
                                    className="filter-input"
                                />
                                <label htmlFor="measurementEndDate">Fecha Fin:</label>
                                <input
                                    type="date"
                                    id="measurementEndDate"
                                    value={measurementEndDateFilter}
                                    onChange={(e) => setMeasurementEndDateFilter(e.target.value)}
                                    className="filter-input"
                                />
                                <label htmlFor="bpmMin">BPM Mín:</label>
                                <input
                                    type="number"
                                    id="bpmMin"
                                    value={bpmMinFilter}
                                    onChange={(e) => setBpmMinFilter(e.target.value)}
                                    className="filter-input-small"
                                    placeholder="Mín"
                                />
                                <label htmlFor="bpmMax">BPM Máx:</label>
                                <input
                                    type="number"
                                    id="bpmMax"
                                    value={bpmMaxFilter}
                                    onChange={(e) => setBpmMaxFilter(e.target.value)}
                                    className="filter-input-small"
                                    placeholder="Máx"
                                />
                                <label htmlFor="spo2Min">SpO2 Mín:</label>
                                <input
                                    type="number"
                                    id="spo2Min"
                                    value={spo2MinFilter}
                                    onChange={(e) => setSpo2MinFilter(e.target.value)}
                                    className="filter-input-small"
                                    placeholder="Mín"
                                />
                                <label htmlFor="spo2Max">SpO2 Máx:</label>
                                <input
                                    type="number"
                                    id="spo2Max"
                                    value={spo2MaxFilter}
                                    onChange={(e) => setSpo2MaxFilter(e.target.value)}
                                    className="filter-input-small"
                                    placeholder="Máx"
                                />
                                <button onClick={clearMeasurementFilters} className="clear-filter-button">Limpiar Filtros</button>
                            </div>
                            {measurements.length > 0 ? (
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>BPM</th>
                                            <th>SpO2</th>
                                            <th>Fecha</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {measurements.map(m => (
                                            <tr key={m.id}>
                                                <td>{m.id}</td>
                                                <td>{m.ritmo_cardiaco}</td>
                                                <td>{m.spo2}</td>
                                                <td>{new Date(m.fecha_hora).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="no-data-message">No hay historial de mediciones.</p>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>

            {/* Sección Alertas con colapso */}
            <section className="alerts-section">
                <h2
                    className="section-title toggle-title"
                    onClick={() => setShowAlerts(!showAlerts)}
                >
                    Alertas {showAlerts ? '▲' : '▼'}
                </h2>
                <AnimatePresence>
                    {showAlerts && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            <div className="filters-container">
                                {/* filtros alertas */}
                                <label htmlFor="alertStartDate">Fecha Inicio:</label>
                                <input
                                    type="date"
                                    id="alertStartDate"
                                    value={alertStartDateFilter}
                                    onChange={(e) => setAlertStartDateFilter(e.target.value)}
                                    className="filter-input"
                                />
                                <label htmlFor="alertEndDate">Fecha Fin:</label>
                                <input
                                    type="date"
                                    id="alertEndDate"
                                    value={alertEndDateFilter}
                                    onChange={(e) => setAlertEndDateFilter(e.target.value)}
                                    className="filter-input"
                                />
                                <label htmlFor="alertType">Tipo:</label>
                                <select
                                    id="alertType"
                                    value={alertTypeFilter}
                                    onChange={(e) => setAlertTypeFilter(e.target.value)}
                                    className="filter-input-select"
                                >
                                    <option value="">Todos</option>
                                    <option value="roja">Roja</option>
                                    <option value="amarilla">Amarilla</option>
                                </select>

                                <label htmlFor="alertState">Estado:</label>
                                <select
                                    id="alertState"
                                    value={alertStateFilter}
                                    onChange={(e) => setAlertStateFilter(e.target.value)}
                                    className="filter-input-select"
                                >
                                    <option value="">Todos</option>
                                    <option value="leida">Leída</option>
                                    <option value="no leida">No Leída</option>
                                </select>

                                <button onClick={clearAlertFilters} className="clear-filter-button">Limpiar Filtros</button>
                            </div>
                            {alerts.length > 0 ? (
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>ID Alerta</th>
                                            <th>ID Medición</th>
                                            <th>Fecha</th>
                                            <th>Tipo</th>
                                            <th>Mensaje</th>
                                            <th>Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {alerts.map(alert => (
                                            <tr key={alert.id}>
                                                <td>{alert.id}</td>
                                                <td>{alert.id_medicion}</td>
                                                <td>
                                                    {new Date(alert.fecha_hora).toLocaleString() !== 'Invalid Date'
                                                        ? new Date(alert.fecha_hora).toLocaleString()
                                                        : 'Fecha inválida'}
                                                </td>
                                                <td>
                                                    <div className={getAlertTypeClass(alert.tipo_alerta)}>
                                                        &nbsp;
                                                    </div>
                                                </td>
                                                <td>{alert.mensaje || 'N/A'}</td>
                                                <td>{getAlertStatus(alert.leida)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="no-data-message">No tienes alertas recientes.</p>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>
        </div>
    );
}

export default PatientDashboard;