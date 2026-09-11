"use client";

import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";

type Theme = "dark" | "light";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

//localStorage は React の外にある状態なので、購読できる小さなストアにまとめる
const STORAGE_KEY = "recipe_theme";
const listeners = new Set<() => void>();
let cachedTheme: Theme | null = null;

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function getSnapshot(): Theme {
  //useSyncExternalStore は毎回同じ参照を要求するのでキャッシュする
  if (cachedTheme === null) {
    try {
      cachedTheme = localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark";
    } catch {
      cachedTheme = "dark";
    }
  }
  return cachedTheme;
}

//サーバーには localStorage がないので dark 固定。ハイドレーション後に実際の値へ切り替わる
function getServerSnapshot(): Theme {
  return "dark";
}

function setTheme(next: Theme) {
  cachedTheme = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {}
  listeners.forEach((listener) => listener());
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
