import React, { createContext, useContext, useState, useEffect } from "react";

export type ThemeType = "light" | "dark";

interface ThemeContextProps {
  theme: ThemeType;
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeType>(() => {
    const saved = localStorage.getItem("mediguide_theme") as ThemeType;
    if (saved === "light" || saved === "dark") return saved;
    return "dark"; // default = dark
  });

  useEffect(() => {
    const body = window.document.body;
    // CSS uses :root (dark default) and body.light (light override)
    if (theme === "light") {
      body.classList.add("light");
    } else {
      body.classList.remove("light");
    }
    localStorage.setItem("mediguide_theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));

  const setTheme = (t: ThemeType) => setThemeState(t);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
