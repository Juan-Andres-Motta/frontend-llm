/**
 * @fileoverview Chat Component
 * 
 * Componente principal de chat interactivo con IA usando RAG (Retrieval Augmented Generation).
 * Permite a los usuarios hacer preguntas y recibir respuestas basadas en documentos cargados.
 * Incluye renderizado de Markdown, syntax highlighting y manejo de historial de conversación.
 * 
 * @author Universidad de los Andes
 * @version 1.0.0
 */

import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";

// Configuración de la aplicación
import { APP_CONFIG, getFullTitle, getBackendUrl, createRequestBody } from "../config/appConfig";

// Tipos para la API del Chat
import type { AskResponse } from "../types/rag";

import { useChatHistory, type ChatMessage } from "../hooks/useChatHistory";

/**
 * Componente principal de chat con IA
 * 
 * Funcionalidades principales:
 * - Interfaz de chat conversacional con IA
 * - Renderizado de respuestas en Markdown con syntax highlighting
 * - Historial de conversación persistente
 * - Indicadores de carga y estado
 * - Scroll automático a nuevos mensajes
 * - Integración con sistema RAG del backend
 * 
 * @returns JSX.Element
 */
export default function Chat() {
  const { messages, addMessage, clearHistory } = useChatHistory({
    role: "bot",
    text: APP_CONFIG.INITIAL_BOT_MESSAGE,
  });

  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<
    Pick<AskResponse, "files_consulted" | "context_docs" | "response_time_sec"> | null
  >(null);

  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    const q = msg.trim();
    if (!q) return;
  
    addMessage({ role: "user", text: q });
    setMsg("");
    setLoading(true);
    setMeta(null);
  
    try {
      const url = getBackendUrl();
      
      console.log("🔗 Enviando petición a:", url);
      
      const requestBody = createRequestBody(q);
      
      console.log("📤 Datos enviados:", requestBody);
      
      const res = await fetch(url, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json",
        },  
        body: JSON.stringify(requestBody),
      });
  
      console.log("📡 Status de respuesta:", res.status, res.statusText);
  
      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Error del backend:", errorText);
        
        // Intentar extraer el mensaje de error del JSON, o usar el texto completo
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.detail || errorText);
        } catch (parseError) {
          throw new Error(errorText);
        }
      }
  
      const data: AskResponse = await res.json();
      console.log("✅ Respuesta exitosa:", data);
  
      addMessage({ role: "bot", text: data.answer || "(Sin respuesta)" });
      setMeta({
        files_consulted: data.files_consulted,
        context_docs: data.context_docs,
        response_time_sec: data.response_time_sec,
      });
      
    } catch (err) {
      console.error("❌ Error completo:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      // Manejo de errores específicos conocidos
      let userFriendlyMessage = errorMessage;
      let isExpectedError = false;
      
      if (errorMessage.includes("No hay colecciones disponibles")) {
        userFriendlyMessage = "No hay colecciones disponibles. Crea una colección en la pestaña Cargar Documentos.";
        isExpectedError = true;
      } else if (errorMessage.includes("Failed to fetch") || errorMessage.includes("ERR_CONNECTION_REFUSED") || errorMessage.includes("ERR_NETWORK")) {
        userFriendlyMessage = "Error de conexión con el servidor. Verifica que el backend esté ejecutándose.";
        isExpectedError = true;
      }
      
      addMessage({
        role: "bot",
        text: isExpectedError ? userFriendlyMessage : `- Error: ${errorMessage}`,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
      <div className="pt-10 lg:pt-10 pb-8">
        {/* Título principal de la aplicación */}
        <div className="text-center mb-8">
          <h1
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
            style={{ color: 'var(--color-primary)' }}
          >
            {getFullTitle()}
          </h1>
          <p className="text-lg md:text-xl" style={{ color: 'var(--text-secondary)' }}>
            {APP_CONFIG.DESCRIPTION}
          </p>
        </div>

        {/* Chat Container */}
        <div className="container mx-auto px-4 flex justify-center">
          <div className="w-full max-w-6xl bg-white border border-gray-200 rounded-xl overflow-hidden shadow-lg">
            

            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
              <h2 className="text-lg font-semibold text-gray-800">Chat</h2>
              <button
                onClick={clearHistory}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                title="Limpiar conversación (mantiene mensaje inicial)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Limpiar Conversación
              </button>
            </div>

            {/* Mensajes */}
            <div 
              ref={messagesRef}
              className="h-[550px] overflow-y-auto p-6 space-y-4 bg-gray-50"
            >
              {messages.map((m, i) => (
                <MessageBubble key={i} role={m.role} text={m.text} />
              ))}

              {loading && <MessageBubble role="bot" text="Pensando… 🤔" />}
            </div>

            {/* Input */}
            <form onSubmit={onSend} className="border-t border-gray-200 p-6 bg-white">
              <div className="flex gap-4">
                <input
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  placeholder={APP_CONFIG.INPUT_PLACEHOLDER}
                  autoComplete="off"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-lg"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--text-primary)'
                  }}
                />
                <button 
                  type="submit" 
                  disabled={loading || !msg.trim()}
                  className="px-8 py-3 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-lg"
                  style={{
                    backgroundColor: 'var(--color-primary)'
                  }}
                  onMouseEnter={(e) => {
                    const target = e.currentTarget;
                    target.style.backgroundColor = 'var(--color-primary-hover)';
                  }}
                  onMouseLeave={(e) => {
                    const target = e.currentTarget;
                    target.style.backgroundColor = 'var(--color-primary)';
                  }}
                >
                  {loading ? "Enviando…" : "Enviar"}
                </button>
              </div>
            </form>

            {/* Panel de metadatos */}
            {meta && (
              <details className="p-6 border-t border-gray-100 bg-gray-50">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                  🔍 Detalles de la consulta
                </summary>
                <div className="mt-3 space-y-3 text-sm">
                  {typeof meta.response_time_sec === "number" && (
                    <p className="text-gray-600">⏱️ Tiempo de respuesta: {meta.response_time_sec.toFixed(2)}s</p>
                  )}
                  {meta.files_consulted?.length ? (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">📄 Archivos consultados</h4>
                      <ul className="space-y-1">
                        {meta.files_consulted.map((f: string, i: number) => (
                          <li key={i} className="text-gray-600 text-xs">{f}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {meta.context_docs?.length ? (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">📋 Fragmentos de contexto</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {meta.context_docs.map((c: any, i: number) => (
                          <div key={i} className="bg-white border border-gray-200 rounded-lg p-3">
                            <div className="text-xs text-gray-500 mb-1">
                              <strong>{c.file_name}</strong> — pág. {c.page_number} — {c.chunk_type} — prioridad {c.priority}
                            </div>
                            <div className="text-xs text-gray-700">{c.snippet}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </details>
            )}
          </div>
        </div>
      </div>
  );
}



function MessageBubble({ role, text }: { role: ChatMessage['role']; text: string }) {
  const isUser = role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {/* Avatar */}
      {!isUser && (
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          🤖
        </div>
      )}

      {/* Burbuja */}
      <div className={`max-w-md lg:max-w-2xl px-4 py-3 rounded-lg ${
        isUser 
          ? "text-white" 
          : "bg-white border border-gray-200 text-gray-800"
      }`}
      style={isUser ? { backgroundColor: 'var(--color-primary)' } : {}}
      >
        {isUser ? (
          <span className="text-sm">{text}</span>
        ) : (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                a: (props) => (
                  <a
                    {...props}
                    target="_blank"
                    rel="noreferrer"
                    className="transition-colors"
                    style={{ color: 'var(--color-primary)' }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.color = 'var(--color-primary-muted)';
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.color = 'var(--color-primary)';
                    }}
                  />
                ),
                p: (props) => <p {...props} className="mb-2 last:mb-0" />,
                ul: (props) => <ul {...props} className="mb-2 last:mb-0 pl-4" />,
                ol: (props) => <ol {...props} className="mb-2 last:mb-0 pl-4" />,
                li: (props) => <li {...props} className="mb-1" />,
                strong: (props) => <strong {...props} className="font-semibold" />,
                em: (props) => <em {...props} className="italic" />,
                code: (props) => {
                  const { className, children, ...rest } = props;
                  const isInline = !className;
                  return isInline ? (
                    <code 
                      {...rest}
                      className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-xs font-mono"
                    >
                      {children}
                    </code>
                  ) : (
                    <code {...rest} className={className}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {text}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-semibold text-sm flex-shrink-0">
          👤
        </div>
      )}
    </div>
  );
}