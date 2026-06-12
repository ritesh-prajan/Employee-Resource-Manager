import {createContext,useContext,useCallback,useState,useEffect, useRef} from "react";
import {loginapi,refreshapi} from "../services/api.js"
const BASE_URL=import.meta.env.VITE_API_KEY;

const ROLE_MAP = {
  ADMIN:     "Admin",
  TEAM_LEAD: "Team Lead",
  SUB_LEAD:  "Sub Lead",
  EMPLOYEE:  "Employee",
};

function maprole(apirole=[]){
  for(const code of ["ADMIN", "TEAM_LEAD", "SUB_LEAD", "EMPLOYEE"]){
    if(apirole.includes(code)){
     
      return ROLE_MAP[code];
    }
  }
  return 'Employee'
}

function normaliseuser(apiuser){
  return{
    id:apiuser.id,
    email:apiuser.email,
    role: maprole(apiuser.roles),
    roles:apiuser.roles??[],
    permission:apiuser.permissions??[],
    components:apiuser.components??[],
  }
}

const interceptors={
  response:[],
  use (onResponse,onError){
    const id=Date.now +Math.random();
    this.response.push({id,onResponse,onError});
    return id;
  },

  eject(id){
    this.response=this.response.filter(i=>i.id!==id);
  },
};

const AuthContext=createContext(null);

export function AuthProvider({children}){
  const [user, setuser] = useState(null);
  const [loading, setloading] = useState(true);
  const [error, seterror] = useState(null);

  const isAuthenticated = !!user;

  const refreshpromiseref = useRef(null);

  function saveUser(apiuser) {
    setuser(normaliseuser(apiuser));
  }

  function clearall() {
    setuser(null);
  }

  async function login(email, password) {
    setloading(true);
    seterror(null);
    try {
      const data = await loginapi(email, password);
      saveUser(data.user);
      return normaliseuser(data.user);
    } catch (err) {
      seterror(err.message ?? "login failed");
      throw err;
    } finally {
      setloading(false);
    }
  }

  function logout() {
    clearall();
  }

  const refresh = useCallback(async () => {
    if (refreshpromiseref.current) return refreshpromiseref.current;
    refreshpromiseref.current = (async () => {
      try {
        const data = await refreshapi();
        saveUser(data.user);
        return true;
      } catch {
        logout();
        return false;
      } finally {
        refreshpromiseref.current = null;
      }
    })();
    return refreshpromiseref.current;
  }, []);

  useEffect(() => {
    async function checkSession() {
      try {
        await refresh();
      } catch {
        // Ignored, user not logged in
      } finally {
        setloading(false);
      }
    }
    checkSession();
  }, [refresh]);

  const authfetch = useCallback(async (url, options = {}) => {
    const defaultOptions = {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      }
    };

    let response = await fetch(url, defaultOptions);

    if (response.status === 401) {
      const refreshed = await refresh();
      if (!refreshed) return response;

      response = await fetch(url, defaultOptions);
      if (response.status === 401) logout();
    }

    return response;
  }, [refresh]);

  function haspermission(permission){
    return user?.permissions?.includes(permission)??false;
  }

  function hasrole(role){
    return (user?.role===role||user?.roles?.includes(role))?? false;
  }

  return(
    <AuthContext.Provider
    value={{
      user,
      isAuthenticated,
      loading,
      error,
      login,
      logout,
      refresh,
      authfetch,
      haspermission,
      hasrole,
    }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(){
  const ctx=useContext(AuthContext);
  if(!ctx){
    throw new Error("auth context must be inside auth provider")
    
  }
  return ctx;
}


