import React, { createContext, useContext } from 'react';

const TimerContext = createContext();

export const TimerProvider = ({ children }) => {
  return (
    <TimerContext.Provider value={{}}>
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => useContext(TimerContext);