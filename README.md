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
JWT_SECRET=replace-with-a-long-random-local-secret
JWT_EXPIRES_IN=15m
CORS_ORIGINS=http://localhost:5173
```

`NODE_ENV` acepta `development`, `test` o `production` (predeterminado: `development`). `PORT` (3000) y `DB_PORT` (5432) deben ser puertos válidos. `DB_HOST`, `DB_NAME`, un usuario (`DB_USER`) y `DB_PASSWORD` son obligatorios; para compatibilidad, `DB_USERNAME` sigue aceptándose si no se define `DB_USER`. Se permite contraseña vacía fuera de producción; en producción debe ser no vacía. `JWT_SECRET` es obligatorio y debe tener al menos 32 caracteres; genera un valor aleatorio solo para tu `.env` local y no uses el marcador de `.env.example` como secreto. `JWT_EXPIRES_IN` define la duración del token y usa `15m` por defecto. `CORS_ORIGINS` es una lista separada por comas de orígenes exactos (por defecto local: `http://localhost:5173`); no admite `*`, y en producción es obligatorio usar orígenes `https://`. La aplicación valida estas variables antes de abrir la conexión y nombra las variables faltantes o inválidas sin imprimir sus valores.

> **Seguridad:** `.env` está excluido del control de versiones mediante `.gitignore`. El archivo versionado `.env.example` solo contiene valores de ejemplo; reemplaza la contraseña ficticia en tu `.env` local y nunca publiques credenciales reales.

> **HTTPS/TLS:** `http://localhost` se permite solo para desarrollo. Toda comunicación con una instalación de producción debe usar HTTPS; configura la terminación TLS en el proxy inverso, balanceador o plataforma de despliegue. JWT y demás secretos solo se configuran mediante el entorno seguro del despliegue, nunca en el repositorio. Un JWT firmado no está cifrado: por HTTP podría ser interceptado y reutilizado.

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
- El entorno requiere `JWT_SECRET` (mínimo 32 caracteres) y `JWT_EXPIRES_IN`, por ejemplo `15m`.

### `POST /auth/login`

```http
POST /auth/login
Content-Type: application/json

{
  "email": "ana@example.com",
  "password": "miPasswordSegura123"
}
```

Si las credenciales son correctas, responde `200 OK` con `accessToken` y el usuario seguro (`id`, `email`, `role`, `createdAt`). Si el correo no está registrado o la contraseña no coincide, ambos casos responden `401 Unauthorized` con el mismo mensaje (`Invalid credentials`). El email debe tener formato válido y la contraseña debe tener al menos 8 caracteres y no superar los 72 bytes que admite bcrypt; un cuerpo inválido responde `400 Bad Request`. El token es una credencial firmada, no cifrada: no lo compartas ni lo guardes en el repositorio.

La consulta de inicio de sesión carga `passwordHash` explícitamente solo para comparar con `bcrypt.compare`. Luego se firma un `accessToken` con el payload mínimo `{ sub, email, role }` y se responde con ese token y el usuario seguro. Las consultas normales no seleccionan ese campo (`select: false`), y tanto el registro como el login construyen una respuesta segura en vez de devolver la entidad.

Para probar localmente, primero registra una cuenta de práctica con `POST /auth/register` y usa esos mismos datos en `/auth/login`. No guardes contraseñas reales en colecciones HTTP compartidas.

### Verificar el token: `GET /auth/me`

La ruta requiere un access token válido en el encabezado `Authorization` con esquema Bearer:

```http
GET /auth/me
Authorization: Bearer <accessToken>
```

Responde con `id`, `email` y `role` cuando la firma y expiración son válidas; sin token, con token inválido o expirado responde `401 Unauthorized`. La verificación se realiza mediante Passport y una estrategia JWT; el guard deja en `req.user` solo la identidad segura `{ id, email, role }`.

### Roles, permisos y propiedad (Sesión 19)

`User.role` es un enum (`admin`, `teacher`, `student`) cuyo valor predeterminado es `student`. El registro público no acepta un rol del cliente; solo un operador debe asignar roles de práctica directamente en la base local. En desarrollo, TypeORM sincroniza la nueva columna porque `synchronize` está habilitado. Antes de desplegar en producción hay que crear y revisar una migración para la columna enum `role` y `courses.createdByUserId`; la sincronización está desactivada en producción.

Para preparar tres cuentas ya registradas en tu base local, reemplaza los correos de ejemplo por los correos de las cuentas de práctica:

```sql
UPDATE users SET role = 'admin' WHERE email = LOWER('admin-practice@example.test');
UPDATE users SET role = 'teacher' WHERE email = LOWER('teacher-practice@example.test');
UPDATE users SET role = 'student' WHERE email = LOWER('student-practice@example.test');
```

