// Guardia Civil 2025 (BOE): apto/no apto con tramos de edad.
// 2000 m y natación en segundos; circuito en segundos con décimas; flexiones en repeticiones.

export const guardiaCivilBaremos = {
  'gc-2000': {
    tipo: 'aptoNoApto',
    direccion: 'lowerIsBetter',
    porSexo: {
      Hombre: { tramos: { lt35: 565, '35-39': 588, gt39: 633 } },
      Mujer: { tramos: { lt35: 674, '35-39': 695, gt39: 769 } },
    },
  },
  'gc-circuito': {
    tipo: 'aptoNoApto',
    direccion: 'lowerIsBetter',
    porSexo: {
      Hombre: { tramos: { lt35: 14.0, '35-39': 14.4, gt39: 15.1 } },
      Mujer: { tramos: { lt35: 16.0, '35-39': 16.4, gt39: 17.9 } },
    },
  },
  'gc-flexiones': {
    tipo: 'aptoNoApto',
    direccion: 'higherIsBetter',
    porSexo: {
      Hombre: { tramos: { lt35: 16, '35-39': 16, gt39: 14 } },
      Mujer: { tramos: { lt35: 11, '35-39': 11, gt39: 9 } },
    },
  },
  'gc-natacion': {
    tipo: 'aptoNoApto',
    direccion: 'lowerIsBetter',
    porSexo: {
      Hombre: { tramos: { lt35: 70, '35-39': 71, gt39: 73 } },
      Mujer: { tramos: { lt35: 81, '35-39': 83, gt39: 88 } },
    },
  },
}
