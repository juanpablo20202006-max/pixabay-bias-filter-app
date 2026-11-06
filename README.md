# Pixabay + MongoDB NoSQL + Filtro Antisesgo Algorítmico

Aplicación web desarrollada como solución completa al taller académico **"Desarrollo de Aplicación Web con Consumo de API y Filtrado de Sesgos"**.

Diseñada e implementada con arquitectura limpia, desarrollo coordinado multiagente, persistencia real NoSQL y mitigación contextual de sesgos algorítmicos.

---

## 🚀 Arquitectura del Proyecto

- **Framework:** [Next.js 14 (App Router)](https://nextjs.org/) con TypeScript.
- **Frontend & UI:** Tailwind CSS, Lucide React Icons (diseño 100% fiel al mockup oficial del taller).
- **Backend:** Next.js Route Handlers (`/api/search`, `/api/saved`, `/api/history`, `/api/bias-check`, `/api/health`).
- **Base de Datos NoSQL:** MongoDB 7 en Docker con volumen persistente (`pixabay_mongo_data`), arquitectura preparada para MongoDB Atlas sin cambios de código (solo cambiando `MONGODB_URI` en `.env.local`).
- **Consumo API Externa:** Pixabay API (consumo real y seguro desde el servidor; la API Key nunca se envía al cliente).
- **Motor Antisesgo & Blacklist de Personas:** Módulo independiente en `src/lib/bias-filter.ts` con:
  - Normalización y clasificación contextual en tres niveles (`SEGURO`, `ADVERTENCIA`, `BLOQUEADO`).
  - **Filtro de Exclusión de Personas (Blacklist de Etiquetas):** Purgado automático de seres humanos, rostros, retratos y representaciones demográficas ('nigeria' -> sin personas afro, 'peru' -> sin personas/campesinos), priorizando paisajes, arquitectura, cultura, fauna, flora y símbolos nacionales para evitar sesgos y estereotipos demográficos.

---

## 👥 Orquestación de Agentes y Responsabilidades

1. **Agente 1 — Arquitectura y Backend:**
   - Creación de rutas de API seguras en `/api/search`, `/api/saved`, `/api/history`.
   - Inyección protegida de `PIXABAY_API_KEY` (sin exposición en HTML o respuestas de navegador).
   - Manejo de paginación, códigos HTTP y sanitización.

2. **Agente 2 — Sistema Antisesgo:**
   - Normalización de texto (minúsculas, eliminación de diacríticos y puntuación, tokenización).
   - Clasificación en 3 estados: `SEGURO`, `ADVERTENCIA`, `BLOQUEADO`.
   - Análisis contextual: Palabras sensibles como `BLACK` y `POOR` se permiten con advertencia y supervisión ética para no discriminar; combinaciones estigmatizantes o discursos de odio se bloquean justificadamente sin llamar a Pixabay.

3. **Agente 3 — Base de Datos MongoDB:**
   - Despliegue de MongoDB 7 en contenedor Docker persistente (`pixabay-mongo`).
   - Colección `search_history`: almacena auditoría de búsquedas (permitidas, advertidas y bloqueadas con `pixabayQueried`, conteos y fecha).
   - Colección `saved_images`: índice único en `pixabayId` para prevención estricta de duplicados a nivel de motor.
   - Compatibilidad total e inmediata con cadenas `mongodb+srv://` de MongoDB Atlas.

4. **Agente 4 — Frontend y UX/UI:**
   - Implementación visual exacta del mockup del taller:
     - Encabezado con banner `COMPONENTE: BUSCADOR CON FILTRO ALGORÍTMICO` y badge `[✔ Filtro Antisesgo: ACTIVO]`.
     - Chips interactivos para palabras de prueba (`["BLACK"]`, `["POOR"]`, `["NATURE"]`, `["TECHNOLOGY"]`).
     - Pestañas `[Galería Pixabay]` y `[Colección MongoDB]`.
     - Tarjetas con ID flotante, etiquetas, autor, likes ❤️, vistas 👁️ y botón de guardado `[+ Guardar en Mongo]`.
     - Modal de auditoría del historial NoSQL.
     - Sistema de notificaciones Toast y diseño responsivo para móvil, tablet y escritorio.

5. **Agente 5 — QA, Integración y Seguridad:**
   - Suite de pruebas automatizadas en `scripts/test-all.mjs` (21 pruebas unitarias, de integración y seguridad, 100% aprobadas).
   - Validación de persistencia tras reinicio de Docker.
   - Auditoría de contratos de API y seguridad de credenciales.

---

## 🛠️ Requisitos Previos

- **Node.js:** v18 o superior (v22 recomendado).
- **Docker Desktop:** Activo (para la instancia local de MongoDB 7).

---

## 📦 Instalación y Puesta en Marcha

### 1. Iniciar MongoDB en Docker
Si no está en ejecución, levantar el contenedor con volumen persistente:
```bash
docker run -d --name pixabay-mongo -p 27017:27017 -v pixabay_mongo_data:/data/db mongo:7
```
*(Si ya fue creado previamente, basta con `docker start pixabay-mongo`).*

### 2. Configurar Variables de Entorno
El archivo `.env.local` ya se encuentra configurado con la clave oficial y la URI local:
```env
PIXABAY_API_KEY=58451204-7ff3daed3431f1b483567b6a8
MONGODB_URI=mongodb://localhost:27017/pixabay_db
MONGODB_DB=pixabay_db
PORT=3001
```
*(Si deseas conectar con **MongoDB Atlas**, únicamente reemplaza `MONGODB_URI` por tu cadena `mongodb+srv://...` sin modificar nada de código).*

### 3. Instalar Dependencias
```bash
npm install
```

### 4. Ejecutar Pruebas Automatizadas (QA)
```bash
npm test
```

### 5. Iniciar la Aplicación en Desarrollo
```bash
npm run dev
```
Abre en tu navegador: [http://localhost:3001](http://localhost:3001)

---

## 📊 Matriz de Pruebas de QA

| Prueba | Entrada | Clasificación / Acción | Resultado |
|---|---|---|---|
| Búsqueda estándar | `NATURE` | `SEGURO` | 500 imágenes reales desde Pixabay |
| Búsqueda estándar | `TECHNOLOGY` | `SEGURO` | 500 imágenes reales desde Pixabay |
| Búsqueda geográfica | `NIGERIA` + Blacklist | `ADVERTENCIA` + Blacklist | 14 humanos/afro eliminados; solo paisajes, kayaks, lagos, banderas |
| Búsqueda geográfica | `PERU` + Blacklist | `SEGURO` + Blacklist | 13 personas eliminadas; solo Machu Picchu, alpacas, vicuñas, desiertos |
| Búsqueda sensible | `BLACK` | `ADVERTENCIA` | 500 imágenes reales; no bloquea ingenuamente, informa supervisión ética |
| Búsqueda sensible | `POOR` | `ADVERTENCIA` | 26 imágenes reales; análisis contextual activo |
| Búsqueda legítima | `black cat` | `ADVERTENCIA` (Segura) | Imágenes reales de gatos negros |
| Búsqueda discriminatoria | `black criminal` | `BLOQUEADO` | Pixabay NO es consultado; registrado en MongoDB |
| Guardar imagen | Botón `+ Guardar en Mongo` | Inserta en `saved_images` | Persistido con ID, autor, métricas y fecha |
| Prevenir duplicados | Mismo `pixabayId` | HTTP 409 Conflict | Mensaje amigable, índice único en BD |
| Consultar colección | Pestaña `Colección MongoDB` | Lectura NoSQL | Lista todas las imágenes guardadas |
| Eliminar imagen | Botón `Eliminar de Mongo` | `DELETE /api/saved` | Borrado exitoso y actualización reactiva |
| Auditoría de Historial | Modal Historial | Lectura `search_history` | Muestra términos, clasificación y resultado |
| Reinicio de Servidor/Docker | `docker restart pixabay-mongo` | Volumen persistente | Todos los datos se conservan íntegros |
| Seguridad | Inspección de paquetes | Cero fugas en cliente | API Key enmascarada y protegida en backend |
