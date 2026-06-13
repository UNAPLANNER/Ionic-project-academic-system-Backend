# API Contracts — Sistema Académico

**Base URL:** `http://localhost:3000/api`

## Headers comunes

```
Authorization: Bearer {firebase_id_token}
Content-Type: application/json
```

---

## Modelos de Datos

### User
```typescript
{
  id: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  name: string;
}
```

### Student
```typescript
{
  id: string;
  name: string;
  email: string;
  career: string | null;
  semester: number | null;   // positivo
  createdAt: Date;
}
```

### Course
```typescript
{
  id: string;
  name: string;
  code: string;
  teacherId: string;
  credits: number;
  schedule: string;
  students?: string[];        // IDs de estudiantes inscritos
  totalStudents?: number;
}
```

### Evaluation
```typescript
{
  id: string;
  studentId: string;
  courseId: string;
  type: 'exam' | 'assignment' | 'project';
  score: number;             // no puede superar maxScore
  maxScore: number;
  date: Date;
  description: string;
}
```

### TeacherSummary
```typescript
{
  id: string;
  name: string;
  email: string;
  role: 'teacher';
}
```

### DashboardMetrics
```typescript
{
  totalStudents: number;
  totalCourses: number;
  totalEvaluations: number;
  averageScore: number;
  atRiskCount: number;       // estudiantes con promedio < 60
}
```

### CoursePerformance
```typescript
{
  courseId: string;
  courseName: string;
  averageScore: number;
  totalStudents: number;
}
```

---

## Códigos de Error Globales

| Código | Significado |
|--------|-------------|
| `400` | Validación fallida / campos faltantes |
| `401` | Token ausente o inválido |
| `403` | Rol sin permisos suficientes |
| `404` | Recurso no encontrado |
| `500` | Error interno del servidor |

---

### POST `/api/auth/login`

**Request**
```json
{
  "email": "admin@academico.com",
  "password": "123456"
}
```

**Response 200**
```json
{
  "message": "Login exitoso",
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uid_firebase_abc123",
    "email": "admin@academico.com",
    "role": "admin",
    "name": "Carlos Admin"
  }
}
```

**Errores**
- `400` — email o password faltantes
- `401` — credenciales inválidas
- `500` — error de servidor

---

### POST `/api/auth/register`

**Request**
```json
{
  "email": "juan.perez@academico.com",
  "password": "securepass",
  "name": "Juan Pérez",
  "role": "student"
}
```

> `role`: `"admin"` | `"teacher"` | `"student"` · `password` mínimo 6 caracteres

**Response 201**
```json
{
  "message": "Usuario registrado exitosamente",
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uid_firebase_xyz789",
    "email": "juan.perez@academico.com",
    "role": "student",
    "name": "Juan Pérez"
  }
}
```

**Errores**
- `400` — campos faltantes / rol inválido / password menor a 6 caracteres
- `500` — error de servidor

---

## Students — `/api/students`

> Auth requerida: Bearer token

| Método | Endpoint | Roles permitidos |
|--------|----------|-----------------|
| `GET` | `/students` | admin, teacher, student |
| `GET` | `/students/:id` | admin, teacher, student |
| `POST` | `/students` | admin |
| `PUT` | `/students/:id` | admin |
| `DELETE` | `/students/:id` | admin |

### GET `/api/students`

**Response 200**
```json
[
  {
    "id": "student_001",
    "name": "Ana García",
    "email": "ana.garcia@uni.edu",
    "career": "Ingeniería de Sistemas",
    "semester": 4,
    "createdAt": "2024-03-01T10:00:00.000Z"
  },
  {
    "id": "student_002",
    "name": "Luis Martínez",
    "email": "luis.martinez@uni.edu",
    "career": "Administración",
    "semester": 2,
    "createdAt": "2024-03-05T08:30:00.000Z"
  }
]

```
---

### GET `/api/students/:id`

**Response 200**
```json
{
  "id": "student_001",
  "name": "Ana García",
  "email": "ana.garcia@uni.edu",
  "career": "Ingeniería de Sistemas",
  "semester": 4,
  "createdAt": "2024-03-01T10:00:00.000Z"
}
```

**Errores**
- `404` — estudiante no encontrado

---

### POST `/api/students`

**Campos requeridos:** `name`, `email`, `career`, `semester` (número positivo)

**Request**
```json
{
  "name": "María López",
  "email": "maria.lopez@uni.edu",
  "career": "Psicología",
  "semester": 3
}
```

