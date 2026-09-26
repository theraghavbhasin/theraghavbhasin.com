(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isCoarsePointer = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  const palette = ["108,140,255", "52,224,216", "255,95,174"];

  /* Real constellations (stylized, not to astronomical scale) placed at
     fixed anchors (% of viewport) that double as a positioning pitch:
     hovering (or tapping, on touch) one lights it up and surfaces what it
     stands for. Anchor percentages must match the .constellation-hit inline
     styles in index.html. `edges` are explicit index pairs rather than an
     implied chain, so each shape can branch (Orion's belt+sword, Scorpius's
     claw) instead of reading as a single loop. `sizes` (optional, defaults
     to 1) gives each constellation's brightest named star(s) a slightly
     bigger dot, for a touch of authenticity. Point spread stays short on the
     side facing the card (checked against the ~1000px breakpoint below
     which this whole layer is hidden) and longer on the outward side. */
  const CONSTELLATIONS = [
    {
      // Big Dipper (Ursa Major) — handle points away from the card. 1.3x the
      // original spacing: its short side (toward the card) had the most
      // slack of the four, so it can grow more than Cassiopeia below.
      anchor: [16, 15],
      points: [
        [-234, -78], [-156, -52], [-78, -65], [0, -39],
        [-13, 39], [78, 52], [91, -26],
      ],
      edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]],
      sizes: [1, 1, 1.1, 1, 1, 1, 1.3],
      title: "Brand & Positioning",
      desc: "Positioning sharp enough to survive a boardroom and a pitch deck.",
    },
    {
      // Orion — shoulders, belt, sword, and feet. 1.3x scale.
      anchor: [84, 25],
      points: [
        [-91, -143], [91, -130], [-32.5, -26], [0, -19.5], [32.5, -13],
        [78, 130], [-71.5, 143], [0, 52],
      ],
      edges: [[0, 1], [0, 2], [1, 4], [2, 3], [3, 4], [2, 6], [4, 5], [3, 7]],
      sizes: [1.3, 1.1, 1, 1, 1, 1, 1.3, 0.9],
      title: "Product",
      desc: "Websites and products that ship fast and don't fall over.",
    },
    {
      // Scorpius — curving tail with a hooked stinger, claws reach outward.
      // 1.3x scale — its card-facing side is the shortest of any cluster, so
      // there's plenty of room even after growing.
      anchor: [15, 78],
      points: [
        [-182, -78], [-221, -130], [-130, -117], [-52, -65], [13, -13],
        [52, 52], [39, 130], [-13, 182], [-78, 195], [-117, 143], [-84.5, 97.5],
      ],
      edges: [[0, 1], [0, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10]],
      sizes: [1, 1, 1, 1.4, 1, 1, 1, 1, 1, 1, 1],
      title: "Web & Emerging Tech",
      desc: "AI Orchestration, web deployments, and the occasional bit of magic.",
    },
    {
      // Cassiopeia — the W. Reaches roughly equally in both directions, so
      // near a corner anchor it's squeezed between the card on one side and
      // the viewport edge on the other — only a 1.1x scale fits both.
      anchor: [87, 70],
      points: [
        [132, 22], [66, -55], [0, 11], [-66, -66], [-132, 0],
      ],
      edges: [[0, 1], [1, 2], [2, 3], [3, 4]],
      title: "GTM & Growth",
      desc: "Campaigns and stories built to move metrics, for real.",
    },
  ];
  const CONSTELLATION_MIN_WIDTH = 1050;
  let hoveredConstellation = -1;

  /* ---------- Theme toggle ---------- */
  const root = document.documentElement;
  const themeToggle = document.getElementById("theme-toggle");
  // Storage can throw (blocked cookies, some private modes); never let that
  // take down the rest of the script.
  let stored = null;
  try { stored = localStorage.getItem("raghav-theme"); } catch {}
  if (stored) root.setAttribute("data-theme", stored);

  function currentTheme() {
    return root.getAttribute("data-theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }
  function syncThemeTooltip() {
    themeToggle?.setAttribute(
      "data-tooltip",
      currentTheme() === "dark" ? "Switch to light mode" : "Switch to dark mode"
    );
  }
  syncThemeTooltip();

  themeToggle?.addEventListener("click", () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("raghav-theme", next); } catch {}
    syncThemeTooltip();
  });

  /* ---------- Footer year ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Reveal on load ---------- */
  document.querySelectorAll(".reveal").forEach((el, i) => {
    el.style.transitionDelay = `${i * 90}ms`;
    requestAnimationFrame(() => el.classList.add("in-view"));
  });

  /* ---------- Custom cursor: HUD reticle ---------- */
  if (!isCoarsePointer) {
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    window.addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
    }, { passive: true });

    const reticleEl = document.querySelector(".cursor-reticle");
    const dotEl = reticleEl?.querySelector(".reticle-dot");
    const ringEl = reticleEl?.querySelector(".reticle-ring");
    let dotX = mx, dotY = my, ringX = mx, ringY = my;

    function animateReticle() {
      dotX += (mx - dotX) * 0.55;
      dotY += (my - dotY) * 0.55;
      ringX += (mx - ringX) * 0.16;
      ringY += (my - ringY) * 0.16;
      if (dotEl) dotEl.style.translate = `${dotX}px ${dotY}px`;
      if (ringEl) ringEl.style.translate = `${ringX}px ${ringY}px`;
      requestAnimationFrame(animateReticle);
    }
    requestAnimationFrame(animateReticle);

    document.querySelectorAll("a, button, .card").forEach((el) => {
      el.addEventListener("mouseenter", () => reticleEl?.classList.add("active"));
      el.addEventListener("mouseleave", () => reticleEl?.classList.remove("active"));
    });
  }

  /* ---------- Magnetic button ---------- */
  if (!isCoarsePointer && !prefersReducedMotion) {
    document.querySelectorAll(".magnetic").forEach((btn) => {
      btn.addEventListener("mousemove", (e) => {
        const rect = btn.getBoundingClientRect();
        const relX = e.clientX - rect.left - rect.width / 2;
        const relY = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${relX * 0.18}px, ${relY * 0.35}px)`;
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.transform = "translate(0, 0)";
      });
    });
  }

  /* ---------- Card tilt ---------- */
  if (!isCoarsePointer && !prefersReducedMotion) {
    document.querySelectorAll(".tilt-card").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        const rotY = (px - 0.5) * 8;
        const rotX = (0.5 - py) * 8;
        card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(4px)`;
        card.style.setProperty("--mx", `${px * 100}%`);
        card.style.setProperty("--my", `${py * 100}%`);
      });
      card.addEventListener("mouseleave", () => {
        card.style.transform = "perspective(800px) rotateX(0) rotateY(0)";
      });
    });
  }

  /* ---------- Calendly popup trigger ---------- */
  const CALENDLY_URL = "https://calendly.com/brewingstudio/20min";
  document.querySelectorAll("[data-calendly-trigger]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (window.Calendly) {
        window.Calendly.initPopupWidget({ url: CALENDLY_URL });
      } else {
        window.open(CALENDLY_URL, "_blank", "noopener,noreferrer");
      }
    });
  });

  /* ---------- Constellation hover/tap labels ---------- */
  const constellationLabel = document.getElementById("constellation-label");
  const constellationTitleEl = constellationLabel?.querySelector(".constellation-title");
  const constellationDescEl = constellationLabel?.querySelector(".constellation-desc");

  function activateConstellation(index) {
    const data = CONSTELLATIONS[index];
    if (!data || !constellationLabel) return;
    hoveredConstellation = index;
    constellationTitleEl.textContent = data.title;
    constellationDescEl.textContent = data.desc;
    const [ax, ay] = data.anchor;
    const rawLeft = (window.innerWidth * ax) / 100;
    const left = Math.min(Math.max(rawLeft, 130), window.innerWidth - 130);
    const top = ay < 50
      ? (window.innerHeight * ay) / 100 + 210
      : (window.innerHeight * ay) / 100 - 210;
    constellationLabel.style.left = `${left}px`;
    constellationLabel.style.top = `${top}px`;
    constellationLabel.classList.add("visible");
  }
  function deactivateConstellation() {
    hoveredConstellation = -1;
    constellationLabel?.classList.remove("visible");
  }

  document.querySelectorAll(".constellation-hit").forEach((hit) => {
    const index = Number(hit.dataset.index);
    if (!CONSTELLATIONS[index]) return;

    if (!isCoarsePointer) {
      hit.addEventListener("mouseenter", () => activateConstellation(index));
      hit.addEventListener("mouseleave", () => deactivateConstellation());
    }
    // Tap-to-toggle works alongside hover, since some devices report both.
    hit.addEventListener("click", (e) => {
      e.stopPropagation();
      if (hoveredConstellation === index) deactivateConstellation();
      else activateConstellation(index);
    });
  });
  // On touch devices there's no hover to dismiss the label, so any tap
  // outside a constellation's hit-area closes it.
  if (isCoarsePointer) {
    document.addEventListener("click", () => deactivateConstellation());
  }

  /* ---------- Constellation network canvas ---------- */
  const canvas = document.getElementById("node-canvas");
  if (canvas && !prefersReducedMotion) {
    const ctx = canvas.getContext("2d");
    let w, h, dpr;
    let nodes = [];
    let pointer = { x: null, y: null };

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedNodes();
    }

    function seedNodes() {
      const count = Math.round((w * h) / 32000);
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: 1.2 + Math.random() * 1.6,
        color: palette[Math.floor(Math.random() * palette.length)],
      }));
    }

    const LINK_DIST = 110;
    const POINTER_DIST = 160;

    function draw() {
      ctx.clearRect(0, 0, w, h);

      const g1 = ctx.createRadialGradient(w * 0.18, h * 0.12, 0, w * 0.18, h * 0.12, w * 0.6);
      g1.addColorStop(0, "rgba(108,140,255,0.10)");
      g1.addColorStop(1, "transparent");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);

      const g2 = ctx.createRadialGradient(w * 0.85, h * 0.8, 0, w * 0.85, h * 0.8, w * 0.55);
      g2.addColorStop(0, "rgba(255,95,174,0.08)");
      g2.addColorStop(1, "transparent");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);

      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;

        if (pointer.x !== null) {
          const dx = n.x - pointer.x;
          const dy = n.y - pointer.y;
          const dist = Math.hypot(dx, dy);
          if (dist < POINTER_DIST) {
            const force = (1 - dist / POINTER_DIST) * 0.6;
            n.x += (dx / (dist || 1)) * force;
            n.y += (dy / (dist || 1)) * force;
          }
        }

        if (n.x < 0) n.x = w; if (n.x > w) n.x = 0;
        if (n.y < 0) n.y = h; if (n.y > h) n.y = 0;
      });

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < LINK_DIST) {
            ctx.strokeStyle = `rgba(108,140,255,${0.12 * (1 - dist / LINK_DIST)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      nodes.forEach((n) => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${n.color}, 0.8)`;
        ctx.fill();
      });

      if (window.innerWidth >= CONSTELLATION_MIN_WIDTH) drawConstellations();

      requestAnimationFrame(draw);
    }

    function drawConstellations() {
      const t = performance.now() / 1000;
      CONSTELLATIONS.forEach((c, i) => {
        const active = i === hoveredConstellation;
        const ax = (w * c.anchor[0]) / 100;
        const ay = (h * c.anchor[1]) / 100;
        const pts = c.points.map(([dx, dy]) => [ax + dx, ay + dy]);
        const twinkle = 0.55 + Math.sin(t * 1.4 + i) * 0.15;
        const baseAlpha = active ? 0.85 : twinkle * 0.4;

        ctx.strokeStyle = `rgba(108,140,255,${active ? 0.65 : baseAlpha * 0.5})`;
        ctx.lineWidth = active ? 2 : 1.4;
        c.edges.forEach(([ai, bi]) => {
          const [ax1, ay1] = pts[ai];
          const [bx1, by1] = pts[bi];
          ctx.beginPath();
          ctx.moveTo(ax1, ay1);
          ctx.lineTo(bx1, by1);
          ctx.stroke();
        });

        pts.forEach(([x, y], pi) => {
          const sizeMul = c.sizes?.[pi] ?? 1;
          ctx.beginPath();
          ctx.arc(x, y, (active ? 3.2 : 2.3) * sizeMul, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${baseAlpha})`;
          ctx.fill();
        });
      });
    }

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("mousemove", (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    }, { passive: true });
    window.addEventListener("mouseleave", () => { pointer.x = null; pointer.y = null; });

    resize();
    requestAnimationFrame(draw);
  }
})();
