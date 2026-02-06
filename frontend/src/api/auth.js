import client from './client';

export const register = async (data) => {
  const response = await client.post('/auth/register', data);
  return response.data;
};

export const login = async (email, password) => {
  const response = await client.post('/auth/login', { email, password });
  const { access_token, refresh_token } = response.data;
  localStorage.setItem('access_token', access_token);
  localStorage.setItem('refresh_token', refresh_token);
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

export const getMe = async () => {
  const response = await client.get('/auth/me');
  return response.data;
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('access_token');
};

export const getRole = () => {
  const token = localStorage.getItem('access_token');
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role;
  } catch {
    return null;
  }
};
