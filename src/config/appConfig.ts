// ========================================
// CONFIGURACIÓN DE LA APLICACIÓN
// ========================================
// Archivo para que los estudiantes modifiquen

import { applyTheme, ThemeKey, THEMES, updateThemeMetaColor } from "../styles/themeManager";

const CONFIG_STORAGE_KEYS = {
  DEFAULT_COLLECTION: "app_config_default_collection",
  DEFAULT_TOP_K: "app_config_default_top_k",
  USE_RERANKING: "app_config_use_reranking",
  USE_QUERY_REWRITING: "app_config_use_query_rewriting",
  FORCE_REBUILD: "app_config_force_rebuild",
  INITIAL_BOT_MESSAGE: "app_config_initial_bot_message",
  DESCRIPTION: "app_config_description",
  INPUT_PLACEHOLDER: "app_config_input_placeholder",
  PROJECT_NAME: "app_config_project_name",
  ACTIVE_THEME: "app_config_active_theme",
};

export const APP_CONFIG = {
  // ========== INFORMACIÓN DEL PROYECTO ==========
  // Cambiar por el nombre de su proyecto o grupo
  PROJECT_NAME: "Asistente Inteligente MISW4411",
  
  // Número del grupo (opcional)
  GROUP_NUMBER: null, // Ejemplo: "Grupo 5" o null
  
  // Nombre(s) del/los estudiante(s) (opcional)
  STUDENT_NAMES: null, // Ejemplo: "Seneca Uniandes - Aura Uniandes" o null
  
  // ========== DESCRIPCIÓN ==========
  DESCRIPTION: "Pregúntame sobre el curso o temas relacionados con Grandes Modelos de Lenguaje",
  
  // ========== CONFIGURACIÓN DEL CHAT ==========
  // Mensaje inicial del bot
  INITIAL_BOT_MESSAGE: "Hola 👋 Soy el **Asistente Inteligente MISW4411**. Pregúntame sobre el curso o temas relacionados con **Grandes Modelos de Lenguaje**.\n\n",
  
  // Placeholder del input
  INPUT_PLACEHOLDER: "Escribe tu pregunta sobre el curso MISW4411...",
  
  // ========== CONFIGURACIÓN DEL BACKEND ==========
  // URL del backend (los estudiantes cambiarán esto por su servidor)
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000",
  
  // Endpoint de la API
  API_ENDPOINT: "/api/v1/ask",
  
  // Parámetros por defecto para el RAG
  DEFAULT_TOP_K: 5,
  DEFAULT_COLLECTION: "manuales_collection",
  
  // ========== OPCIONES AVANZADAS DE RAG SEMANA 3 ==========
  // Activar/desactivar reranking de documentos recuperados
  USE_RERANKING: false,
  
  // Activar/desactivar reescritura de consultas con LLM
  USE_QUERY_REWRITING: false,
  
  // Forzar reconstrucción del índice en cada consulta
  FORCE_REBUILD: false,

  // Tema activo de la aplicación
  ACTIVE_THEME: "blue" as ThemeKey,
  
};


// Sincronizar configuración persistida (si existe) en el momento de carga del módulo
if (typeof window !== "undefined") {
  const storedDefaultCollection = window.localStorage.getItem(CONFIG_STORAGE_KEYS.DEFAULT_COLLECTION);
  if (storedDefaultCollection) {
    APP_CONFIG.DEFAULT_COLLECTION = storedDefaultCollection;
  }

  const storedInitialMessage = window.localStorage.getItem(CONFIG_STORAGE_KEYS.INITIAL_BOT_MESSAGE);
  if (storedInitialMessage) {
    APP_CONFIG.INITIAL_BOT_MESSAGE = storedInitialMessage;
  }

  const storedDescription = window.localStorage.getItem(CONFIG_STORAGE_KEYS.DESCRIPTION);
  if (storedDescription) {
    APP_CONFIG.DESCRIPTION = storedDescription;
  }

  const storedInputPlaceholder = window.localStorage.getItem(CONFIG_STORAGE_KEYS.INPUT_PLACEHOLDER);
  if (storedInputPlaceholder) {
    APP_CONFIG.INPUT_PLACEHOLDER = storedInputPlaceholder;
  }

  const storedProjectName = window.localStorage.getItem(CONFIG_STORAGE_KEYS.PROJECT_NAME);
  if (storedProjectName) {
    APP_CONFIG.PROJECT_NAME = storedProjectName;
  }

  const storedTopK = window.localStorage.getItem(CONFIG_STORAGE_KEYS.DEFAULT_TOP_K);
  if (storedTopK) {
    const parsed = Number(storedTopK);
    if (Number.isFinite(parsed) && parsed > 0) {
      APP_CONFIG.DEFAULT_TOP_K = parsed;
    }
  }

  const storedUseReranking = window.localStorage.getItem(CONFIG_STORAGE_KEYS.USE_RERANKING);
  if (storedUseReranking != null) {
    APP_CONFIG.USE_RERANKING = storedUseReranking === "true";
  }

  const storedUseQueryRewriting = window.localStorage.getItem(CONFIG_STORAGE_KEYS.USE_QUERY_REWRITING);
  if (storedUseQueryRewriting != null) {
    APP_CONFIG.USE_QUERY_REWRITING = storedUseQueryRewriting === "true";
  }

  const storedForceRebuild = window.localStorage.getItem(CONFIG_STORAGE_KEYS.FORCE_REBUILD);
  if (storedForceRebuild != null) {
    APP_CONFIG.FORCE_REBUILD = storedForceRebuild === "true";
  }

  const storedTheme = window.localStorage.getItem(CONFIG_STORAGE_KEYS.ACTIVE_THEME) as ThemeKey | null;
  if (storedTheme && storedTheme in THEMES) {
    APP_CONFIG.ACTIVE_THEME = storedTheme;
  }

  applyTheme(APP_CONFIG.ACTIVE_THEME);
  updateThemeMetaColor(APP_CONFIG.ACTIVE_THEME);
}

