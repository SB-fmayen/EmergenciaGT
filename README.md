
# EmergenciaGT - Documentación del Proyecto

## 1. Visión General del Proyecto

**EmergenciaGT** es una plataforma de respuesta a emergencias diseñada para conectar a ciudadanos en Guatemala con los servicios de primera respuesta (bomberos, paramédicos) de manera rápida y eficiente. La solución consta de dos componentes principales: una Aplicación Web Progresiva (PWA) para usuarios finales y un Panel de Administración web para operadores y administradores del servicio.

- **El Problema:** Reducir el tiempo de respuesta ante emergencias y proporcionar a los socorristas información vital del paciente antes de llegar a la escena.
- **La Solución:** Una plataforma centralizada que utiliza geolocalización en tiempo real, perfiles médicos de usuario y un sistema de despacho de alertas para optimizar la gestión de emergencias.

---

## 2. Arquitectura de la Solución

La plataforma utiliza una arquitectura moderna basada en **Next.js** y **Firebase**, lo que garantiza escalabilidad, rendimiento y desarrollo rápido.

- **Frontend (App Móvil y Panel Web):** Ambas interfaces están construidas con Next.js, React, TypeScript, Tailwind CSS y componentes de shadcn/ui.
- **Backend y Base de Datos (BaaS):** Firebase es el núcleo de la solución, proporcionando:
  - **Firebase Authentication:** Para la gestión de usuarios (email/contraseña, anónimo) y control de acceso basado en roles (Custom Claims).
  - **Firestore:** Como base de datos NoSQL en tiempo real para almacenar toda la información de la aplicación (alertas, datos médicos, estaciones, etc.).
  - **Firebase Hosting:** Para desplegar y servir tanto la PWA como el panel de administración.

```
+--------------------------+        +--------------------------+
|      Aplicación Móvil    |        |  Panel de Administración |
| (Next.js PWA / React)    |        |   (Next.js / React)      |
+--------------------------+        +--------------------------+
           |                                  |
           | (HTTPS / WebSocket)              | (HTTPS / WebSocket)
           v                                  v
+-------------------------------------------------------------+
|                        Firebase (BaaS)                        |
|                                                             |
|  +------------------+   +------------------+   +-----------+  |
|  |   Authentication |   |    Firestore     |   |  Hosting  |  |
|  | (Usuarios, Roles)|   |  (Base de Datos) |   | (Despliegue)|
|  +------------------+   +------------------+   +-----------+  |
|                                                             |
+-------------------------------------------------------------+

```

---

## 3. Estructura de la Base de Datos (Firestore)

La base de datos está organizada en colecciones principales que separan las distintas entidades de la aplicación.

### Colección: `users`
- **Propósito:** Almacena perfiles públicos básicos de los operadores/administradores del panel web.
- **Estructura del Documento (ID = UID del usuario):**
  ```json
  {
    "uid": "string",
    "email": "string",
    "role": "operator" | "admin",
    "createdAt": "Timestamp",
    "lastLogin": "Timestamp"
  }
  ```

### Colección: `medicalInfo`
- **Propósito:** Guarda la información médica detallada de los usuarios de la aplicación móvil. Es una colección separada por privacidad y para un acceso rápido.
- **Estructura del Documento (ID = UID del usuario):**
  ```json
  {
    "fullName": "string",
    "age": "string",
    "bloodType": "string",
    "conditions": ["array", "of", "strings"],
    "otherConditions": "string",
    "medications": [{ "name": "string" }],
    "additionalNotes": "string",
    "emergencyContacts": [
      {
        "name": "string",
        "phone": "string",
        "relation": "string"
      }
    ]
  }
  ```

### Colección: `alerts`
- **Propósito:** El corazón de la aplicación. Cada documento es una emergencia reportada.
- **Estructura del Documento (ID = Auto-generado por Firestore):**
  ```json
  {
    "id": "string", // ID del documento, replicado por conveniencia
    "userId": "string", // UID del usuario que generó la alerta
    "isAnonymous": "boolean",
    "timestamp": "Timestamp", // Hora de creación
    "location": "GeoPoint", // Coordenadas de la emergencia
    "status": "new" | "dispatched" | "resolved" | "cancelled",
    "cancellationReason": "string" // Opcional
  }
  ```

### Colección: `stations`
- **Propósito:** Almacena la información de las estaciones de bomberos o paramédicos.
- **Estructura del Documento (ID = Auto-generado por Firestore):**
  ```json
  {
    "name": "string",
    "address": "string",
    "location": "GeoPoint", // Coordenadas de la estación
    "createdAt": "Timestamp",
    // Subcolección: unidades
  }
  ```
  - **Subcolección: `unidades`**
    - **Propósito:** Unidades (ambulancias, camiones) pertenecientes a una estación.
    - **Estructura del Documento (ID = ID de la unidad):**
      ```json
      {
        "nombre": "string",
        "tipo": "Ambulancia" | "etc...",
        "disponible": "boolean"
      }
      ```

---

## 4. Estructura de Archivos del Proyecto

El proyecto está organizado siguiendo las convenciones de Next.js App Router.

- `src/app/`
  - `(admin)/`: Grupo de rutas para todo el panel de administración.
    - `dashboard/`: Páginas protegidas del panel (admin, estaciones, usuarios, analíticas).
    - `login/`: Página de inicio de sesión para operadores/admins.
    - `layout.tsx`: **Layout de seguridad** que protege las rutas de admin y gestiona los roles.
  - `(mobile)/`: Grupo de rutas para la PWA del usuario final (implícito en las rutas raíz).
    - `auth/`: Página de registro/login para usuarios de la app.
    - `dashboard/`: Panel principal del usuario con el botón de pánico.
    - `alerts/`: Historial de alertas del usuario.
    - `medical-info/`: Formulario de información médica.
    - `welcome/`: Página de bienvenida post-registro.
