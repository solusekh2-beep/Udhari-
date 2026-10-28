/**
 * Dukaan Soundbox Chime & Audio Announcer
 * Emulates the famous Indian merchant soundboxes (Paytm / PhonePe speaker)
 */

class SoundboxService {
  private audioCtx: AudioContext | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Play crystal-clear payment chime (pleasant 3-tone ascending chord)
   */
  public playPaymentChime(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.45);
      });
    } catch {
      // Audio playback fails gracefully if muted or disallowed
    }
  }

  /**
   * Voice announcement using browser SpeechSynthesis
   */
  public announcePayment(amount: number, customerName: string): void {
    this.playPaymentChime();

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      // Speak after chime
      setTimeout(() => {
        const text = `₹${amount} received from ${customerName}. Udhari updated.`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.05;

        // Try to pick Hindi or Indian English voice if present
        const voices = window.speechSynthesis.getVoices();
        const inVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('IN') || v.name.toLowerCase().includes('india'));
        if (inVoice) {
          utterance.voice = inVoice;
        }

        window.speechSynthesis.speak(utterance);
      }, 350);
    } catch {
      // ignore speech errors
    }
  }
}

export const soundbox = new SoundboxService();
