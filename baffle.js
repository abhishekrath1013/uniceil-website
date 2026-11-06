// Baffle product page: the hero card shrinks into a fixed left panel; the product rotates with the
// scroll while "Why It's Specified" and "Specifications" scroll on the right.
(function () {
  var root = document.documentElement;
  var sc = document.getElementById("pphero");
  if (!sc) return;
  var pin = sc.querySelector(".pp-pin"), title = sc.querySelector(".pp-title");
  var vl = sc.querySelector(".pp-var.l"), vr = sc.querySelector(".pp-var.r"), cap = sc.querySelector(".pp-cap");
  var trav = document.querySelector(".pp-trav");

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function smooth(t) { return t * t * (3 - 2 * t); }

  var HERO_FIT = 1.0, PANEL_FIT = 1.3;

  // Per-product data. `pitch` tilts the main model so its lighting line faces the viewer.
  var PRODUCTS = {
    direct: {
      name: "Baffle Direct", pitch: -0.3,
      specs: {
        material: "100% recyclable uPVC", config: "Linear · direct-down lighting", width: "84mm – 150mm",
        length: "Up to 6000mm, custom cut", lighting: "Integrated direct-down LED channel",
        fire: "Class B-s1, d0 rated core", finish: "Matte, gloss, wood-look laminate", warranty: "10-year manufacturing warranty",
      },
    },
    cove: {
      name: "Baffle Cove", pitch: 0.5,
      specs: {
        material: "100% recyclable uPVC", config: "In-Fill · cove-lit reveal", width: "150mm – 300mm",
        length: "Up to 4000mm, custom cut", lighting: "Cove channel, warm-white or tunable",
        fire: "Class B-s1, d0 rated core", finish: "Matte, wood-look laminate", warranty: "10-year manufacturing warranty",
      },
    },
    indirect: {
      name: "Baffle Indirect", pitch: 0.5,
      specs: {
        material: "100% recyclable uPVC", config: "Open baffle blades · indirect lighting", width: "100mm – 200mm blades",
        length: "Up to 6000mm, custom cut", lighting: "Indirect uplight channel, optional",
        fire: "Class B-s1, d0 rated core", finish: "Matte, gloss", warranty: "10-year manufacturing warranty",
      },
    },
  };
  var ORDER = ["direct", "cove", "indirect"];
  var current = "direct", pitchCur = null;
  var hint = sc.querySelector(".pp-hint");
  var hintNames = Array.prototype.slice.call(document.querySelectorAll(".pp-hint .nm"));
  var dotSets = Array.prototype.slice.call(document.querySelectorAll(".pp-hint .dots")).map(function (d) { return Array.prototype.slice.call(d.querySelectorAll("i")); });
  var specTag = document.getElementById("spec-tag"), specList = document.querySelector(".specs-t");

  function applyProduct(key) {
    var P = PRODUCTS[key]; if (!P) return;
    current = key;
    hintNames.forEach(function (n) { n.textContent = P.name; });
    dotSets.forEach(function (ds) { ds.forEach(function (d, i) { d.classList.toggle("on", ORDER[i] === key); }); });
    if (specTag) specTag.textContent = P.name;
    if (specList) {
      specList.classList.add("swap");
      setTimeout(function () {
        Array.prototype.forEach.call(specList.querySelectorAll("dd[data-k]"), function (dd) { dd.textContent = P.specs[dd.getAttribute("data-k")]; });
        specList.classList.remove("swap");
      }, 250);
    }
    easePitch();
  }
  window.addEventListener("baffle-select", function (e) { applyProduct(e.detail.variant); });

  // glide the tilt when the product changes (the line sits on the underside of "direct")
  var easing = false;
  function easePitch() {
    if (easing) return; easing = true;
    (function step() {
      var tgt = PRODUCTS[current].pitch;
      pitchCur += (tgt - pitchCur) * 0.12;
      update();
      if (Math.abs(tgt - pitchCur) > 0.004) requestAnimationFrame(step); else { pitchCur = tgt; easing = false; update(); }
    })();
  }

  // swipe on the hero (outside the draggable product) or arrow keys switch products
  var sw = null;
  var panelEl = document.querySelector(".pp-body .pp-panel");
  function heroVisible() {
    var r = sc.getBoundingClientRect(), h = window.innerHeight;
    if (r.bottom > h * 0.5 && r.top < h * 0.5) return true;
    var pr = panelEl.getBoundingClientRect();
    return pr.top < h * 0.8 && pr.bottom > h * 0.2;
  }
  Array.prototype.forEach.call(document.querySelectorAll("[data-sw]"), function (b) {
    b.addEventListener("click", function () { if (window.Baffle3D) window.Baffle3D.select(b.getAttribute("data-sw")); });
  });
  window.addEventListener("pointerdown", function (e) {
    if (!heroVisible() || (e.target.closest && e.target.closest("a,button,[role=dialog]"))) return;
    var B = window.Baffle3D, m = B && B.views.main, r = m && m.rect;
    if (r && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) return;
    sw = { x: e.clientX, y: e.clientY };
  });
  window.addEventListener("pointerup", function (e) {
    if (!sw) return;
    var dx = e.clientX - sw.x, dy = e.clientY - sw.y; sw = null;
    if (Math.abs(dx) > 60 && Math.abs(dy) < 70 && window.Baffle3D) window.Baffle3D.select(dx < 0 ? "right" : "left");
  });
  window.addEventListener("keydown", function (e) {
    if (!heroVisible() || !window.Baffle3D) return;
    if (e.key === "ArrowRight") window.Baffle3D.select("right");
    else if (e.key === "ArrowLeft") window.Baffle3D.select("left");
  });

  var card = document.querySelector(".pp-card"), hint2 = document.querySelector(".pp-hint2");
  var body = document.getElementById("why");
  var panel = document.querySelector(".pp-body .pp-panel");
  var split = document.querySelector(".pp-body .pp-split");

  function update() {
    var z = parseFloat(getComputedStyle(root).getPropertyValue("--zoom")) || 1;
    var vw = window.innerWidth, vh = window.innerHeight;
    var mob = vw <= 820;
    var r = sc.getBoundingClientRect(), travel = r.height - vh;
    var p = travel > 0 ? clamp(-r.top / travel, 0, 1) : 0;
    var t = ease(clamp(p / 0.35, 0, 1));            // intro: title leaves, side products + caption arrive
    var s = smooth(clamp((p - 0.55) / 0.45, 0, 1)); // hero card shrinks into the left panel

    title.style.transform = "translateY(" + (-t * 150) + "px)";
    title.style.opacity = String(1 - clamp(t * 1.6, 0, 1));
    vl.style.transform = "translateX(" + (-(1 - t) * 340) + "px)";
    vr.style.transform = "translateX(" + ((1 - t) * 340) + "px)";
    var fade = String(1 - clamp(s * 3, 0, 1));
    vl.style.opacity = vr.style.opacity = fade;
    cap.classList.toggle("on", t > 0.6 && s < 0.12);
    if (hint) hint.classList.toggle("on", t > 0.6 && s < 0.12);

    // --- target: the sticky left panel (stuck position, or following it out at the end)
    var pr = panel.getBoundingClientRect(), PT = mob ? 76 : 96 * z;
    var tg = { x: pr.left, y: Math.min(pr.top, PT), w: pr.width, h: pr.height };

    // --- grey grid card: full screen -> panel
    var cx0 = lerp(0, tg.x, s), cy0 = lerp(0, tg.y, s), cw = lerp(vw, tg.w, s), ch = lerp(vh, tg.h, s);
    card.style.left = cx0 + "px"; card.style.top = cy0 + "px";
    card.style.width = cw + "px"; card.style.height = ch + "px";
    hint2.style.left = cx0 / z + "px"; hint2.style.width = cw / z + "px";
    hint2.style.bottom = (vh - cy0 - ch) / z + 18 + "px";
    hint2.style.opacity = String(clamp((s - 0.85) / 0.15, 0, 1));
    hint2.style.pointerEvents = s > 0.95 ? "auto" : "none";
    card.style.borderRadius = lerp(0, 16 * z, s) + "px";
    var gs = lerp(86, 59, s) * z;
    card.style.backgroundSize = gs + "px " + gs + "px";

    // --- the 3D product: hero position -> centred in the panel
    var hh = mob ? vw * 0.62 : Math.max(560 * z, vh) * 0.62, k = lerp(1.1, 1.3, t);
    var hero = { cx: vw / 2, cy: lerp(0.5, mob ? 0.33 : 0.44, t) * vh, w: hh * 1.25 * k, h: hh * k, fit: mob ? 1.0 : 1.28 };
    var pw = Math.min(tg.w * 0.96, tg.h * 0.8 * 1.25), ph = pw / 1.25;
    var cur = {
      cx: lerp(hero.cx, tg.x + tg.w / 2, s), cy: lerp(hero.cy, tg.y + tg.h / 2, s),
      w: lerp(hero.w, pw, s), h: lerp(hero.h, ph, s), fit: lerp(hero.fit, mob ? 0.8 : PANEL_FIT, s),
    };
    // the 3D view is a scissored rectangle: make it generously larger than the product (same visual size via fit)
    var F = 1.7, bw = cur.w * F, bh = cur.h * F;
    cur.fit /= F;
    trav.style.left = (cur.cx - bw / 2) + "px";
    trav.style.top = (cur.cy - bh / 2) + "px";
    trav.style.width = bw + "px";
    trav.style.height = bh + "px";

    // --- orientation: hero angle eases to the same angle as the side products; no scroll-driven spin (drag to rotate)
    var B = window.Baffle3D;
    if (pitchCur === null) pitchCur = PRODUCTS[current].pitch;
    if (B && B.views.main) {
      var m = B.views.main;
      m.yaw = lerp(0.95, 1.12, s);
      m.pitch = lerp(0.7, pitchCur, s);
      m.fit = cur.fit;
      m.hit = { left: cur.cx - cur.w / 2, right: cur.cx + cur.w / 2, top: cur.cy - cur.h / 2, bottom: cur.cy + cur.h / 2 };
    }
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; update(); });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  window.addEventListener("load", update);
  window.addEventListener("b3d-loaded", update);
  update();
})();
