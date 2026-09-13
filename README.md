# Web Oposición - Calculadora física

Proyecto React + Vite + Tailwind con pruebas separadas por cuerpo y sexo.

Despliegue principal Vercel: https://app-opositor-policia-bay.vercel.app

## Cuerpos y pruebas configuradas

- Policía Local de Madrid: 800 metros, 60 metros, salto de longitud, lanzamiento de balón, natación 25 metros.
- Policía Nacional: 1000 metros, circuito de agilidad, dominadas (hombre), suspensión en barra (mujer).
- Guardia Civil: 1000 metros, circuito de agilidad, flexiones.

## Lógica

- Policía Local de Madrid: nota decimal.
- Policía Nacional: nota decimal.
- Guardia Civil: solo apto/no apto.

## Perfil y guardado de marcas

- Desde la calculadora puedes pulsar `Guardar en perfil` para almacenar resultados.
- El perfil guarda nombre y sexo.
- Se calcula media de nota en pruebas baremadas y media de marca por prueba.
- Los datos se guardan en Firebase Firestore por usuario anónimo.

## Informe de entrenamiento

- En Perfil puedes añadir: peso, altura, cuerpo objetivo, fecha de examen (concreta o aproximada) y marcas objetivo.
- Con esos datos la app genera un informe general con frecuencia sugerida y enfoque por prueba.

## Mi ritmo base (tercer escalón)

- Guarda en localStorage tu marca de 800 m y fecha aproximada de examen.
- Calcula ritmo base para 100, 200, 300 y 400.
- Detecta fase de temporada según semanas restantes.
- Incluye dos modos:
  - `Qué entreno hoy`: propone sesión según fase.
  - `Calcula mis ritmos`: eliges sesión propuesta o escribes una propia (texto libre) y te da ritmos objetivo por bloque.

## Ranking anónimo

- En Inicio se muestra media global por prueba (sin datos personales).
- Se alimenta desde el cliente con usuario autenticado para mantener plan gratuito.

## Firebase (requerido)

- Proyecto: `calculadora-a7ef6`
- Necesitas tener activado en consola:
  - Authentication -> método Anónimo
  - Authentication -> método Google
  - Firestore Database

Si no está activado, la app no podrá guardar perfil/marcas en la nube.

## Variables de entorno Vercel

Configura estas variables solo cuando tengas credenciales definitivas:

```bash
VITE_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
VITE_ADSENSE_SLOT_TOP=1111111111
VITE_ADSENSE_SLOT_CONTENT=2222222222
VITE_ADSENSE_SLOT_SIDEBAR=3333333333
VITE_STRAVA_CLIENT_ID=tu_client_id
STRAVA_CLIENT_ID=tu_client_id
STRAVA_CLIENT_SECRET=tu_client_secret
STRAVA_WEBHOOK_VERIFY_TOKEN=un_token_privado_para_webhook
STRAVA_STATE_SECRET=secreto_largo_para_firmar_oauth
STRAVA_TOKEN_ENCRYPTION_KEY=clave_base64_de_32_bytes
APP_ORIGIN=https://app-opositor-policia-bay.vercel.app
FIREBASE_SERVICE_ACCOUNT_BASE64=clave_admin_base64
RESEND_API_KEY=tu_api_key_de_resend
EMAIL_FROM="App Opositor Policía <no-reply@tudominio.com>"
AI_API_KEY=tu_api_key_del_proveedor_ia
AI_API_URL=https://api.openai.com/v1/chat/completions
AI_MODEL=gpt-4o-mini
```

`VITE_*` se expone al navegador. No pongas secretos en variables `VITE_*`.

Las variables sin prefijo `VITE_` son únicamente para API Routes de Vercel y se configuran en Vercel, nunca en el repositorio. `STRAVA_STATE_SECRET` puede generarse con `openssl rand -base64 32`; `STRAVA_TOKEN_ENCRYPTION_KEY` debe ser una clave base64 que decodifique exactamente 32 bytes, por ejemplo `openssl rand -base64 32`.

## Ranking robusto con Cloud Functions

Hay una Cloud Function preparada en `functions/index.js`, pero no se despliega en plan gratuito Spark. La app actual usa actualización cliente protegida por reglas Firestore.

## Dónde editar baremos reales

- `src/data/baremos/policiaLocalMadrid.js`
- `src/data/baremos/policiaNacional.js`
- `src/data/baremos/guardiaCivil.js`

Los componentes visuales no incluyen baremos hardcodeados.

## Estructura de datos

- `src/data/tests/policiaLocalMadridTests.js`
- `src/data/tests/policiaNacionalTests.js`
- `src/data/tests/guardiaCivilTests.js`

## Ejecutar

```bash
cd /Users/gabrielsaceda/Downloads/weboposoción
npm install
npm run dev
```

Abrir `http://localhost:5173`.

Para móvil (misma red):

```bash
npm run dev:host
```

## Validación técnica

```bash
npm run lint
npm run build
```
