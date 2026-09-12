// Policía Local de Madrid 2025 (según tablas facilitadas).
// Marcas intermedias: interpolación lineal entre puntos publicados (5 a 10).

export const policiaLocalMadridBaremos = {
  'plm-800': {
    tipo: 'interpolado',
    direccion: 'lowerIsBetter',
    porSexo: {
      Hombre: [
        { puntos: 5, marca: 170 },
        { puntos: 6, marca: 159 },
        { puntos: 7, marca: 148 },
        { puntos: 8, marca: 137 },
        { puntos: 9, marca: 126 },
        { puntos: 10, marca: 115 },
      ],
      Mujer: [
        { puntos: 5, marca: 210 },
        { puntos: 6, marca: 199 },
        { puntos: 7, marca: 188 },
        { puntos: 8, marca: 177 },
        { puntos: 9, marca: 166 },
        { puntos: 10, marca: 155 },
      ],
    },
  },
  'plm-60': {
    tipo: 'interpolado',
    direccion: 'lowerIsBetter',
    porSexo: {
      Hombre: [
        { puntos: 5, marca: 9.1 },
        { puntos: 6, marca: 8.68 },
        { puntos: 7, marca: 8.26 },
        { puntos: 8, marca: 7.84 },
        { puntos: 9, marca: 7.42 },
        { puntos: 10, marca: 7.0 },
      ],
      Mujer: [
        { puntos: 5, marca: 10.4 },
        { puntos: 6, marca: 9.98 },
        { puntos: 7, marca: 9.56 },
        { puntos: 8, marca: 9.14 },
        { puntos: 9, marca: 8.72 },
        { puntos: 10, marca: 8.3 },
      ],
    },
  },
  'plm-salto-longitud': {
    tipo: 'interpolado',
    direccion: 'higherIsBetter',
    porSexo: {
      Hombre: [
        { puntos: 5, marca: 2.15 },
        { puntos: 6, marca: 2.35 },
        { puntos: 7, marca: 2.55 },
        { puntos: 8, marca: 2.75 },
        { puntos: 9, marca: 2.95 },
        { puntos: 10, marca: 3.15 },
      ],
      Mujer: [
        { puntos: 5, marca: 1.85 },
        { puntos: 6, marca: 2.05 },
        { puntos: 7, marca: 2.25 },
        { puntos: 8, marca: 2.45 },
        { puntos: 9, marca: 2.65 },
        { puntos: 10, marca: 2.85 },
      ],
    },
  },
  'plm-lanzamiento-balon': {
    tipo: 'interpolado',
    direccion: 'higherIsBetter',
    porSexo: {
      Hombre: [
        { puntos: 5, marca: 5.5 },
        { puntos: 6, marca: 6.5 },
        { puntos: 7, marca: 7.5 },
        { puntos: 8, marca: 8.5 },
        { puntos: 9, marca: 9.5 },
        { puntos: 10, marca: 10.5 },
      ],
      Mujer: [
        { puntos: 5, marca: 5.5 },
        { puntos: 6, marca: 6.5 },
        { puntos: 7, marca: 7.5 },
        { puntos: 8, marca: 8.5 },
        { puntos: 9, marca: 9.5 },
        { puntos: 10, marca: 10.5 },
      ],
    },
  },
  'plm-natacion-25': {
    tipo: 'interpolado',
    direccion: 'lowerIsBetter',
    porSexo: {
      Hombre: [
        { puntos: 5, marca: 24.0 },
        { puntos: 6, marca: 21.2 },
        { puntos: 7, marca: 18.4 },
        { puntos: 8, marca: 15.6 },
        { puntos: 9, marca: 12.8 },
        { puntos: 10, marca: 10.0 },
      ],
      Mujer: [
        { puntos: 5, marca: 26.0 },
        { puntos: 6, marca: 23.2 },
        { puntos: 7, marca: 20.4 },
        { puntos: 8, marca: 17.6 },
        { puntos: 9, marca: 14.8 },
        { puntos: 10, marca: 12.0 },
      ],
    },
  },
}
