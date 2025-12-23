# MARIE: Características Implementadas

Este documento detalla las funcionalidades principales de **MARIE** (Machine-Assisted Research Intelligent Environment) con capturas de pantalla actualizadas.

## 1. Interfaz de Usuario Moderna (Landing Page)
MARIE cuenta con una interfaz de bienvenida limpia y profesional, diseñada para investigadores y desarrolladores.

![Landing Page](imgs/snapshots/landing_page.png)

## 2. Entorno de Chat Inteligente
El núcleo de MARIE es su interfaz de chat, que incluye:
- **Auto-titulado**: El sistema genera automáticamente un título para la conversación basado en el primer mensaje.
- **Contenido Rico**: Soporte para Markdown, ecuaciones LaTeX y bloques de código.
- **Gestión de Conversaciones**: Historial persistente y búsqueda.

![Chat Interface](imgs/snapshots/chat_interface.png)

## 3. Developer API v1 (Swagger)
MARIE ofrece una API REST completa para integración externa, documentada interactivamente con Swagger.
- **Endpoints**: `/chat/completions`, `/conversations`, `/search`.
- **Seguridad**: Autenticación mediante API Keys (SHA-256).

![API Docs](imgs/snapshots/api_docs.png)

## 4. Consola de Administración
Panel centralizado para la gestión del sistema:
- **Configuración Dinámica**: Selección de modelos en tiempo real desde Ollama y HuggingFace.
- **Gestión de Usuarios**: Control de acceso y permisos.
- **Estadísticas del Sistema**: Monitoreo de recursos.

![Admin Settings](imgs/snapshots/admin_settings.png)

---
*Desarrollado por el equipo de ImpactU / CoLaV.*
