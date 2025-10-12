# EmergenciaGT - Documentación del Proyecto

## Índice

1.  [Visión General del Proyecto](#1-visión-general-del-proyecto)
2.  [Instalación y Ejecución Local](#2-instalación-y-ejecución-local)
3.  [Arquitectura de la Solución](#3-arquitectura-de-la-solución)
4.  [Modelo de Base de Datos (Firestore)](#4-modelo-de-base-de-datos-firestore)
5.  [Casos de Uso](#5-casos-de-uso)
6.  [Flujos de Proceso Detallados](#6-flujos-de-proceso-detallados)
7.  [Flujo Detallado por Estado de Alerta](#7-flujo-detallado-por-estado-de-alerta)
8.  [Estructura de Archivos del Proyecto](#8-estructura-de-archivos-del-proyecto)

---

## 1. Visión General del Proyecto

**EmergenciaGT** es una plataforma de respuesta a emergencias diseñada para conectar a ciudadanos en Guatemala con los servicios de primera respuesta (bomberos, paramédicos) de manera rápida y eficiente. La solución consta de dos componentes principales: una Aplicación Web Progresiva (PWA) para usuarios finales y un Panel de Administración web para operadores y administradores del servicio.

- **El Problema:** Reducir el tiempo de respuesta ante emergencias y proporcionar a los socorristas información vital del paciente antes de llegar a la escena.
- **La Solución:** Una plataforma centralizada que utiliza geolocalización en tiempo real, perfiles médicos de usuario y un sistema de despacho de alertas para optimizar la gestión de emergencias.

---

## 2. Instalación y Ejecución Local

Para trabajar en el proyecto desde tu computadora, sigue estos pasos detallados.

### 2.1. Prerrequisitos

- **[Node.js](https://nodejs.org/en):** Descarga e instala la versión **LTS**, que es la más estable y recomendada.

### 2.2. Pasos de Instalación

1.  **Descargar el Código:** Descomprime el archivo `.zip` del proyecto en una carpeta de fácil acceso.

2.  **Instalar Dependencias:** Abre una terminal en la carpeta raíz del proyecto y ejecuta:
    ```bash
    npm install
    ```

3.  **Configurar Variables de Entorno:**
    *   Crea un archivo llamado `.env.local` en la raíz del proyecto.
    *   Obtén tu **clave de servicio de Firebase** desde la [Consola de Firebase](https://console.firebase.google.com/) > Configuración del proyecto > Cuentas de servicio > "Generar nueva clave privada".
    *   Abre el archivo JSON descargado, copia todo su contenido y pégalo en el archivo `.env.local` de la siguiente manera:
        ```env
        FIREBASE_SERVICE_ACCOUNT_KEY='{"type": "service_account", ...}'
        ```

4.  **Ejecutar el Servidor de Desarrollo:**
    ```bash
    npm run dev
    ```
    *   Abre tu navegador y visita **http://localhost:9002** para ver el panel de administración.

---

## 3. Arquitectura de la Solución

### 3.1. Arquitectura General y de Software

La plataforma utiliza una arquitectura moderna basada en **Next.js** y **Firebase**, garantizando escalabilidad, rendimiento y desarrollo rápido.

- **Frontend (App Móvil y Panel Web):** Ambas interfaces están construidas con Next.js (usando el App Router), React, TypeScript y Tailwind CSS.
- **Backend y Base de Datos (BaaS):** Firebase es el núcleo de la solución, proveyendo toda la infraestructura de backend de manera serverless.

### 3.2. Infraestructura del Sistema

- **Firebase Hosting:** Para el despliegue y servicio global (vía CDN) de ambas aplicaciones.
- **Firebase Authentication:** Para la autenticación segura de usuarios (email/contraseña, anónimo) y gestión de roles.
- **Firestore:** Base de datos NoSQL, serverless y con capacidades de tiempo real.

### 3.3. Diagrama de Arquitectura

```
+--------------------------+        +--------------------------+
|      Aplicación Móvil    |        |  Panel de Administración |
| (Next.js PWA / React)    |        |   (Next.js / React)      |
+--------------------------+        +--------------------------+
           |                                  |
           v                                  v
+-------------------------------------------------------------+
|              Infraestructura Google Cloud (Firebase)        |
|  +------------------+   +------------------+   +-----------+  |
|  |   Authentication |   |    Firestore     |   |  Hosting  |  |
|  | (Usuarios, Roles)|   |  (Base de Datos) |   | (Despliegue)|
|  +------------------+   +------------------+   +-----------+  |
+-------------------------------------------------------------+
```

### 3.4. Arquitectura Técnica Detallada

- **Next.js App Router:** Organiza las rutas y layouts en grupos: `(admin)` para el panel y `(mobile)` para la PWA.
- **Componentes de Servidor y Cliente:** Se favorece el uso de Componentes de Servidor (`"use server"`) para la lógica de negocio y las interacciones con Firebase Admin, reduciendo el código enviado al cliente. Los componentes interactivos (`"use client"`) se usan para la UI que requiere estado o eventos del navegador.
- **Comunicación en Tiempo Real:** Se utiliza la función `onSnapshot` de Firestore para escuchar cambios en la base de datos en tiempo real, permitiendo que el panel de administración reciba nuevas alertas instantáneamente.
- **Seguridad Basada en Reglas:** La seguridad reside en las **Reglas de Seguridad de Firestore** (`firestore.rules`), que definen en el servidor quién puede leer o escribir datos, basándose en el rol del usuario almacenado en los **Custom Claims** de su token de autenticación.

---

## 4. Modelo de Base de Datos (Firestore)

### Colección: `users`
- **Propósito:** Almacena perfiles de los usuarios del **Panel de Administración** (Operadores, Administradores).
- **Estructura del Documento (ID = UID de Firebase Auth):**
  ```json
  {
    "uid": "string",
    "email": "string",
    "role": "operator" | "admin" | "unit",
    "stationId": "string" | null,
    "createdAt": "Timestamp",
    "lastLogin": "Timestamp"
  }
  ```

### Colección: `medicalInfo`
- **Propósito:** Guarda la información médica de los usuarios de la aplicación móvil.
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
- **Propósito:** Cada documento es una emergencia reportada.
- **Estructura del Documento (ID = Auto-generado):**
  ```json
  {
    "id": "string",
    "userId": "string",
    "isAnonymous": "boolean",
    "timestamp": "Timestamp",
    "location": "GeoPoint",
    "status": "new" | "assigned" | "en_route" | "on_scene" | "attending" | "transporting" | "patient_attended" | "resolved" | "cancelled",
    "assignedStationId": "string",
    "assignedUnitId": "string"
  }
  ```

### Colección: `stations`
- **Propósito:** Almacena la información de las estaciones de bomberos.
- **Estructura del Documento (ID = Auto-generado):**
  ```json
  {
    "name": "string",
    "address": "string",
    "location": "GeoPoint",
    "createdAt": "Timestamp"
  }
  ```
  - **Subcolección: `unidades`**
    - **Ruta:** `stations/{stationId}/unidades/{unitId}`
    - **Estructura:**
      ```json
      {
        "nombre": "string",
        "tipo": "string",
        "disponible": "boolean",
        "uid": "string"
      }
      ```

---

## 5. Casos de Uso

### 5.1. Casos de Uso de la Aplicación Móvil (PWA)

- **Registro de Nuevo Usuario:** Un ciudadano se registra con su correo y contraseña para acceder a las funcionalidades completas.
- **Ingreso de Información Médica:** El usuario registrado completa su perfil médico, que se almacena en la colección `medicalInfo`.
- **Generar Alerta (Usuario Registrado):** Al presionar el botón de pánico, la app envía su geolocalización y `userId` para crear una alerta, permitiendo al operador ver su perfil médico.
- **Generar Alerta (Usuario Anónimo):** Un usuario invitado puede presionar el botón de pánico. La alerta se crea con `isAnonymous: true`, y el operador solo ve la ubicación.

### 5.2. Casos de Uso del Panel de Administración

- **Gestión de Alertas:** El operador visualiza alertas entrantes en tiempo real, ve los detalles y las asigna a una unidad disponible, cambiando su estado a `assigned`.
- **Gestión de Estaciones y Unidades:** Un administrador puede crear, editar o eliminar estaciones y las unidades (ambulancias) asociadas a ellas.
- **Gestión de Usuarios del Panel:** Un administrador gestiona los roles (`admin`, `operator`, `unit`) y asignaciones de estación de otros usuarios del panel.

---

## 6. Flujos de Proceso Detallados

### 6.1. Flujo de Generación de Alerta

1.  **Activación:** El usuario (registrado o anónimo) mantiene presionado el **Botón de Pánico**.
2.  **Geolocalización:** La app obtiene las coordenadas GPS del dispositivo mediante `navigator.geolocation`.
3.  **Creación en Firestore:** Se crea un nuevo documento en la colección `alerts` con el `userId`, la `location` (como GeoPoint), `status: 'new'` y el flag `isAnonymous` correspondiente.
4.  **Recepción en Panel:** El panel de administración, escuchando en tiempo real, recibe la nueva alerta. Si no es anónima, busca y muestra la información médica asociada.

### 6.2. Flujo de Usuario Anónimo para Emergencias

1.  **Acción:** En la pantalla de inicio, el usuario selecciona "Ingresar como Invitado".
2.  **Autenticación:** Firebase Authentication crea una cuenta de usuario temporal y anónima para el dispositivo.
3.  **Practicidad:** Este enfoque permite el reporte de emergencias sin la fricción de un proceso de registro, lo cual es crucial en situaciones de alta presión.

### 6.3. Flujo de Despacho y Gestión en Campo (Unidad)

1.  **Asignación:** Un operador asigna una alerta a una unidad específica desde el panel.
2.  **Recepción:** El personal de la unidad, con sesión iniciada en un dispositivo móvil, recibe la misión en tiempo real, con detalles y mapa.
3.  **Actualización de Estado:** La unidad actualiza el estado (`En Ruta`, `En el Lugar`, etc.) a través de su interfaz. Cada actualización se refleja instantáneamente en el documento de la alerta en Firestore.
4.  **Sincronización:** El operador en la central ve los cambios de estado en tiempo real, optimizando la comunicación.

---

## 7. Flujo Detallado por Estado de Alerta

El seguimiento de una emergencia se gestiona a través de un flujo de estados claro. Cada estado representa un paso específico en el proceso de atención.

| Estado               | Actor que lo Activa | Descripción                                                                   |
| -------------------- | ------------------- | ----------------------------------------------------------------------------- |
| `new`                | Usuario (Móvil)     | La alerta ha sido creada y está pendiente de ser vista por un operador.        |
| `assigned`           | Operador (Panel)    | Un operador ha asignado la alerta a una estación y unidad específicas.        |
| `en_route`           | Unidad (Campo)      | La unidad de emergencia ha salido de la base y está en camino al lugar.         |
| `on_scene`           | Unidad (Campo)      | La unidad ha llegado a la ubicación de la emergencia.                          |
| `attending`          | Unidad (Campo)      | El personal está activamente atendiendo al paciente o la situación.             |
| `transporting`       | Unidad (Campo)      | El paciente está siendo trasladado a un centro médico.                        |
| `patient_attended`   | Unidad (Campo)      | El paciente fue atendido en el lugar y no requirió traslado. Fin del servicio. |
| `resolved`           | Unidad (Campo)      | La unidad ha llegado al hospital y ha entregado al paciente. Fin del servicio. |
| `cancelled`          | Usuario u Operador  | La alerta ha sido cancelada, ya sea por el usuario o por un operador.          |


---

## 8. Estructura de Archivos del Proyecto

El proyecto está organizado siguiendo las convenciones de Next.js App Router.

- **`src/app/`**
  - **`(admin)/`**: Grupo de rutas para el panel de administración (`/dashboard/admin`, `/dashboard/users`, etc.).
  - **`(mobile)/`**: Grupo de rutas para la PWA del usuario final (`/dashboard`, `/medical-info`, etc.).
- **`src/components/`**: Componentes de React reutilizables.
- **`src/lib/`**:
  - **`firebase.ts`**: Configuración del SDK de cliente de Firebase.
  - **`firebase-admin.ts`**: Configuración del SDK de Admin para usar en el backend (Server Actions).
  - **`types.ts`**: Definiciones de tipos de TypeScript.
- **`firestore.rules`**: Archivo crítico que define las reglas de seguridad de la base de datos.