Los tokens incluyen el rol leído al iniciar sesión. Después de cambiar un rol, vuelve a iniciar sesión para obtener un token actualizado y deja de usar el anterior. No hay endpoint HTTP para cambiar roles.

| Ruta | Política |
| --- | --- |
| `POST /auth/register`, `POST /auth/login` | Pública |
| `GET /auth/me` | JWT válido |
| `POST /courses` | JWT y rol `admin` o `teacher`; guarda `createdByUserId` desde la identidad autenticada |
| `PATCH /courses/:id` | JWT y rol `admin` o `teacher`; admin puede editar cualquiera y teacher solo el curso propio |
| `DELETE /courses/:id` | JWT y rol `admin` |
| Lecturas GET y demás rutas | Públicas en esta etapa |

Un token ausente o inválido responde `401`; una identidad autenticada sin el rol o la propiedad requerida responde `403`. Los cursos existentes antes de esta columna quedan con `createdByUserId = NULL`: solo un admin puede modificarlos y únicamente un admin puede eliminarlos. El ID de propietario nunca se acepta del cuerpo HTTP.

La matriz de requests reproducible está en [session-19-authorization.http](./requests/session-19-authorization.http). Sustituye sus tres marcadores de token con tokens temporales obtenidos después de asignar los roles locales y volver a iniciar sesión; actualiza también ambos IDs de curso según las respuestas. No guardes tokens reales en ese archivo.

```http
PATCH /courses/12
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "title": "Curso actualizado por su docente"
}
```

## Controles de seguridad para API pública (Sesión 20)

### CORS

La aplicación permite solo los orígenes de `CORS_ORIGINS`, configurados como URLs de origen exactas separadas por comas. En desarrollo el valor predeterminado es `http://localhost:5173`; ajústalo si tu cliente local usa otro puerto. Para producción configura explícitamente orígenes `https://` en el entorno de despliegue. Los métodos permitidos son `GET`, `POST`, `PATCH`, `DELETE` y `OPTIONS`; los encabezados permitidos son `Content-Type` y `Authorization`. No se habilita `*` ni se permiten credenciales de cookies.

Para comprobarlo desde el navegador, sirve una página desde el origen permitido y otra desde un origen distinto: la permitida podrá leer la respuesta; la no permitida no recibirá `Access-Control-Allow-Origin`. El servidor todavía puede recibir una solicitud del origen no permitido; CORS hace que el navegador impida leer la respuesta y no sustituye JWT ni roles. Postman y scripts no aplican esta política del navegador.

### Limitación de solicitudes

`ThrottlerGuard` limita globalmente a 20 solicitudes por minuto por dirección IP. `POST /auth/login` tiene un límite más estricto: cinco intentos por minuto; el siguiente responde `429 Too Many Requests` con un mensaje genérico, sin incluir correo, contraseña ni indicar si una cuenta existe. Espera a que termine la ventana de un minuto antes de repetir la demostración. El almacenamiento predeterminado del limitador es local al proceso; para varias instancias de producción se necesita un almacenamiento compartido. La configuración usa la IP de la conexión; si despliegas detrás de un proxy, configura el proxy y la confianza de IP de forma explícita antes de depender de límites por IP.

Ejecuta seis solicitudes controladas desde el mismo cliente con [session-20-security.http](./requests/session-20-security.http), usando solo una cuenta y contraseña ficticias de práctica. Envía las peticiones de una en una y dentro del mismo minuto; las primeras cinco alcanzan el login y la sexta debe responder `429`. La prueba automatizada `src/auth/auth.throttle.spec.ts` también verifica ese límite.

### HTTPS y secretos

`http://localhost` se reserva para desarrollo. En producción, el cliente y la API deben comunicarse mediante HTTPS/TLS, normalmente con TLS terminado en un proxy inverso, balanceador o plataforma segura. No envíes tokens Bearer por HTTP: una firma válida no cifra el token ni evita que alguien que lo intercepte lo reutilice. `JWT_SECRET`, credenciales de base de datos y demás secretos solo se configuran en `.env` local ignorado o en el gestor de secretos/entorno seguro del despliegue; nunca se versionan.

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

## Middleware, pipes, filters e interceptors (Sesión 21)

- El middleware global registra método, ruta sin query string, estado y duración al terminar la respuesta. No registra encabezados, cuerpos, credenciales ni tokens.
- `ValidationPipe` valida los DTOs globalmente; `ParseIntPipe` convierte y rechaza identificadores no numéricos en rutas de cursos y estudiantes. Las matrículas conservan su pipe numérico.
- `HttpErrorFilter` normaliza errores como `{ statusCode, path, timestamp, message }`. Mantiene los mensajes de errores HTTP esperados (por ejemplo, `400` y `404`) y responde con un mensaje genérico ante fallos internos; no expone consultas ni trazas.
- `TimingInterceptor` añade `X-Response-Time` sin modificar el cuerpo ni ocultar excepciones.

