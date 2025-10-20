import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUsers, getMeasurements, getAlerts, updateMeasurement, updateAlert, updateUser, deleteMeasurement, deleteAlert } from '../services/apiService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import './PatientDetails.css'; // Usamos el mismo CSS para mantener el estilo

function UserDetails() {
    const { cedula } = useParams();
    const [patientProfile, setPatientProfile] = useState(null);
    const [measurements, setMeasurements] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Filtros mediciones
    const [measurementStartDate, setMeasurementStartDate] = useState('');
    const [measurementEndDate, setMeasurementEndDate] = useState('');
    const [bpmMin, setBpmMin] = useState('');
    const [bpmMax, setBpmMax] = useState('');
    const [spo2Min, setSpo2Min] = useState('');
    const [spo2Max, setSpo2Max] = useState('');

    // Filtros alertas
    const [alertStartDate, setAlertStartDate] = useState('');
    const [alertEndDate, setAlertEndDate] = useState('');
    const [alertType, setAlertType] = useState('');
    const [alertState, setAlertState] = useState('');

    // Perfil editable
    const [editableProfile, setEditableProfile] = useState({ nombre: '', apellido: '', cedula: '', contrasena: '', genero: '', fecha_nacimiento: '' });
    const [isEditingProfile, setIsEditingProfile] = useState(false);

    // Mediciones en edición
    const [editingMeasurementId, setEditingMeasurementId] = useState(null);
    const [editedMeasurement, setEditedMeasurement] = useState({ ritmo_cardiaco: '', spo2: '' });

    // Mostrar/ocultar secciones
    const [showMeasurements, setShowMeasurements] = useState(true);
    const [showAlerts, setShowAlerts] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) navigate('/');

        const fetchProfile = async () => {
            try {
                const resp = await getUsers(token, { cedula });
                let profile = null;
                if (resp.data.usuario) profile = resp.data.usuario;
                else if (Array.isArray(resp.data.usuarios)) profile = resp.data.usuarios.find(u => String(u.cedula) === String(cedula));
                setPatientProfile(profile);
                if (profile) setEditableProfile({ ...profile, contrasena: '' });
            } catch (err) {
                console.error(err);
            }
        };

        fetchProfile();
    }, [cedula, navigate]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const fetchMeasurementsData = async () => {
            try {
                const filters = {};
                if (measurementStartDate) filters.fecha_min = measurementStartDate;
                if (measurementEndDate) filters.fecha_max = measurementEndDate;
                if (bpmMin) filters.ritmo_min = parseInt(bpmMin, 10);
                if (bpmMax) filters.ritmo_max = parseInt(bpmMax, 10);
                if (spo2Min) filters.spo2_min = parseInt(spo2Min, 10);
                if (spo2Max) filters.spo2_max = parseInt(spo2Max, 10);

                const resp = await getMeasurements(token, { cedula, ...filters });
                setMeasurements(resp.data.mediciones || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchMeasurementsData();
    }, [cedula, measurementStartDate, measurementEndDate, bpmMin, bpmMax, spo2Min, spo2Max]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const fetchAlertsData = async () => {
            try {
                const filters = {};
                if (alertStartDate) filters.fecha_min = alertStartDate;
                if (alertEndDate) filters.fecha_max = alertEndDate;
                if (alertType) filters.tipo_alerta = alertType.toUpperCase();
                if (alertState === 'leida') filters.leida = true;
                if (alertState === 'no leida') filters.leida = false;

                const resp = await getAlerts(token, { cedula, ...filters });
                setAlerts(resp.data.alertas || []);
            } catch (err) {
                console.error(err);
            }
        };
        fetchAlertsData();
    }, [cedula, alertStartDate, alertEndDate, alertType, alertState]);

    const formatDateTime = (dateStr) => {
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? 'Fecha inválida' : d.toLocaleString();
    };

    const getAlertTypeClass = (type) => {
        if (!type) return '';
        const t = type.toLowerCase();
        if (t === 'roja') return 'alert-type-badge roja';
        if (t === 'amarilla') return 'alert-type-badge amarilla';
        return 'alert-type-badge';
    };

    // --- Lógica de Mediciones ---
    const handleMeasurementEditClick = (m) => {
        setEditingMeasurementId(m.id);
        setEditedMeasurement({ ritmo_cardiaco: m.ritmo_cardiaco, spo2: m.spo2 });
    };

    const handleMeasurementSave = async (id) => {
        try {
            const token = localStorage.getItem('token');
            // Nota: Aquí se está pasando solo editedMeasurement, el backend debe ignorar campos prohibidos.
            await updateMeasurement(token, id, editedMeasurement); 
            // Actualiza la lista de mediciones localmente con los nuevos datos
            setMeasurements(prev => prev.map(m => m.id === id ? { ...m, ...editedMeasurement } : m));
            setEditingMeasurementId(null); // Sale del modo de edición
        } catch (err) {
            console.error(err);
            alert('Error al guardar la medición. Revisa la consola o los permisos del token.');
        }
    };

    const handleDeleteMeasurement = async (id) => {
        if (window.confirm(`¿Estás seguro de que deseas eliminar la medición con ID ${id}?`)) {
            try {
                const token = localStorage.getItem('token');
                await deleteMeasurement(token, id);
                setMeasurements(prev => prev.filter(m => m.id !== id));
                alert('Medición eliminada con éxito.');
            } catch (err) {
                console.error('Error al eliminar la medición:', err);
                alert('Ocurrió un error al eliminar la medición.');
            }
        }
    };
    // ----------------------------

    // Función para eliminar alerta
    const handleDeleteAlert = async (id) => {
        if (window.confirm(`¿Estás seguro de que deseas eliminar la alerta con ID ${id}?`)) {
            try {
                const token = localStorage.getItem('token');
                await deleteAlert(token, id);
                setAlerts(prev => prev.filter(a => a.id !== id));
                alert('Alerta eliminada con éxito.');
            } catch (err) {
                console.error('Error al eliminar la alerta:', err);
                alert('Ocurrió un error al eliminar la alerta.');
            }
        }
    };

    // Perfil
    const handleProfileSave = async () => {
        try {
            const token = localStorage.getItem('token');
            await updateUser(token, cedula, editableProfile);
            setPatientProfile({ ...editableProfile });
            setIsEditingProfile(false);
            alert('Perfil actualizado correctamente.');
        } catch (err) {
            console.error(err);
            alert('Error al actualizar perfil.');
        }
    };

    const clearMeasurementFilters = () => {
        setMeasurementStartDate('');
        setMeasurementEndDate('');
        setBpmMin('');
        setBpmMax('');
        setSpo2Min('');
        setSpo2Max('');
    };

    const clearAlertFilters = () => {
        setAlertStartDate('');
        setAlertEndDate('');
        setAlertType('');
        setAlertState('');
    };

    if (loading) return <div>Cargando...</div>;

    return (
        <div className="patient-details-container">
            <header className="dashboard-header">
                <h1>Usuario: {patientProfile ? `${patientProfile.nombre} ${patientProfile.apellido}-${patientProfile.cedula} ` : cedula}</h1>
                <button onClick={() => navigate(-1)}>Volver</button>
            </header>

            {/* Perfil */}
            {patientProfile && (
                <section className="profile-section">
                    <h2>Perfil del Usuario</h2>
                    <div className="profile-info">
                        <p><strong>Nombre:</strong> {patientProfile.nombre}</p>
                        <p><strong>Apellido:</strong> {patientProfile.apellido}</p>
                        <p><strong>Cédula:</strong> {patientProfile.cedula}</p>
                        <p><strong>Género:</strong> {patientProfile.genero}</p>
                        <p><strong>Fecha de Nacimiento:</strong> {patientProfile.fecha_nacimiento}</p>
                        <p><strong>Rol:</strong> {patientProfile.rol}</p>
                        <button onClick={() => navigate(`/edit-user/${patientProfile.cedula}`)}>
                            Editar Perfil
                        </button>
                    </div>
                </section>
            )}

            {/* Gráfico */}
            <section className="measurements-chart-section">
                <h2>Gráfico de Mediciones</h2>
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={measurements.map(m => ({ ...m, fecha: formatDateTime(m.fecha_hora) }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="fecha" reversed />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="ritmo_cardiaco" stroke="#8884d8" name="BPM" />
                        <Line type="monotone" dataKey="spo2" stroke="#82ca9d" name="SpO2" />
                    </LineChart>
                </ResponsiveContainer>
            </section>

            {/* Tabla Mediciones */}
            <section className="measurements-table-section">
                <h2>
                    Historial de Mediciones{" "}
                    <button onClick={() => setShowMeasurements(!showMeasurements)}>
                        {showMeasurements ? '▲' : '▼'}
                    </button>
                </h2>
                <AnimatePresence>
                    {showMeasurements && (
                        <motion.div
                            key="measurements"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.4, ease: "easeInOut" }}
                            style={{ overflow: "hidden" }}
                        >
                            <div className="filters-container">
                                <label>Fecha inicio:</label>
                                <input type="date" value={measurementStartDate} onChange={e => setMeasurementStartDate(e.target.value)} />
                                <label>Fecha fin:</label>
                                <input type="date" value={measurementEndDate} onChange={e => setMeasurementEndDate(e.target.value)} />
                                <label>BPM Min:</label>
                                <input type="number" value={bpmMin} onChange={e => setBpmMin(e.target.value)} />
                                <label>BPM Max:</label>
                                <input type="number" value={bpmMax} onChange={e => setBpmMax(e.target.value)} />
                                <label>SpO2 Min:</label>
                                <input type="number" value={spo2Min} onChange={e => setSpo2Min(e.target.value)} />
                                <label>SpO2 Max:</label>
                                <input type="number" value={spo2Max} onChange={e => setSpo2Max(e.target.value)} />
                                <button onClick={clearMeasurementFilters}>Borrar Filtros</button>
                            </div>

                            <table className="data-table center-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>BPM</th>
                                        <th>SpO2</th>
                                        <th>Fecha</th>
                                        <th>Editar</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {measurements.map(m => (
                                        <tr key={m.id}>
                                            <td>{m.id}</td>
                                            
                                            {/* *** INICIO DEL CAMBIO NECESARIO (BPM) *** */}
                                            <td>
                                                {editingMeasurementId === m.id ? (
                                                    <input
                                                        type="number"
                                                        value={editedMeasurement.ritmo_cardiaco}
                                                        onChange={e => setEditedMeasurement({ ...editedMeasurement, ritmo_cardiaco: e.target.value })}
                                                        style={{ width: '80px', textAlign: 'center' }}
                                                    />
                                                ) : (
                                                    m.ritmo_cardiaco
                                                )}
                                            </td>
                                            {/* *** FIN DEL CAMBIO NECESARIO (BPM) *** */}
                                            
                                            {/* *** INICIO DEL CAMBIO NECESARIO (SpO2) *** */}
                                            <td>
                                                {editingMeasurementId === m.id ? (
                                                    <input
                                                        type="number"
                                                        value={editedMeasurement.spo2}
                                                        onChange={e => setEditedMeasurement({ ...editedMeasurement, spo2: e.target.value })}
                                                        style={{ width: '80px', textAlign: 'center' }}
                                                    />
                                                ) : (
                                                    m.spo2
                                                )}
                                            </td>
                                            {/* *** FIN DEL CAMBIO NECESARIO (SpO2) *** */}

                                            <td>{formatDateTime(m.fecha_hora)}</td>
                                            
                                            {/* *** LÓGICA MÍNIMA DEL BOTÓN EDITAR *** */}
                                            <td>
                                                <button 
                                                    onClick={() => {
                                                        if (editingMeasurementId === m.id) {
                                                            // Si ya está en edición, Guarda
                                                            handleMeasurementSave(m.id);
                                                        } else {
                                                            // Si no está en edición, Activa la edición
                                                            handleMeasurementEditClick(m);
                                                        }
                                                    }}
                                                >
                                                    {/* Mostrar "Guardar" si está editando para guiar al usuario */}
                                                    {editingMeasurementId === m.id ? 'Guardar' : 'Editar'}
                                                </button>

                                                {/* Se agrega un botón de cancelar, ya que es la única manera de salir
                                                    del modo de edición sin guardar si el usuario cambia de opinión.
                                                    Si no lo quiere, simplemente ignórelo en su copia. */}
                                                {editingMeasurementId === m.id && (
                                                    <button onClick={() => setEditingMeasurementId(null)} style={{ marginLeft: '5px', backgroundColor: '#9e9e9e' }}>
                                                        X
                                                    </button>
                                                )}
                                            </td>
                                            {/* *** FIN LÓGICA MÍNIMA DEL BOTÓN EDITAR *** */}
                                            
                                            <td>
                                                <button onClick={() => handleDeleteMeasurement(m.id)} style={{ backgroundColor: '#f44336' }}>
                                                    Eliminar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>

            {/* Tabla Alertas */}
            <section className="alerts-table-section">
                <h2>
                    Alertas{" "}
                    <button onClick={() => setShowAlerts(!showAlerts)}>
                        {showAlerts ? '▲' : '▼'}
                    </button>
                </h2>
                <AnimatePresence>
                    {showAlerts && (
                        <motion.div
                            key="alerts"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.4, ease: "easeInOut" }}
                            style={{ overflow: "hidden" }}
                        >
                            <div className="filters-container">
                                <label>Fecha inicio:</label>
                                <input type="date" value={alertStartDate} onChange={e => setAlertStartDate(e.target.value)} />
                                <label>Fecha fin:</label>
                                <input type="date" value={alertEndDate} onChange={e => setAlertEndDate(e.target.value)} />
                                <label>Tipo:</label>
                                <select value={alertType} onChange={e => setAlertType(e.target.value)}>
                                    <option value="">Todos</option>
                                    <option value="roja">Roja</option>
                                    <option value="amarilla">Amarilla</option>
                                </select>
                                <label>Estado:</label>
                                <select value={alertState} onChange={e => setAlertState(e.target.value)}>
                                    <option value="">Todos</option>
                                    <option value="leida">Leída</option>
                                    <option value="no leida">No leída</option>
                                </select>
                                <button onClick={clearAlertFilters}>Borrar Filtros</button>
                            </div>

                            <table className="data-table center-table">
                                <thead>
                                    <tr>
                                        <th>ID Alerta</th>
                                        <th>ID Medición</th>
                                        <th>Fecha</th>
                                        <th>Tipo</th>
                                        <th>Mensaje</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {alerts.map(a => (
                                        <tr key={a.id}>
                                            <td>{a.id}</td>
                                            <td>{a.id_medicion}</td>
                                            <td>{formatDateTime(a.fecha_hora)}</td>
                                            <td><span className={getAlertTypeClass(a.tipo_alerta)}></span></td>
                                            <td>{a.mensaje}</td>
                                            <td>{a.leida ? 'Leída' : 'No leída'}</td>
                                            <td>
                                                <button onClick={() => handleDeleteAlert(a.id)} style={{ backgroundColor: '#f44336' }}>
                                                    Eliminar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>
        </div>
    );
}

export default UserDetails;
