import { useApp } from './AppContext';

export const AuthProvider = ({ children }) => children;

export const useAuth = () => {
  const { currentUser, isAuthenticated, login, logout, changeUser } = useApp();
  return { currentUser, isAuthenticated, login, logout, changeUser };
};