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
* **Gestión de Medios:** **Cloudinary** para el almacenamiento y optimización de imágenes en la nube, almacenando únicamente las URLs seguras en la base de datos.
* **DevOps:** Despliegue continuo en **Render**, con configuración de entornos aislados para Frontend y Backend, y gestión de seguridad mediante variables de entorno y políticas CORS estrictas.
