import React, { useState } from 'react';
import { register } from '../services/apiService';
import { Link, useNavigate } from 'react-router-dom';
import './RegisterPage.css';

function RegisterPage() {
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [cedula, setCedula] = useState('');
    const [password, setPassword] = useState('');
    const [fechaNacimiento, setFechaNacimiento] = useState('');
    const [genero, setGenero] = useState('');
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
            };
            await register(userData);
            setSuccess('Registro exitoso. Serás redirigido al login.');
            setTimeout(() => {
                navigate('/');
            }, 3000);
        } catch (err) {
            // Manejo de error mejorado para mostrar el mensaje exacto del backend
            if (err.response && err.response.data && err.response.data.detail) {
                // Si el error tiene una lista de detalles, como en el caso de Pydantic
                if (Array.isArray(err.response.data.detail)) {
                    // Tomamos el primer mensaje de la lista (por lo general, es el más relevante)
                    setError(err.response.data.detail[0].msg);
                } else {
                    // Si es un solo mensaje, como el de cédula duplicada
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
                <h1 className="register-title">Registro de Paciente</h1>
                <form className="register-form" onSubmit={handleSubmit}>
                    <input type="text" placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
                    <input type="text" placeholder="Apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} required />
                    <input type="text" placeholder="Cédula" value={cedula} onChange={(e) => setCedula(e.target.value)} required />
                    <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <label>Fecha de Nacimiento:</label>
                    <input type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} required />
                    <input type="text" placeholder="Género (M/F)" value={genero} onChange={(e) => setGenero(e.target.value.toUpperCase())} required />
                    
                    <button type="submit" className="register-button">Registrarse</button>
                </form>
                {error && <p className="error-message">{error}</p>}
                {success && <p className="success-message">{success}</p>}
                <p className="login-link-text">
                    ¿Ya tienes una cuenta? <Link to="/" className="login-link">Inicia sesión aquí</Link>
                </p>
            </div>
        </div>
    );
}

export default RegisterPage;