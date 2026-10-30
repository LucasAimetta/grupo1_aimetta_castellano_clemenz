# 🔥 Burned - Plataforma de Gestión de Recetas Full Stack

**Burned** es una aplicación web escalable diseñada para la creación, gestión y descubrimiento de recetas culinarias. El proyecto implementa una arquitectura de microservicios desacoplados, optimizando el rendimiento mediante un backend compilado y una interfaz de usuario reactiva.

---

## 🏗 Arquitectura del Sistema

### ⚙️ Backend: Rendimiento y Concurrencia
El servidor está desarrollado en **Go (Golang)** utilizando el framework **Gin Gonic**, seleccionado por su eficiencia en el manejo de peticiones HTTP y baja latencia.

* **Patrón de Diseño:** Implementación de **Clean Architecture** separando las capas de *Handlers* (controladores), *Services* (lógica de negocio) y *Repositories* (acceso a datos).
* **Autenticación:** Sistema híbrido que soporta:
    * **OAuth 2.0 (Google):** Integración nativa para autenticación federada.
    * **JWT (JSON Web Tokens):** Gestión de sesiones *stateless* con middleware personalizado para validación de roles y protección de rutas.
* **Manejo de Errores:** Control centralizado de *panics* y validación estricta de tipos de datos para asegurar la estabilidad del servicio.

### 🎨 Frontend: Interfaz y Experiencia de Usuario
Desarrollado con **React** y **Vite** para garantizar una carga rápida y una experiencia de usuario fluida (SPA).

* **UI/UX:** Diseño implementado con **Tailwind CSS**, priorizando la adaptabilidad móvil (*Responsive Design*) y el uso de animaciones CSS optimizadas para la interacción del usuario.
* **Gestión de Estado:** Uso de React Hooks para el manejo de contextos globales (Autenticación, Preferencias de Búsqueda).

### 🤖 Inteligencia Artificial: Moderación en el Cliente
Integración de **TensorFlow.js (NSFWJS)** para la moderación automática de contenido.

* **Funcionamiento:** Las imágenes se analizan localmente en el navegador del usuario antes de iniciar la subida.
* **Beneficio:** Reduce la carga del servidor y los costos de ancho de banda al filtrar contenido inapropiado en el origen (*Edge Computing*).

---

## ☁️ Infraestructura y Despliegue

* **Base de Datos:** **MongoDB Atlas** (NoSQL), modelado para documentos flexibles que permiten estructuras variables en ingredientes y pasos de preparación.
* **DevOps:** Despliegue continuo en **Render**, con configuración de entornos aislados para Frontend y Backend, y gestión de seguridad mediante variables de entorno y políticas CORS estrictas.


## 🔐 Gestión de Secretos con Doppler

Este proyecto utiliza **Doppler** como plataforma centralizada para la gestión segura de variables de entorno y secretos, eliminando la necesidad de exponer archivos `.env` con credenciales sensibles en el repositorio.

La arquitectura de secretos opera bajo dos modalidades:

### 1. Producción (Render)
El servicio web en producción está integrado nativamente con Doppler mediante una API Key. Cada modificación realizada en el panel de Doppler se sincroniza automáticamente (*push*) hacia las variables de entorno de Render, disparando un despliegue continuo de forma transparente y segura.

### 2. Entorno Local
Para correr el proyecto localmente utilizando la gestión centralizada de secretos sin exponer claves, el sistema está preparado para ser ejecutado mediante la **Doppler CLI**.

#### Requisitos previos para ejecución local:
1. Tener instalado [Doppler CLI](https://docs.doppler.com/docs/install-cli).
2. Contar con una cuenta en Doppler y haber sido invitado al proyecto con permisos de lectura (*Viewer*).

#### Pasos para levantar el proyecto localmente:

1. **Iniciar sesión en Doppler desde la terminal:**
   ```bash
   doppler login

2. **Vincular el directorio del proyecto con tu entorno de Doppler:**
```bash
doppler setup

3.  Ejecutar el proyecto inyectando los secretos en memoria:
doppler run -- docker compose up -d --build