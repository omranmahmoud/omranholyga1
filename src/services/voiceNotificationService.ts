// Voice notification service for real-time alerts
class VoiceNotificationService {
  private synth: SpeechSynthesis;
  private enabled: boolean = false;
  private voice: SpeechSynthesisVoice | null = null;
  private volume: number = 0.8;
  private rate: number = 1.0;
  private pitch: number = 1.0;

  constructor() {
    this.synth = window.speechSynthesis;
    this.initializeVoices();
  }

  private initializeVoices() {
    // Wait for voices to load
    if (this.synth.getVoices().length === 0) {
      this.synth.addEventListener('voiceschanged', () => {
        this.setPreferredVoice();
      });
    } else {
      this.setPreferredVoice();
    }
  }

  private setPreferredVoice() {
    const voices = this.synth.getVoices();
    
    // Prefer English voices
    const englishVoices = voices.filter(voice => 
      voice.lang.startsWith('en-') || voice.lang === 'en'
    );

    if (englishVoices.length > 0) {
      // Prefer female voices for better clarity
      const femaleVoice = englishVoices.find(voice => 
        voice.name.toLowerCase().includes('female') ||
        voice.name.toLowerCase().includes('samantha') ||
        voice.name.toLowerCase().includes('victoria') ||
        voice.name.toLowerCase().includes('susan')
      );
      
      this.voice = femaleVoice || englishVoices[0];
    } else {
      this.voice = voices[0] || null;
    }
  }

  public enable() {
    this.enabled = true;
    this.speak('Voice notifications enabled');
  }

  public disable() {
    this.enabled = false;
    this.synth.cancel(); // Stop any current speech
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  public setRate(rate: number) {
    this.rate = Math.max(0.1, Math.min(2, rate));
  }

  public setPitch(pitch: number) {
    this.pitch = Math.max(0, Math.min(2, pitch));
  }

  private speak(text: string, priority: 'low' | 'medium' | 'high' = 'medium') {
    if (!this.enabled || !text.trim()) return;

    // Cancel current speech for high priority messages
    if (priority === 'high') {
      this.synth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    if (this.voice) {
      utterance.voice = this.voice;
    }
    
    utterance.volume = this.volume;
    utterance.rate = this.rate;
    utterance.pitch = this.pitch;

    // Add error handling
    utterance.onerror = (event) => {
      console.warn('Speech synthesis error:', event.error);
    };

    this.synth.speak(utterance);
  }

  // Public methods for different types of notifications
  public announceNewOrder(orderNumber: string, customerName: string, amount: number) {
    const message = `New order received. Order number ${orderNumber} from ${customerName}. Amount ${amount} dollars.`;
    this.speak(message, 'high');
  }

  public announceOrderUpdate(orderNumber: string, status: string) {
    const message = `Order ${orderNumber} status updated to ${status}.`;
    this.speak(message, 'medium');
  }

  public announceSalesUpdate(totalSales: number, orderCount: number) {
    const message = `Sales update: ${orderCount} orders totaling ${totalSales.toFixed(0)} dollars.`;
    this.speak(message, 'low');
  }

  public announceInventoryAlert(message: string) {
    const announcement = `Inventory alert: ${message}`;
    this.speak(announcement, 'high');
  }

  public announceSystemStatus(status: string) {
    const message = `System ${status}`;
    this.speak(message, 'medium');
  }

  // Test the voice
  public test() {
    this.speak('Voice notification test. This is how order alerts will sound.', 'medium');
  }

  // Get available voices for user selection
  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.synth.getVoices();
  }

  public setVoice(voice: SpeechSynthesisVoice) {
    this.voice = voice;
  }
}

export const voiceNotificationService = new VoiceNotificationService();
