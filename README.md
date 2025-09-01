# EmergenciaGT - Documentación del Proyecto

## 1. Visión General del Proyecto

**EmergenciaGT** es una plataforma de respuesta a emergencias diseñada para conectar a ciudadanos en Guatemala con los servicios de primera respuesta (bomberos, paramédicos) de manera rápida y eficiente. La solución consta de dos componentes principales: una Aplicación Web Progresiva (PWA) para usuarios finales y un Panel de Administración web para operadores y administradores del servicio.

- **El Problema:** Reducir el tiempo de respuesta ante emergencias y proporcionar a los socorristas información vital del paciente antes de llegar a la escena.
- **La Solución:** Una plataforma centralizada que utiliza geolocalización en tiempo real, perfiles médicos de usuario y un sistema de despacho de alertas para optimizar la gestión de emergencias.

---

## 2. Instalación y Ejecución Local

Para trabajar en el proyecto desde tu computadora, sigue estos pasos.

### 2.1. Prerrequisitos

Asegúrate de tener instalado **[Node.js](https://nodejs.org/en)** (se recomienda la versión LTS). Esto instalará automáticamente `npm`.

### 2.2. Pasos de Instalación

1.  **Descargar el Código:** Descarga el proyecto como un archivo ZIP y descomprímelo en una carpeta de tu elección.

2.  **Instalar Dependencias:** Abre una terminal o línea de comandos en la carpeta del proyecto y ejecuta el siguiente comando. Esto descargará todas las librerías necesarias.
    ```bash
    npm install
    ```

3.  **Configurar Variables de Entorno (Clave de Admin):** Este es el paso más importante para que las funciones de administrador funcionen localmente.
    *   **Crea un archivo:** En la raíz del proyecto, crea un nuevo archivo llamado `.env.local`.
    *   **Obtén tu clave de servicio de Firebase:**
        *   Ve a la [Consola de Firebase](https://console.firebase.google.com/).
        *   Selecciona tu proyecto `emergenciagt`.
        *   Haz clic en el ícono de engranaje (Configuración) y ve a **Configuración del proyecto**.
        *   Ve a la pestaña **Cuentas de servicio**.
        *   Haz clic en el botón **"Generar nueva clave privada"**. Se descargará un archivo JSON.
    *   **Añade la clave al archivo `.env.local`:** Abre el archivo JSON que descargaste, copia todo su contenido y pégalo en tu archivo `.env.local` dentro de comillas simples, de la siguiente manera:
        ```env
        FIREBASE_SERVICE_ACCOUNT_KEY='{
          "type": "service_account",
          "project_id": "emergenciagt",
          "private_key_id": "...",
          "private_key": "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n",
          "client_email": "...",
          "client_id": "...",
          "auth_uri": "...",
          "token_uri": "...",
          "auth_provider_x509_cert_url": "...",
          "client_x509_cert_url": "..."
        }'
        ```
        > **Importante:** El archivo `.env.local` nunca debe compartirse ni subirse a repositorios públicos como GitHub.

4.  **Ejecutar el Servidor de Desarrollo:** Una vez configurado, ejecuta el siguiente comando en tu terminal:
    ```bash
    npm run dev
    ```

5.  **Abrir la Aplicación:** Abre tu navegador web y visita **http://localhost:9002**. Verás el panel de administración listo para usar, conectado a tu base de datos de Firebase en la nube.

---

## 3. Arquitectura de la Solución

Esta sección cubre la arquitectura del software, la infraestructura del sistema y la arquitectura técnica.

### 3.1. Arquitectura General y de Software

La plataforma utiliza una arquitectura moderna basada en **Next.js** y **Firebase**, lo que garantiza escalabilidad, rendimiento y desarrollo rápido.

- **Frontend (App Móvil y Panel Web):** Ambas interfaces están construidas con Next.js (usando el App Router), React, TypeScript y Tailwind CSS para el estilo, con componentes pre-construidos de shadcn/ui.
- **Backend y Base de Datos (BaaS - Backend as a Service):** Firebase es el núcleo de la solución, proveyendo toda la infraestructura de backend de manera serverless.

### 3.2. Infraestructura del Sistema

La infraestructura es completamente serverless, alojada y gestionada por Google a través de Firebase:

- **Firebase Hosting:** Para el despliegue y servicio global (vía CDN) tanto de la PWA de los usuarios como del panel de administración.
- **Firebase Authentication:** Servicio gestionado para la autenticación segura de usuarios (email/contraseña, anónimo) y la gestión de roles mediante Custom Claims.
- **Firestore:** Base de datos NoSQL, serverless, distribuida globalmente y con capacidades de tiempo real.

### 3.3. Diagrama de Arquitectura

```
+--------------------------+        +--------------------------+
|      Aplicación Móvil    |        |  Panel de Administración |
| (Next.js PWA / React)    |        |   (Next.js / React)      |
+--------------------------+        +--------------------------+
           |                                  |
           | (HTTPS / WebSocket)              | (HTTPS / WebSocket)
           v                                  v
+-------------------------------------------------------------+
|              Infraestructura Google Cloud (Firebase)        |
|                                                             |
|  +------------------+   +------------------+   +-----------+  |
|  |   Authentication |   |    Firestore     |   |  Hosting  |  |
|  | (Usuarios, Roles)|   |  (Base de Datos) |   | (Despliegue)|
|  +------------------+   +------------------+   +-----------+  |
|                                                             |
+-------------------------------------------------------------+

```

### 3.4. Arquitectura Técnica Detallada

- **Next.js App Router:** Se utiliza el enrutador de aplicación de Next.js para una mejor organización de rutas y layouts anidados. Las rutas se dividen en grupos: `(admin)` para el panel y `(mobile)` para la PWA.
- **Componentes de Servidor y Cliente:** Se favorece el uso de Componentes de Servidor (`"use server"`) en Next.js para la lógica de negocio y las acciones que interactúan con Firebase Admin (ej: `users/actions.ts`), reduciendo la cantidad de JavaScript enviado al cliente. Los componentes interactivos (`"use client"`) se usan para la UI que requiere estado o eventos del navegador (ej: los dashboards).
- **Comunicación en Tiempo Real:** Se utiliza la función `onSnapshot` de Firestore para establecer listeners en tiempo real. Esto permite que el panel de administración reciba las nuevas alertas de emergencia instantáneamente sin necesidad de recargar la página.
- **Seguridad Basada en Reglas:** La seguridad no reside en el código del cliente, sino en las **Reglas de Seguridad de Firestore** (`firestore.rules`). Estas reglas definen en el servidor quién puede leer, escribir o actualizar cada documento, basándose en el rol (`admin`, `operator`) y el `stationId` del usuario, los cuales se almacenan en los **Custom Claims** del token de autenticación.

---

## 4. Modelo de Base de Datos (Firestore)

La base de datos está organizada en colecciones principales que separan las distintas entidades de la aplicación.

### Colección: `users`
- **Propósito:** Almacena perfiles de los usuarios del **Panel de Administración (Operadores y Administradores)**. Esta colección **NO** contiene datos de los usuarios de la aplicación móvil. Sirve para guardar metadatos que Firebase Authentication no puede almacenar, como la estación a la que pertenece un operador.
- **Estructura del Documento (ID = UID del usuario de Firebase Auth):**
  ```json
  {
    "uid": "string",            // ID de Firebase Authentication, para enlazar.
    "email": "string",          // Correo del operador/admin, para mostrarlo fácilmente.
    "role": "operator" | "admin", // Rol del usuario (aunque la fuente de verdad es el Custom Claim).
    "stationId": "string" | null, // ID de la estación a la que está asignado el operador.
    "createdAt": "Timestamp",   // Fecha de creación de la cuenta.
    "lastLogin": "Timestamp"    // Fecha del último inicio de sesión.
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
    "status": "new" | "assigned" | "en_route" | "on_scene" | "attending" | "transporting" | "patient_attended" | "resolved" | "cancelled",
    "cancellationReason": "string", // Opcional
    "assignedStationId": "string", // ID de la estación asignada
    "assignedStationName": "string" // Nombre de la estación asignada
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
    "createdAt": "Timestamp"
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

## 5. Diagrama de Procesos (Flujos de Lógica de Negocio)

Esta sección detalla los procesos clave que conectan la App Móvil, el Panel Web y Firebase.

### 5.1. Flujo de Generación de Alerta de Emergencia

Este es el flujo más crítico de la plataforma.

1.  **Activación (App Móvil - `src/app/dashboard/page.tsx`):**
    *   Un usuario (registrado o anónimo) abre la PWA y mantiene presionado el **Botón de Pánico** (`<PanicButton />` en `src/components/dashboard/PanicButton.tsx`).
    *   La activación requiere una pulsación sostenida de 2 segundos para prevenir falsas alarmas. Una barra de progreso visual indica el avance.

2.  **Geolocalización (App Móvil - `src/app/dashboard/page.tsx`):**
    *   Una vez completada la pulsación, la función `handleActivateEmergency` se dispara.
    *   Esta llama a `getUserLocation()`, que utiliza la API de geolocalización del navegador (`navigator.geolocation`) para obtener las coordenadas GPS exactas del usuario. Se manejan errores específicos si el usuario deniega el permiso o si la ubicación no está disponible.

3.  **Creación del Documento (Firestore - `src/app/dashboard/page.tsx`):**
    *   Si la geolocalización es exitosa, el sistema crea un nuevo documento en la colección `alerts` de Firestore.
    *   El documento se puebla con los siguientes datos:
        *   `id`: Un ID único generado por Firestore, que también se guarda dentro del documento para fácil referencia.
        *   `userId`: El UID del usuario de Firebase.
        *   `isAnonymous`: Un booleano (`true`/`false`) que indica si el usuario está en modo invitado.
        *   `location`: Un `GeoPoint` de Firestore con la latitud y longitud obtenidas.
        *   `status`: Se establece inicialmente en `"new"`.
        *   `timestamp`: Se utiliza `serverTimestamp()` para registrar la hora exacta del servidor.
    *   Al usuario se le muestra un modal (`<EmergencyModal />`) confirmando que la ayuda está en camino.

4.  **Recepción de la Alerta (Panel de Administración - `src/app/(admin)/dashboard/admin/page.tsx`):**
    *   El dashboard del panel (`AdminDashboardPage`) tiene un "listener" en tiempo real (`onSnapshot`) sobre la colección `alerts`.
    *   La función `fetchAlerts` es la encargada de establecer esta escucha.
    *   Cuando el nuevo documento se crea en el paso anterior, Firestore lo envía **automáticamente** y en tiempo real al panel de los administradores y operadores relevantes.
    *   La nueva alerta aparece instantáneamente en la parte superior de la lista de "Alertas de Emergencia" y como un nuevo marcador parpadeante en el mapa (`<AlertsMap />`).

5.  **Enriquecimiento de Datos (Panel de Administración - `src/app/(admin)/dashboard/admin/page.tsx`):**
    *   Dentro de la función `processAlerts`, si la alerta entrante no es anónima (`isAnonymous == false`), el sistema toma el `userId` de la alerta y realiza una consulta a la colección `medicalInfo` para buscar el documento con ese mismo ID.
    *   Si se encuentra, los datos médicos del usuario se adjuntan al objeto de la alerta en el estado del panel (`EnrichedAlert`). Esto permite que el operador, al hacer clic en la alerta, vea inmediatamente la información médica relevante del paciente en el modal `<AlertDetailModal />`.

### 5.2. Flujo de Gestión de Roles (Admin y Operator)

El sistema utiliza **Custom Claims** de Firebase Authentication para gestionar los roles, lo que proporciona una seguridad robusta a nivel de backend.

1.  **Registro por Defecto como "Operator" (`src/app/(admin)/login/page.tsx`):**
    *   Cuando un nuevo usuario se registra en el panel de administración, la función `handleRegister` crea una cuenta en Firebase Authentication y un documento en la colección `users` con el `role` por defecto de `'operator'`.
    *   Crucialmente, la cuenta de Auth **no tiene ningún claim especial** al inicio. El sistema lo considera `operator` por ausencia del claim `admin`.

2.  **Auto-Promoción del Primer Administrador (`src/app/(admin)/dashboard/users/actions.ts`):**
    *   El sistema está diseñado para resolver el problema de "quién crea al primer admin".
    *   La función de servidor `updateUser` contiene una lógica especial: si un usuario intenta asignarse a sí mismo el rol de `admin`, el sistema primero verifica si ya existe algún otro administrador en la base de datos (`admins.length === 0`).
    *   Si no existe **ningún otro administrador**, la operación se permite, y el usuario se convierte en el primer y único administrador.

3.  **Promoción por un Administrador Existente (`src/app/(admin)/dashboard/users/actions.ts`):**
    *   Una vez que existe al menos un administrador, la lógica anterior se desactiva.
    *   Ahora, para que un `operator` se convierta en `admin`, un administrador existente debe ir a la página "Usuarios" (`/dashboard/users`) y hacer clic en "Hacer Admin".
    *   La función `updateUser` verifica el `idToken` de la persona que hace la llamada. Solo permitirá la operación si el token contiene el claim `admin: true`.

4.  **Verificación de Rol en la Interfaz (`src/app/(admin)/layout.tsx`):**
    *   Cuando un usuario inicia sesión, el componente `AuthProvider` no solo verifica si está autenticado, sino que fuerza una actualización de su `idToken` (`currentUser.getIdTokenResult(true)`).
    *   Este token contiene los Custom Claims. El layout extrae el claim `admin` y lo guarda en el estado del contexto `AuthContext` (`userRole`).
    *   Componentes como `AdminDashboardPage` y `SettingsDropdown` usan el hook `useAuth()` para acceder a este rol y decidir si muestran (`userRole === 'admin'`) u ocultan (`userRole === 'operator'`) los botones de "Estaciones" y "Usuarios".

### 5.3. Flujo de Despacho y Asignación de Alertas (Admin/Operator)

Este flujo describe cómo las alertas se asignan a estaciones específicas y cómo los operadores ven solo lo que les corresponde.

1.  **Asignación de Operadores a Estaciones (Admin - `src/app/(admin)/dashboard/users/page.tsx`):**
    *   Un administrador va a la página de "Usuarios".
    *   Para cada usuario con rol de `operator`, aparece un menú desplegable (`<Select />`) con la lista de estaciones (leídas de la colección `stations`).
    *   El administrador selecciona una estación para el operador. Esta acción llama a la función `handleStationChange`, que a su vez invoca la acción de servidor `updateUser` en `actions.ts`.
    *   La función `updateUser` hace dos cosas:
        *   Establece el `stationId` en el documento del operador en la colección `users`.
        *   Añade un **Custom Claim** (`stationId`) al token de autenticación del operador. Este claim es la fuente de verdad para la seguridad.

2.  **Recepción y Asignación de Alertas (Admin - `src/components/admin/AlertDetailModal.tsx`):**
    *   Una nueva alerta llega al dashboard del administrador (que ve todas las alertas).
    *   El administrador hace clic en la alerta, abriendo el modal de detalles (`AlertDetailModal`).
    *   Dentro del modal, hay un menú desplegable "Asignar Estación". El administrador selecciona la estación y hace clic en "Asignar".
    *   La función `handleAssignStation` actualiza el documento de la alerta en la colección `alerts`, estableciendo los campos `assignedStationId` y `assignedStationName`, y cambiando el `status` a `'assigned'`.

3.  **Filtrado de Alertas por Operador (Operator - `src/app/(admin)/dashboard/admin/page.tsx`):**
    *   Un operador inicia sesión. El `AuthProvider` lee su `stationId` desde los Custom Claims del token y lo guarda en el contexto (`useAuth`).
    *   La función `fetchAlerts` en el dashboard usa el `stationId` del contexto. En lugar de pedir todas las alertas, construye su consulta a Firestore de la siguiente manera: `query(alertsRef, where("assignedStationId", "==", stationId), ...)`.
    *   Las reglas de seguridad de Firestore (`firestore.rules`) permiten esta consulta específica.
    *   Como resultado, el operador solo ve en su lista y en su mapa las alertas que han sido explícitamente asignadas a su estación.

---

## 6. Flujo Detallado por Estado de Alerta

Esta sección describe el propósito y el proceso de cada uno de los 9 estados que puede tener una alerta, desde su creación hasta su resolución.

### 6.1. Estado: `new` (Nueva)
- **Propósito:** Es el estado inicial. La alerta ha sido recibida pero no procesada.
- **Diagrama:**
  `[Usuario App] --(Botón de Pánico)--> [Sistema/Firestore] --(Crea doc. 'new')--> [Panel Admin]`
- **Descripción:**
  1.  **Usuario** presiona el botón de pánico en la aplicación móvil.
  2.  La **App Móvil** obtiene la geolocalización.
  3.  La **App Móvil** crea un nuevo documento en la colección `alerts` de Firestore con `status: 'new'`.
  4.  El **Panel de Administración** recibe la alerta en tiempo real y la muestra como "Nueva".

### 6.2. Estado: `assigned` (Asignada)
- **Propósito:** Un operador ha tomado la alerta y la ha asignado a una estación específica.
- **Diagrama:**
  `[Panel Admin] --(Selecciona Estación)--> [Sistema/Firestore] --(Actualiza doc. a 'assigned')--> [Panel Admin]`
- **Descripción:**
  1.  Un **Operador/Admin** ve la alerta "Nueva" en el panel.
  2.  Abre el modal de detalles de la alerta.
  3.  Selecciona una estación de la lista y hace clic en "Asignar".
  4.  El **Panel de Administración** envía la actualización a Firestore.
  5.  **Firestore** actualiza el estado del documento de la alerta a `status: 'assigned'` y guarda el `assignedStationId`.

### 6.3. Estado: `en_route` (En Ruta)
- **Propósito:** La unidad de emergencia (ambulancia, etc.) de la estación asignada ya está en camino.
- **Diagrama:**
  `[Unidad Emergencia] --(Notifica por Radio)--> [Operador] --(Actualiza en Panel)--> [Sistema/Firestore: 'en_route']`
- **Descripción:**
  1.  La **Unidad de Emergencia** confirma al operador (por radio, teléfono) que ha salido de la estación.
  2.  El **Operador** en el panel abre los detalles de la alerta.
  3.  Selecciona el nuevo estado "En Ruta" y lo guarda.
  4.  **Firestore** actualiza el documento a `status: 'en_route'`.

### 6.4. Estado: `on_scene` (En el Lugar)
- **Propósito:** La unidad de emergencia ha llegado al lugar del incidente.
- **Diagrama:**
  `[Unidad Emergencia] --(Confirma Llegada)--> [Operador] --(Actualiza en Panel)--> [Sistema/Firestore: 'on_scene']`
- **Descripción:**
  1.  La **Unidad de Emergencia** llega a la ubicación de la alerta y lo comunica al operador.
  2.  El **Operador** actualiza el estado en el panel a "En el Lugar".
  3.  **Firestore** actualiza el documento a `status: 'on_scene'`.

### 6.5. Estado: `attending` (Atendiendo)
- **Propósito:** Los paramédicos o bomberos están activamente atendiendo al paciente o la situación.
- **Diagrama:**
  `[Unidad Emergencia] --(Inicia Atención)--> [Operador] --(Actualiza en Panel)--> [Sistema/Firestore: 'attending']`
- **Descripción:**
  1.  El personal de la **Unidad de Emergencia** comienza los primeros auxilios o las maniobras necesarias.
  2.  Informan al **Operador** que la atención ha comenzado.
  3.  El **Operador** cambia el estado de la alerta a "Atendiendo" en el panel.
  4.  **Firestore** actualiza el documento a `status: 'attending'`.

### 6.6. Estado: `transporting` (Trasladando)
- **Propósito:** El paciente necesita ser llevado a un hospital y la unidad está en camino hacia allí.
- **Diagrama:**
  `[Unidad Emergencia] --(Inicia Traslado)--> [Operador] --(Actualiza en Panel)--> [Sistema/Firestore: 'transporting']`
- **Descripción:**
  1.  La **Unidad de Emergencia** decide que es necesario el traslado a un centro asistencial e inicia el viaje.
  2.  Notifica al **Operador** sobre el traslado.
  3.  El **Operador** actualiza el estado a "Trasladando" en el panel.
  4.  **Firestore** actualiza el documento a `status: 'transporting'`.

### 6.7. Estado: `patient_attended` (Atendido en Lugar)
- **Propósito:** El paciente fue atendido en el lugar y no necesitó traslado a un hospital. El servicio ha finalizado.
- **Diagrama:**
  `[Unidad Emergencia] --(Reporta Fin de Servicio)--> [Operador] --(Actualiza en Panel)--> [Sistema/Firestore: 'patient_attended']`
- **Descripción:**
  1.  La **Unidad de Emergencia** atiende al paciente en la escena y determina que no es necesario el traslado.
  2.  Informa al **Operador** que el servicio ha concluido en el lugar.
  3.  El **Operador** selecciona el estado "Atendido en Lugar" para cerrar el caso.
  4.  **Firestore** actualiza el documento a `status: 'patient_attended'`, finalizando la alerta.

### 6.8. Estado: `resolved` (Finalizada en Hospital)
- **Propósito:** La unidad llegó al hospital, entregó al paciente y el servicio ha concluido.
- **Diagrama:**
  `[Unidad Emergencia] --(Confirma Llegada a Hospital)--> [Operador] --(Actualiza en Panel)--> [Sistema/Firestore: 'resolved']`
- **Descripción:**
  1.  La **Unidad de Emergencia** que estaba en estado "Trasladando" llega al hospital.
  2.  Entrega al paciente y queda libre. Informa de esto al **Operador**.
  3.  El **Operador** selecciona el estado "Finalizada en Hospital" para cerrar el caso.
  4.  **Firestore** actualiza el documento a `status: 'resolved'`, finalizando la alerta.

### 6.9. Estado: `cancelled` (Cancelada)
- **Propósito:** La alerta se anula antes de ser completada.
- **Diagrama (Opción 1: Usuario):**
  `[Usuario App] --(Cancela Alerta)--> [Sistema/Firestore: 'cancelled']`
- **Diagrama (Opción 2: Operador):**
  `[Operador] --(Cancela en Panel)--> [Sistema/Firestore: 'cancelled']`
- **Descripción:**
  1.  **Opción 1:** El **Usuario** que creó la alerta la cancela desde su aplicación. La app actualiza el estado en Firestore a `status: 'cancelled'`.
  2.  **Opción 2:** Un **Operador** determina que la alerta es una falsa alarma o ya no es necesaria y la cancela manualmente desde el panel, especificando una razón. El panel actualiza el estado en Firestore a `status: 'cancelled'`.

---

## 7. Estructura de Archivos del Proyecto

El proyecto está organizado siguiendo las convenciones de Next.js App Router.

- **`src/app/`**
  - **`(admin)/`**: Grupo de rutas para todo el panel de administración.
    - **`dashboard/`**: Páginas protegidas del panel.
        - **`admin/page.tsx`**: El dashboard principal donde se listan y mapean las alertas.
        - **`analytics/page.tsx`**: Página con gráficos y KPIs (solo para admins).
        - **`stations/page.tsx`**: Página para CRUD de estaciones (solo para admins).
        - **`users/page.tsx`**: Página para gestionar roles y asignaciones de usuarios (solo para admins).
    - **`login/page.tsx`**: Página de inicio de sesión para operadores/administradores.
    - **`layout.tsx`**: **Layout de seguridad**. Envuelve todas las rutas de admin. Contiene el `AuthProvider` que verifica la sesión y los roles, protegiendo las rutas y proveyendo el contexto de autenticación.
  - **`(mobile)/`**: Grupo de rutas para la PWA del usuario final (implícito en las rutas raíz `/`).
    - **`auth/page.tsx`**: Página de registro/login/invitado para usuarios de la app.
    - **`dashboard/page.tsx`**: Panel principal del usuario con el botón de pánico.
    - **`alerts/page.tsx`**: Historial de alertas del usuario registrado.
    - **`medical-info/page.tsx`**: Formulario para que el usuario ingrese su información médica.
    - **`welcome/page.tsx`**: Página de bienvenida que se muestra después del registro.
    - **`page.tsx`**: Página raíz que redirige a `/auth` o `/dashboard` según el estado de la sesión.
- **`src/components/`**
  - **`admin/`**: Componentes específicos del panel de administración (ej: `AlertDetailModal`, `EditStationModal`, `AlertsMap`).
  - **`dashboard/`**: Componentes del dashboard del usuario móvil (ej: `PanicButton`, `EmergencyModal`).
  - **`ui/`**: Componentes de UI reutilizables de shadcn (Button, Card, etc.).
- **`src/lib/`**
  - **`firebase.ts`**: Configuración del SDK de cliente de Firebase para el navegador.
  - **`firebase-admin.ts`**: Configuración del SDK de Admin de Firebase para usar en Server Actions.
  - **`types.ts`**: Definiciones de tipos de TypeScript para la estructura de datos (AlertData, MedicalData, etc.).
- **`src/hooks/`**:
  - **`use-toast.ts`**: Hook personalizado para mostrar notificaciones (toasts).
- **`firestore.rules`**: **Archivo crítico** que define las reglas de seguridad de la base de datos Firestore, especificando quién puede leer, escribir o actualizar cada colección.
- **`next.config.ts`**: Configuración de Next.js.
- **`tailwind.config.ts`**: Configuración de Tailwind CSS y el tema de la aplicación.
