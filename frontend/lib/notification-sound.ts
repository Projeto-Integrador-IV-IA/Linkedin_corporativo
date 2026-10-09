let audioContext: AudioContext | null = null

export function unlockNotificationSound() {
  if (typeof window === "undefined" || !window.AudioContext) return
  audioContext ??= new window.AudioContext()
  if (audioContext.state === "suspended") void audioContext.resume()
}

export function playNotificationSound() {
  if (!audioContext || audioContext.state === "suspended") return

  const oscillator = audioContext.createOscillator()
  const gain = audioContext.createGain()
  const now = audioContext.currentTime

  oscillator.type = "sine"
  oscillator.frequency.setValueAtTime(880, now)
  oscillator.frequency.setValueAtTime(1174, now + 0.08)
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.16, now + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24)
  oscillator.connect(gain)
  gain.connect(audioContext.destination)
  oscillator.start(now)
  oscillator.stop(now + 0.25)
}
