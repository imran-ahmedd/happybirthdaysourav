/**
 * GiftBox
 * The lid is dragged upward to open (instead of a plain click/tap).
 * Drag progress maps to lid rotation in real time; releasing past the
 * threshold snaps it fully open, releasing early springs it back shut.
 */
class GiftBox {
  constructor({ wrapEl, lidEl, cubeEl, glowEl, hintEl, onOpened }) {
    this.wrapEl = wrapEl;
    this.lidEl = lidEl;
    this.cubeEl = cubeEl;
    this.glowEl = glowEl;
    this.hintEl = hintEl;
    this.onOpened = onOpened;

    this.opened = false;
    this.dragging = false;
    this.startY = 0;
    this.progress = 0; // 0 closed -> 1 fully open
    this.maxAngle = -122; // degrees

    this._bind();
  }

  _bind() {
    this.lidEl.addEventListener("pointerdown", e => this._onDown(e));
    window.addEventListener("pointermove", e => this._onMove(e));
    window.addEventListener("pointerup", e => this._onUp(e));
  }

  _onDown(e) {
    if (this.opened) return;
    this.dragging = true;
    this.startY = e.clientY;
    this.lidEl.classList.add("dragging");
    try { this.lidEl.setPointerCapture(e.pointerId); } catch (err) {}
    if (this.hintEl) this.hintEl.style.opacity = "0";
  }

  _onMove(e) {
    if (!this.dragging || this.opened) return;
    const dy = this.startY - e.clientY; // positive when dragging upward
    this.progress = Math.max(0, Math.min(1, dy / 90));
    const angle = this.maxAngle * this.progress;
    this.lidEl.style.transform = `rotateX(${angle}deg)`;
  }

  _onUp() {
    if (!this.dragging || this.opened) return;
    this.dragging = false;
    this.lidEl.classList.remove("dragging");

    if (this.progress > 0.5) {
      this._open();
    } else {
      // spring back shut
      this.lidEl.style.transition = "transform .35s cubic-bezier(.34,1.4,.4,1)";
      this.lidEl.style.transform = "rotateX(0deg)";
      this.progress = 0;
      if (this.hintEl) this.hintEl.style.opacity = "";
      setTimeout(() => { this.lidEl.style.transition = ""; }, 360);
    }
  }

  _open() {
    this.opened = true;
    this.lidEl.classList.add("opened");
    this.lidEl.style.transition = "";
    this.lidEl.style.transform = `rotateX(${this.maxAngle}deg) translateY(-4px)`;
    this.cubeEl.classList.add("settle");
    if (this.glowEl) this.glowEl.classList.add("on");
    if (this.hintEl) this.hintEl.style.display = "none";

    setTimeout(() => {
      if (typeof this.onOpened === "function") this.onOpened();
    }, 1200);
  }
}
