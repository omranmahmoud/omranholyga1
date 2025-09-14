// Audio notification service for Bob notifications
class AudioNotificationService {
  private context: AudioContext | null = null;
  private enabled: boolean = true;
  private volume: number = 0.7;

  constructor() {
    // Initialize AudioContext on first user interaction
    this.initializeAudioContext();
  }

  private initializeAudioContext() {
    try {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  private async ensureAudioContext() {
    if (!this.context) {
      this.initializeAudioContext();
    }

    if (this.context && this.context.state === 'suspended') {
      try {
        await this.context.resume();
      } catch (error) {
        console.warn('Failed to resume audio context:', error);
      }
    }
  }

  // Create a notification sound using Web Audio API
  private createNotificationSound(frequency: number = 800, duration: number = 0.2, type: OscillatorType = 'sine') {
    if (!this.context || !this.enabled) return;

    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);

    oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);
    oscillator.type = type;

    // Volume envelope
    gainNode.gain.setValueAtTime(0, this.context.currentTime);
    gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, this.context.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);

    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + duration);
  }

  // Play a cheerful notification sound for new orders
  async playNewOrderSound() {
    await this.ensureAudioContext();
    
    if (!this.enabled || !this.context) return;

    // Play a pleasant ascending melody
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6

    notes.forEach((frequency, index) => {
      setTimeout(() => {
        this.createNotificationSound(frequency, 0.15, 'sine');
      }, index * 100);
    });

    // Add a subtle echo effect
    setTimeout(() => {
      this.createNotificationSound(1047, 0.3, 'sine');
    }, 500);
  }

  // Play a coin/cash register sound effect
  async playCashSound() {
    await this.ensureAudioContext();
    
    if (!this.enabled || !this.context) return;

    // Simulate cash register "cha-ching" sound
    const oscillator1 = this.context.createOscillator();
    const oscillator2 = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(this.context.destination);

    // Two frequencies for harmony
    oscillator1.frequency.setValueAtTime(1200, this.context.currentTime);
    oscillator2.frequency.setValueAtTime(1600, this.context.currentTime);

    oscillator1.type = 'triangle';
    oscillator2.type = 'triangle';

    // Sharp attack, quick decay
    gainNode.gain.setValueAtTime(0, this.context.currentTime);
    gainNode.gain.linearRampToValueAtTime(this.volume * 0.4, this.context.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.4);

    oscillator1.start(this.context.currentTime);
    oscillator2.start(this.context.currentTime);
    oscillator1.stop(this.context.currentTime + 0.4);
    oscillator2.stop(this.context.currentTime + 0.4);
  }

  // Play success/achievement sound
  async playSuccessSound() {
    await this.ensureAudioContext();
    
    if (!this.enabled || !this.context) return;

    // Major chord progression
    const chords = [
      [523, 659, 784], // C major
      [587, 740, 880], // D major  
      [659, 831, 988]  // E major
    ];

    chords.forEach((chord, chordIndex) => {
      setTimeout(() => {
        chord.forEach((frequency) => {
          this.createNotificationSound(frequency, 0.3, 'triangle');
        });
      }, chordIndex * 150);
    });
  }

  // Enable/disable audio notifications
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  // Set volume (0-1)
  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  getVolume(): number {
    return this.volume;
  }

  // Test the audio system
  async test() {
    await this.playNewOrderSound();
  }
}

export const audioNotificationService = new AudioNotificationService();
