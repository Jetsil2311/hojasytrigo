/* eslint-disable react/prop-types */
import { createContext, useContext, useState, useEffect } from 'react';
import { db, doc, onSnapshot, setDoc, updateDoc, serverTimestamp } from '../demo/store';

const RegisterContext = createContext();

const todayKey = () => {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
};

export const RegisterProvider = ({ children }) => {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [initialAmount, setInitialAmount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onSnapshot(
      doc(db, 'register_sessions', todayKey()),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setIsRegisterOpen(!data.isClosed);
          setInitialAmount(data.openingFloat || 0);
        } else {
          setIsRegisterOpen(false);
          setInitialAmount(0);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to register session:', error);
        setLoading(false);
      }
    );
  }, []);

  const openRegister = async (amount) => {
    await setDoc(doc(db, 'register_sessions', todayKey()), {
      date: todayKey(),
      openingFloat: amount,
      cashSales: 0,
      cardSales: 0,
      loyaltyRedemptions: 0,
      deposits: [],
      withdrawals: [],
      closingCash: null,
      isClosed: false,
      createdAt: serverTimestamp(),
    });
  };

  const closeRegister = async (closingCash = 0) => {
    await updateDoc(doc(db, 'register_sessions', todayKey()), {
      closingCash,
      isClosed: true,
      closedAt: serverTimestamp(),
    });
  };

  return (
    <RegisterContext.Provider value={{ isRegisterOpen, initialAmount, openRegister, closeRegister, loading }}>
      {children}
    </RegisterContext.Provider>
  );
};

export const useRegisterContext = () => {
  const context = useContext(RegisterContext);
  if (!context) {
    throw new Error('useRegisterContext must be used within a RegisterProvider');
  }
  return context;
};
