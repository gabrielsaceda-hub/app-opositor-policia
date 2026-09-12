const { onDocumentWritten } = require('firebase-functions/v2/firestore')
const { initializeApp } = require('firebase-admin/app')
const { FieldValue, getFirestore } = require('firebase-admin/firestore')

initializeApp()

const db = getFirestore()

function parseMarkData(data) {
  if (!data) return null

  const testId = typeof data.pruebaId === 'string' ? data.pruebaId : ''
  const testName = typeof data.pruebaNombre === 'string' ? data.pruebaNombre : ''
  const sexo = typeof data.sexo === 'string' ? data.sexo : ''
  const mark = Number(data.marcaNormalizada)

  if (!testId || !sexo || !Number.isFinite(mark)) return null

  return {
    testId,
    testName,
    sexo,
    mark,
  }
}

exports.syncPublicRanking = onDocumentWritten('users/{userId}/marks/{markId}', async (event) => {
  const beforeRaw = event.data?.before?.exists ? event.data.before.data() : null
  const afterRaw = event.data?.after?.exists ? event.data.after.data() : null

  const before = parseMarkData(beforeRaw)
  const after = parseMarkData(afterRaw)

  if (!before && !after) return

  const deltas = new Map()

  if (before) {
    const rankingId = `${before.testId}_${before.sexo}`
    deltas.set(rankingId, {
      testId: before.testId,
      testName: before.testName,
      sexo: before.sexo,
      countDelta: -1,
      sumDelta: -before.mark,
    })
  }

  if (after) {
    const rankingId = `${after.testId}_${after.sexo}`
    const current = deltas.get(rankingId) ?? { countDelta: 0, sumDelta: 0, testName: after.testName }
    deltas.set(rankingId, {
      testId: after.testId,
      testName: after.testName || current.testName,
      sexo: after.sexo,
      countDelta: current.countDelta + 1,
      sumDelta: current.sumDelta + after.mark,
    })
  }

  await db.runTransaction(async (transaction) => {
    for (const [rankingId, delta] of deltas.entries()) {
      if (delta.countDelta === 0 && delta.sumDelta === 0) continue

      const rankingRef = db.collection('publicRankings').doc(rankingId)
      const rankingSnap = await transaction.get(rankingRef)
      const current = rankingSnap.exists
        ? rankingSnap.data()
        : { totalMarks: 0, sumMarks: 0, avgMark: 0, testId: delta.testId, testName: delta.testName, sexo: delta.sexo }

      const totalMarks = Math.max(0, Number(current.totalMarks || 0) + delta.countDelta)
      const sumMarks = Math.max(0, Number(current.sumMarks || 0) + delta.sumDelta)

      if (totalMarks === 0) {
        transaction.delete(rankingRef)
        continue
      }

      transaction.set(
        rankingRef,
        {
          testId: delta.testId,
          testName: delta.testName || current.testName || delta.testId,
          sexo: delta.sexo || current.sexo,
          totalMarks,
          sumMarks,
          avgMark: sumMarks / totalMarks,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      )
    }
  })
})
