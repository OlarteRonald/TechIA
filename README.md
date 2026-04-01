# TechSecure AI | Premium Biometric SaaS

Plataforma inteligente de seguridad y autenticación multimodal inspirada en el ecosistema Apple. Utiliza redes neuronales para reconocimiento de voz (Teachable Machine), biometría facial y asistencia de voz interactiva con Vapi AI.

## 🚀 Características
- **Activación por Voz**: Inicia el protocolo de seguridad diciendo "registrar" o "ingresar".
- **Biometría Facial**: Captura y validación de rostros en tiempo real.
- **Teachable Machine**: Modelo de audio entrenado para comandos de voz de alta precisión.
- **Vapi AI**: Guía interactiva por voz durante todo el flujo de usuario.
- **Dashboard Premium**: Interfaz administrativa con analíticas y registros dinámicos.
- **Tecnologías**: HTML5, Vanilla CSS (Glassmorphism), JavaScript (ES6), Supabase, TensorFlow.js.

## 📦 Estructura del Proyecto
- `/index.html`: Punto de entrada y landing page de marketing.
- `/src/style.css`: Sistema de diseño premium y estilos del dashboard.
- `/src/main.js`: Lógica de biometría, integración de IA y control de base de datos.
- `/src/assets/`: Imágenes y recursos visuales.

## 🛠️ Instalación y Despliegue
Este proyecto está optimizado para funcionar tanto en servidores de desarrollo como en hosts estáticos (GitHub Pages, Netlify, Vercel).

1. Sube el contenido a tu repositorio de GitHub.
2. Activa **GitHub Pages** desde los settings.
3. Asegúrate de que las rutas relativas `./src/...` se mantengan intactas.

## 🛡️ Seguridad
El sistema utiliza **Supabase** para el almacenamiento seguro de perfiles de usuario y almacenamiento de imágenes biométricas (Buckets de S3).
