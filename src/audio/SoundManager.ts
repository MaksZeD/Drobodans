export class SoundManager {
  private ctx: AudioContext | null = null;
  private _muted = false;

  get muted(): boolean {
    return this._muted;
  }

  toggleMute(): boolean {
    this._muted = !this._muted;
    return this._muted;
  }

  private getCtx(): AudioContext | null {
    if (this._muted) return null;
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  playCardSlide(): void {
    const ctx = this.getCtx();
    if (!ctx) return;

    const duration = 0.15;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2500;
    filter.Q.value = 0.7;

    const gain = ctx.createGain();
    gain.gain.value = 0.12;

    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start();
  }

  playCardFlip(): void {
    const ctx = this.getCtx();
    if (!ctx) return;

    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(500, now + 0.06);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  playShuffle(): void {
    const ctx = this.getCtx();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Rapid series of soft clicks simulating a riffle shuffle
    for (let i = 0; i < 16; i++) {
      const time = now + i * 0.06 + Math.random() * 0.02;

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(700 + Math.random() * 500, time);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.06, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.035);

      osc.connect(gain).connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.04);
    }

    // Ending thud
    const thudTime = now + 1.1;
    const noise = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
    const noiseData = noise.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * (1 - i / noiseData.length);
    }
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noise;

    const lpf = ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = 400;

    const thudGain = ctx.createGain();
    thudGain.gain.value = 0.15;

    noiseSource.connect(lpf).connect(thudGain).connect(ctx.destination);
    noiseSource.start(thudTime);
  }

  playQueenAlert(): void {
    const ctx = this.getCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freqs = [440, 660, 880];

    freqs.forEach((freq, i) => {
      const time = now + i * 0.12;
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.08, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

      osc.connect(gain).connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.1);
    });
  }

  playGameOver(): void {
    const ctx = this.getCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freqs = [660, 440, 330, 220];

    freqs.forEach((freq, i) => {
      const time = now + i * 0.22;
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.12, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

      osc.connect(gain).connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.3);
    });
  }
}