**Response 201**
```json
{
  "id": "student_003",
  "name": "María López",
  "email": "maria.lopez@uni.edu",
  "career": "Psicología",
  "semester": 3,
  "createdAt": "2025-01-15T09:00:00.000Z"
}
```

**Errores**
- `400` — campos faltantes / semester no es número positivo

---

### PUT `/api/students/:id`

**Request** (campos a actualizar)
```json
{
  "semester": 4,
  "career": "Psicología Clínica"
}
```

**Response 200** — Student actualizado

---

### DELETE `/api/students/:id`

**Response 200**
```json
{ "message": "Estudiante eliminado correctamente" }
```

---

## Teachers — `/api/users/teachers`

> Auth: Bearer token · Rol requerido: **admin**

| Método | Endpoint | Body | Response |
|--------|----------|------|----------|
| `GET` | `/users/teachers` | — | `TeacherSummary[]` |
| `POST` | `/users/teachers` | `{ name, email, password }` | `TeacherSummary` |

### GET `/api/users/teachers`

**Response 200**
```json
[
  {
    "id": "teacher_001",
    "name": "Dr. Roberto Silva",
    "email": "r.silva@uni.edu",
    "role": "teacher"
  },
  {
    "id": "teacher_002",
    "name": "Lic. Patricia Gómez",
    "email": "p.gomez@uni.edu",
    "role": "teacher"
  }
]
```

---

### POST `/api/users/teachers`

> `password` mínimo 6 caracteres

**Request**
```json
{
  "name": "Ing. Marco Ruiz",
  "email": "m.ruiz@uni.edu",
  "password": "securepass"
}
```

**Response 201**
```json
{
  "id": "teacher_003",
  "name": "Ing. Marco Ruiz",
  "email": "m.ruiz@uni.edu",
  "role": "teacher"
}
```

---

## Courses — `/api/courses`

> Auth: Bearer token

| Método | Endpoint | Roles permitidos |
|--------|----------|-----------------|
| `GET` | `/courses` | admin (todos) · teacher (sus cursos) · student (inscritos) |
| `GET` | `/courses/:id` | admin, teacher, student |
| `POST` | `/courses` | admin |
| `PUT` | `/courses/:id` | admin, teacher (solo sus propios cursos) |
| `PUT` | `/courses/:id/students` | admin |
| `PUT` | `/courses/:id/teacher` | admin |
| `DELETE` | `/courses/:id` | admin |
| `GET` | `/courses/:courseId/students` | admin, teacher |

**Campos requeridos (POST):** `name`, `code`, `credits`, `schedule` · `teacherId` es opcional

### GET `/api/courses`

**Response 200**
```json
[
  {
    "id": "course_001",
    "name": "Bases de Datos",
    "code": "BD-301",
    "teacherId": "teacher_001",
    "credits": 4,
    "schedule": "Lunes y Miércoles 10:00-12:00",
    "students": ["student_001", "student_002"],
    "totalStudents": 2
  }
]
```

---

### POST `/api/courses`

**Request**
```json
{
  "name": "Programación Web",
  "code": "PW-201",
  "credits": 3,
  "schedule": "Martes y Jueves 14:00-16:00",
  "teacherId": "teacher_002"
}
```

**Response 201** — Course creado

---

### PUT `/api/courses/:id/students`

> Reemplaza la lista completa de inscritos (deduplicado automáticamente)

**Request**
```json
{
  "students": ["student_001", "student_002", "student_003"]
}
```

**Response 200** — Course con lista actualizada

---

### PUT `/api/courses/:id/teacher`

**Request**
```json
{
  "teacherId": "teacher_002"
}
```

**Response 200** — Course con nuevo profesor asignado

---

### GET `/api/courses/:courseId/students`

**Response 200** — `Student[]` inscritos en el curso

---

## Evaluations — `/api/evaluations`

> **Nota:** actualmente sin middleware de autenticación (sin token requerido). Deuda técnica pendiente.

| Método | Endpoint | Body | Response |
|--------|----------|------|----------|
| `GET` | `/evaluations` | — | `Evaluation[]` |
| `GET` | `/evaluations/student/:studentId` | — | `{ evaluations, average }` |
| `POST` | `/evaluations` | `Partial<Evaluation>` | `Evaluation` |
| `PUT` | `/evaluations/:id` | `Partial<Evaluation>` | `Evaluation` |
| `DELETE` | `/evaluations/:id` | — | `void` |

**Restricción:** `score` no puede superar `maxScore`
**`type`:** `"exam"` | `"assignment"` | `"project"`

### GET `/api/evaluations`

