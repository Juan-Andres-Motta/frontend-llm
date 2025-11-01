# MISW4411 Frontend Template

Plantilla de interfaz web React + TypeScript para el curso **Construcción de Aplicaciones basadas en Grandes Modelos de Lenguaje (MISW4411)** de la **Maestría en Ingeniería de Software – Universidad de los Andes**.

## Tabla de Contenido

- [Descripción](#descripción)
- [Características](#características)
- [Inicio Rápido](#inicio-rápido)
- [Personalización](#personalización)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Integración con API](#integración-con-api)
- [Solución de Problemas](#solución-de-problemas)
- [Implementación Personalizada](#implementación-personalizada)

## Descripción

Este template proporciona una interfaz web completa y funcional para interactuar con el backend de su proyecto RAG (Retrieval Augmented Generation). Está diseñado específicamente para que los grupos puedan concentrar sus esfuerzos en los aspectos centrales del curso relacionados con Grandes Modelos de Lenguaje, sin preocuparse por la implementación del frontend.

**Objetivo principal**: Facilitar la creación de videos de demostración para las entregas del curso, proporcionando una interfaz profesional y lista para usar.

### Funcionalidades incluidas

- **Chat interactivo**: Interfaz conversacional para consultas al sistema RAG
- **Carga de documentos**: Panel para cargar documentos desde URLs
- **Metadatos detallados**: Visualización de archivos consultados, fragmentos de contexto y tiempos de respuesta
- **Renderizado de Markdown**: Soporte completo para respuestas en formato Markdown con syntax highlighting
- **Historial de conversación**: Persistencia de mensajes durante la sesión
- **Diseño responsivo**: Adaptación automática a diferentes tamaños de pantalla

## Características

- ⚛️ **React 18 + TypeScript** - Desarrollo moderno y tipado estático
- 🎨 **Tailwind CSS** - Diseño elegante y responsivo
- 📱 **Interfaz adaptativa** - Funciona en desktop, tablet y móvil
- ⚙️ **Configuración sencilla** - Un solo archivo para personalizar todo
- 🔍 **Panel de metadatos** - Información detallada sobre consultas RAG
- 📄 **Soporte Markdown** - Renderizado de respuestas complejas
- 🚀 **Lista para usar** - Configuración mínima requerida

## Inicio Rápido

### 1. Fork del repositorio

```bash
# 1. Crear fork desde GitHub
# Ve a: https://github.com/MISW4411-Aplicaciones-basadas-en-LLMs/MISW4411-Frontend-Template
# Haz clic en "Fork" en la esquina superior derecha
# Esto creará una copia en su cuenta de GitHub

# 2. Clonar SU fork (no el original)
git clone https://github.com/SU-USUARIO/MISW4411-Frontend-Template.git
cd MISW4411-Frontend-Template
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar el proyecto

Editar el archivo `src/config/appConfig.ts` con la información de su grupo:

```typescript
export const APP_CONFIG = {
  // ========== INFORMACIÓN DE SU PROYECTO ==========
  PROJECT_NAME: "Asistente RAG Grupo X",
  GROUP_NUMBER: "Grupo X", 
  STUDENT_NAMES: "Estudiante A - Estudiante B",
  
  // ========== DESCRIPCIÓN ==========
  DESCRIPTION: "Describa su sistema RAG aquí",
  
  // ========== CONFIGURACIÓN DEL BACKEND ==========
  BACKEND_URL: "http://localhost:8000",      // URL de su API
  DEFAULT_TOP_K: 5,
  DEFAULT_COLLECTION: "su_coleccion",
  
  // ========== OPCIONES AVANZADAS DE RAG ==========
  USE_RERANKING: false,                      // Reordenar documentos recuperados
  USE_QUERY_REWRITING: false,                // Reescribir consultas con LLM
  FORCE_REBUILD: false,                      // Reconstruir índice en cada consulta
};
```

### 4. Ejecutar el proyecto

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

## Personalización

### Configuración Principal

Todo el comportamiento del frontend se controla desde `src/config/appConfig.ts`:

```typescript
export const APP_CONFIG = {
  // ========== INFORMACIÓN DEL PROYECTO ==========
  PROJECT_NAME: "Nombre de su proyecto",    // Aparece en el título principal
  GROUP_NUMBER: "Grupo X",                  // Opcional: número de grupo
  STUDENT_NAMES: "Nombre A - Nombre B",     // Opcional: integrantes del equipo
  
  // ========== DESCRIPCIÓN ==========
  DESCRIPTION: "Descripción de su sistema", // Subtítulo explicativo
  
  // ========== CONFIGURACIÓN DEL CHAT ==========
  INITIAL_BOT_MESSAGE: "Mensaje inicial del bot",
  INPUT_PLACEHOLDER: "Placeholder del input de texto",
  
  // ========== CONFIGURACIÓN DEL BACKEND ==========
  BACKEND_URL: "http://localhost:8000",     // URL base de su API
  API_ENDPOINT: "/api/v1/ask",              // Endpoint de consultas
  DEFAULT_TOP_K: 5,                         // Número de documentos a recuperar
  DEFAULT_COLLECTION: "nombre_coleccion",   // Colección por defecto
  
  // ========== OPCIONES AVANZADAS DE RAG ==========
  USE_RERANKING: false,                     // Activar reordenamiento de documentos
  USE_QUERY_REWRITING: false,               // Activar reescritura de consultas
  FORCE_REBUILD: false,                     // Forzar reconstrucción del índice
};
```

### Personalización Avanzada

Si desean hacer cambios más profundos:

- **Estilos**: Modificar archivos en `src/styles/`
- **Componentes**: Editar componentes en `src/components/`
- **Tipos**: Actualizar interfaces en `src/types/`

## Estructura del Proyecto

```
src/
├── components/           # Componentes React
│   ├── Chat.tsx         # 💬 Interfaz principal del chat
│   ├── FileUploader.tsx # 📁 Panel de carga de documentos
│   ├── Header.tsx       # 🔝 Barra de navegación
│   ├── Footer.tsx       # 👇 Pie de página institucional
│   └── Layout.tsx       # 📐 Layout general de la aplicación
├── config/
│   └── appConfig.ts     # ⚙️ CONFIGURACIÓN PRINCIPAL - EDITAR AQUÍ
├── types/
│   └── rag.ts           # 🔧 Tipos TypeScript para API
├── hooks/               # 🎣 Custom hooks React
├── styles/              # 🎨 Estilos y configuración CSS
├── App.tsx              # 🚀 Componente raíz
└── main.tsx             # 🏁 Punto de entrada de la aplicación
```

## Integración con API

### Estructura de la Petición

El frontend envía peticiones POST a su endpoint `/api/v1/ask` con la siguiente estructura:

```typescript
// Petición enviada al backend
{
  "question": "Pregunta del usuario",
  "top_k": 5,
  "collection": "nombre_coleccion",
  "force_rebuild": false,
  "use_reranking": false,
  "use_query_rewriting": false
}
```

**Nota importante**: Los valores de estos parámetros se configuran en `src/config/appConfig.ts`. Puede modificarlos según las capacidades de su backend:

- `top_k`: Número de documentos a recuperar del vector store
- `collection`: Nombre de la colección de documentos a consultar
- `force_rebuild`: Si es `true`, reconstruye el índice antes de cada consulta
- `use_reranking`: Si es `true`, reordena los documentos recuperados por relevancia
- `use_query_rewriting`: Si es `true`, reescribe la consulta del usuario con un LLM antes de buscar

### Estructura de la Respuesta

El frontend espera respuestas en el siguiente formato:

```typescript
// Respuesta esperada del backend
{
  "answer": "Respuesta generada por el modelo",
  "files_consulted": ["archivo1.pdf", "archivo2.pdf"],
  "context_docs": [
    {
      "file_name": "documento.pdf",
      "page_number": 1,
      "chunk_type": "paragraph",
      "priority": 1,
      "snippet": "Fragmento de texto relevante..."
    }
  ],
  "response_time_sec": 1.23
}
```

### Endpoint de Carga de Documentos

Para la funcionalidad de carga de documentos, el frontend utiliza:

```
POST /api/v1/documents/load-from-url    # Iniciar carga de documento
GET  /api/v1/documents/load-from-url/{processing_id}  # Verificar estado
```

## Solución de Problemas

### ❌ Error de CORS

```
Access to fetch at 'http://localhost:8000' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solución**: Configurar CORS en su backend FastAPI:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### ❌ Backend no responde

**Verificar**:

1. ✅ El backend está ejecutándose en la URL configurada
2. ✅ La `BACKEND_URL` en `appConfig.ts` es correcta
3. ✅ El endpoint `/api/v1/ask` existe y funciona
4. ✅ El backend devuelve JSON válido
5. ✅ No hay errores en la consola del backend

### ❌ Error 404 - Collection not found

**Solución**:

1. Verificar que la colección existe en su sistema RAG
2. Confirmar el nombre en `DEFAULT_COLLECTION`
3. Cargar documentos primero usando la pestaña "Cargar Documentos"

### ❌ Error 422 - Validation Error

**Posibles causas**:

- Estructura de petición incorrecta
- Campos requeridos faltantes
- Tipos de datos incorrectos

**Verificar**: Que su backend acepta la estructura de datos descrita en [Integración con API](#integración-con-api).

## Implementación Personalizada

Esta plantilla está diseñada para ser funcional sin modificaciones, pero **no es restrictiva**. Si su grupo prefiere una implementación diferente del frontend, pueden:

### Opciones alternativas

1. **Usar este template**: Configurar solo `appConfig.ts` (recomendado)
2. **Modificar componentes**: Personalizar la interfaz según sus necesidades

### Consideraciones importantes

- ⚠️ **Tiempo de desarrollo**: Una implementación personalizada requiere tiempo adicional que podría ser mejor invertido en el backend
- 🎯 **Enfoque del curso**: El objetivo es dominar los conceptos de LLMs, no desarrollo frontend
- 📹 **Videos de entrega**: Esta plantilla ya proporciona una interfaz profesional para demostraciones

### Recomendación

Sugerimos usar esta plantilla con configuración mínima para maximizar el tiempo disponible para los aspectos centrales del curso relacionados con Grandes Modelos de Lenguaje.

---

**🎓 Curso**: MISW4411 - Construcción de Aplicaciones basadas en Grandes Modelos de Lenguaje
**🏛️ Universidad**: Universidad de los Andes - Maestría en Ingeniería de Software
**📅 Año**: 2025

---

Este proyecto es material educativo del curso MISW4411. Su implementación no es calificada - es un recurso proporcionado para que los grupos concentren su energía en los temas del curso relacionados con el backend y los Grandes Modelos de Lenguaje.
