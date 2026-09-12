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
