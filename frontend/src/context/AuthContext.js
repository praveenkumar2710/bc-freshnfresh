import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch { return true; }
}

function getRoleFromToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role || null;
  } catch { return null; }
}

function clearAllStorage() {
  localStorage.removeItem('fs_token');
  localStorage.removeItem('fs_user');
  localStorage.removeItem('fs_cart');
  localStorage.removeItem('fs_cart_ts');
}

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(null);
  const [loading, setLoading] = useState(true); // ← NEW: wait until session restored

  // Restore session from localStorage on first load
  useEffect(() => {
    const t = localStorage.getItem('fs_token');
    const u = localStorage.getItem('fs_user');
    if (t && u) {
      if (isTokenExpired(t)) {
        clearAllStorage();
      } else {
        setToken(t);
        try {
          const parsedUser    = JSON.parse(u);
          const roleFromToken = getRoleFromToken(t);
          if (roleFromToken && parsedUser.role !== roleFromToken) {
            parsedUser.role = roleFromToken;
            localStorage.setItem('fs_user', JSON.stringify(parsedUser));
          }
          setUser(parsedUser);
        } catch {
          clearAllStorage();
        }
      }
    }
    setLoading(false); // ← done restoring session
  }, []);

  const login = (userData, jwt) => {
    const roleFromToken = getRoleFromToken(jwt);
    const enrichedUser  = { ...userData, role: roleFromToken || userData.role };
    setUser(enrichedUser);
    setToken(jwt);
    localStorage.setItem('fs_token', jwt);
    localStorage.setItem('fs_user',  JSON.stringify(enrichedUser));
    localStorage.removeItem('fs_cart');
    localStorage.removeItem('fs_cart_ts');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    clearAllStorage();
  };

  const isAdmin    = user?.role === 'ADMIN';
  const isLoggedIn = !!token && !isTokenExpired(token);

  // ← Don't render anything until session is restored
  if (loading) {
    return (
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'center',
        height:'100vh', flexDirection:'column', gap:12
      }}>
        <div style={{ fontSize:40 }}>🌸</div>
        <p style={{ color:'#1a8c4e', fontWeight:600, fontSize:16 }}>
          BC Fresh n Fresh
        </p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAdmin, isLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);