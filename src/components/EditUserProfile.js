import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { getUsers, updateUser } from '../services/apiService';
import './EditProfile.css';

function EditUserProfile() {
    const { cedula: originalCedula } = useParams();
    const navigate = useNavigate();
    const [userData, setUserData] = useState({
        nombre: '',
        apellido: '',
        cedula: '',
        fecha_nacimiento: '',
        genero: '',
        rol: ''
    });
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
            return;
        }

        try {
            const decoded = jwtDecode(token);
            setUserRole(decoded.rol);
        } catch (err) {
            console.error('Token inválido', err);
            navigate('/');
            return;
        }

        const fetchUser = async () => {
            try {
                const response = await getUsers(token, { cedula: originalCedula });
                const userToEdit = response.data.usuarios.find(u => String(u.cedula) === String(originalCedula));
                if (userToEdit) {
                    setUserData({
                        nombre: userToEdit.nombre,
                        apellido: userToEdit.apellido,
                        cedula: userToEdit.cedula,
                        fecha_nacimiento: userToEdit.fecha_nacimiento,
                        genero: userToEdit.genero,
                        rol: userToEdit.rol
                    });
                } else {
                    setError('Usuario no encontrado.');
                }
            } catch (err) {
                console.error('Error fetching user data:', err);
                setError('No se pudo cargar la información del usuario.');
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [originalCedula, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUserData(prev => ({ ...prev, [name]: value }));
    };

    const handleRoleChange = (newRole) => {
        setUserData(prev => ({ ...prev, rol: newRole }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validación: La cédula solo puede contener números
        if (!/^\d+$/.test(userData.cedula)) {
            setError('La cédula debe contener solo números.');
            return;
        }
        
        // Validación: El género debe ser 'M' o 'F'
        if (userData.genero !== 'M' && userData.genero !== 'F') {
            setError('El género debe ser "M" o "F".');
            return;
        }
            
        try {
            const token = localStorage.getItem('token');
            let dataToUpdate = {
                cedula: userData.cedula,
                nombre: userData.nombre,
                apellido: userData.apellido,
                fecha_nacimiento: userData.fecha_nacimiento,
                genero: userData.genero,
            };

            // ✅ Se añade la contraseña si se ha ingresado una
            if (newPassword.trim() !== '') {
                dataToUpdate.password = newPassword;
            }

            // Se añade el rol solo si el usuario es admin
            if (userRole === 'admin') {
                dataToUpdate.rol = userData.rol;
            }
            
            await updateUser(token, originalCedula, dataToUpdate);
            setSuccess('Perfil de usuario actualizado con éxito. Redirigiendo...');

            const cedulaChanged = userData.cedula !== originalCedula;
            const passwordChanged = newPassword.trim() !== '';

            // ✅ Redirección al dashboard si la cédula o la contraseña cambian
            if (cedulaChanged || passwordChanged) {
                alert('La cédula o la contraseña han sido actualizadas. Serás redirigido al dashboard.');
                navigate('/dashboard');
            } else {
                // Si no hay cambios críticos, regresa a la página de perfil del paciente
                setTimeout(() => {
                    navigate(`/doctor/paciente/${userData.cedula}`);
                }, 2000);
            }
        } catch (err) {
            console.error('Error updating user profile:', err);
            if (err.response?.data?.detail) {
                setError(err.response.data.detail);
            } else {
                setError('Ocurrió un error inesperado al actualizar el perfil.');
            }
        }
    };

    if (loading) return <div>Cargando...</div>;
    if (!userData.cedula && !loading) return <div>{error}</div>;

    return (
        <div className="register-container">
            <div className="register-box">
                <h1 className="register-title">Editar Perfil de {userData.nombre} {userData.apellido}</h1>
                <form className="register-form" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        name="nombre"
                        placeholder="Nombre"
                        value={userData.nombre}
                        onChange={handleChange}
                        required
                    />
                    <input
                        type="text"
                        name="apellido"
                        placeholder="Apellido"
                        value={userData.apellido}
                        onChange={handleChange}
                        required
                    />
                    <input
                        type="text"
                        name="cedula"
                        placeholder="Cédula"
                        value={userData.cedula}
                        onChange={handleChange}
                        required
                    />
                    <label>Fecha de Nacimiento:</label>
                    <input
                        type="date"
                        name="fecha_nacimiento"
                        value={userData.fecha_nacimiento}
                        onChange={handleChange}
                        required
                    />
                    <input
                        type="text"
                        name="genero"
                        placeholder="Género (M/F)"
                        value={userData.genero}
                        onChange={e => setUserData({ ...userData, genero: e.target.value.toUpperCase() })}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Nueva Contraseña (opcional)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />

                    {userRole === 'admin' && (
                        <>
                            <label>Rol:</label>
                            <div className="role-buttons">
                                <button
                                    type="button"
                                    className={`role-button ${userData.rol === 'paciente' ? 'active' : ''}`}
                                    onClick={() => handleRoleChange('paciente')}
                                >
                                    Paciente
                                </button>
                                <button
                                    type="button"
                                    className={`role-button ${userData.rol === 'medico' ? 'active' : ''}`}
                                    onClick={() => handleRoleChange('medico')}
                                >
                                    Médico
                                </button>
                                <button
                                    type="button"
                                    className={`role-button ${userData.rol === 'admin' ? 'active' : ''}`}
                                    onClick={() => handleRoleChange('admin')}
                                >
                                    Admin
                                </button>
                            </div>
                        </>
                    )}

                    <button type="submit" className="register-button">Guardar Cambios</button>
                    <button
                        type="button"
                        onClick={() => navigate(`/doctor/paciente/${originalCedula}`)}
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

export default EditUserProfile;