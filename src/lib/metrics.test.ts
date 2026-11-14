import { describe, expect, it } from 'vitest'
import { intensityFactor, normalizedPower, powerZones, trainingStressScore, variabilityIndex } from './metrics'

describe('métricas de ciclismo', () => {
  it('calcula NP constante', () => expect(normalizedPower(Array(60).fill(200))).toBe(200))
  it('calcula IF, TSS e VI', () => { expect(intensityFactor(250,250)).toBe(1); expect(trainingStressScore(3600,250,250)).toBe(100); expect(variabilityIndex(220,200)).toBe(1.1) })
  it('calcula zonas a partir do FTP', () => { const zones=powerZones(200); expect(zones).toHaveLength(7); expect(zones[0]?.maxWatts).toBe(110) })
})
