(function () {
  // ---------- background stars ----------
  function scatterStars() {
    const box = document.getElementById("stars");
    const n = 46;
    for (let i = 0; i < n; i++) {
      const s = document.createElement("span");
      s.style.left = Math.random() * 100 + "%";
      s.style.top = Math.random() * 100 + "%";
      s.style.animationDelay = Math.random() * 4 + "s";
      s.style.opacity = (0.2 + Math.random() * 0.6).toFixed(2);
      box.appendChild(s);
    }
  }

  // ---------- step engine ----------
  function StepFlow() {
    function goTo(n) {
      const current = document.querySelector(".step.active");
      const next = document.querySelector('.step[data-step="' + n + '"]');
      if (!next) return;
      if (current) {
        current.classList.add("leaving");
        setTimeout(() => {
          current.classList.remove("active", "leaving");
          next.classList.add("active");
        }, 480);
      } else {
        next.classList.add("active");
      }
    }
    document.querySelectorAll("[data-next]").forEach(btn => {
      btn.addEventListener("click", () => {
        const cur = btn.closest(".step");
        const curN = parseInt(cur.dataset.step, 10);
        goTo(curN + 1);
      });
    });
    return { goTo };
  }

  function main() {
    scatterStars();
    const flow = StepFlow();

    const audio = new AudioEngine();
    const unlockOnce = () => { audio.unlock(); window.removeEventListener("pointerdown", unlockOnce); };
    window.addEventListener("pointerdown", unlockOnce);

    const canvas = document.getElementById("fw-canvas");
    const fireworks = new FireworksEngine(canvas, audio);

    // ---- gift box ----
    const giftBox = new GiftBox({
      wrapEl: document.getElementById("giftWrap"),
      lidEl: document.getElementById("lidHinge"),
      cubeEl: document.getElementById("cube"),
      glowEl: document.querySelector(".glow-inside"),
      hintEl: document.getElementById("giftHint"),
      onOpened: () => flow.goTo(1)
    });

    // ---- cake + matchstick, wired once step 5 is reached ----
    const cake = new Cake({
      sparklerEl: document.getElementById("sparkler"),
      glowEl: document.getElementById("sparklerGlow"),
      fireworksEngine: fireworks,
      audio
    });

    const matchSystem = new MatchSystem({
      matchEl: document.getElementById("matchstick"),
      strikeboxEl: document.getElementById("strikebox"),
      mflameEl: document.getElementById("mflame"),
      audio,
      captionEl: document.getElementById("sceneCaption")
    });

    let sceneReady = false;
    function setupScene5() {
      if (sceneReady) return;
      sceneReady = true;

      matchSystem.setTarget(cake.getWickTarget(), () => {
        matchSystem.setCaption("");
        cake.light(26000);
        setTimeout(() => {
          document.getElementById("finale").classList.add("show");
        }, 900);
        fireworks.runShow(60000);
      });
    }

    // watch for step 5 becoming active to size everything correctly
    const observer = new MutationObserver(() => {
      const step5 = document.querySelector('.step[data-step="5"]');
      if (step5.classList.contains("active")) {
        setupScene5();
      }
    });
    document.querySelectorAll(".step").forEach(s => observer.observe(s, { attributes: true, attributeFilter: ["class"] }));
  }

  document.addEventListener("DOMContentLoaded", main);
})();
