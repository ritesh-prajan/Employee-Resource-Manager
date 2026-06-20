import { api } from './api';

export const authService = {

  login: (email, password) => {
    return api.post('/auth/login', { email, password });
  },

  logout: () => {
    return api.post('/auth/logout', {});
  },

  refresh: (refreshToken) => {
    return api.post('/auth/refresh', { refreshToken });
  },
  forgotpassword:(email)=>{
    return api.post('/auth/forgot-password',{email})
  },
  resetpassword:(password,token)=>{
    return api.post('/auth/reset-password',{token, newPassword: password})
  }


};