import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Employees from './pages/admin/Employees';

function Inner() {
  const { changeUser, currentUser } = useApp();
  
  React.useEffect(() => {
    changeUser('user-admin');  // directly sets currentUser by ID
  }, []);

  if (!currentUser) return <div>loading...</div>;
  
  return <Employees />;
}

function App() {
  return (
    <AppProvider>
      <Inner />
    </AppProvider>
  );
}

export default App;