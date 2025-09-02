
# EmergenciaGT - Documentación del Proyecto

## 1. Visión General del Proyecto

**EmergenciaGT** es una plataforma de respuesta a emergencias diseñada para conectar a ciudadanos en Guatemala con los servicios de primera respuesta (bomberos, paramédicos) de manera rápida y eficiente. La solución consta de dos componentes principales: una Aplicación Web Progresiva (PWA) para usuarios finales y un Panel de Administración web para operadores y administradores del servicio.

- **El Problema:** Reducir el tiempo de respuesta ante emergencias y proporcionar a los socorristas información vital del paciente antes de llegar a la escena.
- **La Solución:** Una plataforma centralizada que utiliza geolocalización en tiempo real, perfiles médicos de usuario y un sistema de despacho de alertas para optimizar la gestión de emergencias.

---

## 2. Instalación y Ejecución Local

Para trabajar en el proyecto desde tu computadora, sigue estos pasos detallados.

### 2.1. Prerrequisitos

Solo necesitas tener una cosa instalada en tu sistema antes de empezar:

-   **[Node.js](https://nodejs.org/en):** Es el entorno que ejecuta el código de la aplicación. Descarga e instala la versión **LTS**, que es la más estable y recomendada. Al instalar Node.js, se instala automáticamente `npm` (Node Package Manager), que es la herramienta que usaremos para gestionar las librerías del proyecto.

### 2.2. Pasos de Instalación

1.  **Descargar el Código:**
    *   Utiliza la opción "Descargar ZIP" en la interfaz de Firebase Studio.
    *   Descomprime el archivo `.zip` en una carpeta de fácil acceso en tu computadora (por ejemplo, en tu Escritorio). La carpeta que se cree al descomprimir (probablemente llamada `emergenciagt`) será la **raíz del proyecto**.

    > **Visualización de la Estructura de Carpetas:**
    > Una vez descomprimido, tu proyecto se verá así. **La carpeta raíz es `emergenciagt`**:
    > ```
    > emergenciagt/       <-- Esta es la carpeta RAÍZ del proyecto.
    > ├── node_modules/   <-- (Se crea automáticamente con `npm install`)
    > ├── public/
    > ├── src/            <-- (Aquí vive todo el código fuente)
    > ├── .env.local      <-- (Tú creas este archivo para la clave de Firebase)
    > ├── package.json    <-- (Este archivo es clave para los comandos de npm)
    > ├── README.md
    > └── ... y otros archivos de configuración.
    > ```

2.  **Instalar Dependencias:**
    *   Abre una terminal o línea de comandos (En Windows: PowerShell, CMD; En Mac/Linux: Terminal).
    *   Asegúrate de que estás en la **carpeta raíz del proyecto** (`emergenciagt`). **No dentro de la carpeta `src`**.
    *   Ejecuta el siguiente comando. Este comando leerá el archivo `package.json` y descargará todas las librerías y herramientas que el proyecto necesita.
    ```bash
    npm install
    ```
    > **Nota:** Este comando no crea archivos sueltos. Su principal trabajo es crear una nueva carpeta llamada **`node_modules`** en la raíz de tu proyecto. Si ves esa carpeta, ¡el comando funcionó!

3.  **Configurar Variables de Entorno (Clave de Admin):**
    *   Este es el paso más importante para que las funciones de administrador (gestionar usuarios, estaciones) funcionen en tu PC. Necesitas darle a tu aplicación local una "llave" para que Firebase sepa que tiene permisos de administrador.
    *   **Crea un archivo:** En la **raíz del proyecto**, crea un nuevo archivo llamado `.env.local`.
    *   **Obtén tu clave de servicio de Firebase:**
        *   Ve a la [Consola de Firebase](https://console.firebase.google.com/).
        *   Selecciona tu proyecto `emergenciagt`.
        *   Haz clic en el ícono de engranaje (Configuración) y ve a **Configuración del proyecto**.
        *   Ve a la pestaña **Cuentas de servicio**.
        *   Haz clic en el botón **"Generar nueva clave privada"**. Se descargará un archivo JSON.
    *   **Añade la clave al archivo `.env.local`:**
        *   Abre el archivo JSON que descargaste con un editor de texto (como el Bloc de Notas o VS Code).
        *   Copia **todo** su contenido.
        *   Pega ese contenido en tu archivo `.env.local` y envuélvelo en comillas simples, de la siguiente manera:

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
        > **Importante:** El archivo `.env.local` es para secretos. **Nunca** debe compartirse ni subirse a repositorios públicos como GitHub. El sistema ya está configurado para ignorarlo.

4.  **Ejecutar el Servidor de Desarrollo:**
    *   Una vez todo configurado, ejecuta el siguiente comando en tu terminal (estando aún en la carpeta raíz):
    ```bash
    npm run dev
    ```
    *   Este comando inicia un servidor web local. Verás un mensaje en la terminal indicando que el servidor está listo, usualmente en `http://localhost:9002`.

5.  **Abrir la Aplicación:**
    *   Abre tu navegador web y visita **http://localhost:9002**.
    *   Verás el panel de administración listo para usar, conectado a tu base de datos de Firebase en la nube. Cualquier cambio que hagas (como crear una estación) se reflejará en la base de datos real.

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
    "role": "operator" | "admin" | "unit", // Rol del usuario (aunque la fuente de verdad es el Custom Claim).
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
    "assignedStationName": "string", // Nombre de la estación asignada
    "assignedUnitId": "string", // ID de la unidad (ej: "Ambulancia A-123")
    "assignedUnitName": "string" // Nombre de la unidad asignada
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
    - **Ruta:** `stations/{stationId}/unidades/{unitId}`
    - **Propósito:** Unidades (ambulancias, camiones) pertenecientes a una estación.
    - **Estructura del Documento (ID = ID de la unidad):**
      ```json
      {
        "nombre": "string",        // ej: "Ambulancia A-123"
        "tipo": "Ambulancia" | "etc...",
        "disponible": "boolean",
        "uid": "string"            // UID del usuario de Auth que representa a esta unidad.
      }
      ```

---

## 5. Diagrama de Procesos (Flujos de Lógica de Negocio)

Esta sección detalla los procesos clave que conectan la App Móvil, el Panel Web y Firebase.

### 5.1. Flujo de Generación de Alerta de Emergencia

Este es el flujo más crítico de la plataforma, con dos variantes principales dependiendo del tipo de usuario.

#### **Flujo para Usuario Registrado (con sesión iniciada)**

Este es el caso ideal, ya que permite asociar la alerta con la información médica del usuario.

1.  **Inicio y Autenticación:**
    *   El usuario abre la aplicación.
    *   La app detecta una sesión activa de Firebase y redirige al usuario al dashboard (`/dashboard`).
    *   El sistema carga en segundo plano los datos médicos del usuario desde la colección `medicalInfo` usando el UID del usuario.

2.  **Activación de Alerta:**
    *   El usuario mantiene presionado el **Botón de Pánico** (`<PanicButton />`) durante 2 segundos.

3.  **Geolocalización:**
    *   La app solicita y obtiene las coordenadas GPS del dispositivo del usuario.

4.  **Creación de Alerta en Firestore:**
    *   Se crea un nuevo documento en la colección `alerts`.
    *   El documento contiene:
        *   `userId`: El UID del usuario de Firebase.
        *   `isAnonymous`: `false`.
        *   `location`: Las coordenadas obtenidas.
        *   `status`: Se establece inicialmente en `"new"`.
        *   `type`: El tipo de emergencia ("Pánico General", "Incendio", etc.).

5.  **Notificación al Usuario:**
    *   Se muestra un modal (`<EmergencyModal />`) confirmando que la ayuda está en camino.

6.  **Recepción en Panel de Administración:**
    *   El panel, que escucha en tiempo real, recibe la nueva alerta.
    *   El sistema detecta que `isAnonymous` es `false`, por lo que toma el `userId` de la alerta y **automáticamente busca** en la colección `medicalInfo` el documento correspondiente.
    *   La alerta se "enriquece" con los datos médicos, que se muestran al operador en el modal de detalles (`<AlertDetailModal />`).

#### **Flujo para Usuario Anónimo (Invitado)**

Este flujo permite a cualquier persona reportar una emergencia sin necesidad de crear una cuenta.

1.  **Inicio y Autenticación Anónima:**
    *   El usuario abre la aplicación.
    *   En la pantalla de login (`/auth`), selecciona la opción "Ingresar como Invitado".
    *   Firebase crea una **sesión anónima** temporal para el dispositivo. El usuario es redirigido al dashboard.

2.  **Activación de Alerta:**
    *   El usuario mantiene presionado el **Botón de Pánico**.

3.  **Geolocalización:**
    *   La app obtiene las coordenadas GPS del dispositivo.

4.  **Creación de Alerta en Firestore:**
    *   Se crea un nuevo documento en la colección `alerts`.
    *   El documento contiene:
        *   `userId`: El UID temporal del usuario anónimo.
        *   `isAnonymous`: `true`.
        *   `location`: Las coordenadas obtenidas.
        *   `status`: `"new"`.
        *   `type`: El tipo de emergencia.

5.  **Notificación al Usuario:**
    *   Se muestra el modal (`<EmergencyModal />`) confirmando que la ayuda está en camino.

6.  **Recepción en Panel de Administración:**
    *   El panel recibe la nueva alerta.
    *   El sistema detecta que `isAnonymous` es `true`.
    *   **No se realiza ninguna búsqueda de información médica.**
    *   La alerta se muestra en el panel como "Usuario Anónimo" y los campos de datos médicos aparecen como "No disponible".

### 5.2. Flujo de Gestión de Roles (Admin, Operator y Unit)

El sistema utiliza **Custom Claims** de Firebase Authentication para gestionar los roles, lo que proporciona una seguridad robusta a nivel de backend.

1.  **Registro por Defecto como "Operator" (`src/app/(admin)/login/page.tsx`):**
    *   Cuando un nuevo usuario se registra en el panel de administración, la función `handleRegister` crea una cuenta en Firebase Authentication y un documento en la colección `users` con el `role` por defecto de `'operator'`.
    *   Crucialmente, la cuenta de Auth **no tiene ningún claim especial** al inicio. El sistema lo considera `operator` por ausencia de los claims `admin` o `unit`.

2.  **Promoción de Roles por un Administrador (`src/app/(admin)/dashboard/users/page.tsx`):**
    *   Un administrador existente debe ir a la página "Usuarios" (`/dashboard/users`).
    *   Ahí, puede cambiar el rol de cualquier usuario a `admin`, `operator` o `unit` usando un menú desplegable.
    *   La función de servidor `updateUser` verifica que quien hace la llamada sea un administrador y luego aplica los Custom Claims correspondientes al usuario objetivo (`admin: true`, `unit: true`, o ninguno para `operator`).

3.  **Auto-Promoción del Primer Administrador (`src/app/(admin)/dashboard/users/actions.ts`):**
    *   Para evitar un bloqueo inicial, si no existe ningún administrador en el sistema, el primer usuario que se asigne a sí mismo el rol de `admin` tendrá éxito.

4.  **Verificación de Rol en la Interfaz (`src/app/(admin)/layout.tsx`):**
    *   Cuando un usuario inicia sesión, el `AuthProvider` lee sus Custom Claims. El rol (`admin`, `operator`, `unit`) y `stationId` se almacenan en el `AuthContext`.
    *   La interfaz se adapta dinámicamente:
        *   Los **admins** ven todos los menús (Analíticas, Estaciones, Usuarios).
        *   Los **operators** solo ven el dashboard de alertas filtrado por su estación.
        *   Las **units** serán redirigidas a una interfaz especial de misión.

### 5.3. Flujo de Despacho y Gestión en Campo (Unidad)

Este flujo describe cómo una alerta es manejada por el personal de emergencia en el campo.

1.  **Asignación a la Unidad (Admin/Operator):**
    *   Una nueva alerta llega al panel. El operador la abre y, en lugar de asignar solo una estación, ahora puede seleccionar una **unidad específica** (ej: "Ambulancia 123") de esa estación.
    *   Al asignar, el documento de la alerta en Firestore se actualiza con `assignedUnitId` y el `status` cambia a `'assigned'`.

2.  **Recepción de la Misión (Unidad):**
    *   El personal de la "Ambulancia 123" tiene sesión iniciada en una tablet o móvil.
    *   Su interfaz, que estaba en espera, recibe la nueva alerta asignada en tiempo real.
    *   La pantalla se actualiza mostrando un "Perfil de Misión" con:
        *   Detalles de la emergencia (tipo, info del paciente).
        *   Un mapa con la ruta desde su ubicación hasta el incidente.
        *   Botones de acceso directo para "Navegar con Waze / Google Maps".
        *   Una botonera para actualizar el estado del servicio.

3.  **Actualización desde el Campo (Unidad):**
    *   La unidad sale de la estación y su personal presiona el botón **`En Ruta`** en su pantalla.
    *   Al llegar, presionan **`En el Lugar`**.
    *   Mientras atienden al paciente, presionan **`Atendiendo`**.
    *   Si lo trasladan, presionan **`Trasladando`**.
    *   Cada vez que presionan un botón, el `status` del documento de la alerta en Firestore se actualiza instantáneamente.

4.  **Sincronización con el Panel:**
    *   El operador en la central ve los cambios de estado en el panel de administración en tiempo real. Esto reduce la necesidad de comunicación constante por radio para actualizaciones de estado, permitiendo que la comunicación se centre en lo crítico.

5.  **Finalización del Servicio (Unidad):**
    *   La unidad finaliza el servicio presionando **`Atendido en Lugar`** o **`Finalizada en Hospital`**.
    *   La misión desaparece de su pantalla, y la unidad queda marcada como "disponible" para la siguiente emergencia.

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
- **Propósito:** Un operador ha tomado la alerta y la ha asignado a una estación o unidad específica.
- **Diagrama:**
  `[Panel Admin] --(Selecciona Unidad)--> [Sistema/Firestore] --(Actualiza doc. a 'assigned')--> [Panel Unidad]`
- **Descripción:**
  1.  Un **Operador/Admin** ve la alerta "Nueva" en el panel.
  2.  Abre el modal de detalles de la alerta.
  3.  Selecciona una unidad de emergencia de la lista.
  4.  El **Panel de Administración** actualiza el documento de la alerta con el `assignedUnitId` y el estado a `status: 'assigned'`.
  5.  La **Interfaz de la Unidad** recibe la misión en tiempo real.

### 6.3. Estado: `en_route` (En Ruta)
- **Propósito:** La unidad de emergencia ha salido de la estación y está en camino.
- **Diagrama:**
  `[Panel Unidad] --(Botón 'En Ruta')--> [Sistema/Firestore: 'en_route'] --> [Panel Admin]`
- **Descripción:**
  1.  El personal de la **Unidad** presiona el botón "En Ruta" en su dispositivo.
  2.  **Firestore** actualiza el documento a `status: 'en_route'`.
  3.  El **Panel de Administración** refleja el cambio de estado en tiempo real.

### 6.4. Estado: `on_scene` (En el Lugar)
- **Propósito:** La unidad de emergencia ha llegado al lugar del incidente.
- **Diagrama:**
  `[Panel Unidad] --(Botón 'En el Lugar')--> [Sistema/Firestore: 'on_scene'] --> [Panel Admin]`
- **Descripción:**
  1.  La **Unidad de Emergencia** llega y presiona "En el Lugar".
  2.  **Firestore** actualiza el documento a `status: 'on_scene'`.
  3.  El **Panel de Administración** refleja el cambio.

### 6.5. Estado: `attending` (Atendiendo)
- **Propósito:** Los paramédicos o bomberos están activamente atendiendo al paciente o la situación.
- **Diagrama:**
  `[Panel Unidad] --(Botón 'Atendiendo')--> [Sistema/Firestore: 'attending'] --> [Panel Admin]`
- **Descripción:**
  1.  El personal de la **Unidad** comienza a trabajar y presiona "Atendiendo".
  2.  **Firestore** actualiza el documento a `status: 'attending'`.
  3.  El **Panel de Administración** refleja el cambio.

### 6.6. Estado: `transporting` (Trasladando)
- **Propósito:** El paciente necesita ser llevado a un hospital y la unidad está en camino hacia allí.
- **Diagrama:**
  `[Panel Unidad] --(Botón 'Trasladando')--> [Sistema/Firestore: 'transporting'] --> [Panel Admin]`
- **Descripción:**
  1.  La **Unidad** inicia el traslado y presiona "Trasladando".
  2.  **Firestore** actualiza el documento a `status: 'transporting'`.
  3.  El **Panel de Administración** refleja el cambio.

### 6.7. Estado: `patient_attended` (Atendido en Lugar)
- **Propósito:** El paciente fue atendido en el lugar y no necesitó traslado. El servicio ha finalizado.
- **Diagrama:**
  `[Panel Unidad] --(Botón 'Atendido en Lugar')--> [Sistema/Firestore: 'patient_attended']`
- **Descripción:**
  1.  La **Unidad** concluye el servicio en la escena y presiona "Atendido en Lugar".
  2.  **Firestore** actualiza el documento a `status: 'patient_attended'`, finalizando la alerta.
  3.  La misión se cierra en el **Panel de la Unidad** y en el **Panel de Administración**.

### 6.8. Estado: `resolved` (Finalizada en Hospital)
- **Propósito:** La unidad llegó al hospital, entregó al paciente y el servicio ha concluido.
- **Diagrama:**
  `[Panel Unidad] --(Botón 'Finalizada en Hospital')--> [Sistema/Firestore: 'resolved']`
- **Descripción:**
  1.  La **Unidad** entrega al paciente en el hospital y presiona "Finalizada en Hospital".
  2.  **Firestore** actualiza el documento a `status: 'resolved'`, finalizando la alerta.
  3.  La misión se cierra en ambos paneles.

### 6.9. Estado: `cancelled` (Cancelada)
- **Propósito:** La alerta se anula antes de ser completada.
- **Diagrama (Opción 1: Usuario):**
  `[Usuario App] --(Cancela Alerta)--> [Sistema/Firestore: 'cancelled']`
- **Diagrama (Opción 2: Operador):**
  `[Operador] --(Cancela en Panel)--> [Sistema/Firestore: 'cancelled']`
- **Descripción:**
  1.  **Opción 1:** El **Usuario** que creó la alerta la cancela desde su aplicación.
  2.  **Opción 2:** Un **Operador** la cancela manualmente desde el panel.

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
