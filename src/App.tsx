/**
 * @fileoverview App Component
 * 
 * Componente principal de la aplicación que estructura toda la interfaz.
 * Maneja la navegación entre pestañas, metadatos SEO y el layout general.
 * Incluye el sistema de notificaciones y manejo de errores global.
 * 
 * @author Universidad de los Andes
 * @version 1.0.0
 */

import { useState } from 'react'
import { Helmet } from 'react-helmet-async'

import Layout from '@components/Layout'
import ErrorBoundary from '@components/ErrorBoundary'
import { getFullTitle, getActiveTheme } from './config/appConfig'
import Chat from '@components/Chat'
import URLUploader from '@components/FileUploader'
import ConfigurationPanel from '@components/ConfigurationPanel'
import { NotificationProvider } from './contexts/NotificationContext'
import { THEMES } from './styles/themeManager'

/**
 * Metadatos institucionales para SEO y redes sociales
 * Define la información base que se muestra en motores de búsqueda y compartir en redes
 */
const INSTITUTIONAL_META = {
  TITLE: "Construcción de Aplicaciones con LLM - MISO Uniandes",
  DESCRIPTION: "Proyecto del curso de Construcción de Aplicaciones basadas en Grandes Modelos de Lenguaje - Maestría en Ingeniería de Software, Universidad de los Andes",
  KEYWORDS: "LLM, grandes modelos de lenguaje, inteligencia artificial, MISO, Universidad de los Andes, ingeniería de software, AI, machine learning",
  AUTHOR: "MISO - Universidad de los Andes",
  OG_URL: "https://uniandes.edu.co"
}

/**
 * Tipos de pestañas disponibles en la aplicación
 */
type TabKey = 'chat' | 'uploader' | 'config'

/**
 * Componente principal de la aplicación
 * 
 * Funcionalidades principales:
 * - Gestión de metadatos SEO y redes sociales
 * - Navegación entre pestañas (Chat y Cargar Documentos)
 * - Sistema de notificaciones global
 * - Manejo de errores con ErrorBoundary
 * - Layout responsivo y estructurado
 * 
 * @returns JSX.Element
 */
function App() {
  const [tab, setTab] = useState<TabKey>('chat')
  const activeTheme = getActiveTheme()
  const themePrimary = THEMES[activeTheme]?.primary ?? THEMES.blue.primary

  return (
    <>
      {/* Metadatos SEO y redes sociales */}
      <Helmet>
        <title>{getFullTitle()}</title>
        <meta name="description" content={INSTITUTIONAL_META.DESCRIPTION} />
        <meta name="keywords" content={INSTITUTIONAL_META.KEYWORDS} />
        <meta name="author" content={INSTITUTIONAL_META.AUTHOR} />

        {/* Open Graph para Facebook y LinkedIn */}
        <meta property="og:title" content={getFullTitle()} />
        <meta property="og:description" content={INSTITUTIONAL_META.DESCRIPTION} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={INSTITUTIONAL_META.OG_URL} />

        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={getFullTitle()} />
        <meta name="twitter:description" content={INSTITUTIONAL_META.DESCRIPTION} />

        {/* Colores del tema para navegadores */}
        <meta name="theme-color" content={themePrimary} />
        <meta name="msapplication-TileColor" content={themePrimary} />
      </Helmet>

      {/* Proveedores de contexto y manejo de errores */}
      <NotificationProvider>
        <ErrorBoundary>
          <Layout tab={tab} setTab={setTab}>
            <div className="mx-auto max-w-5xl min-h-[70vh] pb-10">
              {/* Pestaña de Chat */}
              {tab === 'chat' && (
                <div className="rounded-xl border bg-white">
                  <Chat />
                </div>
              )}

              {/* Pestaña de Carga de Documentos */}
              {tab === 'uploader' && (
                <div className="rounded-2xl border bg-white shadow-sm p-6 space-y-3">
                  <h2 className="text-lg font-semibold mb-2">Cargar Documentos por URL</h2>
                  <URLUploader />
                </div>
              )}

              {/* Pestaña de Configuración */}
              {tab === 'config' && (
                <div className="rounded-2xl border bg-white shadow-sm p-6 space-y-3">
                  <h2 className="text-lg font-semibold mb-2">Configuración Global</h2>
                  <ConfigurationPanel />
                </div>
              )}
            </div>
          </Layout>
        </ErrorBoundary>
      </NotificationProvider>
    </>
  )
}

export default App
