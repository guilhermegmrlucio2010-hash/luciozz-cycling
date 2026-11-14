export function normalizedPower(samples: number[], windowSeconds = 30): number | null {
  if (samples.length < windowSeconds || windowSeconds < 1) return null
  const rolling: number[] = []
  let sum = 0
  for (let i = 0; i < samples.length; i++) {
    sum += samples[i] ?? 0
    if (i >= windowSeconds) sum -= samples[i - windowSeconds] ?? 0
    if (i >= windowSeconds - 1) rolling.push(sum / windowSeconds)
  }
  return Math.round(Math.pow(rolling.reduce((acc, value) => acc + value ** 4, 0) / rolling.length, 0.25))
}

export function intensityFactor(np: number | null, ftp: number): number | null {
  return np !== null && ftp > 0 ? Number((np / ftp).toFixed(3)) : null
}

export function trainingStressScore(durationSeconds: number, np: number | null, ftp: number): number | null {
  const factor = intensityFactor(np, ftp)
  return factor !== null && np !== null ? Number(((durationSeconds * np * factor) / (ftp * 3600) * 100).toFixed(1)) : null
}

export function variabilityIndex(np: number | null, averagePower: number): number | null {
  return np !== null && averagePower > 0 ? Number((np / averagePower).toFixed(3)) : null
}

export function powerZones(ftp: number) {
  if (ftp <= 0) return []
  const limits = [[0,.55],[.55,.75],[.75,.90],[.90,1.05],[1.05,1.20],[1.20,1.50],[1.50,Infinity]]
  return limits.map(([min,max], index) => ({ zone:index+1, minWatts:Math.ceil(ftp*min), maxWatts:Number.isFinite(max) ? Math.floor(ftp*max) : null }))
}
