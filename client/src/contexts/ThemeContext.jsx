import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const savedTheme = localStorage.getItem('zeno_theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }
      return 'dark'; // Mặc định là Theme Tối
    } catch {
      return 'dark';
    }
  });

  const applyTheme = (t) => {
    const root = document.documentElement;
    const body = document.body;
    
    if (t === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
      body.classList.remove('dark', 'bg-slate-950', 'text-slate-100');
      body.classList.add('light', 'bg-slate-100', 'text-slate-900');
      root.setAttribute('data-theme', 'light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      body.classList.remove('light', 'bg-slate-100', 'text-slate-900');
      body.classList.add('dark', 'bg-slate-950', 'text-slate-100');
      root.setAttribute('data-theme', 'dark');
    }
  };

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem('zeno_theme', theme);
    } catch (e) {
      console.warn('Lỗi lưu theme:', e.message);
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (newTheme) => {
    if (newTheme === 'dark' || newTheme === 'light') {
      setThemeState(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
