import { policiaLocalMadridTests } from './policiaLocalMadridTests'
import { policiaNacionalTests } from './policiaNacionalTests'
import { guardiaCivilTests } from './guardiaCivilTests'

export const testsByBody = {
  plm: policiaLocalMadridTests,
  pn: policiaNacionalTests,
  gc: guardiaCivilTests,
}

const allTests = Object.values(testsByBody).flat()

export function getTestsForSelection(bodyId, sexo) {
  const tests = testsByBody[bodyId] ?? []

  if (!sexo) return []

  return tests.filter((test) => {
    if (!test.sexosPermitidos) return true
    return test.sexosPermitidos.includes(sexo)
  })
}

export function getTestById(testId) {
  return allTests.find((test) => test.id === testId) ?? null
}