Prueba los casos HTTP controlados con [session-21-cross-cutting.http](./requests/session-21-cross-cutting.http): el ID no numérico debe responder `400` y un ID inexistente debe responder `404`, ambos con el contrato del filtro. Las pruebas unitarias del filtro verifican además que un error inesperado responda `500` sin filtrar sus detalles; no se agrega una ruta pública de prueba para provocar errores internos.

Como guía: un token inválido corresponde al guard de autenticación (`401`); un ID no numérico, al pipe (`400`); un recurso ausente, a la excepción HTTP del servicio (`404`); y una operación lenta se observa con el interceptor y el log de duración.

## Casos de uso, puertos y adaptadores (Sesión 22)

La actualización de cursos conserva `PATCH /courses/:id` y su respuesta, pero la regla de propiedad vive en `UpdateCourseUseCase`. El caso de uso depende del puerto mínimo `CourseRepository` (`findById` y `save`), declarado con el token `COURSE_REPOSITORY`. `TypeOrmCourseRepository` implementa el puerto usando el repositorio de TypeORM; `CoursesModule` conecta ambos mediante `provide` y `useClass`.

El controlador delega la actualización al caso de uso. La política resultante sigue siendo: un administrador puede actualizar cualquier curso y un docente solo el curso cuyo `createdByUserId` coincide con su identidad autenticada; estudiante o docente ajeno recibe `403`, y un curso inexistente mantiene `404`. La identidad y el propietario se toman de la solicitud autenticada y del curso persistido, nunca de los cambios recibidos del cliente.

Si se reemplaza TypeORM, se sustituye el adaptador y su registro del puerto; el caso de uso no necesita conocer la biblioteca de persistencia. Si cambia la regla de propiedad, se modifica `UpdateCourseUseCase`; el controlador y el adaptador permanecen ajenos a esa decisión. `src/courses/application/update-course.use-case.spec.ts` prueba esta lógica con un repositorio falso, sin HTTP ni PostgreSQL.

## Pruebas unitarias de reglas de negocio (Sesión 23)

`UpdateCourseUseCase` se prueba con Arrange–Act–Assert y un repositorio falso registrado mediante el token `COURSE_REPOSITORY`. Las pruebas no crean el servidor HTTP ni abren PostgreSQL: controlan directamente `findById` y `save`.

El conjunto cubre:

- éxito del docente propietario y persistencia con `save`;
- `403 Forbidden` al intentar actualizar el curso de otro docente;
- permiso del administrador para actualizar cursos ajenos;
- `404 Not Found` cuando no existe el curso.

En los casos de rechazo se verifica tanto la excepción como que `save` no fue llamado. Así, una respuesta de error no puede ocultar una modificación que ya habría sido persistida.

Ejecuta únicamente las pruebas del caso de uso con:

```bash
npm test -- update-course
```

Ejecuta toda la suite con `npm test`, compila con `npm run build` y revisa el código con `npm run lint`. La práctica manual de cambiar temporalmente una expectativa permite comprobar que la prueba detecta una regresión; restaura la expectativa correcta antes de finalizar y no versiones ese fallo.

## Controladores y cobertura (Sesión 24)

La prueba de `CoursesController.update` sustituye `UpdateCourseUseCase` por una función simulada y comprueba que el controlador le entrega el ID, el DTO original y el usuario autenticado, y que devuelve su resultado. Una segunda prueba comprueba que un rechazo del caso de uso se propaga: el controlador no debe convertirlo en una respuesta exitosa. La propiedad y los permisos se verifican en las pruebas unitarias del caso de uso, no se vuelven a probar aquí.

Para generar el reporte de cobertura:

```bash
npm test -- --coverage
```

Revisa líneas, funciones y ramas como indicadores de qué caminos se ejecutaron; prioriza ramas de negocio y autorización con expectativas que confirmen el resultado y los efectos, por ejemplo, que `save` no se invoque ante un `403`. El porcentaje no demuestra por sí solo que la regla sea correcta ni reemplaza revisión de código. Antes de cambiar la regla de propiedad, añade una prueba de caso de uso para el nuevo comportamiento, incluyendo el resultado permitido/rechazado y si debe persistirse.

