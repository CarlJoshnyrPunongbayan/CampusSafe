let ctx: AudioContext | null = null

/** Two-tone alert beep generated with Web Audio, so no sound file is needed. */
export function playAlertSound(urgent = true) {
  try {
    ctx ??= new AudioContext()
    const notes = urgent ? [880, 660, 880, 660] : [660]
    notes.forEach((freq, i) => {
      const osc = ctx!.createOscillator()
      const gain = ctx!.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const start = ctx!.currentTime + i * 0.22
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.2)
      osc.connect(gain).connect(ctx!.destination)
      osc.start(start)
      osc.stop(start + 0.21)
    })
  } catch {
    // Audio can be blocked until the user interacts with the page; the toast still shows.
  }
}
