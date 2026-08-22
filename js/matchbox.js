/**
 * MatchSystem
 * Two-phase pointer interaction:
 *   1) STRIKE  - the stick must be rubbed back and forth over the
 *                strike strip (like a real matchbox) until enough
 *                friction distance accumulates, then it catches fire.
 *   2) CARRY   - once lit, the stick can be picked up and carried
 *                anywhere on screen; releasing it near the registered
 *                target (the cake sparkler wick) lights that target.
 */
class MatchSystem {
  constructor({ matchEl, strikeboxEl, mflameEl, audio, captionEl, homeRect }) {
    this.matchEl = matchEl;
    this.strikeboxEl = strikeboxEl;
    this.mflameEl = mflameEl;
    this.audio = audio;
    this.captionEl = captionEl;

    this.lit = false;
    this.spent = false;
    this.mode = "idle"; // idle -> strike -> carry -> spent
    this.strikeDistance = 0;
    this.strikeThreshold = 260;
    this.lastX = 0;
    this.lastScratchAt = 0;
    this.homePos = null; // filled on first pointerdown
    this.grabOffset = { x: 0, y: 0 };
    this.targetEl = null;
    this.targetHitRadius = 46;
    this.onLit = null;

    this._bind();
  }

  setCaption(text) {
    if (this.captionEl) this.captionEl.textContent = text;
  }

  /** Register the DOM element that should ignite when the flame reaches it. */
  setTarget(el, onLit) {
    this.targetEl = el;
    this.onLit = onLit;
  }

  _bind() {
    this.matchEl.addEventListener("pointerdown", e => this._onDown(e));
    window.addEventListener("pointermove", e => this._onMove(e));
    window.addEventListener("pointerup", e => this._onUp(e));
  }

  _rectCenter(el) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, rect: r };
  }

  _onDown(e) {
    if (this.spent) return;
    this.matchEl.classList.add("grabbed");

    if (!this.lit) {
      this.mode = "strike";
      this.strikeDistance = 0;
      this.lastX = e.clientX;
      return;
    }

    // already lit -> begin carrying
    this.mode = "carry";
    const rect = this.matchEl.getBoundingClientRect();
    this.grabOffset = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    // switch to viewport-fixed positioning so it can travel anywhere
    this.matchEl.style.position = "fixed";
    this.matchEl.style.left = rect.left + "px";
    this.matchEl.style.top = rect.top + "px";
    this.matchEl.style.margin = "0";
    this.matchEl.style.transform = "rotate(0deg)";
    this.matchEl.style.zIndex = "50";
  }

  _onMove(e) {
    if (this.spent) return;

    if (this.mode === "strike") {
      const box = this.strikeboxEl.getBoundingClientRect();
      const pad = 18;
      const within =
        e.clientX >= box.left - pad && e.clientX <= box.right + pad &&
        e.clientY >= box.top - pad && e.clientY <= box.bottom + pad;

      if (within) {
        const dx = Math.abs(e.clientX - this.lastX);
        this.strikeDistance += dx;
        const now = performance.now();
        if (dx > 1.5 && now - this.lastScratchAt > 70) {
          this.lastScratchAt = now;
          if (this.audio) this.audio.strikeScratch();
        }
        // subtle visual rub feedback
        const wobble = Math.sin(this.strikeDistance / 12) * 4;
        this.matchEl.style.transform = `rotate(${18 + wobble}deg)`;

        if (this.strikeDistance >= this.strikeThreshold) {
          this._ignite();
        }
      }
      this.lastX = e.clientX;
      return;
    }

    if (this.mode === "carry") {
      const x = e.clientX - this.grabOffset.x;
      const y = e.clientY - this.grabOffset.y;
      this.matchEl.style.left = x + "px";
      this.matchEl.style.top = y + "px";

      if (this.targetEl) {
        const head = this._headPosition();
        const c = this._rectCenter(this.targetEl);
        const dist = Math.hypot(head.x - c.x, head.y - c.y);
        this.matchEl.classList.toggle("near-target", dist < this.targetHitRadius * 1.6);
      }
    }
  }

  _headPosition() {
    const rect = this.matchEl.getBoundingClientRect();
    // head sits near the top of the stick
    return { x: rect.left + rect.width / 2, y: rect.top + 4 };
  }

  _ignite() {
    this.lit = true;
    this.mode = "idle-lit";
    this.matchEl.classList.add("lit");
    this.matchEl.style.transform = "rotate(0deg)";
    if (this.audio) this.audio.catchFire();
    this.setCaption("এবার কাঠিটা তুলে আগুনটা কেকের ওপরের বাতিটার কাছে নিয়ে যাও");
  }

  _onUp(e) {
    this.matchEl.classList.remove("grabbed");

    if (this.mode === "strike") {
      this.mode = "idle";
      return;
    }

    if (this.mode === "carry") {
      if (this.targetEl) {
        const head = this._headPosition();
        const c = this._rectCenter(this.targetEl);
        const dist = Math.hypot(head.x - c.x, head.y - c.y);
        if (dist < this.targetHitRadius) {
          this._deliverToTarget(c);
          return;
        }
      }
      // missed - keep it lit, just settle in place (still carryable)
      this.mode = "idle-lit";
      this.matchEl.classList.remove("near-target");
    }
  }

  _deliverToTarget(centerPoint) {
    this.mode = "spent";
    this.spent = true;
    this.matchEl.classList.remove("near-target");
    this.matchEl.classList.remove("lit");
    this.matchEl.classList.add("spent");

    // move the match just behind the target point, then fade it out
    this.matchEl.style.left = (centerPoint.x - 3) + "px";
    this.matchEl.style.top = (centerPoint.y - 40) + "px";
    this.matchEl.style.transition = "opacity .6s ease .2s";

    if (typeof this.onLit === "function") this.onLit();

    setTimeout(() => {
      this.matchEl.style.opacity = "0";
    }, 250);
  }
}
