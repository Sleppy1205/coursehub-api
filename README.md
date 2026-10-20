<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# CourseHub API Persistente

API desarrollada en NestJS con TypeORM y PostgreSQL para la gestión persistente de cursos, estudiantes y matrículas.

## Descripción

CourseHub API integra los módulos de **Courses**, **Students** y **Enrollments** (matrículas). Toda la información se administra de forma persistente en una base de datos **PostgreSQL**, garantizando la integridad referencial y aplicando restricciones de clave única.

## Requisitos Previos

* Node.js v20 o superior ([descargas oficiales](https://nodejs.org/en/download/)); verifica con `node --version`.
* PostgreSQL v14 o superior ([instaladores oficiales](https://www.postgresql.org/download/)); verifica con `psql --version`.
* npm (incluido con Node.js) o yarn.

## Variables de Entorno

Copia `.env.example` a `.env` en la raíz del proyecto y configura tus credenciales locales. En PowerShell:

```powershell
Copy-Item .env.example .env
```

```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=replace-with-your-local-password
DB_NAME=coursehub
```

`NODE_ENV` acepta `development`, `test` o `production` (predeterminado: `development`). `PORT` (3000) y `DB_PORT` (5432) deben ser puertos válidos. `DB_HOST`, `DB_NAME`, un usuario (`DB_USER`) y `DB_PASSWORD` son obligatorios; para compatibilidad, `DB_USERNAME` sigue aceptándose si no se define `DB_USER`. Se permite contraseña vacía fuera de producción; en producción debe ser no vacía. La aplicación valida estas variables antes de abrir la conexión y nombra los valores faltantes o inválidos en el error de arranque.

> **Seguridad:** `.env` está excluido del control de versiones mediante `.gitignore`. El archivo versionado `.env.example` solo contiene valores de ejemplo; reemplaza la contraseña ficticia en tu `.env` local y nunca publiques credenciales reales.

Para comprobar el fallo temprano sin modificar archivos, en PowerShell define temporalmente un valor inválido y luego quítalo:

```powershell
$env:DB_PORT = 'not-a-number'
npm run start:dev
Remove-Item Env:DB_PORT
```

Para comprobar un puerto distinto, configura `PORT=3001` en tu `.env`, inicia la aplicación y verifica, por ejemplo, `GET http://localhost:3001/courses`.

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

## Autenticación y registro seguro

La API permite registrar cuentas y comprobar credenciales. La contraseña se guarda como hash de `bcrypt`; nunca se almacena ni se devuelve en texto plano.

### `POST /auth/register`

```http
POST /auth/register
Content-Type: application/json

{
  "email": "ana@example.com",
  "password": "miPasswordSegura123"
}
```

Respuesta exitosa (`201 Created`):

```json
{
  "id": 1,
  "email": "ana@example.com",
  "createdAt": "2026-10-19T12:00:00.000Z"
}
```

Reglas:

- El correo se normaliza a minúsculas y se valida con `@IsEmail()`.
- La contraseña debe tener al menos 8 caracteres y no superar los 72 bytes que admite bcrypt por operación.
- Si el correo ya existe, la API responde `409 Conflict`.
- La base mantiene una restricción única para el correo; si dos registros simultáneos colisionan, PostgreSQL también se traduce a `409 Conflict` sin exponer detalles internos.
- El valor `passwordHash` se guarda en la base, no la contraseña en texto plano.

### `POST /auth/login`

```http
POST /auth/login
Content-Type: application/json

{
  "email": "ana@example.com",
  "password": "miPasswordSegura123"
}
```

Si las credenciales son correctas, responde `200 OK` con `id`, `email` y `createdAt`. Si el correo no está registrado o la contraseña no coincide, ambos casos responden `401 Unauthorized` con el mismo mensaje (`Invalid credentials`). El email debe tener formato válido y la contraseña debe tener al menos 8 caracteres y no superar los 72 bytes que admite bcrypt; un cuerpo inválido responde `400 Bad Request`. El endpoint solo comprueba credenciales: no crea una sesión ni emite JWT, y todavía no decide qué acciones puede realizar el usuario.

La consulta de inicio de sesión carga `passwordHash` explícitamente solo para comparar con `bcrypt.compare`. Las consultas normales no seleccionan ese campo (`select: false`), y tanto el registro como el login construyen una respuesta segura en vez de devolver la entidad.

Para probar localmente, primero registra una cuenta de práctica con `POST /auth/register` y usa esos mismos datos en `/auth/login`. No guardes contraseñas reales en colecciones HTTP compartidas.

## TypeORM por ambiente

La conexión PostgreSQL se construye con `ConfigService` y las variables validadas: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME`. Las entidades se cargan mediante `autoLoadEntities` a partir de `TypeOrmModule.forFeature` en los módulos de cursos, estudiantes y matrículas.

La sincronización automática del esquema se activa únicamente con `NODE_ENV=development`. En `production` y `test` se mantiene desactivada; no se ejecutan migraciones automáticamente en esta etapa. Para producción, configura las variables en el entorno seguro del servicio de despliegue y planifica migraciones revisadas antes de cambiar el esquema. Nunca copies el `.env` local a producción ni compartas sus secretos.

Para comprobar la política sin desplegar y sin usar una base ajena, conserva las credenciales de tu base local en `.env` y, en PowerShell, inicia una instancia de prueba en otro puerto:

```powershell
$env:NODE_ENV = 'production'
$env:PORT = '3001'
npm run start:dev
```

La conexión sigue apuntando a la base local indicada por `.env`, pero `synchronize` queda desactivado porque `NODE_ENV` del proceso prevalece sobre el archivo. Detén el servidor con `Ctrl+C` y restaura las variables temporales:

```powershell
Remove-Item Env:NODE_ENV
Remove-Item Env:PORT
```

Para volver al modo de desarrollo, ejecuta `npm run start:dev` sin sobrescribir `NODE_ENV` (el valor de `.env.example` es `development`).

## Lista de comprobación de Etapa 2

| Aspecto | Verificación |
| --- | --- |
| Relaciones | `POST /enrollments` acepta una matrícula válida, rechaza duplicados y no permite matricular estudiantes inactivos. |
| Consultas | `GET /courses?page=1&limit=5&sortBy=id&order=ASC` pagina cursos; `GET /enrollments?search=ana&activeOnly=true&page=1&limit=5` combina búsqueda, estado y paginación. |
| Configuración | Host, puerto, base, usuario y contraseña se leen de `ConfigService`; no están codificados en TypeScript. |
| Ambientes | Las pruebas de `database.config.spec.ts` comprueban sincronización en desarrollo y que está desactivada en producción y pruebas. |
| Reproducibilidad y seguridad | `.env.example` se puede copiar a `.env`; `.env` está ignorado y no se debe entregar ni compartir. |

Ejecuta las verificaciones automatizadas relevantes con:

```bash
npm test -- src/config/ src/courses/ src/enrollments/ src/students/
npm run build
```

La colección [coursehub-demo.http](./requests/coursehub-demo.http) contiene la secuencia integradora, incluidas solicitudes de creación de cursos y estudiantes, matrícula, consulta después de reiniciar, duplicado, estudiante inactivo, paginación, búsqueda combinada y validación `400`. Antes de repetirla, cambia `demoTag` a un valor único y actualiza `courseId`, `activeStudentId` e `inactiveStudentId` con los IDs devueltos en las respuestas de creación. Las solicitudes de creación deben ejecutarse individualmente; después de crear cada estudiante, copia su ID a la variable correspondiente antes de continuar.

## Endpoints Principales

### 1. Cursos (`/courses`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/courses` | Lista cursos con filtros, paginación y orden (`level`, `page`, `limit`, `sortBy`, `order`) |
| GET | `/courses/:id` | Obtiene el detalle de un curso |
| POST | `/courses` | Crea un nuevo curso |
| PATCH | `/courses/:id` | Actualiza un curso existente |
| DELETE | `/courses/:id` | Elimina un curso |

### 2. Estudiantes (`/students`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/students` | Lista estudiantes (filtros opcionales `career`, `semester` e `isActive`) |
| GET | `/students/:id` | Obtiene un estudiante por ID |
| POST | `/students` | Crea un estudiante (valida correo único) |
| PATCH | `/students/:id` | Actualiza un estudiante |
| DELETE | `/students/:id` | Elimina un estudiante |
| PATCH | `/students/:id/toggle-status` | Activa o inactiva a un estudiante |

### 3. Matrículas (`/enrollments`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/enrollments` | Matricula un estudiante activo en un curso |
| GET | `/enrollments` | Busca y pagina matrículas con filtros `search`, `studentId`, `courseId` y `activeOnly` |
| DELETE | `/enrollments/:id` | Cancela una matrícula existente |

### Buscar matrículas con filtros y paginación

`GET /enrollments` acepta `search` (coincidencia parcial y sin distinguir mayúsculas en el nombre del estudiante o título del curso), `studentId`, `courseId`, `activeOnly=true|false`, `page` y `limit`. La página predeterminada es 1 y el límite predeterminado es 10, con máximo de 50. Los IDs deben ser enteros positivos dentro del rango de PostgreSQL. Los datos de estudiante y curso se incluyen en cada matrícula. La respuesta incluye `items` y `meta` (`total`, `page`, `limit` y `totalPages`); una página sin resultados responde `200` con `items: []`.

```http
GET /enrollments?search=nest&activeOnly=true&page=1&limit=5
```

Otros ejemplos:

```http
GET /enrollments?studentId=1&courseId=2
GET /enrollments?search=ana&page=2&limit=10
GET /enrollments?search=sin-coincidencias&page=1&limit=5
```

```json
{
  "items": [
    {
      "id": 4,
      "student": {
        "id": 1,
        "name": "Ana",
        "email": "ana@example.com",
        "age": 21,
        "career": "Software Engineering",
        "semester": 4,
        "isActive": true
      },
      "course": { "id": 2, "title": "NestJS Básico", "level": "beginner" }
    }
  ],
  "meta": { "total": 1, "page": 1, "limit": 5, "totalPages": 1 }
}
```

La búsqueda se envía como parámetro del `QueryBuilder` (`:search`), no se concatena en SQL. Una búsqueda sin coincidencias responde `200` con `items: []` y metadatos en cero.

### Listar cursos con filtros y paginación

`GET /courses` usa `page=1`, `limit=10`, `sortBy=id` y `order=ASC` de forma predeterminada. El límite máximo es 50; los campos permitidos para ordenar son `id`, `title` y `level`. Si hay valores iguales en el campo elegido, los resultados se desempatan por `id` ascendente.

```http
GET /courses?level=beginner&page=2&limit=5&sortBy=title&order=ASC
```

Otros ejemplos:

```http
GET /courses
GET /courses?page=1&limit=5&sortBy=title&order=ASC
GET /courses?page=2&limit=5&sortBy=title&order=ASC
GET /courses?level=beginner&page=1&limit=5
```

La respuesta siempre tiene `items` y `meta`; `total` cuenta todos los cursos que cumplen el filtro, no solo los de esta página:

```json
{
  "items": [
    { "id": 8, "title": "NestJS Básico", "level": "beginner" }
  ],
  "meta": {
    "total": 8,
    "page": 2,
    "limit": 5,
    "totalPages": 2
  }
}
```

Valores inválidos como `page=0`, `limit=200`, `sortBy=createdAt` u `order=sideways` responden `400 Bad Request`.

### Demostración práctica

La colección [coursehub-demo.http](./requests/coursehub-demo.http) contiene seis solicitudes para crear cursos de demostración y consultas consecutivas de páginas, filtro por nivel, búsqueda de matrículas, combinación con estudiante activo y paginación, parámetro inválido y búsqueda sin coincidencias. Ejecútala con una extensión compatible con archivos `.http`; configura `studentId`, `courseId` y `searchTerm` con una matrícula existente asociada a un estudiante activo. Las páginas consecutivas usan idénticos `sortBy` y `order`; compara los IDs para comprobar que no se repiten.

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