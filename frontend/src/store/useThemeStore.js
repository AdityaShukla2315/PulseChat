import { create } from "zustand";

const getInitialTheme = () => {
  const saved = localStorage.getItem("chat-theme");
  if (saved) return saved;
  
  // Default to dark theme
  localStorage.setItem("chat-theme", "dark");
  return "dark";
};

export const useThemeStore = create((set) => ({
  theme: getInitialTheme(),
  setTheme: (theme) => {
    localStorage.setItem("chat-theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
    set({ theme });
  },
}));
