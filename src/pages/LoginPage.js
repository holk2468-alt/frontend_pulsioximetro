import React, { useState } from 'react';
import { login } from '../services/apiService';
import { Link, useNavigate } from 'react-router-dom';
import './LoginPage.css';

function LoginPage() {
    const [cedula, setCedula] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await login({ username: cedula, password });
            const token = response.data.access_token;
            localStorage.setItem('token', token);
            navigate('/dashboard');
        } catch (err) {
            setError('Cédula o contraseña incorrectas.');
            console.error(err);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <div className="login-header">
                    <img src="/logo.png" alt="Logo de la aplicación" className="login-logo" />
                    <h1>Sistema de registros medicos</h1>
                </div>

                <h2 className="login-title">Inicio de sesión</h2> 
                
                <form className="login-form" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Cédula"
                        value={cedula}
                        onChange={(e) => setCedula(e.target.value)}
                        className="login-input"
                    />
                    <input
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="login-input"
                    />
                    <button type="submit" className="login-button">Entrar</button>
                </form>
                {error && <p className="error-message">{error}</p>}
                <p className="register-link-text">
                    ¿No tienes una cuenta? <Link to="/register" className="register-link">Regístrate aquí</Link>
                </p>
            </div>
        </div>
    );
}

export default LoginPage;