import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Tasks from './pages/employee/Tasks';

function Inner() {
  const { changeUser, currentUser } = useApp();
  
  React.useEffect(() => {
    changeUser('user-admin');
  }, []);

  if (!currentUser) return <div>loading...</div>;
  
  return <Tasks />;
}

function App() {
  return (
    <AppProvider>
      <Inner />
    </AppProvider>
  );
}

export default App;