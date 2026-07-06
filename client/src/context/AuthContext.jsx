import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { authAPI, getAPIErrorMessage } from '../services/api';
import { AuthContext } from './auth-context-core';

const SESSION_IDLE_TIMEOUT_MS = 60 * 60 * 1000;
const ACTIVITY_THROTTLE_MS = 30 * 1000;
const SESSION_ACTIVITY_KEY = 'mg_last_activity';
const SESSION_TIMEOUT_LABEL = '60 minutes';

const readStoredUser = () => {
  try {
    const stored = localStorage.getItem('mg_user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    localStorage.removeItem('mg_user');
    return null;
  }
};

const readLastActivity = () => {
  const stored = Number(localStorage.getItem(SESSION_ACTIVITY_KEY));
  return Number.isFinite(stored) && stored > 0 ? stored : Date.now();
};

const markActivity = (timestamp = Date.now()) => {
  localStorage.setItem(SESSION_ACTIVITY_KEY, String(timestamp));
};

const isStoredSessionExpired = () => Date.now() - readLastActivity() > SESSION_IDLE_TIMEOUT_MS;

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
    localStorage.removeItem(SESSION_ACTIVITY_KEY);
  }, []);

  const expireSession = useCallback(() => {
    logout();
    toast('Signed out after 60 minutes of inactivity.', {
      id: 'missiongrid-session-expired',
    });
  }, [logout]);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        if (isStoredSessionExpired()) {
          expireSession();
          setLoading(false);
          return;
        }

        try {
          const { data } = await authAPI.getMe();
          setUser(data);
          localStorage.setItem('mg_user', JSON.stringify(data));
          markActivity();
          setAuthError(null);
        } catch (error) {
          const cachedUser = readStoredUser();
          if (cachedUser) {
            setUser(cachedUser);
            setAuthError('Could not verify the current session. Showing cached account data until the API reconnects.');
          } else {
            localStorage.removeItem('mg_token');
            setToken(null);
            setUser(null);
            setAuthError(getAPIErrorMessage(error, 'Could not verify the current session'));
          }
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token, expireSession]);

  useEffect(() => {
    const handleUnauthorized = () => logout();
    window.addEventListener('missiongrid:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('missiongrid:unauthorized', handleUnauthorized);
  }, [logout]);

  useEffect(() => {
    if (!token || !user) return undefined;

    let timeoutId;

    const scheduleTimeout = () => {
      window.clearTimeout(timeoutId);
      const remaining = SESSION_IDLE_TIMEOUT_MS - (Date.now() - readLastActivity());
      timeoutId = window.setTimeout(expireSession, Math.max(0, remaining));
    };

    const recordActivity = () => {
      const currentTime = Date.now();
      if (currentTime - readLastActivity() > ACTIVITY_THROTTLE_MS) {
        markActivity(currentTime);
      }
      scheduleTimeout();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (isStoredSessionExpired()) {
          expireSession();
          return;
        }
        recordActivity();
      }
    };

    const handleStorage = (event) => {
      if (event.key === SESSION_ACTIVITY_KEY) {
        scheduleTimeout();
      }
      if (event.key === 'mg_token' && !event.newValue) {
        logout();
      }
    };

    const activityEvents = ['pointerdown', 'keydown', 'touchstart', 'scroll'];
    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, recordActivity, { passive: true });
    });
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorage);

    if (!localStorage.getItem(SESSION_ACTIVITY_KEY)) {
      markActivity();
    }
    scheduleTimeout();

    return () => {
      window.clearTimeout(timeoutId);
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, recordActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, [token, user, expireSession, logout]);

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
      markActivity();
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
    markActivity();
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
        sessionTimeoutMinutes: SESSION_TIMEOUT_LABEL,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
