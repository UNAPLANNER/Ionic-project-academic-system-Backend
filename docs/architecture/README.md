# Arquitectura del Sistema Académico

## 1. Diagrama de Arquitectura

### Backend (Express + Firebase)

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTES                                 │
│                                                                 │
│   ┌─────────────────────┐      ┌──────────────────────────┐     │
│   │   Ionic + Angular   │      │  Capacitor (iOS/Android) │     │
│   │   localhost:8100    │      │     App nativa movil     │     │
│   └──────────┬──────────┘      └────────────┬─────────────┘     │
└──────────────┼──────────────────────────────┼───────────────────┘
               │         HTTP / REST           │
               └──────────────┬───────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                   BACKEND — Express.js :3000                    │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  CORS Middleware                          │  │
│  │  localhost:8100 | :8101 | :4200 | capacitor:// | ionic:// │  │
│  └──────────────────────────┬─────────────────────────────┘     │
│                              │                                  │
│  ┌───────────────────────────▼──────────────────────────────┐   │
│  │                    auth.middleware.js                     │  │
│  │         verifyToken (Firebase ID Token)  +  checkRole    │   │
│  └──────┬──────────┬──────────┬──────────┬──────────┬───────┘   │
│         │          │          │          │          │           │
│  ┌──────▼──┐ ┌─────▼───┐ ┌───▼────┐ ┌───▼───┐ ┌───▼───────┐     │
│  │  /auth  │ │/students│ │/courses│ │/users │ │/evaluations│    │
│  │  Routes │ │ Routes  │ │ Routes │ │ Routes│ │  /dashboard│    │
│  └──────┬──┘ └─────┬───┘ └───┬────┘ └───┬───┘ └───┬───────┘     │
│         │          │          │          │          │           │
│  ┌──────▼──┐ ┌─────▼───┐ ┌───▼────┐ ┌───▼───┐ ┌───▼───────┐     │
│  │  auth.  │ │students.│ │courses.│ │users. │ │evaluation.│     │
│  │  ctrl   │ │  ctrl   │ │  ctrl  │ │ ctrl  │ │ dashboard │     │
│  └──────┬──┘ └─────┬───┘ └───┬────┘ └───┬───┘ └───┬───────┘     │
│         │          │          │          │          │           │
│  ┌──────▼──┐ ┌─────▼───┐ ┌───▼────┐ ┌───▼───┐ ┌───▼───────┐     │
│  │  user   │ │student  │ │ course │ │  user │ │evaluation │     │
│  │  model  │ │  model  │ │  model │ │ model │ │   model   │     │
│  └──────┬──┘ └─────┬───┘ └───┬────┘ └───┬───┘ └───┬───────┘     │
└─────────┼──────────┼──────────┼──────────┼──────────┼───────────┘
          └──────────┴──────────┴──────────┴──────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                    FIREBASE (Google Cloud)                      │
│                                                                 │
│   ┌──────────────────────┐      ┌────────────────────────────┐  │
│   │    Firebase Auth     │      │         Firestore          │  │
│   │  - verifyIdToken()   │      │  - users (roles)           │  │
│   │  - signOut           │      │  - students                │  │
│   │  - createUser        │      │  - courses                 │  │
│   └──────────────────────┘      │  - evaluations             │  │
│                                 └────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Frontend / Mobile (Ionic + Angular + Capacitor)

```
┌─────────────────────────────────────────────────────────────────┐
│              Ionic / Angular App (Capacitor)                    │
│                                                                 │
│   AppModule / AppComponent                                      │
│         └── AppRoutingModule                                    │
│                    │                                            │
│         ┌──────────┴──────────┐                                 │
│         │      Auth Module    │                                 │
│         │  LoginPage          │                                 │
│         │  RegisterPage       │                                 │
│         └──────────┬──────────┘                                 │
│                    │ Guards: authGuard · roleGuard              │
│         ┌──────────┼─────────────────────────┐                  │
│         │          │                          │                 │
│  ┌──────▼──┐ ┌─────▼──────┐  ┌───────────────▼──┐               │
│  │  Admin  │ │  Teacher   │  │     Student       │              │
│  │  Tabs   │ │   Tabs     │  │      Tabs         │              │
│  │─────────│ │────────────│  │───────────────────│              │
│  │Dashboard│ │ Dashboard  │  │  Dashboard        │              │
│  │Teachers │ │ Courses    │  │  Courses          │              │
│  │Students │ │ Students   │  │  EvaluationList   │              │
│  │Courses  │ │ EvalList   │  └───────────────────┘              │
│  └─────────┘ │ EvalForm   │                                     │
│              └────────────┘                                     │
│                                                                 │
│   Core Services                   State / Storage               │
│   ┌──────────────────────┐        ┌──────────────────────┐      │
│   │ AuthService          │        │ localStorage          │     │
│   │  - currentUser$      │        │  - auth_user          │     │
│   │  - BehaviorSubject   │        │  - auth_token         │     │
│   │  - JWT Token         │        └──────────────────────┘      │
│   ├──────────────────────┤                                      │
│   │ ApiService           │        Capacitor Plugins             │
│   │  - HTTP Client       │        ┌──────────────────────┐      │
│   │  - Bearer Token      │        │   Push Notifications │      │
│   ├──────────────────────┤        │   Haptics            │      │
│   │ StudentService       │        │   Status Bar         │      │
│   │  - RxJS Observables  │        └──────────────────────┘      |
│   └──────────────────────┘                                      │
└─────────────────────────────────────────────────────────────────┘
         │
         │  HTTP REST   Authorization: Bearer {token}
         ▼
   Backend :3000/api
```

