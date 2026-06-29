"use client";

import { createContext, useContext, useEffect, useState } from 'react';
export const CafeContext = createContext();

export const CafeProvider = ({ children }) => {
  const [cafeIdContext, setCafeIdContext] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("cafeId") || null;
    }
    return null;
  });
  useEffect(() => {
    if (cafeIdContext) {
      localStorage.setItem("cafeId", cafeIdContext);
    }
  }, [cafeIdContext]);
  return (
    <CafeContext.Provider value={{ cafeIdContext, setCafeIdContext }}>
      {children}
    </CafeContext.Provider>
  );
};

export const useCafe = () => useContext(CafeContext);
