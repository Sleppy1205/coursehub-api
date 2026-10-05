<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# CourseHub API Persistente

API desarrollada en NestJS con TypeORM y PostgreSQL para la gestión persistente de cursos, estudiantes y matrículas.

## Descripción

CourseHub API integra los módulos de **Courses**, **Students** y **Enrollments** (matrículas). Toda la información se administra de forma persistente en una base de datos **PostgreSQL**, garantizando la integridad referencial y aplicando restricciones de clave única.

## Requisitos Previos

* Node.js v18+
* PostgreSQL v14+
* npm o yarn

## Variables de Entorno

Copia el archivo `.env.example` a `.env` en la raíz del proyecto y configura tus credenciales de PostgreSQL:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_contraseña_aqui
DB_NAME=coursehub
```

> **Nota:** El archivo `.env` está excluido del control de versiones mediante `.gitignore` por seguridad.

## Instalación y Ejecución

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar en modo desarrollo
npm run start:dev

# 3. Compilar para producción
npm run build
npm run start:prod
```

## Endpoints Principales

### 1. Cursos (`/courses`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/courses` | Lista todos los cursos (filtro opcional `?level=`) |
| GET | `/courses/:id` | Obtiene el detalle de un curso |
| POST | `/courses` | Crea un nuevo curso |
| PATCH | `/courses/:id` | Actualiza un curso existente |
| DELETE | `/courses/:id` | Elimina un curso |

### 2. Estudiantes (`/students`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/students` | Lista estudiantes (filtro opcional `?career=`) |
| GET | `/students/:id` | Obtiene un estudiante por ID |
| POST | `/students` | Crea un estudiante (valida correo único) |
| PATCH | `/students/:id` | Actualiza un estudiante |
| DELETE | `/students/:id` | Elimina un estudiante |
| PATCH | `/students/:id/toggle-status` | Activa o inactiva a un estudiante |

### 3. Matrículas (`/enrollments`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/enrollments` | Matricula un estudiante activo en un curso |
| GET | `/enrollments` | Lista matrículas (filtros opcionales `studentId` y `courseId`) |
| DELETE | `/enrollments/:id` | Cancela una matrícula existente |

## Casos de Uso y Respuestas HTTP

### 1. Registrar matrícula válida (`POST /enrollments`)

```jsonc
// Body:
{ "studentId": 1, "courseId": 1 }

// Respuesta 201 Created:
{
  "id": 1,
  "student": { "id": 1, "name": "Juan Pérez", "email": "juan@example.com", "isActive": true },
  "course": { "id": 1, "title": "NestJS Básico", "level": "intermediate" }
}
```

### 2. Matrícula duplicada (`POST /enrollments`)

```jsonc
// Respuesta 409 Conflict:
{
  "statusCode": 409,
  "message": "El estudiante ya se encuentra matriculado en este curso",
  "error": "Conflict"
}
```

### 3. Estudiante inactivo (`POST /enrollments`)

```jsonc
// Respuesta 400 Bad Request:
{
  "statusCode": 400,
  "message": "El estudiante se encuentra inactivo",
  "error": "Bad Request"
}
```

### 4. Recurso inexistente (`POST /enrollments`)

```jsonc
// Respuesta 404 Not Found:
{
  "statusCode": 404,
  "message": "Estudiante con ID 999 no encontrado",
  "error": "Not Found"
}
```

## Licencia

Este proyecto está bajo la Licencia MIT.