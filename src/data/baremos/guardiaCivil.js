// Guardia Civil (según tablas facilitadas): apto/no apto.

export const guardiaCivilBaremos = {
  'gc-1000': {
    tipo: 'aptoNoApto',
    direccion: 'lowerIsBetter',
    porSexo: {
      Hombre: { marcaLimite: 260 },
      Mujer: { marcaLimite: 310 },
    },
  },
  'gc-circuito': {
    tipo: 'aptoNoApto',
    direccion: 'lowerIsBetter',
    porSexo: {
      Hombre: { marcaLimite: 16.0 },
      Mujer: { marcaLimite: 19.0 },
    },
  },
  'gc-flexiones': {
    tipo: 'aptoNoApto',
    direccion: 'higherIsBetter',
    porSexo: {
      Hombre: { marcaLimite: 9 },
      Mujer: { marcaLimite: 7 },
    },
  },
}
