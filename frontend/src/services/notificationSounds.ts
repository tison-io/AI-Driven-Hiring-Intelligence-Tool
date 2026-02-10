class NotificationSounds {
  private audioContext: AudioContext | null = null;
  private soundEnabled = true;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private createBeep(frequency: number, duration: number, volume: number = 0.3) {
    if (!this.audioContext || !this.soundEnabled) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  playSuccess() {
    // Pleasant ascending tone
    this.createBeep(523.25, 0.1); // C5
    setTimeout(() => this.createBeep(659.25, 0.1), 100); // E5
    setTimeout(() => this.createBeep(783.99, 0.15), 200); // G5
  }

  playError() {
    // Lower, more urgent tone
    this.createBeep(220, 0.2, 0.4); // A3
    setTimeout(() => this.createBeep(196, 0.3, 0.4), 150); // G3
  }

  playWarning() {
    // Double beep
    this.createBeep(440, 0.1); // A4
    setTimeout(() => this.createBeep(440, 0.1), 200);
  }

  playInfo() {
    // Single pleasant tone
    this.createBeep(523.25, 0.2); // C5
  }

  playNewNotification() {
    // Gentle notification sound
    this.createBeep(659.25, 0.1); // E5
    setTimeout(() => this.createBeep(523.25, 0.15), 100); // C5
  }

  setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  isSoundEnabled() {
    return this.soundEnabled;
  }
}

export const notificationSounds = new NotificationSounds();