// Baffle product page: hero scene, then the selected baffle travels with the scroll
// through "Why It's Specified" and "Specifications" (a fixed 3D view driven by scroll).
(function () {
  var root = document.documentElement;
  var sc = document.getElementById("pphero");
  if (!sc) return;
  var pin = sc.querySelector(".pp-pin"), title = sc.querySelector(".pp-title");
  var vl = sc.querySelector(".pp-var.l"), vr = sc.querySelector(".pp-var.r"), cap = sc.querySelector(".pp-cap");
  var trav = document.querySelector(".pp-trav");
  var anchors = Array.prototype.slice.call(document.querySelectorAll(".pp-anchor"));

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function smooth(t) { return t * t * (3 - 2 * t); }

  var HERO_FIT = 1.0, PANEL_FIT = 0.95;

  function update() {
    var z = parseFloat(getComputedStyle(root).getPropertyValue("--zoom")) || 1;
    var vw = window.innerWidth, vh = window.innerHeight;
    var r = sc.getBoundingClientRect(), travel = r.height - vh;
    var p = travel > 0 ? clamp(-r.top / travel, 0, 1) : 0;
    var t = ease(clamp(p / 0.7, 0, 1));

    title.style.transform = "translateY(" + (-t * 150) + "px)";
    title.style.opacity = String(1 - clamp(t * 1.6, 0, 1));
    vl.style.transform = "translateX(" + (-(1 - t) * 340) + "px)";
    vr.style.transform = "translateX(" + ((1 - t) * 340) + "px)";
    cap.classList.toggle("on", t > 0.6);

    // --- the traveller: hero position -> panel 1 -> panel 2, all in real viewport pixels
    var mob = vw <= 820;
    var hh = mob ? vw * 0.62 : Math.max(560 * z, vh) * 0.62, s = lerp(0.92, 0.9, t);
    var cur = { cx: vw / 2, cy: lerp(0.56, mob ? 0.33 : 0.37, t) * vh, w: hh * 1.25 * s, h: hh * s, fit: mob ? 1.0 : lerp(1.28, 1.25, t) };
    for (var i = 0; i < anchors.length; i++) {
      var a = anchors[i].getBoundingClientRect();
      var u = smooth(clamp(1 - a.top / vh, 0, 1));
      if (u <= 0) continue;
      cur = {
        cx: lerp(cur.cx, a.left + a.width / 2, u), cy: lerp(cur.cy, a.top + a.height / 2, u),
        w: lerp(cur.w, a.width, u), h: lerp(cur.h, a.height, u), fit: lerp(cur.fit, mob ? 0.8 : PANEL_FIT, u),
      };
    }
    trav.style.left = (cur.cx - cur.w / 2) + "px";
    trav.style.top = (cur.cy - cur.h / 2) + "px";
    trav.style.width = cur.w + "px";
    trav.style.height = cur.h + "px";
    // spin once while travelling to the cards, then rest at a different angle
    var tu = anchors.length ? smooth(clamp(1 - anchors[0].getBoundingClientRect().top / vh, 0, 1)) : 0;
    var B = window.Baffle3D;
    if (B && B.views.main) { B.views.main.yaw = 1.12 + tu * (Math.PI * 2 - 0.5); B.views.main.pitch = lerp(0.5, 0.4, tu); }
    if (B && B.views.main) B.views.main.fit = cur.fit;
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
