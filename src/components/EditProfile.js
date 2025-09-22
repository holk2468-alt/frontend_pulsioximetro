import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { getUsers, updateUser } from '../services/apiService';
import './EditProfile.css';

function EditProfile() {
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [originalCedula, setOriginalCedula] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    try {
      const decodedToken = jwtDecode(token);
      setCurrentUser(decodedToken);

      const fetchProfile = async () => {
        try {
          const response = await getUsers(token, { cedula: decodedToken.sub });
          if (response.data) {
            const usuario =
              response.data.usuario ||
              (Array.isArray(response.data.usuarios) &&
                response.data.usuarios.find(
                  (u) => String(u.cedula) === String(decodedToken.sub)
                ));

            if (usuario) {
              setProfile(usuario);
              setFormData({ ...usuario, password: '' });
              setOriginalCedula(usuario.cedula);
            }
          }
        } catch (err) {
          console.error('Error cargando perfil:', err);
          setError('No se pudo cargar el perfil.');
        } finally {
          setLoading(false);
        }
      };

      fetchProfile();
    } catch (err) {
      console.error('Token inválido', err);
      navigate('/');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    setError(null);
    setSuccess(null);

    try {
      const dataToUpdate = {
        cedula: formData.cedula,
        nombre: formData.nombre,
        apellido: formData.apellido,
        genero: formData.genero,
        fecha_nacimiento: formData.fecha_nacimiento,
      };

      if (currentUser && currentUser.rol === 'admin') {
        dataToUpdate.rol = formData.rol;
      }
      
      if (formData.password && formData.password.trim() !== '') {
        dataToUpdate.password = formData.password;
      }

      await updateUser(token, originalCedula, dataToUpdate);

      setSuccess('Perfil actualizado exitosamente.');
      
      // ✅ Lógica de redirección mejorada:
      const passwordChanged = formData.password && formData.password.trim() !== '';
      const cedulaChanged = formData.cedula !== originalCedula;
      const roleChanged = currentUser.rol === 'admin' && formData.rol !== profile.rol;

      if (passwordChanged || cedulaChanged || roleChanged) {
        alert('Se ha realizado un cambio de seguridad. Por favor, vuelve a iniciar sesión.');
        localStorage.removeItem('token');
        navigate('/');
      } else {
        setProfile(dataToUpdate);
        setOriginalCedula(dataToUpdate.cedula);
        setTimeout(() => {
          navigate(-1);
        }, 1500);
      }
    } catch (err) {
      console.error(
        'Error actualizando perfil:',
        err.response?.data || err.message
      );
      setError(err.response?.data?.detail || 'No se pudo actualizar el perfil.');
      setSuccess(null);
    }
  };

  if (loading) return <div className="edit-profile-container">Cargando...</div>;

  return (
    <div className="edit-profile-container">
      <h2>Editar Perfil</h2>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Cédula</label>
          <input
            type="text"
            name="cedula"
            value={formData.cedula || ''}
            onChange={handleChange}
            disabled={formData.rol === 'paciente'}
          />
        </div>

        <div className="form-group">
          <label>Nombre</label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre || ''}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Apellido</label>
          <input
            type="text"
            name="apellido"
            value={formData.apellido || ''}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Género</label>
          <select
            name="genero"
            value={formData.genero || ''}
            onChange={handleChange}
            required
          >
            <option value="">Seleccione...</option>
            <option value="M">M</option>
            <option value="F">F</option>
          </select>
        </div>

        <div className="form-group">
          <label>Fecha de Nacimiento</label>
          <input
            type="date"
            name="fecha_nacimiento"
            value={formData.fecha_nacimiento || ''}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Rol</label>
          {currentUser && currentUser.rol === 'admin' ? (
            <select
              name="rol"
              value={formData.rol || ''}
              onChange={handleChange}
              required
            >
              <option value="paciente">Paciente</option>
              <option value="medico">Médico</option>
              <option value="admin">Admin</option>
            </select>
          ) : (
            <input type="text" name="rol" value={formData.rol || ''} disabled />
          )}
        </div>

        <div className="form-group">
          <label>Nueva Contraseña (opcional)</label>
          <input
            type="password"
            name="password"
            value={formData.password || ''}
            onChange={handleChange}
            placeholder="Dejar vacío para no cambiar"
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="save-button">
            Guardar
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="cancel-button"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditProfile;