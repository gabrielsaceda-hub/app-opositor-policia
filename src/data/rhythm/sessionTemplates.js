export const sessionTemplatesByPhase = {
  'base-general': [
    {
      id: 'bg-rodaje-progresivo',
      name: 'Rodaje progresivo + técnica',
      blocks: [
        { repeats: 1, distance: 2000, intensity: 1.12, note: 'Rodaje suave' },
        { repeats: 6, distance: 100, intensity: 1.02, note: 'Técnica y coordinación' },
      ],
    },
    {
      id: 'bg-series-300',
      name: 'Series controladas 300',
      blocks: [{ repeats: 6, distance: 300, intensity: 1.07, note: 'Recuperación 90 s' }],
    },
  ],
  'desarrollo-especifico': [
    {
      id: 'de-series-400',
      name: 'Series específicas 400',
      blocks: [{ repeats: 5, distance: 400, intensity: 1.03, note: 'Recuperación 2 min' }],
    },
    {
      id: 'de-mixto-200-300',
      name: 'Mixto 200 + 300',
      blocks: [
        { repeats: 4, distance: 200, intensity: 0.98, note: 'Ritmo vivo' },
        { repeats: 3, distance: 300, intensity: 1.02, note: 'Control de ritmo' },
      ],
    },
  ],
  'afinado-competitivo': [
    {
      id: 'ac-simulacion-ritmo',
      name: 'Simulación de ritmo objetivo',
      blocks: [
        { repeats: 2, distance: 400, intensity: 1.0, note: 'Ritmo competición' },
        { repeats: 2, distance: 200, intensity: 0.97, note: 'Final fuerte' },
      ],
    },
    {
      id: 'ac-activacion-300',
      name: 'Activación 300',
      blocks: [{ repeats: 4, distance: 300, intensity: 0.99, note: 'Recuperación completa' }],
    },
  ],
  'taper-pico': [
    {
      id: 'tp-recordatorio-200',
      name: 'Recordatorio de velocidad 200',
      blocks: [{ repeats: 4, distance: 200, intensity: 0.98, note: 'Sin fatigar, buena técnica' }],
    },
    {
      id: 'tp-activacion-corta',
      name: 'Activación corta pre-prueba',
      blocks: [{ repeats: 3, distance: 100, intensity: 0.96, note: 'Explosivo y controlado' }],
    },
  ],
}

export const allSessionTemplates = Object.values(sessionTemplatesByPhase).flat()