**Response 200**
```json
[
  {
    "id": "eval_001",
    "studentId": "student_001",
    "courseId": "course_001",
    "type": "exam",
    "score": 85,
    "maxScore": 100,
    "date": "2025-01-20T00:00:00.000Z",
    "description": "Primer parcial"
  }
]
```

---

### GET `/api/evaluations/student/:studentId`

**Response 200**
```json
{
  "evaluations": [
    {
      "id": "eval_001",
      "studentId": "student_001",
      "courseId": "course_001",
      "type": "exam",
      "score": 85,
      "maxScore": 100,
      "date": "2025-01-20T00:00:00.000Z",
      "description": "Primer parcial"
    },
    {
      "id": "eval_002",
      "studentId": "student_001",
      "courseId": "course_001",
      "type": "assignment",
      "score": 92,
      "maxScore": 100,
      "date": "2025-01-25T00:00:00.000Z",
      "description": "Tarea 1 - Modelado ER"
    }
  ],
  "average": 88.5
}
```

---

### POST `/api/evaluations`

**Request**
```json
{
  "studentId": "student_001",
  "courseId": "course_001",
  "type": "project",
  "score": 90,
  "maxScore": 100,
  "date": "2025-02-10T00:00:00.000Z",
  "description": "Proyecto final - Sistema de inventario"
}
```

**Response 201** — Evaluation creada

**Errores**
- `400` — `score` supera `maxScore` / `type` inválido / campos faltantes

---

### PUT `/api/evaluations/:id`

**Request** (campos a actualizar)
```json
{
  "score": 95,
  "description": "Proyecto final - Versión corregida"
}
```

**Response 200** — Evaluation actualizada

---

## Dashboard — `/api/dashboard`

> **Nota:** actualmente sin middleware de autenticación (sin token requerido). Deuda técnica pendiente.

| Método | Endpoint | Response |
|--------|----------|----------|
| `GET` | `/dashboard/metrics` | `DashboardMetrics` |
| `GET` | `/dashboard/performance` | `CoursePerformance[]` |

### GET `/api/dashboard/metrics`

**Response 200**
```json
{
  "totalStudents": 45,
  "totalCourses": 8,
  "totalEvaluations": 120,
  "averageScore": 76.4,
  "atRiskCount": 7
}
```

> `atRiskCount` = estudiantes con promedio < 60

---

### GET `/api/dashboard/performance`

**Response 200**
```json
[
  {
    "courseId": "course_001",
    "courseName": "Bases de Datos",
    "averageScore": 82.3,
    "totalStudents": 18
  },
  {
    "courseId": "course_002",
    "courseName": "Cálculo I",
    "averageScore": 61.7,
    "totalStudents": 25
  },
  {
    "courseId": "course_003",
    "courseName": "Programación Web",
    "averageScore": 88.0,
    "totalStudents": 12
  }
]
```

---

## Mock Data Completo

### Usuarios de prueba

```json
[
  { "email": "admin@academico.com",   "password": "admin123",   "role": "admin",   "name": "Carlos Admin" },
  { "email": "r.silva@uni.edu",       "password": "teacher123", "role": "teacher", "name": "Dr. Roberto Silva" },
  { "email": "ana.garcia@uni.edu",    "password": "student123", "role": "student", "name": "Ana García" }
]
```

### Cursos de prueba

```json
[
  { "name": "Bases de Datos",    "code": "BD-301", "credits": 4, "schedule": "Lun-Mié 10:00-12:00", "teacherId": "teacher_001" },
  { "name": "Cálculo I",         "code": "MAT-101","credits": 4, "schedule": "Mar-Jue 08:00-10:00", "teacherId": "teacher_001" },
  { "name": "Programación Web",  "code": "PW-201", "credits": 3, "schedule": "Mar-Jue 14:00-16:00", "teacherId": "teacher_002" }
]
```

### Evaluaciones de prueba

```json
[
  { "studentId": "student_001", "courseId": "course_001", "type": "exam",       "score": 85, "maxScore": 100, "description": "Primer parcial" },
  { "studentId": "student_001", "courseId": "course_001", "type": "assignment", "score": 92, "maxScore": 100, "description": "Tarea 1 - Modelado ER" },
  { "studentId": "student_001", "courseId": "course_001", "type": "project",    "score": 90, "maxScore": 100, "description": "Proyecto final" },
  { "studentId": "student_002", "courseId": "course_001", "type": "exam",       "score": 55, "maxScore": 100, "description": "Primer parcial" },
  { "studentId": "student_002", "courseId": "course_002", "type": "exam",       "score": 48, "maxScore": 100, "description": "Primer parcial Cálculo" }
]
```
