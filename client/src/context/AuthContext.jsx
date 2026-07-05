import { useState, useEffect, useCallback } from 'react';
import { authAPI, getAPIErrorMessage } from '../services/api';
import { AuthContext } from './auth-context-core';

const readStoredUser = () => {
  try {
    const stored = localStorage.getItem('mg_user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    localStorage.removeItem('mg_user');
    return null;
  }
};

const normalizeAuthPayload = (payload) => {
  const token = payload?.token || payload?.accessToken;
  const sourceUser = payload?.user || payload || {};
  const { token: _token, accessToken: _accessToken, ...user } = sourceUser;
  return { token, user };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => readStoredUser());
  const [token, setToken] = useState(localStorage.getItem('mg_token'));
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setAuthError(null);
    localStorage.removeItem('mg_token');
    localStorage.removeItem('mg_user');
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const { data } = await authAPI.getMe();
          setUser(data);
          localStorage.setItem('mg_user', JSON.stringify(data));
          setAuthError(null);
        } catch {
          const cachedUser = readStoredUser();
          const fallbackUser = cachedUser || {
            name: 'Offline Commander',
            email: 'offline@missiongrid.local',
            role: 'Captain',
          };
          setUser(fallbackUser);
          setAuthError('Live identity uplink is offline. Showing cached command access.');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  useEffect(() => {
    const handleUnauthorized = () => logout();
    window.addEventListener('missiongrid:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('missiongrid:unauthorized', handleUnauthorized);
  }, [logout]);

  const login = async (email, password) => {
    try {
      const { data } = await authAPI.login({ email, password });
      const normalized = normalizeAuthPayload(data);
      if (!normalized.token) {
        throw new Error('Login response did not include an access token');
      }
      setUser(normalized.user);
      setToken(normalized.token);
      setAuthError(null);
      localStorage.setItem('mg_token', normalized.token);
      localStorage.setItem('mg_user', JSON.stringify(normalized.user));
      return normalized.user;
    } catch (error) {
      error.missionGridMessage = getAPIErrorMessage(error, 'Access denied');
      throw error;
    }
  };

  const persistAuth = (normalized) => {
    if (!normalized.token) {
      throw new Error('Authentication response did not include an access token');
    }
    setUser(normalized.user);
    setToken(normalized.token);
    setAuthError(null);
    localStorage.setItem('mg_token', normalized.token);
    localStorage.setItem('mg_user', JSON.stringify(normalized.user));
    return normalized.user;
  };

  const registerCaptain = async ({ name, email, password, workspaceName }) => {
    try {
      const { data } = await authAPI.registerCaptain({ name, email, password, workspaceName });
      const normalized = normalizeAuthPayload(data);
      return persistAuth(normalized);
    } catch (error) {
      error.missionGridMessage = getAPIErrorMessage(error, 'Registration failed');
      throw error;
    }
  };

  const joinTeam = async ({ inviteCode, name, email, password }) => {
    try {
      const { data } = await authAPI.joinTeam({ inviteCode, name, email, password });
      const normalized = normalizeAuthPayload(data);
      return persistAuth(normalized);
    } catch (error) {
      error.missionGridMessage = getAPIErrorMessage(error, 'Team join failed');
      throw error;
    }
  };

  const register = async (name, email, password, role, workspaceName, inviteCode) => {
    if (role === 'Crew' || role === 'Team Member' || role === 'TeamMember') {
      return joinTeam({ inviteCode, name, email, password });
    }
    return registerCaptain({ name, email, password, workspaceName: workspaceName || `${name}'s Team` });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        authError,
        login,
        register,
        registerCaptain,
        joinTeam,
        logout,
        isAuthenticated: Boolean(token && user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
