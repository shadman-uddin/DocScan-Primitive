import { create } from "zustand";
import { theme as defaultTheme, type Theme } from "../config/theme";
import { fieldDefinitions as defaultFields, type FieldDefinition } from "../config/fields";

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

interface AppState {
  appName: string;
  theme: Theme;
  fieldDefinitions: FieldDefinition[];
  confidenceThreshold: number;
  setAppName: (name: string) => void;
  setTheme: (partial: Partial<Theme>) => void;
  setFieldDefinitions: (fields: FieldDefinition[]) => void;
  setConfidenceThreshold: (t: number) => void;
  resetConfig: () => void;
}

export const useAppStore = create<AppState>()((set) => ({
  appName: loadFromStorage('config_appName', defaultTheme.appName),
  theme: loadFromStorage('config_theme', defaultTheme),
  fieldDefinitions: loadFromStorage('config_fields', defaultFields),
  confidenceThreshold: loadFromStorage('config_threshold', 0.7),

  setAppName: (name) => {
    saveToStorage('config_appName', name);
    set({ appName: name });
  },

  setTheme: (partial) => {
    set((state) => {
      const updated = { ...state.theme, ...partial };
      saveToStorage('config_theme', updated);
      return { theme: updated };
    });
  },

  setFieldDefinitions: (fields) => {
    saveToStorage('config_fields', fields);
    set({ fieldDefinitions: fields });
  },

  setConfidenceThreshold: (t) => {
    saveToStorage('config_threshold', t);
    set({ confidenceThreshold: t });
  },

  resetConfig: () => {
    localStorage.removeItem('config_appName');
    localStorage.removeItem('config_theme');
    localStorage.removeItem('config_fields');
    localStorage.removeItem('config_threshold');
    localStorage.removeItem('config_kpiToggles');
    localStorage.removeItem('config_sheetId');
    localStorage.removeItem('config_sheetTabs');
    set({
      appName: defaultTheme.appName,
      theme: defaultTheme,
      fieldDefinitions: defaultFields,
      confidenceThreshold: 0.7,
    });
  },
}));
