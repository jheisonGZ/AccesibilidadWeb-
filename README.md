<img width="1536" height="1024" alt="ChatGPT Image 15 may 2026, 06_47_48 p m" src="https://github.com/user-attachments/assets/a6498ee8-1307-4d0c-88ce-39b6183122d1" />

Aplicación Web de Bienestar Emocional

Aplicación web interactiva orientada al bienestar emocional de estudiantes universitarios, diseñada bajo principios modernos de accesibilidad digital, experiencia inmersiva y arquitectura escalable. El sistema integra autenticación institucional, entorno 3D interactivo, herramientas de regulación emocional y un backend inteligente impulsado por IA para asistencia conversacional.

Desarrollada como proyecto de tesis de grado para Ingeniería en Sistemas en la Universidad del Valle.

Descripción General

La plataforma proporciona un espacio digital seguro, accesible e inmersivo donde los estudiantes pueden autenticarse utilizando su correo institucional, personalizar un avatar e interactuar dentro de un entorno 3D diseñado para promover el bienestar emocional y la relajación.

La aplicación incorpora herramientas orientadas al acompañamiento emocional y la experiencia inclusiva, incluyendo:

Ejercicios de respiración guiados.
Cuestionarios de evaluación emocional.
Zona de relajación inmersiva.
Recomendaciones personalizadas.
Asistente conversacional inteligente impulsado por IA.
Navegación accesible bajo estándares WCAG 2.1 nivel AA.

El proyecto combina tecnologías modernas de frontend y backend con una arquitectura preparada para escalabilidad, integración de servicios externos y despliegue en producción.

Objetivo de la Investigación

El propósito de esta tesis es desarrollar una aplicación web accesible e inmersiva que contribuya al bienestar emocional de estudiantes universitarios mediante herramientas digitales interactivas, experiencias 3D y asistencia basada en inteligencia artificial.

La investigación busca integrar:

Accesibilidad digital.
Experiencia de usuario inclusiva.
Tecnologías web modernas.
Entornos inmersivos 3D.
Sistemas inteligentes conversacionales.

Todo ello enfocado en generar un entorno digital seguro y de apoyo emocional para la comunidad estudiantil.

Características Principales
Frontend
Autenticación restringida al dominio institucional:
@correounivalle.edu.co
Entorno 3D desarrollado con React Three Fiber.
Sistema de estado global con Zustand.
Validación tipada y segura mediante Zod.
Diseño responsive optimizado para múltiples dispositivos.
Arquitectura modular basada en Next.js App Router.
Interfaz moderna construida con Tailwind CSS v4.
Integración preparada para avatares avanzados.
Backend
API REST desarrollada con Express.js.
Integración con inteligencia artificial mediante Groq API.
Sistema de chat conversacional inteligente.
Configuración CORS para comunicación segura entre cliente y servidor.
Health checks para monitoreo del servicio.
Arquitectura preparada para microservicios y despliegue cloud.
Accesibilidad

La aplicación fue diseñada siguiendo estándares WCAG 2.1 nivel AA, incluyendo:

Navegación completa por teclado.
Roles y atributos ARIA.
Gestión correcta del foco.
Formularios accesibles y etiquetados.
Contraste adecuado de colores.
Compatibilidad con tecnologías asistivas.
Diseño inclusivo centrado en experiencia de usuario.

La accesibilidad representa uno de los pilares fundamentales de la investigación.

Tecnologías Utilizadas
Frontend
Next.js 14 (App Router)
React
TypeScript
React Three Fiber
Drei
Tailwind CSS v4
Zustand
Zod
Backend
Node.js
Express.js
Groq SDK
CORS
dotenv
IA Integrada
Llama 3.3 70B Versatile
Groq API
Arquitectura del Sistema

La solución está compuesta por dos capas principales:

Cliente (Frontend)

Responsable de:

Renderizado del entorno 3D.
Gestión de interfaz y experiencia inmersiva.
Validación de formularios.
Accesibilidad y navegación.
Comunicación con APIs backend.
Servidor (Backend)

Responsable de:

Procesamiento de solicitudes API.
Integración con modelos de inteligencia artificial.
Gestión de endpoints conversacionales.
Control de estado del servicio.
Escalabilidad futura hacia autenticación y persistencia real.
Instalación del Frontend
Clonar repositorio
git clone https://github.com/jheisonGZ/AccesibilidadWeb.git

cd AccesibilidadWeb
Instalar dependencias
npm install
Variables de Entorno Frontend

Crear un archivo .env.local en la raíz del proyecto:

NEXT_PUBLIC_API_BASE=""
ALLOWED_DOMAIN="@correounivalle.edu.co"
JWT_SECRET="devsecret"
Ejecución del Frontend
npm run dev

Abrir en:

http://localhost:3000
Configuración del Backend
Instalación
npm install express cors groq-sdk dotenv
Variables de Entorno Backend

Crear archivo .env:

GROQ_API_KEY=tu_api_key
PORT=3001
Servidor Backend

El backend fue desarrollado con Express.js e integra inteligencia artificial mediante Groq API.

Funcionalidades del Backend
Endpoint de salud del sistema.
Endpoint principal de chat IA.
Configuración CORS.
Comunicación segura frontend-backend.
Arquitectura desacoplada y escalable.
Ejecución
node server.js

Servidor disponible en:

http://localhost:3001
Estructura del Proyecto
/app
├── (auth)/page.tsx
├── avatar/page.tsx
├── world/page.tsx
├── api/auth/login/route.ts
├── api/avatars/select/route.ts
└── api/sessions/save/route.ts

/components
├── ui/
├── auth/
├── avatar/
└── world/

/lib
├── store.ts
└── api.ts

/backend
├── server.js
├── routes/
├── controllers/
└── services/
API Inteligente Integrada

El sistema incorpora un asistente conversacional inteligente utilizando:

Groq API
Modelo Llama 3.3 70B Versatile
Endpoint Principal
POST /api/chat
Despliegue

Actualmente tanto el frontend como el backend se encuentran desplegados en producción.

Frontend

Desplegado mediante:

Vercel
Backend

Desplegado como servicio Node.js cloud-ready compatible con:

Render
Railway
VPS Linux
Docker
Aporte Académico

Este proyecto representa una propuesta tecnológica orientada a la integración de accesibilidad digital, bienestar emocional e inteligencia artificial dentro de contextos universitarios.

La tesis busca demostrar cómo las tecnologías web modernas y los entornos inmersivos pueden utilizarse como herramientas de apoyo emocional y experiencia inclusiva para estudiantes de educación superior.

Trabajo Futuro
Persistencia con PostgreSQL o MongoDB.
Integración con Firebase o Supabase.
Sistema de seguimiento emocional.
Notificaciones inteligentes.
Avatares avanzados con Ready Player Me.
Audio ambiental dinámico.
Sistema multijugador en entorno 3D.
Panel administrativo.
Métricas de bienestar emocional.
Autor

Jheison Estiben Gómez Muñoz
Ingeniería en Sistemas
Universidad del Valle

GitHub:
jheisonGZ GitHub

Licencia

Proyecto académico desarrollado como tesis de grado con fines educativos, investigativos y de innovación tecnológica.
