
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
    "status": "new" | "dispatched" | "resolved" | "cancelled",
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

## 4. Flujos de Interacción y Lógica de Negocio

Esta sección detalla los procesos clave que conectan la App Móvil, el Panel Web y Firebase.

### 4.1. Flujo de Generación de Alerta de Emergencia

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
    *   La función `fetchAlerts` es la encargada de establecer esta escucha, construyendo la consulta de forma diferente según el rol del usuario.
    *   Cuando el nuevo documento se crea en el paso anterior, Firestore lo envía **automáticamente** y en tiempo real al panel de los administradores y operadores relevantes.
    *   La nueva alerta aparece instantáneamente en la parte superior de la lista de "Alertas de Emergencia" y como un nuevo marcador parpadeante en el mapa (`<AlertsMap />`).

5.  **Enriquecimiento de Datos (Panel de Administración - `src/app/(admin)/dashboard/admin/page.tsx`):**
    *   Dentro de la función `processAlerts`, si la alerta entrante no es anónima (`isAnonymous == false`), el sistema toma el `userId` de la alerta y realiza una consulta a la colección `medicalInfo` para buscar el documento con ese mismo ID.
    *   Si se encuentra, los datos médicos del usuario se adjuntan al objeto de la alerta en el estado del panel (`EnrichedAlert`). Esto permite que el operador, al hacer clic en la alerta, vea inmediatamente la información médica relevante del paciente en el modal `<AlertDetailModal />`.

### 4.2. Flujo de Gestión de Roles (Admin y Operator)

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

### 4.3. Flujo de Despacho y Asignación de Alertas (Admin/Operator)

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
    *   La función `handleAssignStation` actualiza el documento de la alerta en la colección `alerts`, estableciendo los campos `assignedStationId` y `assignedStationName`, y cambiando el `status` a `'dispatched'`.

3.  **Filtrado de Alertas por Operador (Operator - `src/app/(admin)/dashboard/admin/page.tsx`):**
    *   Un operador inicia sesión. El `AuthProvider` lee su `stationId` desde los Custom Claims del token y lo guarda en el contexto (`useAuth`).
    *   La función `fetchAlerts` en el dashboard usa el `stationId` del contexto. En lugar de pedir todas las alertas, construye su consulta a Firestore de la siguiente manera: `query(alertsRef, where("assignedStationId", "==", stationId), ...)`.
    *   Las reglas de seguridad de Firestore (`firestore.rules`) permiten esta consulta específica.
    *   Como resultado, el operador solo ve en su lista y en su mapa las alertas que han sido explícitamente asignadas a su estación.

---

## 5. Estructura de Archivos del Proyecto

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
- **`src/lib/`**:
  - **`firebase.ts`**: Configuración del SDK de cliente de Firebase para el navegador.
  - **`firebase-admin.ts`**: Configuración del SDK de Admin de Firebase para usar en Server Actions.
  - **`types.ts`**: Definiciones de tipos de TypeScript para la estructura de datos (AlertData, MedicalData, etc.).
- **`src/hooks/`**:
  - **`use-toast.ts`**: Hook personalizado para mostrar notificaciones (toasts).
- **`firestore.rules`**: **Archivo crítico** que define las reglas de seguridad de la base de datos Firestore, especificando quién puede leer, escribir o actualizar cada colección.
- **`next.config.ts`**: Configuración de Next.js.
- **`tailwind.config.ts`**: Configuración de Tailwind CSS y el tema de la aplicación.

---

## 6. Plan de QA (Casos de Prueba Clave)

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
|                              | 2. La nueva alerta aparece en tiempo real en el panel del administrador.              | La alerta es visible en la lista y en el mapa del panel web.                               |
|                              | 3. Asignar la alerta a una estación desde el panel de admin.                             | La alerta se actualiza en Firestore y desaparece de los paneles de otros operadores.      |
|                              | 4. El operador de la estación asignada ve la nueva alerta en su panel en tiempo real.   | La alerta aparece inmediatamente en el panel del operador correcto.                       |
|                              | 5. Cancelar una alerta desde el modal de la app.                                     | El estado de la alerta en Firestore cambia a "cancelled".                                 |

---

## 7. PRD (Documento de Requisitos del Producto)

### 7.1. Resumen

EmergenciaGT es una plataforma integral que agiliza la comunicación y la respuesta en situaciones de emergencia, sirviendo tanto a ciudadanos como a los equipos de primera respuesta.

### 7.2. Funcionalidades de la Aplicación Móvil (PWA)

- **F1. Autenticación de Usuario:** Los usuarios pueden crear una cuenta con email/contraseña o ingresar como invitados (anónimos) para un uso rápido.
- **F2. Botón de Pánico:** Un botón prominente que, al ser presionado de forma sostenida, envía una alerta con la geolocalización del usuario a la central.
- **F3. Perfil Médico:** Los usuarios registrados pueden almacenar información médica vital (tipo de sangre, alergias, condiciones, contactos) para asistir a los socorristas.
- **F4. Historial de Alertas:** Los usuarios registrados pueden ver un historial de sus alertas pasadas y el estado de cada una.
- **F5. Cancelación de Alerta:** Los usuarios pueden cancelar una alerta recién creada si fue una falsa alarma o si la situación se resolvió.

### 7.3. Funcionalidades del Panel de Administración

- **F6. Dashboard en Tiempo Real:** Los operadores y administradores ven un resumen de KPIs y una lista/mapa de alertas. Los administradores ven todas las alertas, mientras que los operadores solo ven las asignadas a su estación.
- **F7. Gestión y Despacho de Alertas (Admin):** Los administradores pueden ver los detalles de una alerta, incluyendo datos médicos, y asignarla a una estación específica para su despacho. Pueden actualizar su estado (`new`, `dispatched`, `resolved`, `cancelled`).
- **F8. Gestión de Estaciones (Admin):** Los administradores pueden crear, leer, actualizar y eliminar estaciones de emergencia.
- **F9. Gestión de Roles y Asignaciones (Admin):** Los administradores pueden ver la lista de operadores, promoverlos a `admin`, y asignar cada `operator` a una estación de bomberos específica.

### 7.4. Requisitos No Funcionales

- **Rendimiento:** La aplicación debe ser rápida y responsiva. La creación y recepción de una alerta debe ser casi instantánea.
- **Seguridad:** El acceso a funciones administrativas y a los datos de las alertas debe estar estrictamente controlado por roles y asignación de estación.
- **Usabilidad:** La interfaz, especialmente el botón de pánico y el flujo de despacho, debe ser simple e intuitiva.
- **Escalabilidad:** La solución basada en Firebase debe poder soportar un aumento en el número de usuarios, estaciones y alertas.
