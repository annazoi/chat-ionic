// ThemeContext.tsx

import React, { createContext, useState, useContext, ReactNode } from "react";

interface ThemeContextType {
  isDarkTheme: boolean;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
);

interface ProviderProps {
  children: ReactNode;
}

export const Provider: React.FC<ProviderProps> = ({ children }) => {
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(false);

  const toggleTheme = () => {
    setIsDarkTheme((prevTheme) => !prevTheme);
  };

  return (
    <ThemeContext.Provider value={{ isDarkTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
