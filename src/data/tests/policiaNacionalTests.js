export const policiaNacionalTests = [
  { id: 'pn-1000', nombre: '1000 metros', tipoEntrada: 'time', formatoTiempo: 'minutesSeconds', direccion: 'lowerIsBetter' },
  { id: 'pn-circuito', nombre: 'Circuito de agilidad', tipoEntrada: 'time', formatoTiempo: 'secondsDecimal', direccion: 'lowerIsBetter' },
  {
    id: 'pn-dominadas',
    nombre: 'Dominadas',
    tipoEntrada: 'repetitions',
    direccion: 'higherIsBetter',
    sexosPermitidos: ['Hombre'],
  },
  {
    id: 'pn-suspension-barra',
    nombre: 'Suspensión en barra',
    tipoEntrada: 'suspensionSeconds',
    direccion: 'higherIsBetter',
    sexosPermitidos: ['Mujer'],
  },
]
