let audioContext: AudioContext | null = null
let audioUnlocked = false

export async function unlockNotificationSound() {
  if (typeof window === "undefined" || !window.AudioContext) return false
  try {
    audioContext ??= new window.AudioContext()
    if (audioContext.state === "suspended") await audioContext.resume()
    audioUnlocked = audioContext.state === "running"
    return audioUnlocked
  } catch {
    audioUnlocked = false
    return false
  }
}

export function playNotificationSound() {
  try {
    if (
      typeof window !== "undefined" &&
      window.localStorage.getItem("synapse-notification-sound") === "off"
    )
      return
  } catch {
    /* Use the default when storage is unavailable. */
  }
  if (!audioUnlocked || !audioContext || audioContext.state !== "running") return

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
