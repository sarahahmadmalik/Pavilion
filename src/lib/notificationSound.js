/**
 * notificationSound.js
 * ====================
 * A brief two-tone chime synthesized with the Web Audio API — no audio
 * asset or licensing needed. Plays only on realtime notification arrivals,
 * never on the initial page-load fetch.
 */
let audioCtx = null;

export function playNotificationChime() {
  try {
    if (!audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      audioCtx = new AudioCtx();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }

    const now = audioCtx.currentTime;
    [880, 1174.66].forEach((freq, i) => {
      const start = now + i * 0.11;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.16, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.32);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(start);
      osc.stop(start + 0.34);
    });
  } catch {
    // Audio unavailable/blocked — fail silently, sound is a nice-to-have.
  }
}