- `src/components/`
  - `admin/`: Componentes específicos del panel de administración (ej: `AlertDetailModal`).
  - `dashboard/`: Componentes específicos del dashboard del usuario móvil (ej: `PanicButton`).
  - `ui/`: Componentes de UI reutilizables de shadcn.
- `src/lib/`:
  - `firebase.ts`: Configuración del SDK de cliente de Firebase.
  - `firebase-admin.ts`: Configuración del SDK de Admin para acciones de servidor.
  - `types.ts`: Definiciones de tipos de TypeScript para la estructura de datos.
- `src/hooks/`: Hooks de React personalizados (ej: `use-toast`).
- `firestore.rules`: **Archivo crítico** que define las reglas de seguridad de la base de datos.
- `next.config.ts`: Configuración de Next.js.
- `tailwind.config.ts`: Configuración de Tailwind CSS.

---

## 5. Plan de QA (Casos de Prueba Clave)

Este es un plan básico para asegurar que las funcionalidades principales no se rompan.

| Feature                      | Caso de Prueba                                                                       | Resultado Esperado                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| **Autenticación (Admin)**    | 1. Registrar un nuevo usuario desde la página de login de admin.                     | El usuario se crea con rol "operator".                                                    |
|                              | 2. Iniciar sesión con un usuario "operator".                                         | El dashboard se muestra sin los botones "Estaciones" y "Usuarios".                        |
|                              | 3. Promover un "operator" a "admin" desde una cuenta admin.                           | El rol del usuario se actualiza en la tabla.                                              |
|                              | 4. El nuevo "admin" cierra sesión y vuelve a entrar.                                 | El dashboard se muestra con todos los botones de administrador.                           |
| **Gestión de Estaciones**    | 1. Crear una nueva estación con datos válidos desde una cuenta admin.                  | La estación aparece en la tabla. Se crea la subcolección `unidades` en Firestore.         |
|                              | 2. Editar la información de una estación existente.                                  | Los datos se actualizan en la tabla y en Firestore.                                       |
|                              | 3. Eliminar una estación.                                                            | La estación desaparece de la tabla y se elimina de Firestore.                             |
|                              | 4. Intentar crear una estación desde una cuenta "operator".                          | La acción falla, mostrando un error de "Acceso Denegado".                                 |
| **Autenticación (Móvil)**    | 1. Crear una cuenta nueva desde la PWA.                                              | El usuario es redirigido a la página de bienvenida y luego puede acceder al dashboard.    |
|                              | 2. Iniciar sesión con una cuenta existente.                                          | El usuario accede directamente al dashboard.                                              |
| **Alerta de Emergencia**     | 1. Mantener presionado el botón de pánico por 2 segundos.                            | Se obtiene la ubicación, se crea un documento en la colección `alerts`, y aparece el modal.|
|                              | 2. La nueva alerta aparece en tiempo real en el panel de administración.              | La alerta es visible en la lista y en el mapa del panel web.                               |
|                              | 3. Cancelar una alerta desde el modal de la app.                                     | El estado de la alerta en Firestore cambia a "cancelled".                                 |

---

## 6. PRD (Documento de Requisitos del Producto)

### 6.1. Resumen

EmergenciaGT es una plataforma integral que agiliza la comunicación y la respuesta en situaciones de emergencia, sirviendo tanto a ciudadanos como a los equipos de primera respuesta.

### 6.2. Funcionalidades de la Aplicación Móvil (PWA)

- **F1. Autenticación de Usuario:** Los usuarios pueden crear una cuenta con email/contraseña o ingresar como invitados (anónimos) para un uso rápido.
- **F2. Botón de Pánico:** Un botón prominente que, al ser presionado de forma sostenida, envía una alerta con la geolocalización del usuario a la central.
- **F3. Perfil Médico:** Los usuarios registrados pueden almacenar información médica vital (tipo de sangre, alergias, condiciones, contactos) para asistir a los socorristas.
- **F4. Historial de Alertas:** Los usuarios registrados pueden ver un historial de sus alertas pasadas y el estado de cada una.
- **F5. Cancelación de Alerta:** Los usuarios pueden cancelar una alerta recién creada si fue una falsa alarma o si la situación se resolvió.

### 6.3. Funcionalidades del Panel de Administración

- **F6. Dashboard en Tiempo Real:** Los operadores ven un resumen de KPIs (alertas activas, en curso, resueltas) y una lista y mapa de alertas activas que se actualizan en tiempo real.
- **F7. Gestión de Alertas:** Los operadores pueden ver los detalles completos de una alerta, incluyendo la información médica del usuario (si está disponible), y actualizar su estado (`new`, `dispatched`, `resolved`, `cancelled`).
- **F8. Gestión de Estaciones (Admin):** Los administradores pueden crear, leer, actualizar y eliminar estaciones de emergencia, incluyendo su nombre, dirección y coordenadas.
- **F9. Gestión de Roles de Usuario (Admin):** Los administradores pueden ver la lista de todos los operadores y promoverlos al rol de "administrador".

### 6.4. Requisitos No Funcionales

- **Rendimiento:** La aplicación debe ser rápida y responsiva. La creación de una alerta debe ser casi instantánea.
- **Seguridad:** El acceso a funciones administrativas debe estar estrictamente controlado por roles. Las reglas de Firestore deben prevenir el acceso no autorizado a los datos.
- **Usabilidad:** La interfaz, especialmente el botón de pánico, debe ser extremadamente simple e intuitiva.
- **Escalabilidad:** La solución basada en Firebase debe poder soportar un aumento en el número de usuarios y alertas.

