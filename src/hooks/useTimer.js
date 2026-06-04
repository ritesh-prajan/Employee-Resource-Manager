import { useApp } from '../context/AppContext';

export const useTimer = () => {
  const { timerState, clockIn, clockOut, toggleBreak } = useApp();
  return { timerState, clockIn, clockOut, toggleBreak };
};