import { useEffect, useState } from "react";

const DarkModeToggle = () => {
  const [dark, setDark] = useState(() =>
    typeof window !== "undefined"
      ? window.localStorage.getItem("theme") === "dark"
      : false
  );

  useEffect(() => {
    if (dark) {
      document.documentElement.setAttribute("data-theme", "dark");
      window.localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      window.localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return (
    <button
      className="btn btn-xs btn-ghost rounded-full"
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setDark((d) => !d)}
      aria-label="Toggle dark mode"
    >
      {dark ? (
        <span role="img" aria-label="Light">🌞</span>
      ) : (
        <span role="img" aria-label="Dark">🌙</span>
      )}
    </button>
  );
};

export default DarkModeToggle;
