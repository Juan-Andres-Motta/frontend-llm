/**
 * @fileoverview FileUploader Component
 * 
 * Componente para la carga de documentos desde URL al sistema RAG.
 * Permite configurar parámetros de procesamiento, chunking y embeddings.
 * El sistema descarga automáticamente todos los documentos disponibles en la URL.
 * 
 * @author Universidad de los Andes
 * @version 1.0.0
 */

import { useState, useEffect, useRef, useMemo } from "react";
import { useNotifications } from "../contexts/NotificationContext";

// Tipos de estrategias de chunking
type ChunkingStrategy =
  | "recursive_character"
  | "fixed_size"
  | "semantic"
  | "document_structure"
  | "linguistic_units";

type UploadProcessStatus = "in_progress" | "completed" | "error";

type UploadProcess = {
  processingId: string;
  collectionName: string;
  sourceUrl: string;
  status: UploadProcessStatus;
  percentage: number;
  stage?: string | null;
  message?: string | null;
  notificationId?: string;
  lastUpdated: string;
};

/**
 * Componente para cargar documentos desde URL
 * 
 * Funcionalidades principales:
 * - Configuración de parámetros de chunking (tamaño, overlap)
 * - Selección de estrategia de chunking
 * - Selección de modelo de embeddings
 * - Configuración de opciones de procesamiento
 * - Validación de entrada y notificaciones en tiempo real
 * - Polling automático para verificar estado del procesamiento
 * 
 * @param baseUrl - URL base del backend (por defecto: http://localhost:8000)
 * @returns JSX.Element
 */