// ========================================
// FUNCIONES AUXILIARES
// ========================================
// No modificar estas funciones

/**
 * Genera el título completo de la aplicación
 * Incluye nombre del proyecto, grupo y estudiantes si están definidos
 */
export const getFullTitle = (): string => {
  let title = APP_CONFIG.PROJECT_NAME;
  
  if (APP_CONFIG.GROUP_NUMBER) {
    title += ` - ${APP_CONFIG.GROUP_NUMBER}`;
  }
  
  if (APP_CONFIG.STUDENT_NAMES) {
    title += ` - ${APP_CONFIG.STUDENT_NAMES}`;
  }
  
  return title;
};

/**
 * Genera la URL completa del backend
 */
export const getBackendUrl = (): string => {
  return `${APP_CONFIG.BACKEND_URL}${APP_CONFIG.API_ENDPOINT}`;
};

/**
 * Genera el cuerpo de la petición al backend
 * Los estudiantes pueden modificar qué parámetros se envían al API editando APP_CONFIG
 */
export const createRequestBody = (question: string) => {
  return {
    question,
    top_k: APP_CONFIG.DEFAULT_TOP_K,
    collection: APP_CONFIG.DEFAULT_COLLECTION,
    force_rebuild: APP_CONFIG.FORCE_REBUILD,
    use_reranking: APP_CONFIG.USE_RERANKING,
    use_query_rewriting: APP_CONFIG.USE_QUERY_REWRITING,
  };
};

/**
 * Actualiza la colección por defecto y la persiste en localStorage
 */
export const setDefaultCollection = (collectionName: string) => {
  APP_CONFIG.DEFAULT_COLLECTION = collectionName;

  if (typeof window !== "undefined") {
    window.localStorage.setItem(CONFIG_STORAGE_KEYS.DEFAULT_COLLECTION, collectionName);
  }
};

/**
 * Obtiene la colección por defecto actual
 */
export const getDefaultCollection = () => APP_CONFIG.DEFAULT_COLLECTION;

/**
 * Actualiza el valor por defecto de top_k
 */
export const setDefaultTopK = (value: number) => {
  APP_CONFIG.DEFAULT_TOP_K = value;

  if (typeof window !== "undefined") {
    window.localStorage.setItem(CONFIG_STORAGE_KEYS.DEFAULT_TOP_K, String(value));
  }
};

export const getDefaultTopK = () => APP_CONFIG.DEFAULT_TOP_K;

export const setUseReranking = (value: boolean) => {
  APP_CONFIG.USE_RERANKING = value;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(CONFIG_STORAGE_KEYS.USE_RERANKING, String(value));
  }
};

export const getUseReranking = () => APP_CONFIG.USE_RERANKING;

export const setUseQueryRewriting = (value: boolean) => {
  APP_CONFIG.USE_QUERY_REWRITING = value;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(CONFIG_STORAGE_KEYS.USE_QUERY_REWRITING, String(value));
  }
};

export const getUseQueryRewriting = () => APP_CONFIG.USE_QUERY_REWRITING;

export const setForceRebuild = (value: boolean) => {
  APP_CONFIG.FORCE_REBUILD = value;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(CONFIG_STORAGE_KEYS.FORCE_REBUILD, String(value));
  }
};

export const getForceRebuild = () => APP_CONFIG.FORCE_REBUILD;

export const setInitialBotMessage = (message: string) => {
  APP_CONFIG.INITIAL_BOT_MESSAGE = message;

  if (typeof window !== "undefined") {
    window.localStorage.setItem(CONFIG_STORAGE_KEYS.INITIAL_BOT_MESSAGE, message);
  }
};

export const getInitialBotMessage = () => APP_CONFIG.INITIAL_BOT_MESSAGE;

export const setDescription = (description: string) => {
  APP_CONFIG.DESCRIPTION = description;

  if (typeof window !== "undefined") {
    window.localStorage.setItem(CONFIG_STORAGE_KEYS.DESCRIPTION, description);
  }
};

export const getDescription = () => APP_CONFIG.DESCRIPTION;

export const setInputPlaceholder = (placeholder: string) => {
  APP_CONFIG.INPUT_PLACEHOLDER = placeholder;

  if (typeof window !== "undefined") {
    window.localStorage.setItem(CONFIG_STORAGE_KEYS.INPUT_PLACEHOLDER, placeholder);
  }
};

export const getInputPlaceholder = () => APP_CONFIG.INPUT_PLACEHOLDER;

export const setProjectName = (projectName: string) => {
  APP_CONFIG.PROJECT_NAME = projectName;

  if (typeof window !== "undefined") {
    window.localStorage.setItem(CONFIG_STORAGE_KEYS.PROJECT_NAME, projectName);
  }
};

export const getProjectName = () => APP_CONFIG.PROJECT_NAME;


export const setActiveTheme = (theme: ThemeKey) => {
  APP_CONFIG.ACTIVE_THEME = theme;

  if (typeof window !== "undefined") {
    window.localStorage.setItem(CONFIG_STORAGE_KEYS.ACTIVE_THEME, theme);
  }

  applyTheme(theme);
  updateThemeMetaColor(theme);
};

export const getActiveTheme = () => APP_CONFIG.ACTIVE_THEME;
