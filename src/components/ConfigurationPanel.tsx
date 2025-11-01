/**
 * @fileoverview ConfigurationPanel Component
 *
 * Panel para ajustar parámetros globales de la aplicación.
 * Permite definir la colección por defecto utilizada en las consultas RAG.
 * Persistimos la configuración en localStorage para conservarla entre sesiones.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNotifications } from "../contexts/NotificationContext";
import {
  APP_CONFIG,
  getDefaultCollection,
  setDefaultCollection,
  getDefaultTopK,
  setDefaultTopK,
  getUseReranking,
  setUseReranking as setGlobalUseReranking,
  getUseQueryRewriting,
  setUseQueryRewriting as setGlobalUseQueryRewriting,
  getForceRebuild,
  setForceRebuild as setGlobalForceRebuild,
  getInitialBotMessage,
  setInitialBotMessage,
  getDescription,
  setDescription,
  getInputPlaceholder,
  setInputPlaceholder,
  getProjectName,
  setProjectName,
  getActiveTheme,
  setActiveTheme,
} from "../config/appConfig";
import { ThemeKey, THEMES, applyTheme, updateThemeMetaColor } from "../styles/themeManager";

const COLLECTION_REGEX = /^[a-zA-Z0-9_-]+$/;
const COLLECTIONS_ENDPOINT = `${APP_CONFIG.BACKEND_URL.replace(/\/$/, "")}/api/v1/collections`;
const THEME_OPTIONS: ThemeKey[] = ["blue", "green", "yellow", "orange", "red", "violet"];

const normalizeCollectionNames = (payload: any): string[] => {
  const candidates = [
    payload,
    payload?.data,
    payload?.collections,
    payload?.data?.collections,
  ].find(Array.isArray);

  if (!Array.isArray(candidates)) {
    return [];
  }

  const items = candidates
    .map((item: any) => {
      if (typeof item === "string") {
        return item.trim();
      }
      if (item && typeof item === "object" && typeof item.name === "string") {
        return item.name.trim();
      }
      return null;
    })
    .filter((item): item is string => Boolean(item && COLLECTION_REGEX.test(item)));

  return Array.from(new Set(items));
};

export default function ConfigurationPanel() {
  const { addNotification } = useNotifications();
  const [currentDefault, setCurrentDefault] = useState<string>(() => getDefaultCollection());
  const [collectionName, setCollectionName] = useState<string>(() => getDefaultCollection());
  const [currentTopK, setCurrentTopK] = useState<number>(() => getDefaultTopK());
  const [topK, setTopKValue] = useState<string>(() => String(getDefaultTopK()));
  const [currentUseReranking, setCurrentUseReranking] = useState<boolean>(() => getUseReranking());
  const [useReranking, setUseRerankingState] = useState<boolean>(() => getUseReranking());
  const [currentUseQueryRewriting, setCurrentUseQueryRewriting] = useState<boolean>(() => getUseQueryRewriting());
  const [useQueryRewriting, setUseQueryRewritingState] = useState<boolean>(() => getUseQueryRewriting());
  const [currentForceRebuild, setCurrentForceRebuild] = useState<boolean>(() => getForceRebuild());
  const [forceRebuild, setForceRebuildState] = useState<boolean>(() => getForceRebuild());
  const [currentInitialMessage, setCurrentInitialMessage] = useState<string>(() => getInitialBotMessage());
  const [initialMessage, setInitialMessage] = useState<string>(() => getInitialBotMessage());
  const [currentDescription, setCurrentDescription] = useState<string>(() => getDescription());
  const [description, setDescriptionState] = useState<string>(() => getDescription());
  const [currentInputPlaceholder, setCurrentInputPlaceholder] = useState<string>(() => getInputPlaceholder());
  const [inputPlaceholder, setInputPlaceholderState] = useState<string>(() => getInputPlaceholder());
  const [currentProjectName, setCurrentProjectName] = useState<string>(() => getProjectName());
  const [projectName, setProjectNameState] = useState<string>(() => getProjectName());
  const [currentTheme, setCurrentTheme] = useState<ThemeKey>(() => getActiveTheme());
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>(() => getActiveTheme());
  const savedThemeRef = useRef<ThemeKey>(getActiveTheme());
  const [collections, setCollections] = useState<string[]>([]);
  const [isLoadingCollections, setIsLoadingCollections] = useState<boolean>(false);
  const [collectionsError, setCollectionsError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const defaultCollection = getDefaultCollection();
    const defaultTopK = getDefaultTopK();
    const reranking = getUseReranking();
    const queryRewriting = getUseQueryRewriting();
    const rebuild = getForceRebuild();
    const initial = getInitialBotMessage();
    const descriptionValue = getDescription();
    const placeholderValue = getInputPlaceholder();
    const projectNameValue = getProjectName();
    const themeValue = getActiveTheme();

    setCollectionName(defaultCollection);
    setCurrentDefault(defaultCollection);
    setTopKValue(String(defaultTopK));
    setCurrentTopK(defaultTopK);
    setUseRerankingState(reranking);
    setCurrentUseReranking(reranking);
    setUseQueryRewritingState(queryRewriting);
    setCurrentUseQueryRewriting(queryRewriting);
    setForceRebuildState(rebuild);
    setCurrentForceRebuild(rebuild);
    setInitialMessage(initial);
    setCurrentInitialMessage(initial);
    setDescriptionState(descriptionValue);
    setCurrentDescription(descriptionValue);
    setInputPlaceholderState(placeholderValue);
    setCurrentInputPlaceholder(placeholderValue);
    setProjectNameState(projectNameValue);
    setCurrentProjectName(projectNameValue);
    setSelectedTheme(themeValue);
    setCurrentTheme(themeValue);
    savedThemeRef.current = themeValue;
  }, []);

  const fetchCollections = useCallback(async () => {
    setIsLoadingCollections(true);
    setCollectionsError(null);

    try {
      const response = await fetch(COLLECTIONS_ENDPOINT);

      if (!response.ok) {
        throw new Error(`No se pudieron obtener las colecciones (HTTP ${response.status}).`);
      }

      const data = await response.json();
      const names = normalizeCollectionNames(data);
      const defaultCollection = getDefaultCollection();
      const merged = Array.from(
        new Set([
          ...names,
          ...(defaultCollection ? [defaultCollection] : []),
        ])
      );

      setCollections(merged);
    } catch (error: any) {
      const fallbackDefault = getDefaultCollection();
      setCollectionsError(error?.message || "No se pudieron cargar las colecciones disponibles.");
      setCollections(fallbackDefault ? [fallbackDefault] : []);
    } finally {
      setIsLoadingCollections(false);
    }
  }, []);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  useEffect(() => {
    applyTheme(selectedTheme);
    updateThemeMetaColor(selectedTheme);
  }, [selectedTheme]);

  useEffect(() => {
    return () => {
      if (selectedTheme !== savedThemeRef.current) {
        applyTheme(savedThemeRef.current);
        updateThemeMetaColor(savedThemeRef.current);
      }
    };
  }, [selectedTheme]);

  useEffect(() => {
    if (collections.length === 0) {
      return;
    }

    if (!collections.includes(collectionName)) {
      const defaultCollection = getDefaultCollection();
      if (defaultCollection && collections.includes(defaultCollection)) {
        setCollectionName(defaultCollection);
      } else if (collections.length > 0) {
        setCollectionName(collections[0]);
      }
    }
  }, [collections, collectionName]);

  const hasChanges = useMemo(
    () => {
      const trimmedCollection = collectionName.trim();
      const parsedTopK = Number(topK);
      return (
        trimmedCollection !== currentDefault ||
        parsedTopK !== currentTopK ||
        useReranking !== currentUseReranking ||
        useQueryRewriting !== currentUseQueryRewriting ||
        forceRebuild !== currentForceRebuild ||
        initialMessage !== currentInitialMessage ||
        description !== currentDescription ||
        inputPlaceholder !== currentInputPlaceholder ||
        projectName !== currentProjectName
        || selectedTheme !== currentTheme
      );
    },
    [
      collectionName,
      currentDefault,
      topK,
      currentTopK,
      useReranking,
      currentUseReranking,
      useQueryRewriting,
      currentUseQueryRewriting,
      forceRebuild,
      currentForceRebuild,
      initialMessage,
      currentInitialMessage,
      description,
      currentDescription,
      inputPlaceholder,
      currentInputPlaceholder,
      projectName,
      currentProjectName,
      selectedTheme,
      currentTheme,
    ]
  );

  const handleSave = async () => {
    const trimmed = collectionName.trim();
    const parsedTopK = Number(topK);

    if (!trimmed) {
      addNotification({
        type: "error",
        title: "Colección requerida",
        message: "Debes ingresar un nombre de colección para guardar los cambios.",
        autoClose: false,
      });
      return;
    }

    if (!COLLECTION_REGEX.test(trimmed)) {
      addNotification({
        type: "error",
        title: "Formato inválido",
        message: "La colección solo puede contener letras, números, guiones y guiones bajos.",
        autoClose: false,
      });
      return;
    }

    if (!Number.isInteger(parsedTopK) || parsedTopK <= 0) {
      addNotification({
        type: "error",
        title: "Top K inválido",
        message: "El valor de Top K debe ser un número entero positivo.",
        autoClose: false,
      });
      return;
    }

    setIsSaving(true);

    try {
      setDefaultCollection(trimmed);
      setCurrentDefault(trimmed);
      setCollectionName(trimmed);
      setCollections((prev) => Array.from(new Set([trimmed, ...prev])));

      setDefaultTopK(parsedTopK);
      setCurrentTopK(parsedTopK);
      setTopKValue(String(parsedTopK));

      setGlobalUseReranking(useReranking);
      setCurrentUseReranking(useReranking);

      setGlobalUseQueryRewriting(useQueryRewriting);
      setCurrentUseQueryRewriting(useQueryRewriting);

      setGlobalForceRebuild(forceRebuild);
      setCurrentForceRebuild(forceRebuild);

      setInitialBotMessage(initialMessage);
      setCurrentInitialMessage(initialMessage);

      setDescription(description);
      setCurrentDescription(description);

      setInputPlaceholder(inputPlaceholder);
      setCurrentInputPlaceholder(inputPlaceholder);

      setProjectName(projectName);
      setCurrentProjectName(projectName);

      setActiveTheme(selectedTheme);
      setCurrentTheme(selectedTheme);
  savedThemeRef.current = selectedTheme;

      addNotification({
        type: "success",
        title: "Configuración guardada",
        message: `Parámetros actualizados. Colección por defecto: "${trimmed}" • Top K: ${parsedTopK} • Tema: ${selectedTheme}.`,
        autoClose: true,
        duration: 5000,
      });
    } catch (error: any) {
      addNotification({
        type: "error",
        title: "No se pudo guardar",
        message: error?.message || "Ocurrió un error inesperado al guardar la configuración.",
        autoClose: false,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl rounded-lg border bg-white p-6 shadow-md space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Configuración general</h2>
        <p className="text-sm text-gray-600 mt-2">
          Define los parámetros globales que utilizará el asistente.
        </p>
      </div>

      <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
        <div>
          <h3 className="text-md font-semibold text-gray-800">Tema de colores</h3>
          <p className="text-sm text-gray-600 mt-1">
            Selecciona la paleta principal de colores que se aplicará a toda la interfaz.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {THEME_OPTIONS.map((themeKey) => {
            const palette = THEMES[themeKey];
            const isActive = selectedTheme === themeKey;

            return (
              <button
                key={themeKey}
                type="button"
                onClick={() => setSelectedTheme(themeKey)}
                disabled={isSaving}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 transition-all ${
                  isActive ? "border-[var(--color-primary)] shadow-md" : "border-gray-200"
                } ${isSaving ? "opacity-60 cursor-not-allowed" : "hover:border-gray-300"}`}
                style={{
                  background: isActive ? "rgba(0, 0, 0, 0.02)" : "white",
                  color: "inherit",
                }}
              >
                <span className="text-sm font-medium capitalize">{themeKey}</span>
                <span className="flex items-center gap-1">
                  {[palette.primaryLight, palette.primary, palette.primaryMuted].map((color) => (
                    <span
                      key={color}
                      className="h-5 w-5 rounded-full border"
                      style={{
                        backgroundColor: color,
                        borderColor: "rgba(15, 23, 42, 0.1)",
                      }}
                    />
                  ))}
                </span>
              </button>
            );
          })}
        </div>

        <p className="text-xs text-gray-500">
          Tema actual: <span className="font-semibold capitalize">{currentTheme}</span>
        </p>
      </div>

      <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
        <div>
          <h3 className="text-md font-semibold text-gray-800">Colección por defecto</h3>
          <p className="text-sm text-gray-600 mt-1">
            Esta colección se utilizará como destino y origen principal para las consultas RAG.
          </p>
        </div>

        <label className="block text-sm font-medium">
          Nombre de la colección
          <select
            value={collectionName}
            onChange={(event) => setCollectionName(event.target.value)}
            disabled={isSaving || isLoadingCollections || collections.length === 0}
            className="mt-1 w-full rounded border px-3 py-2 text-sm focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100"
            style={{
              borderColor: "var(--border-color)",
              color: "var(--text-primary)",
              backgroundColor: "var(--bg-card)",
              boxShadow: "none",
              outline: "none",
            }}
          >
            {isLoadingCollections && (
              <option value="">Cargando colecciones...</option>
            )}
            {!isLoadingCollections && collections.length === 0 && (
              <option value="">Sin colecciones disponibles</option>
            )}
            {collections.map((collection) => (
              <option key={collection} value={collection}>
                {collection}
              </option>
            ))}
          </select>
        </label>

        {collectionsError && (
          <p className="text-xs text-red-600">
            {collectionsError}
          </p>
        )}

        <p className="text-xs text-gray-500">
          Colección actual en uso: <span className="font-semibold">{currentDefault}</span>
        </p>

      </div>

      <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
        <div>
          <h3 className="text-md font-semibold text-gray-800">Parámetros de recuperación</h3>
          <p className="text-sm text-gray-600 mt-1">
            Ajusta los parámetros globales utilizados al recuperar y procesar documentos.
          </p>
        </div>

        <label className="block text-sm font-medium">
          Top K por defecto
          <input
            type="number"
            min={1}
            value={topK}
            onChange={(event) => setTopKValue(event.target.value)}
            disabled={isSaving}
            className="mt-1 w-full rounded border px-3 py-2 text-sm focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100"
            style={{
              borderColor: "var(--border-color)",
              color: "var(--text-primary)",
              backgroundColor: "var(--bg-card)",
            }}
          />
        </label>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={useReranking}
              onChange={(event) => setUseRerankingState(event.target.checked)}
              disabled={isSaving}
              className="h-4 w-4 rounded border-gray-300"
              style={{ accentColor: "var(--color-primary)" }}
            />
            Activar reranking de documentos recuperados
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={useQueryRewriting}
              onChange={(event) => setUseQueryRewritingState(event.target.checked)}
              disabled={isSaving}
              className="h-4 w-4 rounded border-gray-300"
              style={{ accentColor: "var(--color-primary)" }}
            />
            Activar reescritura de consultas con LLM
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={forceRebuild}
              onChange={(event) => setForceRebuildState(event.target.checked)}
              disabled={isSaving}
              className="h-4 w-4 rounded border-gray-300"
              style={{ accentColor: "var(--color-primary)" }}
            />
            Forzar reconstrucción del índice en cada consulta
          </label>
        </div>
      </div>

      <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
        <div>
          <h3 className="text-md font-semibold text-gray-800">Mensaje inicial del asistente</h3>
          <p className="text-sm text-gray-600 mt-1">
            Personaliza el mensaje que verán los usuarios al abrir la pestaña de chat por primera vez.
          </p>
        </div>

        <label className="block text-sm font-medium">
          Mensaje inicial
          <textarea
            value={initialMessage}
            onChange={(event) => setInitialMessage(event.target.value)}
            disabled={isSaving}
            rows={6}
            className="mt-1 w-full rounded border px-3 py-2 text-sm focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100"
            style={{
              borderColor: "var(--border-color)",
              color: "var(--text-primary)",
              backgroundColor: "var(--bg-card)",
            }}
          />
        </label>

        <p className="text-xs text-gray-500">
          Soporta Markdown básico y emojis. Longitud actual: {initialMessage.length} caracteres.
        </p>
      </div>

      <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
        <div>
          <h3 className="text-md font-semibold text-gray-800">Descripción y experiencia de chat</h3>
          <p className="text-sm text-gray-600 mt-1">
            Actualiza los textos visibles en la interfaz principal del asistente.
          </p>
        </div>

        <label className="block text-sm font-medium">
          Nombre del proyecto
          <input
            value={projectName}
            onChange={(event) => setProjectNameState(event.target.value)}
            disabled={isSaving}
            className="mt-1 w-full rounded border px-3 py-2 text-sm focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100"
            style={{
              borderColor: "var(--border-color)",
              color: "var(--text-primary)",
              backgroundColor: "var(--bg-card)",
            }}
          />
        </label>

        <label className="block text-sm font-medium">
          Descripción de la aplicación
          <textarea
            value={description}
            onChange={(event) => setDescriptionState(event.target.value)}
            disabled={isSaving}
            rows={4}
            className="mt-1 w-full rounded border px-3 py-2 text-sm focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100"
            style={{
              borderColor: "var(--border-color)",
              color: "var(--text-primary)",
              backgroundColor: "var(--bg-card)",
            }}
          />
        </label>

        <label className="block text-sm font-medium">
          Placeholder del chat
          <input
            value={inputPlaceholder}
            onChange={(event) => setInputPlaceholderState(event.target.value)}
            disabled={isSaving}
            className="mt-1 w-full rounded border px-3 py-2 text-sm focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100"
            style={{
              borderColor: "var(--border-color)",
              color: "var(--text-primary)",
              backgroundColor: "var(--bg-card)",
            }}
          />
        </label>

        <p className="text-xs text-gray-500">
          El placeholder se muestra dentro del campo de entrada del chat cuando está vacío.
        </p>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={!hasChanges || isSaving}
        className={`w-full rounded px-4 py-3 text-white font-medium transition-colors focus:outline-none focus:ring-2 ${
          !hasChanges || isSaving ? "cursor-not-allowed opacity-60" : "hover:brightness-105"
        }`}
        style={{
          backgroundColor: !hasChanges || isSaving ? "var(--color-primary-light)" : "var(--color-primary)",
        }}
        onMouseEnter={(event) => {
          if (!hasChanges || isSaving) return;
          const target = event.currentTarget;
          target.style.backgroundColor = "var(--color-primary-hover)";
        }}
        onMouseLeave={(event) => {
          const target = event.currentTarget;
          target.style.backgroundColor = !hasChanges || isSaving ? "var(--color-primary-light)" : "var(--color-primary)";
        }}
      >
        {isSaving ? "Guardando..." : "Guardar configuración"}
      </button>
    </div>
  );
}
