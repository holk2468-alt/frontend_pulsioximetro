import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import PatientDashboard from '../components/PatientDashboard';
import DoctorDashboard from '../components/DoctorDashboard'; // Importa el nuevo componente
import AdminDashboard from '../components/AdminDashboard';

function DashboardPage() {
    const navigate = useNavigate();
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
            return;
        }

        try {
            const decodedToken = jwtDecode(token);
            setUserRole(decodedToken.rol);
        } catch (error) {
            console.error('Token inválido', error);
            navigate('/');
        }
    }, [navigate]);

    if (!userRole) {
        return <div>Cargando...</div>;
    }

    if (userRole === 'paciente') {
        return <PatientDashboard />;
    }



     if (userRole === 'medico') {
        return <DoctorDashboard />; // Ahora renderizamos el dashboard del médico
    }

    if (userRole === 'admin') {
        return <AdminDashboard />;
    }

    return <div>Rol de usuario no reconocido.</div>;
}

export default DashboardPage;