En la revisión actual del reporte, las pruebas del controlador ejercitan el PATCH exitoso y la propagación de su error; `findAll`, `findOne`, `create` y `remove` siguen sin cubrirse en ese archivo. Esto delimita qué rutas no están ejercitadas, pero no obliga a probar cada método trivial solo para elevar el porcentaje: añade cobertura cuando exista un contrato o una transformación específica que proteger.

## Pruebas de integración y end-to-end (Sesión 25)

Las pruebas e2e de `test/courses.e2e-spec.ts` inician Nest y envían HTTP con Supertest. Cubren la colección vacía de cursos, `401` sin token, `403` para un estudiante autenticado y creación/lectura de un curso por un docente autenticado. Preparan usuarios mediante el flujo HTTP de registro e inicio de sesión; el rol docente se asigna solo en la base aislada de pruebas. El comando unitario `npm test` excluye todos los archivos `*.e2e-spec.ts`, para que no arranque accidentalmente la aplicación contra `.env`.

Por seguridad, estas pruebas **no leen las credenciales de `.env`**. Requieren exactamente la base PostgreSQL local `coursehub_e2e_test` y credenciales explícitas `E2E_DB_*`. En PowerShell, crea una base nueva con tu rol PostgreSQL local de pruebas (no uses una base de producción ni la base de desarrollo):

```powershell
createdb -h localhost -p 5432 -U postgres coursehub_e2e_test

$env:E2E_DB_HOST = 'localhost'
$env:E2E_DB_PORT = '5432'
$env:E2E_DB_NAME = 'coursehub_e2e_test'
$env:E2E_DB_USER = 'postgres'
$env:E2E_DB_PASSWORD = 'contraseña-local-de-pruebas'
npm run test:e2e
npm run test:e2e
```

Repite el comando para confirmar que el resultado no depende de la ejecución anterior. La configuración rechaza hosts remotos y cualquier nombre de base distinto de `coursehub_e2e_test`; el esquema se sincroniza únicamente para esa combinación local de pruebas. Antes de cada caso y al terminar se truncan las tablas de matrículas, cursos, estudiantes y usuarios y se reinician sus secuencias, aislando las pruebas entre sí. No guardes estas credenciales en el repositorio. Al terminar, quita las variables temporales:

```powershell
Remove-Item Env:E2E_DB_HOST, Env:E2E_DB_PORT, Env:E2E_DB_NAME, Env:E2E_DB_USER, Env:E2E_DB_PASSWORD
```

La prueba unitaria verifica una clase aislada; una prueba de integración verifica componentes conectados; esta e2e atraviesa HTTP, guards, validación, controladores, casos de uso y PostgreSQL. Un `401` sin token y un `403` con identidad insuficiente son contratos HTTP distintos y ambos se comprueban.

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
npm test -- src/auth/
npm run build
```

La colección [coursehub-demo.http](./requests/coursehub-demo.http) contiene la secuencia integradora, incluidas solicitudes de creación de cursos y estudiantes, matrícula, consulta después de reiniciar, duplicado, estudiante inactivo, paginación, búsqueda combinada, validación `400` y pruebas JWT. Antes de repetirla, inicia sesión y usa el token solo temporalmente en tu cliente HTTP; no guardes ni compartas el token en el archivo. Cambia `demoTag` a un valor único y actualiza `courseId`, `activeStudentId` e `inactiveStudentId` con los IDs devueltos en las respuestas de creación. Las solicitudes de creación deben ejecutarse individualmente; después de crear cada estudiante, copia su ID a la variable correspondiente antes de continuar.

## Endpoints Principales

### 1. Cursos (`/courses`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/courses` | Lista cursos con filtros, paginación y orden (`level`, `page`, `limit`, `sortBy`, `order`) |
| GET | `/courses/:id` | Obtiene el detalle de un curso |
| POST | `/courses` | Crea un curso; requiere JWT y rol admin o teacher |
| PATCH | `/courses/:id` | Admin o docente propietario actualiza el curso |
| DELETE | `/courses/:id` | Elimina un curso; requiere JWT y rol admin. Responde `409 Conflict` si tiene matrículas asociadas |

### 2. Estudiantes (`/students`)

Las rutas de estudiantes permanecen públicas en esta etapa.

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/students` | Lista estudiantes (filtros opcionales `career`, `semester` e `isActive`) |
| GET | `/students/:id` | Obtiene un estudiante por ID |
| POST | `/students` | Crea un estudiante (valida correo único) |
| PATCH | `/students/:id` | Actualiza un estudiante |
| DELETE | `/students/:id` | Elimina un estudiante |
| PATCH | `/students/:id/toggle-status` | Activa o inactiva a un estudiante |

### 3. Matrículas (`/enrollments`)

Las rutas de matrículas permanecen públicas en esta etapa.

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