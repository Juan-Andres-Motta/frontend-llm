/**
 * @fileoverview Header Component
 * 
 * Cabecera principal de la aplicación con navegación entre pestañas.
 * Incluye el título de la aplicación, botones de navegación y el centro de notificaciones.
 * Utiliza animaciones de Framer Motion para transiciones suaves.
 * 
 * @author Universidad de los Andes
 * @version 1.0.0
 */

import { MouseEvent } from 'react';
import { motion } from 'framer-motion';
import NotificationCenter from './NotificationCenter';

type TabOption = 'chat' | 'uploader' | 'config';

type HeaderProps = {
  tab: TabOption;
  setTab: (tab: TabOption) => void;
};

/**
 * Cabecera de la aplicación
 * 
 * Funcionalidades principales:
 * - Navegación entre pestañas (Chat y Cargar Documentos)
 * - Título dinámico de la aplicación
 * - Centro de notificaciones integrado
 * - Diseño responsivo y fijo en la parte superior
 * - Animaciones de entrada y transiciones suaves
 * - Estilo consistente con la identidad visual del proyecto
 * 
 * @param tab - Pestaña actualmente activa
 * @param setTab - Función para cambiar la pestaña activa
 * @returns JSX.Element
 */
const Header = ({ tab, setTab }: HeaderProps) => {
  const handleHover = (
    event: MouseEvent<HTMLButtonElement>,
    isActive: boolean,
    phase: 'enter' | 'leave'
  ) => {
    if (isActive) {
      event.currentTarget.style.backgroundColor = "white";
      return;
    }

    const target = event.currentTarget;
    if (phase === 'enter') {
      target.style.backgroundColor = "var(--color-primary-muted-hover)";
    } else {
      target.style.backgroundColor = "var(--color-primary-muted)";
    }
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        backgroundColor: "var(--color-primary)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.15)",
      }}
    >
      <div className="container-custom">
        <div className="flex items-center justify-between h-20 lg:h-24">
          {/* Logo Izquierdo */}
          <div className="flex items-center gap-4">
            <img 
              src="/assets/MisoLogo.png" 
              alt="MISO Logo" 
              className="h-12 md:h-14 lg:h-16 object-contain"
            />

            {/* Botones de tabs */}
            <nav className="flex gap-2">
              <button
                onClick={() => setTab('chat')}
                className="px-3 py-1.5 rounded text-sm font-medium transition-colors duration-200"
                style={{
                  backgroundColor: tab === 'chat' ? 'white' : 'var(--color-primary-muted)',
                  color: tab === 'chat' ? 'var(--color-primary)' : 'white',
                  border: tab === 'chat' ? '1px solid rgba(15,23,42,0.08)' : '1px solid transparent',
                }}
                onMouseEnter={(event) => handleHover(event, tab === 'chat', 'enter')}
                onMouseLeave={(event) => handleHover(event, tab === 'chat', 'leave')}
              >
                Chat
              </button>
              <button
                onClick={() => setTab('uploader')}
                className="px-3 py-1.5 rounded text-sm font-medium transition-colors duration-200"
                style={{
                  backgroundColor: tab === 'uploader' ? 'white' : 'var(--color-primary-muted)',
                  color: tab === 'uploader' ? 'var(--color-primary)' : 'white',
                  border: tab === 'uploader' ? '1px solid rgba(15,23,42,0.08)' : '1px solid transparent',
                }}
                onMouseEnter={(event) => handleHover(event, tab === 'uploader', 'enter')}
                onMouseLeave={(event) => handleHover(event, tab === 'uploader', 'leave')}
              >
                Cargar Documentos
              </button>
              <button
                onClick={() => setTab('config')}
                className="px-3 py-1.5 rounded text-sm font-medium transition-colors duration-200"
                style={{
                  backgroundColor: tab === 'config' ? 'white' : 'var(--color-primary-muted)',
                  color: tab === 'config' ? 'var(--color-primary)' : 'white',
                  border: tab === 'config' ? '1px solid rgba(15,23,42,0.08)' : '1px solid transparent',
                }}
                onMouseEnter={(event) => handleHover(event, tab === 'config', 'enter')}
                onMouseLeave={(event) => handleHover(event, tab === 'config', 'leave')}
              >
                Configuración
              </button>
            </nav>
          </div>

          {/* Logo Derecho y Notificaciones */}
          <div className="flex items-center gap-4">
            <NotificationCenter />
            <img 
              src="/assets/UniandesDISCLogo.png" 
              alt="Universidad de los Andes Facultad Logo" 
              className="h-12 md:h-14 lg:h-16 object-contain"
            />
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
