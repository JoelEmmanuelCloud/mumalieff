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
  // Always start with light theme
  const [theme, setTheme] = useState('light');
  const [isLoading, setIsLoading] = useState(true);
  
  // Get initial theme preference - ONLY check localStorage, ignore system preference
  useEffect(() => {
    const getInitialTheme = () => {
      // Check if we're on the client side
      if (typeof window === 'undefined') return 'light';
      
      const savedTheme = localStorage.getItem('theme');
      
      // Only use saved theme if it exists, otherwise always default to light
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        return savedTheme;
      }
      
      // Always default to light mode (ignore system preference)
      return 'light';
    };
    
    const initialTheme = getInitialTheme();
    setTheme(initialTheme);
    setIsLoading(false);
  }, []);
  
  // Update theme class on document
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const root = window.document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Save theme preference to localStorage
    if (!isLoading) {
      localStorage.setItem('theme', theme);
    }
  }, [theme, isLoading]);
  
  // Toggle theme
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };
  
  // Set specific theme
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