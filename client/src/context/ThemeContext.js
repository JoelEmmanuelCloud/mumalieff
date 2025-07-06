import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {

  const [theme, setTheme] = useState('light');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getInitialTheme = () => {
    
      if (typeof window === 'undefined') return 'light';
      
      const savedTheme = localStorage.getItem('theme');
      
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        return savedTheme;
      }
      
      return 'light';
    };
    
    const initialTheme = getInitialTheme();
    setTheme(initialTheme);
    setIsLoading(false);
  }, []);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const root = window.document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    

    if (!isLoading) {
      localStorage.setItem('theme', theme);
    }
  }, [theme, isLoading]);
  
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };
  
  const setThemeMode = (mode) => {
    if (mode === 'light' || mode === 'dark') {
      setTheme(mode);
    }
  };
  
  return (
    <ThemeContext.Provider
      value={{ 
        theme, 
        isDarkMode: theme === 'dark',
        isLoading,
        toggleTheme,
        setTheme: setThemeMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;