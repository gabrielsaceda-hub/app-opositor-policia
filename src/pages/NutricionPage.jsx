import { useMemo } from 'react'
import SectionCard from '../components/ui/SectionCard'

const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

function getDayType(day, profile) {
  const available = profile.diasEntreno?.length ? profile.diasEntreno : ['Lunes', 'Miércoles', 'Viernes']
  if (!available.includes(day)) return 'descanso'
  const index = available.indexOf(day)
  if (index % 3 === 0) return 'intenso'
  if (index % 3 === 1) return 'fuerza'
  return 'suave'
}

function getMacros(type, weight) {
  const kg = Number(weight) || 70
  const protein = Math.round(kg * 1.8)
  if (type === 'intenso') return { carbs: Math.round(kg * 5), protein, fat: Math.round(kg * 0.9) }
  if (type === 'fuerza') return { carbs: Math.round(kg * 4), protein: Math.round(kg * 2), fat: Math.round(kg * 1) }
  if (type === 'suave') return { carbs: Math.round(kg * 3.2), protein, fat: Math.round(kg * 1) }
  return { carbs: Math.round(kg * 2.5), protein: Math.round(kg * 1.7), fat: Math.round(kg * 1.1) }
}

function getMenu(type) {
  if (type === 'intenso') return 'Avena/fruta, arroz o pasta con proteína magra, yogur o batido post-entreno, cena con patata/verdura/pescado.'
  if (type === 'fuerza') return 'Tostada integral y huevos, legumbre o arroz con pollo, fruta y frutos secos, cena rica en proteína.'
  if (type === 'suave') return 'Desayuno ligero, comida equilibrada, merienda con fruta, cena con verduras y proteína.'
  return 'Prioriza verduras, proteína suficiente, grasas saludables e hidratos moderados.'
}

function NutricionPage({ profile }) {
  const plan = useMemo(
    () => days.map((day) => {
      const type = getDayType(day, profile)
      return { day, type, macros: getMacros(type, profile.peso), menu: getMenu(type) }
    }),
    [profile],
  )

  const shoppingList = useMemo(
    () => [
      'Avena, arroz, pasta, patata o pan integral',
      'Fruta: plátano, frutos rojos, manzana o naranja',
      'Proteína: pollo, huevos, yogur griego, pescado, legumbres',
      'Verduras variadas y ensalada',
      'Aceite de oliva, frutos secos y aguacate',
      'Bebida isotónica o sales si haces sesiones largas/intensas',
    ],
    [],
  )

  return (
    <div className="space-y-4">
      <SectionCard title="Plan nutricional semanal" subtitle="Macros orientativos ajustados al calendario">
        <p className="mb-4 rounded-2xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">
          Orientación deportiva general. No sustituye a nutricionista, médico ni tratamiento para patologías, alergias o trastornos alimentarios.
        </p>
        <div className="space-y-3">
          {plan.map((item) => (
            <article key={item.day} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p className="font-extrabold text-brand-900">{item.day} · {item.type}</p>
              <p>Carbohidratos: {item.macros.carbs} g · Proteínas: {item.macros.protein} g · Grasas: {item.macros.fat} g</p>
              <p className="mt-2">Menú orientativo: {item.menu}</p>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Consejos pre/post entreno" subtitle="Timing sencillo para rendir mejor">
        <div className="space-y-2 text-sm text-slate-700">
          <p>- 2-3 h antes de series: hidratos fáciles + proteína ligera + agua.</p>
          <p>- 30-60 min antes: fruta o snack si llegas con hambre.</p>
          <p>- Después: proteína + hidratos durante las 2 h posteriores si la sesión fue intensa.</p>
          <p>- En semanas de examen evita experimentar con alimentos nuevos.</p>
        </div>
      </SectionCard>

      <SectionCard title="Lista de la compra" subtitle="Basada en la semana planificada">
        <div className="space-y-2 text-sm text-slate-700">
          {shoppingList.map((item) => <p key={item}>- {item}</p>)}
        </div>
      </SectionCard>
    </div>
  )
}

export default NutricionPage