export default function URLUploader({ baseUrl = "http://localhost:8000" }: URLUploaderProps) {
  const { addNotification, updateNotification } = useNotifications();

  const updateNotificationRef = useRef(updateNotification);
  const addNotificationRef = useRef(addNotification);

  const [input, setInput] = useState("");
  const [collectionName, setCollectionName] = useState("manuales_collection");
  
  // Estados de chunking
  const [chunkingStrategy, setChunkingStrategy] = useState<ChunkingStrategy>("recursive_character");
  const [chunkSize, setChunkSize] = useState(1000);
  const [chunkOverlap, setChunkOverlap] = useState(200);
  const [separators, setSeparators] = useState<string[]>([". ", ", ", "\n\n", "\n", " ", ""]);
  const [lengthFunction, setLengthFunction] = useState<"character_count" | "token_count">("character_count");
  
  // Estados de procesamiento
  const [maxFileSizeMb, setMaxFileSizeMb] = useState(50);
  const [timeoutPerFile, setTimeoutPerFile] = useState(300);
  
  // Estados de embeddings
  const [embeddingModel, setEmbeddingModel] = useState("embedding-001");
  const [batchSize, setBatchSize] = useState(90);
  const [retryAttempts, setRetryAttempts] = useState(3);

  // Estados de secciones colapsables
  const [showChunkingAdvanced, setShowChunkingAdvanced] = useState(false);
  const [showEmbeddingAdvanced, setShowEmbeddingAdvanced] = useState(false);
  const [showProcessingOptions, setShowProcessingOptions] = useState(false);

  const [processes, setProcesses] = useState<UploadProcess[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    try {
      const stored = localStorage.getItem("url_uploader_processes");
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];

      return parsed
        .map((item: any) => ({
          processingId: String(item.processingId),
          collectionName: String(item.collectionName ?? ""),
          sourceUrl: String(item.sourceUrl ?? ""),
          status: normalizeApiStatus(item.status),
          percentage: (() => {
            const parsedPercentage = Number(item.percentage);
            return Number.isFinite(parsedPercentage) ? parsedPercentage : 0;
          })(),
          stage: item.stage ?? null,
          message: item.message ?? null,
          notificationId: item.notificationId ?? undefined,
          lastUpdated: item.lastUpdated ?? new Date().toISOString(),
        }))
        .filter((item) => item.processingId);
    } catch (error) {
      console.warn("URLUploader: no se pudieron recuperar procesos previos", error);
      return [];
    }
  });

  const processesRef = useRef<UploadProcess[]>(processes);

  // Ref para mantener el polling estable
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    updateNotificationRef.current = updateNotification;
    addNotificationRef.current = addNotification;
  }, [updateNotification, addNotification]);

  useEffect(() => {
    processesRef.current = processes;
  }, [processes]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (processes.length === 0) {
      localStorage.removeItem("url_uploader_processes");
      return;
    }

    localStorage.setItem("url_uploader_processes", JSON.stringify(processes));
  }, [processes]);

  function removeProcessArtifacts(processId: string) {
    if (typeof window === "undefined") {
      return;
    }
    localStorage.removeItem(`processing_id_${processId}`);
    localStorage.removeItem(`notification_id_${processId}`);
  }

  // Determinar si la estrategia usa chunk_size
  const strategyUsesChunkSize = (strategy: ChunkingStrategy): boolean => {
    return !["semantic", "document_structure"].includes(strategy);
  };

  // Obtener descripción de la estrategia
  const getStrategyDescription = (strategy: ChunkingStrategy): string => {
    const descriptions: Record<ChunkingStrategy, string> = {
      "recursive_character": "Divide documentos respetando párrafos, oraciones y palabras",
      "fixed_size": "Divide documentos en chunks de tamaño fijo",
      "semantic": "Divide documentos según cambios de significado (más lento, mejor calidad)",
      "document_structure": "Divide según headers y estructura del documento",
      "linguistic_units": "Divide según unidades lingüísticas (oraciones, párrafos)"
    };
    return descriptions[strategy];
  };

  function normalizeApiStatus(status?: string | null): UploadProcessStatus {
    if (!status) return "in_progress";
    const lowered = status.toLowerCase();
    if (lowered === "completed" || lowered === "finished" || lowered === "done") {
      return "completed";
    }
    if (["error", "failed", "failed_with_errors", "cancelled"].includes(lowered)) {
      return "error";
    }
    return "in_progress";
  }

  const validateConfig = (): string | null => {
    if (!/^[a-zA-Z0-9_-]+$/.test(collectionName)) return "collection_name solo puede contener letras, números, guiones y guiones bajos";
    
    // Validar chunk_size y chunk_overlap solo si la estrategia los usa
    if (strategyUsesChunkSize(chunkingStrategy)) {
      if (chunkSize < 100 || chunkSize > 5000) return "chunk_size debe estar entre 100 y 5000";
      if (chunkOverlap < 0 || chunkOverlap >= chunkSize) return "chunk_overlap debe ser >= 0 y menor que chunk_size";
    }
    
    if (maxFileSizeMb < 1 || maxFileSizeMb > 1000) return "max_file_size_mb debe estar entre 1 y 1000";
    if (timeoutPerFile < 30 || timeoutPerFile > 3600) return "timeout_per_file_seconds debe estar entre 30 y 3600";
    if (batchSize < 1 || batchSize > 1000) return "batch_size debe estar entre 1 y 1000";
    if (retryAttempts < 1 || retryAttempts > 10) return "retry_attempts debe estar entre 1 y 10";
    if (!embeddingModel.trim()) return "Debe especificar un modelo de embeddings";
    if (!input || !/^https?:\/\//.test(input)) return "Debes ingresar una URL válida que empiece con http o https";
    return null;
  };

  const handleSubmit = async () => {
    const configError = validateConfig();
    if (configError) {
      addNotification({
        type: 'error',
        title: 'Error de Validación',
        message: configError,
        autoClose: false
      });
      return;
    }

    // Construir chunking_config dinámicamente según la estrategia
    const chunking_config: any = {
      chunking_strategy: chunkingStrategy,
    };

    // Solo incluir chunk_size y chunk_overlap si la estrategia los usa
    if (strategyUsesChunkSize(chunkingStrategy)) {
      chunking_config.chunk_size = chunkSize;
      chunking_config.chunk_overlap = chunkOverlap;
    }

    // Agregar campos opcionales según la estrategia
    if (chunkingStrategy === "recursive_character") {
      chunking_config.separators = separators;
      chunking_config.keep_separator = true;
      chunking_config.strip_whitespace = true;
    }
    
    if (chunkingStrategy === "fixed_size") {
      chunking_config.length_function = lengthFunction;
    }

    const body = {
      source_url: input,
      collection_name: collectionName,
      chunking_config,
      processing_options: {
        file_extensions: ["pdf", "txt", "docx", "md", "csv", "xlsx"],
        max_file_size_mb: maxFileSizeMb,
        extract_metadata: true,
        preserve_formatting: false,
        timeout_per_file_seconds: timeoutPerFile,
      },
      embedding_config: {
        model: embeddingModel,
        batch_size: batchSize,
        retry_attempts: retryAttempts,
      },
    };

    try {
      const res = await fetch(`${baseUrl}/api/v1/documents/load-from-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || "Error al procesar");
      }

      const notificationId = addNotification({
        type: 'processing',
        title: 'Procesamiento Iniciado',
        message: `Cargando documentos desde URL: ${input}`,
        processingId: data.processing_id,
        autoClose: false
      });

      const newProcess: UploadProcess = {
        processingId: data.processing_id,
        collectionName,
        sourceUrl: input,
        status: 'in_progress',
        percentage: Number(data?.data?.progress?.percentage) || 0,
        stage: data?.data?.progress?.stage ?? 'document_download',
        message: data?.message ?? 'Procesamiento iniciado',
        notificationId,
        lastUpdated: new Date().toISOString(),
      };

      setProcesses((prev) => {
        const filtered = prev.filter((item) => item.processingId !== newProcess.processingId);
        const next = [newProcess, ...filtered];
        processesRef.current = next;
        return next;
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem(`processing_id_${data.processing_id}`, data.processing_id);
        localStorage.setItem(`notification_id_${data.processing_id}`, notificationId);
      }

      setInput("");
    } catch (err: any) {
      addNotification({
        type: 'error',
        title: 'Error al Iniciar Procesamiento',
        message: err.message,
        autoClose: false
      });
    }
  };

  const statusLabels = useMemo(
    () => ({
      in_progress: "En progreso",
      completed: "Completado",
      error: "Error",
    }),
    []
  );

  const stageLabels = useMemo(
    () => ({
      document_download: "Descargando documentos",
      document_downloaded: "Descarga finalizada",
      document_processing: "Procesando documentos",
      document_processed: "Procesamiento finalizado",
      embedding_generation: "Generando embeddings",
    }),
    []
  );

  const handleStatusTransition = (
    process: UploadProcess,
    nextStatus: UploadProcessStatus,
    payload?: {
      message?: string;
    }
  ) => {
    if (!process.notificationId) {
      return;
    }

    if (nextStatus === "completed") {
      updateNotificationRef.current(process.notificationId, {
        type: "success",
        title: "Procesamiento Completado",
        message:
          payload?.message ||
          `Documentos cargados exitosamente en la colección "${process.collectionName}"`,
        autoClose: true,
        duration: 10000,
      });
      removeProcessArtifacts(process.processingId);
    }

    if (nextStatus === "error") {
      updateNotificationRef.current(process.notificationId, {
        type: "error",
        title: "Error en Procesamiento",
        message:
          payload?.message ||
          "Ocurrió un problema al cargar los documentos. Revisa los detalles e inténtalo nuevamente.",
        autoClose: false,
      });
      removeProcessArtifacts(process.processingId);
    }
  };

  const handleRemoveProcess = (processId: string) => {
    const target = processesRef.current.find((item) => item.processingId === processId);

    if (target?.notificationId) {
      updateNotificationRef.current(target.notificationId, {
        type: "info",
        title: "Seguimiento detenido",
        message: "Quitaste esta carga del listado manualmente.",
        autoClose: true,
        duration: 5000,
      });
    }

    removeProcessArtifacts(processId);

    setProcesses((prev) => {
      const next = prev.filter((item) => item.processingId !== processId);
      processesRef.current = next;
      return next;
    });
  };

  const handleClearProcesses = () => {
    if (processesRef.current.length === 0) {
      return;
    }

    processesRef.current.forEach((process) => {
      if (process.notificationId) {
        updateNotificationRef.current(process.notificationId, {
          type: "info",
          title: "Seguimiento detenido",
          message: "Limpiamos el listado de cargas manualmente.",
          autoClose: true,
          duration: 5000,
        });
      }
      removeProcessArtifacts(process.processingId);
    });

    setProcesses(() => {
      processesRef.current = [];
      return [];
    });
  };

  const hasActiveProcesses = useMemo(
    () => processes.some((item) => item.status === "in_progress"),
    [processes]
  );

  useEffect(() => {
    if (!hasActiveProcesses) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    const pollStatuses = async () => {
      const activeProcesses = processesRef.current.filter(
        (item) => item.status === "in_progress"
      );

      if (activeProcesses.length === 0) {
        return;
      }

      const updates: Record<string, Partial<UploadProcess> & { status?: UploadProcessStatus }> = {};

      await Promise.all(
        activeProcesses.map(async (process) => {
          try {
            const res = await fetch(
              `${baseUrl}/api/v1/documents/load-from-url/${process.processingId}`
            );
            const data = await res.json();

            const percentage = Number(data?.data?.progress?.percentage) || 0;
            const stage = data?.data?.progress?.stage ?? process.stage ?? null;
            const message = data?.message ?? process.message ?? null;
            const statusFromApi = normalizeApiStatus(data?.status);

            if (data?.success === false || statusFromApi === "error") {
              updates[process.processingId] = {
                status: "error",
                percentage,
                stage,
                message: data?.error || data?.message || message,
                lastUpdated: new Date().toISOString(),
              };
              handleStatusTransition(process, "error", {
                message: data?.error || data?.message,
              });
              return;
            }

            if (statusFromApi === "completed" || (data?.success === true && percentage >= 100)) {
              updates[process.processingId] = {
                status: "completed",
                percentage: 100,
                stage,
                message,
                lastUpdated: new Date().toISOString(),
              };
              handleStatusTransition(process, "completed", {
                message,
              });
              return;
            }

            updates[process.processingId] = {
              percentage,
              stage,
              message,
              lastUpdated: new Date().toISOString(),
            };
          } catch (error: any) {
            const warningMessage = `No se pudo verificar el estado del procesamiento: ${error.message}`;
            addNotificationRef.current({
              type: "warning",
              title: "Error de Red",
              message: warningMessage,
              processingId: process.processingId,
              autoClose: false,
            });

            updates[process.processingId] = {
              stage: process.stage,
              percentage: process.percentage,
              message: warningMessage,
              lastUpdated: new Date().toISOString(),
            };
          }
        })
      );

      if (Object.keys(updates).length > 0) {
        setProcesses((prev) => {
          const next = prev.map((item) =>
            updates[item.processingId]
              ? {
                  ...item,
                  ...updates[item.processingId],
                }
              : item
          );
          processesRef.current = next;
          return next;
        });
      }
    };

    pollStatuses();
    pollingIntervalRef.current = setInterval(pollStatuses, 5000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [baseUrl, hasActiveProcesses]);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="rounded-lg border bg-white p-6 shadow-md space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-center">Configurar carga de documentos</h2>
            <p className="text-sm text-gray-600 text-center mt-2">
              Las notificaciones de progreso aparecerán en el panel de notificaciones 🔔
            </p>
          </div>

          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="text-md font-semibold mb-3 text-gray-800">
              Configuración de Documentos
            </h3>

            <label className="block text-sm font-medium mb-3">
              URL del documento
              <input
                type="url"
                placeholder="https://..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2 text-sm focus:ring-2"
                style={{
                  borderColor: "var(--border-color)",
                  color: "var(--text-primary)",
                  backgroundColor: "var(--bg-card)",
                }}
              />
            </label>

            <label className="block text-sm font-medium">
              Nombre colección
              <input
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2 text-sm focus:ring-2"
                style={{
                  borderColor: "var(--border-color)",
                  color: "var(--text-primary)",
                  backgroundColor: "var(--bg-card)",
                }}
              />
            </label>
          </div>

          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="text-md font-semibold mb-3 text-gray-800">Estrategia de Chunking</h3>

            <label className="block text-sm font-medium mb-3">
              Estrategia
              <select
                value={chunkingStrategy}
                onChange={(e) => setChunkingStrategy(e.target.value as ChunkingStrategy)}
                className="mt-1 w-full rounded border px-3 py-2 text-sm focus:ring-2"
                style={{
                  borderColor: "var(--border-color)",
                  color: "var(--text-primary)",
                  backgroundColor: "var(--bg-card)",
                }}
              >
                <option value="recursive_character">Recursive Character</option>
                <option value="fixed_size">Fixed Size</option>
                <option value="semantic">Semantic</option>
                <option value="document_structure">Document Structure</option>
                <option value="linguistic_units">Linguistic Units</option>
              </select>
              <p className="text-xs text-gray-600 mt-1 italic">
                {getStrategyDescription(chunkingStrategy)}
              </p>
            </label>

            {strategyUsesChunkSize(chunkingStrategy) ? (
              <div className="grid grid-cols-2 gap-4 mb-3">
                <label className="text-sm font-medium">
                  Chunk size
                  <input
                    type="number"
                    min={100}
                    max={5000}
                    value={chunkSize}
                    onChange={(e) => setChunkSize(Number(e.target.value))}
                        className="mt-1 w-full rounded border px-3 py-2 text-sm focus:ring-2"
                        style={{
                          borderColor: "var(--border-color)",
                          color: "var(--text-primary)",
                          backgroundColor: "var(--bg-card)",
                        }}
                  />
                </label>
                <label className="text-sm font-medium">
                  Chunk overlap
                  <input
                    type="number"
                    min={0}
                    max={chunkSize - 1}
                    value={chunkOverlap}
                    onChange={(e) => setChunkOverlap(Number(e.target.value))}
                    className="mt-1 w-full rounded border px-3 py-2 text-sm focus:ring-2"
                    style={{
                      borderColor: "var(--border-color)",
                      color: "var(--text-primary)",
                      backgroundColor: "var(--bg-card)",
                    }}
                  />
                </label>
              </div>
            ) : (
              <div
                className="rounded p-3 mb-3"
                style={{
                  backgroundColor: "var(--color-primary-light)",
                  border: "1px solid var(--color-primary)",
                }}
              >
                <p className="text-sm" style={{ color: "var(--color-primary-muted)" }}>
                  {chunkingStrategy === "semantic"
                    ? "ℹ️ Esta estrategia usa embeddings semánticos, no requiere tamaños fijos"
                    : "ℹ️ Esta estrategia usa la estructura del documento (headers, secciones)"}
                </p>
              </div>
            )}

            <div className="mt-3">
              <button
                onClick={() => setShowChunkingAdvanced(!showChunkingAdvanced)}
                className="text-sm flex items-center gap-1 transition-colors"
                style={{ color: "var(--color-primary)" }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.color = "var(--color-primary-muted)";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.color = "var(--color-primary)";
                }}
              >
                {showChunkingAdvanced ? "▼" : "▶"} Opciones avanzadas
              </button>

              {showChunkingAdvanced && (
                <div
                  className="mt-3 pl-4 border-l-2 space-y-3"
                  style={{ borderColor: "var(--color-primary-light)" }}
                >
                  {chunkingStrategy === "recursive_character" && (
                    <label className="block text-sm font-medium">
                      Separadores (uno por línea)
                      <textarea
                        value={separators.join("\n")}
                        onChange={(e) => setSeparators(e.target.value.split("\n"))}
                        className="mt-1 w-full rounded border px-3 py-2 text-sm focus:ring-2"
                        style={{
                          borderColor: "var(--border-color)",
                          color: "var(--text-primary)",
                          backgroundColor: "var(--bg-card)",
                        }}
                        rows={4}
                        placeholder="Ingrese un separador por línea"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Por defecto: párrafo doble, párrafo simple, espacio
                      </p>
                    </label>
                  )}

                  {chunkingStrategy === "fixed_size" && (
                    <label className="block text-sm font-medium">
                      Función de longitud
                      <select
                        value={lengthFunction}
                        onChange={(e) =>
                          setLengthFunction(e.target.value as "character_count" | "token_count")
                        }
                        className="mt-1 w-full rounded border px-3 py-2 text-sm focus:ring-2"
                        style={{
                          borderColor: "var(--border-color)",
                          color: "var(--text-primary)",
                          backgroundColor: "var(--bg-card)",
                        }}
                      >
                        <option value="character_count">Contar caracteres</option>
                        <option value="token_count">Contar tokens</option>
                      </select>
                    </label>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="text-md font-semibold mb-3 text-gray-800">Configuración de Embeddings</h3>

            <label className="block text-sm font-medium mb-3">
              Modelo de embeddings
              <select
                value={embeddingModel}
                onChange={(e) => setEmbeddingModel(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2 text-sm focus:ring-2"
                style={{
                  borderColor: "var(--border-color)",
                  color: "var(--text-primary)",
                  backgroundColor: "var(--bg-card)",
                }}
              >
                <option value="embedding-001">embedding-001</option>
                <option value="embedding-002">embedding-002</option>
              </select>
            </label>

            <div>
              <button
                onClick={() => setShowEmbeddingAdvanced(!showEmbeddingAdvanced)}
                className="text-sm flex items-center gap-1 transition-colors"
                style={{ color: "var(--color-primary)" }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.color = "var(--color-primary-muted)";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.color = "var(--color-primary)";
                }}
              >
                {showEmbeddingAdvanced ? "▼" : "▶"} Opciones avanzadas
              </button>

              {showEmbeddingAdvanced && (
                <div
                  className="mt-3 pl-4 border-l-2"
                  style={{ borderColor: "var(--color-primary-light)" }}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <label className="text-sm font-medium">
                      Batch size
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        value={batchSize}
                        onChange={(e) => setBatchSize(Number(e.target.value))}
                        className="mt-1 w-full rounded border px-3 py-2 text-sm focus:ring-2"
                        style={{
                          borderColor: "var(--border-color)",
                          color: "var(--text-primary)",
                          backgroundColor: "var(--bg-card)",
                        }}
                      />
                    </label>
                    <label className="text-sm font-medium">
                      Retry attempts
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={retryAttempts}
                        onChange={(e) => setRetryAttempts(Number(e.target.value))}
                        className="mt-1 w-full rounded border px-3 py-2 text-sm focus:ring-2"
                        style={{
                          borderColor: "var(--border-color)",
                          color: "var(--text-primary)",
                          backgroundColor: "var(--bg-card)",
                        }}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-gray-50">
            <button
              onClick={() => setShowProcessingOptions(!showProcessingOptions)}
              className="w-full flex items-center justify-between text-md font-semibold text-gray-800"
            >
              <span>Opciones de Procesamiento</span>
              <span className="text-[var(--color-primary)]">{showProcessingOptions ? "▼" : "▶"}</span>
            </button>

            {showProcessingOptions && (
              <div className="mt-3 grid grid-cols-2 gap-4">
                <label className="text-sm font-medium">
                  Max file size (MB)
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={maxFileSizeMb}
                    onChange={(e) => setMaxFileSizeMb(Number(e.target.value))}
                    className="mt-1 w-full rounded border px-3 py-2 text-sm focus:ring-2"
                    style={{
                      borderColor: "var(--border-color)",
                      color: "var(--text-primary)",
                      backgroundColor: "var(--bg-card)",
                    }}
                  />
                </label>
                <label className="text-sm font-medium">
                  Timeout por archivo (s)
                  <input
                    type="number"
                    min={30}
                    max={3600}
                    value={timeoutPerFile}
                    onChange={(e) => setTimeoutPerFile(Number(e.target.value))}
                    className="mt-1 w-full rounded border px-3 py-2 text-sm focus:ring-2"
                    style={{
                      borderColor: "var(--border-color)",
                      color: "var(--text-primary)",
                      backgroundColor: "var(--bg-card)",
                    }}
                  />
                </label>
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            className="w-full rounded px-4 py-3 text-white font-medium transition-colors"
            style={{
              backgroundColor: "var(--color-primary)",
            }}
            onMouseEnter={(e) => {
              const target = e.currentTarget;
              target.style.backgroundColor = "var(--color-primary-hover)";
            }}
            onMouseLeave={(e) => {
              const target = e.currentTarget;
              target.style.backgroundColor = "var(--color-primary)";
            }}
          >
            Cargar Documentos
          </button>
        </div>

        <aside className="rounded-lg border bg-white p-6 shadow-md flex flex-col">
          <div className="text-center">
            <h2 className="text-xl font-semibold">Procesos recientes</h2>
            <p className="text-sm text-gray-600 mt-1">
              Consulta el estado de cada carga sin salir del formulario.
            </p>
          </div>

          <div className="mt-4 flex-1 space-y-4 overflow-y-auto">
            {processes.length === 0 && (
              <div className="rounded border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                Las cargas aparecerán aquí en cuanto inicies un procesamiento.
              </div>
            )}

            {processes.map((process) => (
              <div
                key={process.processingId}
                className="rounded-lg border bg-gray-50 p-4 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {process.collectionName}
                    </p>
                    {process.sourceUrl ? (
                      <a
                        href={process.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs break-all transition-colors"
                        style={{
                          color: "var(--color-primary)",
                        }}
                        onMouseEnter={(event) => {
                          event.currentTarget.style.color = "var(--color-primary-muted)";
                        }}
                        onMouseLeave={(event) => {
                          event.currentTarget.style.color = "var(--color-primary)";
                        }}
                      >
                        {process.sourceUrl}
                      </a>
                    ) : (
                      <p className="text-xs text-gray-500">URL no disponible</p>
                    )}
                  </div>
                  <div className="flex items-start gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        process.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : process.status === "error"
                          ? "bg-red-100 text-red-700"
                          : "bg-[var(--color-primary-light)] text-[var(--color-primary-muted)]"
                      }`}
                    >
                      {statusLabels[process.status]}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveProcess(process.processingId)}
                      aria-label="Eliminar seguimiento de carga"
                      title="Eliminar seguimiento de carga"
                      className="rounded-full border border-transparent px-2 text-xs font-semibold text-gray-400 hover:border-gray-300 hover:bg-white hover:text-gray-700 focus:outline-none focus:ring-2"
                    >
                      X
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-600 mb-1">
                    {stageLabels[process.stage as keyof typeof stageLabels] || process.stage || "Estado"}
                  </p>
                  <div className="h-2 w-full rounded-full bg-gray-200">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        process.status === "completed"
                          ? "bg-green-500"
                          : process.status === "error"
                          ? "bg-red-500"
                          : "bg-[var(--color-primary)]"
                      }`}
                      style={{ width: `${Math.min(process.percentage, 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {Math.min(process.percentage, 100).toFixed(0)}% completado
                  </p>
                </div>

                {process.message && (
                  <p className="text-xs text-gray-600">{process.message}</p>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleClearProcesses}
            disabled={processes.length === 0}
            className={`mt-4 w-full rounded px-4 py-3 text-white font-medium transition-colors focus:outline-none focus:ring-2 ${
              processes.length === 0 ? "cursor-not-allowed opacity-50" : "hover:brightness-105"
            }`}
            style={{
              backgroundColor: processes.length === 0 ? "var(--color-primary-light)" : "var(--color-primary)",
            }}
            onMouseEnter={(e) => {
              if (processes.length === 0) return;
              const target = e.currentTarget;
              target.style.backgroundColor = "var(--color-primary-hover)";
            }}
            onMouseLeave={(e) => {
              const target = e.currentTarget;
              target.style.backgroundColor = processes.length === 0 ? "var(--color-primary-light)" : "var(--color-primary)";
            }}
          >
            Limpiar cargas
          </button>
        </aside>
      </div>
    </div>
  );
}

// Tipos
export type URLUploaderProps = {
  baseUrl?: string;
};
