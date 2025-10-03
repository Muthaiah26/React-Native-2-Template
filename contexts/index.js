// src/contexts/index.js
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import decryptJWT from '../utils/decrypt';

export const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [role, setRole] = useState(null);
  const [token, setToken] = useState(null);
  const [sno, setSno] = useState(null);
  const [userData, setUserData] = useState(null);

  // Load initial values from AsyncStorage
  useEffect(() => {
    const loadStorage = async () => {
      try {
        const storedRole = await AsyncStorage.getItem('time_ms');
        const storedToken = await AsyncStorage.getItem('test');
        const storedSno = await AsyncStorage.getItem('sno');

        if (storedRole) setRole(storedRole);
        if (storedToken) setToken(storedToken);
        if (storedSno) setSno(storedSno);
      } catch (err) {
        console.error('Failed to load storage', err);
      }
    };

    loadStorage();
  }, []);

  // Persist and decode token when it changes
  useEffect(() => {
    let mounted = true;

    const handleToken = async () => {
      if (!token) {
        await AsyncStorage.removeItem('test');
        if (mounted) setUserData(null);
        return;
      }

      try {
        await AsyncStorage.setItem('test', token);
        const decoded = await decryptJWT(token);
        if (mounted) setUserData(decoded);
      } catch (err) {
        console.error('Failed to decode token', err);
        if (mounted) {
          setUserData(null);
          setToken(null);
          await AsyncStorage.removeItem('test');
        }
      }
    };

    handleToken();

    return () => {
      mounted = false;
    };
  }, [token]);

  // Persist sno and role whenever they change
  useEffect(() => {
    const persistData = async () => {
      try {
        if (sno) await AsyncStorage.setItem('sno', sno);
        else await AsyncStorage.removeItem('sno');

        if (role) await AsyncStorage.setItem('time_ms', role);
        else await AsyncStorage.removeItem('time_ms');
      } catch (err) {
        console.error('Failed to persist sno/role', err);
      }
    };

    persistData();
  }, [sno, role]);

  return (
    <UserContext.Provider
      value={{
        role,
        setRole,
        token,
        setToken,
        sno,
        setSno,
        userData,
        setUserData,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