---

## 2. Explicación de Capas

### Capa de Transporte (CORS + Express)
Entry point en [src/index.js](../../src/index.js). Configura CORS explícitamente para cada origen permitido (Ionic dev, Angular dev, Capacitor iOS/Android), parsea JSON y monta las rutas bajo el prefijo `/api`.

### Capa de Middleware
[src/middleware/auth.middleware.js](../../src/middleware/auth.middleware.js) tiene dos responsabilidades:
- **`verifyToken`** — extrae el Bearer token del header, lo valida con `firebase-admin` (`auth.verifyIdToken`), y luego consulta Firestore para obtener el rol del usuario, ya que Firebase Auth no usa custom claims en este proyecto.
- **`checkRole(...roles)`** — factory que genera un middleware de autorización RBAC; recibe los roles permitidos y compara con `req.user.role`.

### Capa de Rutas
Cada recurso tiene su archivo en [src/routes/](../../src/routes/). Las rutas aplican los middlewares selectivamente por método HTTP (ej: GET abierto a más roles, POST/PUT/DELETE solo a admin).

### Capa de Controladores
Ubicados en [src/controllers/](../../src/controllers/). Contienen la lógica de negocio: leen de Firestore, aplican validaciones de dominio, y retornan las respuestas HTTP. No acceden directamente al cliente HTTP.

### Capa de Modelos / Validación
[src/models/](../../src/models/) definen la forma de los datos y las reglas de validación (campos requeridos, tipos, rangos). Son funciones puras invocadas desde los controladores.

### Capa de Datos (Firebase)
[src/config/firebase.js](../../src/config/firebase.js) inicializa `firebase-admin` con credenciales de variable de entorno y exporta las instancias `db` (Firestore) y `auth` (Firebase Auth). Toda la persistencia pasa por aquí.

---

## 3. Decisiones Técnicas

| Decisión | Alternativa considerada | Razón |
|---|---|---|
| Roles almacenados en Firestore (`users/{uid}.role`) | Firebase Custom Claims | Los custom claims requieren regenerar el token; Firestore permite cambiar el rol sin forzar re-login |
| Sin token requerido en `/evaluations` y `/dashboard` | Auth en todos los endpoints | Decisión de sprint; identificado como deuda técnica a corregir |
| `PUT /courses/:id/students` reemplaza lista completa | PATCH incremental | Simplicidad de implementación en cliente móvil; Firestore actualiza el array completo de `students[]` |
| `score` validado ≤ `maxScore` en modelo | Solo validación en cliente | Garantiza integridad de datos sin depender del frontend |
| CORS con lista blanca explícita | `cors({ origin: '*' })` | Necesario para soportar `capacitor://localhost` y `ionic://localhost` en producción nativa |

---

## 4. Justificación de Tecnologías

### Express.js 5.x
Framework minimalista que se ajusta al alcance del proyecto. La versión 5 incluye manejo asíncrono de errores nativo en rutas (sin necesidad de `try/catch` explícito en cada handler). Suficiente para una API REST de uso interno sin requerimientos de alta concurrencia.

### Firebase Admin SDK + Firestore
- **Firebase Auth** delega toda la gestión de sesiones (creación de usuarios, emisión de tokens, revocación) evitando implementar lógica de autenticación propia.
- **Firestore** es una base de datos NoSQL orientada a documentos, ideal para el modelo de datos del sistema (estudiantes, cursos, evaluaciones) donde los documentos son relativamente independientes y las consultas no requieren JOINs complejos.
- La infraestructura es completamente serverless desde el punto de vista del backend; no se administran instancias de base de datos.

### Ionic + Angular + Capacitor (Frontend)
- **Ionic** provee componentes UI optimizados para móvil con soporte nativo iOS/Android desde una sola base de código.
- **Angular** ofrece un sistema de módulos con lazy loading, inyección de dependencias y `BehaviorSubject` de RxJS para estado reactivo, adecuado para una app con tres roles de usuario distintos.
- **Capacitor** permite empaquetar la app web como aplicación nativa y acceder a plugins del dispositivo (cámara, notificaciones push, haptics) sin abandonar el stack web.

### nodemon (dev)
Reinicio automático del servidor al detectar cambios en archivos `.js`, acelerando el ciclo de desarrollo local sin configuración adicional.

### dotenv
Externaliza las credenciales de Firebase fuera del código fuente. Las variables de entorno requeridas son: `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_CLIENT_ID`.
