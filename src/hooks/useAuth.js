import { useApp } from '../context/AppContext';

export const useAuth = () => {
  const { currentUser, isAuthenticated, login, logout, changeUser } = useApp();
  return { currentUser, isAuthenticated, login, logout, changeUser };
};