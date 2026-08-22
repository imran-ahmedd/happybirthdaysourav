/**
 * FireworksEngine
 * A small canvas particle system used for two things:
 *  - runShow(durationMs): a full-screen fireworks display, rockets launch
 *    from the bottom and burst at random points, repeating for the given
 *    duration.
 *  - sparklerFountain(x, y, durationMs): a gentle continuous shower of
 *    sparks anchored to a point on screen (used for the cake sparkler).
 */
class FireworksEngine {
  constructor(canvas, audio) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.audio = audio;
    this.rockets = [];
    this.particles = [];
    this.fountains = [];
    this.colors = ["#e0b25e", "#f4d99a", "#e8949f", "#ff8a3d", "#f7e6c4", "#9fd8e0", "#c9a7f2"];
    this._looping = false;
    this._resize = this._resize.bind(this);
    this._resize();
    window.addEventListener("resize", this._resize);
  }

  _resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  _rand(min, max) {
    return min + Math.random() * (max - min);
  }

  _spawnBurstParticles(x, y, color) {
    const count = 48 + Math.floor(Math.random() * 20);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.15;
      const speed = this._rand(1.8, 4.4);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: this._rand(0.008, 0.018),
        color,
        size: this._rand(1.5, 2.6),
        gravity: 0.028,
        trail: Math.random() < 0.35
      });
    }
  }

  launchRocket(targetX, targetY) {
    const startX = targetX + this._rand(-40, 40);
    const startY = this.canvas.height + 10;
    const color = this.colors[Math.floor(Math.random() * this.colors.length)];
    this.rockets.push({
      x: startX, y: startY,
      targetX, targetY,
      color,
      progress: 0,
      speed: this._rand(0.014, 0.02)
    });
    if (this.audio) this.audio.fireworkLaunch();
    this._ensureLoop();
  }

  sparklerFountain(x, y, durationMs) {
    const fountain = {
      x, y,
      until: performance.now() + durationMs,
      getPoint: null
    };
    this.fountains.push(fountain);
    this._ensureLoop();
    return fountain;
  }

  _emitFountainParticle(fx) {
    const angle = this._rand(-Math.PI / 2 - 0.7, -Math.PI / 2 + 0.7);
    const speed = this._rand(0.6, 2.2);
    this.particles.push({
      x: fx.x + this._rand(-2, 2),
      y: fx.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: this._rand(0.02, 0.035),
      color: Math.random() < 0.7 ? "#ffe9b8" : "#fff6d8",
      size: this._rand(0.8, 1.6),
      gravity: 0.05,
      trail: false
    });
  }

  runShow(durationMs) {
    const startedAt = performance.now();
    const endAt = startedAt + durationMs;
    const w = this.canvas.width;

    const scheduleNext = () => {
      const nowT = performance.now();
      if (nowT >= endAt) return;
      const x = this._rand(w * 0.15, w * 0.85);
      const y = this._rand(this.canvas.height * 0.18, this.canvas.height * 0.5);
      this.launchRocket(x, y);

      // occasionally fire a quick second rocket for a fuller sky
      if (Math.random() < 0.4) {
        setTimeout(() => {
          if (performance.now() < endAt) {
            this.launchRocket(this._rand(w * 0.1, w * 0.9), this._rand(this.canvas.height * 0.15, this.canvas.height * 0.45));
          }
        }, this._rand(120, 260));
      }

      const nextDelay = this._rand(420, 900);
      setTimeout(scheduleNext, nextDelay);
    };
    scheduleNext();
  }

  _ensureLoop() {
    if (this._looping) return;
    this._looping = true;
    requestAnimationFrame(() => this._tick());
  }

  _tick() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // fountains: emit new sparks each frame while active
    const nowT = performance.now();
    this.fountains = this.fountains.filter(fx => nowT < fx.until);
    this.fountains.forEach(fx => {
      if (Math.random() < 0.85) this._emitFountainParticle(fx);
    });

    // rockets: move toward target, then burst
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const r = this.rockets[i];
      r.progress += r.speed;
      const t = Math.min(r.progress, 1);
      const ease = 1 - Math.pow(1 - t, 2);
      r.x = r.x + (r.targetX - r.x) * 0.06;
      r.y = r.y - (r.y - r.targetY) * 0.0001;
      const curY = (this.canvas.height + 10) + (r.targetY - (this.canvas.height + 10)) * ease;

      ctx.globalAlpha = 0.9;
      ctx.fillStyle = r.color;
      ctx.beginPath();
      ctx.arc(r.x, curY, 2.2, 0, Math.PI * 2);
      ctx.fill();

      if (t >= 1) {
        this._spawnBurstParticles(r.targetX, r.targetY, r.color);
        if (this.audio) this.audio.fireworkBurst();
        this.rockets.splice(i, 1);
      }
    }

    // particles
    ctx.globalAlpha = 1;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.life -= p.decay;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (this.rockets.length || this.particles.length || this.fountains.length) {
      requestAnimationFrame(() => this._tick());
    } else {
      this._looping = false;
    }
  }
}
