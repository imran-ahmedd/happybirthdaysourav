/**
 * Cake
 * Wraps the cake's sparkler: once lit it glows, fizzes (audio), and
 * feeds a continuous shower of sparks into the shared FireworksEngine
 * anchored to its own screen position - independent from the big
 * full-screen firework show that fires at the same time.
 */
class Cake {
  constructor({ sparklerEl, glowEl, fireworksEngine, audio }) {
    this.sparklerEl = sparklerEl;
    this.glowEl = glowEl;
    this.fireworksEngine = fireworksEngine;
    this.audio = audio;
    this.lit = false;
    this.stopFizz = null;
  }

  /** Returns the DOM element the matchstick should target (the wick tip). */
  getWickTarget() {
    return this.sparklerEl;
  }

  light(sparkleDurationMs = 26000) {
    if (this.lit) return;
    this.lit = true;

    this.glowEl.classList.add("on");
    if (this.audio) this.stopFizz = this.audio.startFizz();

    const rect = this.sparklerEl.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + 2;
    this.fireworksEngine.sparklerFountain(x, y, sparkleDurationMs);

    setTimeout(() => {
      if (this.stopFizz) this.stopFizz(1.2);
      this.glowEl.classList.remove("on");
    }, sparkleDurationMs);
  }
}
