import axios from 'axios';

const API_URL = 'https://interfaz-pulsioximetro.onrender.com';

// ------------------- AUTENTICACIÓN -------------------
export const register = (userData) => {
  return axios.post(`${API_URL}/register_paciente`, userData);
};

export const login = (credentials) => {
  const formData = new URLSearchParams(credentials);
  return axios.post(`${API_URL}/login`, formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
};

// ------------------- USUARIOS -------------------
export const getUsers = (token, params = {}) => {
  return axios.get(`${API_URL}/usuarios`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params,
  });
};

export const updateUser = (token, cedulaActual, data) => {
  return axios.put(`${API_URL}/usuarios/${cedulaActual}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const deleteUser = (token, cedula) => {
  return axios.delete(`${API_URL}/usuarios/${cedula}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const createPatient = (token, userData) => {
  return axios.post(
    `${API_URL}/usuarios`,
    { ...userData, rol: 'paciente' },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

export const createUser = (token, userData) => {
  return axios.post(`${API_URL}/usuarios`, userData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// ------------------- MEDICIONES -------------------
export const getMeasurements = (token, params = {}) => {
  return axios.get(`${API_URL}/mediciones`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params,
  });
};

export const updateMeasurement = (token, id, data) => {
  return axios.put(`${API_URL}/mediciones/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const deleteMeasurement = (token, id) => {
  return axios.delete(`${API_URL}/mediciones/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// ------------------- ALERTAS -------------------
export const getAlerts = (token, params = {}) => {
  return axios.get(`${API_URL}/alertas`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params,
  });
};

export const updateAlert = (token, id, data) => {
  return axios.put(`${API_URL}/alertas/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const deleteAlert = (token, id) => {
  return axios.delete(`${API_URL}/alertas/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
