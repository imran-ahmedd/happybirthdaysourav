/**
 * AudioEngine
 * All sound effects are synthesized in real time with the Web Audio API,
 * so no external audio files are required (match strike, flame catch,
 * sparkler fizz, firework launch / boom / crackle).
 */
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.noiseBuffer = null;
    this.unlocked = false;
  }

  /** Must be called from within a user gesture (click/pointerdown). */
  unlock() {
    if (this.unlocked) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.noiseBuffer = this._buildNoiseBuffer(2);
    this.unlocked = true;
    if (this.ctx.state === "suspended") this.ctx.resume();
  }

  _buildNoiseBuffer(seconds) {
    const rate = this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, rate * seconds, rate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  _noiseSource() {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    return src;
  }

  now() {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  /** Short scratchy burst - one "rasp" of the match against the strike strip. */
  strikeScratch() {
    if (!this.ctx) return;
    const t = this.now();
    const src = this._noiseSource();
    const bp = this.ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 2200 + Math.random() * 1400;
    bp.Q.value = 1.2;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.28, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    src.connect(bp).connect(gain).connect(this.ctx.destination);
    src.start(t);
    src.stop(t + 0.11);
  }

  /** Soft whoosh - the moment the match catches flame. */
  catchFire() {
    if (!this.ctx) return;
    const t = this.now();
    const src = this._noiseSource();
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(500, t);
    lp.frequency.exponentialRampToValueAtTime(2600, t + 0.15);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.35, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    src.connect(lp).connect(gain).connect(this.ctx.destination);
    src.start(t);
    src.stop(t + 0.45);
  }

  /** Continuous soft fizz while the sparkler burns. Returns a stop() fn. */
  startFizz() {
    if (!this.ctx) return () => {};
    const src = this._noiseSource();
    const bp = this.ctx.createBiquadFilter();
    bp.type = "highpass";
    bp.frequency.value = 3200;
    const gain = this.ctx.createGain();
    const t = this.now();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.06, t + 0.3);
    src.connect(bp).connect(gain).connect(this.ctx.destination);
    src.start(t);
    return (fadeSec = 0.6) => {
      const stopT = this.now();
      gain.gain.cancelScheduledValues(stopT);
      gain.gain.setValueAtTime(gain.gain.value, stopT);
      gain.gain.exponentialRampToValueAtTime(0.0001, stopT + fadeSec);
      src.stop(stopT + fadeSec + 0.05);
    };
  }

  /** Rising whoosh as a firework rocket climbs. */
  fireworkLaunch() {
    if (!this.ctx) return;
    const t = this.now();
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(650, t + 0.5);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.05, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.6);
  }

  /** Boom + crackle when a firework explodes. */
  fireworkBurst() {
    if (!this.ctx) return;
    const t = this.now();

    // low boom
    const src = this._noiseSource();
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(900, t);
    lp.frequency.exponentialRampToValueAtTime(120, t + 0.5);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.5, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    src.connect(lp).connect(gain).connect(this.ctx.destination);
    src.start(t);
    src.stop(t + 0.65);

    // sparkling crackle ticks
    const tickCount = 10 + Math.floor(Math.random() * 8);
    for (let i = 0; i < tickCount; i++) {
      const delay = 0.08 + Math.random() * 0.9;
      const tickSrc = this._noiseSource();
      const bp = this.ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 3500 + Math.random() * 4000;
      bp.Q.value = 4;
      const tGain = this.ctx.createGain();
      const startAt = t + delay;
      tGain.gain.setValueAtTime(0.0001, startAt);
      tGain.gain.linearRampToValueAtTime(0.12, startAt + 0.005);
      tGain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.06);
      tickSrc.connect(bp).connect(tGain).connect(this.ctx.destination);
      tickSrc.start(startAt);
      tickSrc.stop(startAt + 0.08);
    }
  }
}
