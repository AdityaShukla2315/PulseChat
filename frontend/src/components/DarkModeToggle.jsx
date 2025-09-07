import { useThemeStore } from "../store/useThemeStore";
import { Moon, Sun } from "lucide-react";

const DarkModeToggle = () => {
  const { theme, setTheme } = useThemeStore();
  const isDark = theme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      className="btn btn-sm btn-ghost rounded-full hover:bg-base-200 transition-colors"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
    >
      {isDark ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
    </button>
  );
};

export default DarkModeToggle;
