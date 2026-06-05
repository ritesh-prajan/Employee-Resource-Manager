import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Projects from './pages/admin/Projects';

function Inner() {
  const { changeUser, currentUser } = useApp();
  
  React.useEffect(() => {
    changeUser('user-admin');  // directly sets currentUser by ID
  }, []);

  if (!currentUser) return <div>loading...</div>;
  
  return <Projects />;
}

function App() {
  return (
    <AppProvider>
      <Inner />
    </AppProvider>
  );
}

export default App;