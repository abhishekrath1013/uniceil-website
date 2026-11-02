(function () {
  var DESIGN_WIDTH = 1402;
  var root = document.documentElement;
  var zoom = 1;
  var animated = root.classList.contains("js");

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  /* ---- Scale the 1402px design frame to the viewport ---- */
  // Phones/small tablets get a real responsive layout (no scaling); wider screens scale the 1402px design.
  var mq = window.matchMedia("(max-width: 820px)");
  var MOBILE = mq.matches;
  root.classList.toggle("m", MOBILE);
  function fit() {
    zoom = MOBILE ? 1 : (root.clientWidth || window.innerWidth) / DESIGN_WIDTH;
    root.style.setProperty("--zoom", String(zoom));
  }
  (mq.addEventListener ? mq.addEventListener.bind(mq, "change") : mq.addListener.bind(mq))(function () { location.reload(); });
  fit();

  /* ---- Reveals: play in when entering, play out when leaving, every time ---- */
  function startReveals() {
    var els = $$(".rv, .io");
    if (!animated || !("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("in"); }); return; }
    var seen = new WeakSet();
    // Enter band is narrower than the leave band so an element that has just
    // been toggled can't immediately re-trigger itself at the screen edge.
    var enter = new IntersectionObserver(function (list) {
      list.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); seen.add(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    var leave = new IntersectionObserver(function (list) {
      list.forEach(function (en) {
        if (en.isIntersecting) seen.add(en.target);
        else if (seen.has(en.target)) {
          // Only play out when it has dropped back below the screen (scrolling up).
          // Elements that were scrolled past stay revealed.
          var below = en.boundingClientRect.top > (en.rootBounds ? en.rootBounds.height : window.innerHeight) / 2;
          if (below) { en.target.classList.remove("in"); seen.delete(en.target); }
        }
      });
    }, { rootMargin: "0px 0px 60px 0px" });
    var vh = window.innerHeight;
    els.forEach(function (e) {
      var r = e.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh) { e.classList.add("in"); seen.add(e); }   // already on screen at load
      enter.observe(e); leave.observe(e);
    });
  }

  function ready() { root.classList.add("ready"); }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { requestAnimationFrame(function () { ready(); startReveals(); }); });
    setTimeout(function () { if (!root.classList.contains("ready")) { ready(); startReveals(); } }, 1500);
  } else { ready(); startReveals(); }

  /* ---- Hero: Baffle -> Soffit -> WPE, sliding up every 2s ---- */
  (function () {
    var cycle = $(".cycle");
    if (!cycle || !animated) return;
    var words = $$(".w", cycle), i = 0;
    var opts = { duration: 800, easing: "cubic-bezier(.76,0,.24,1)", fill: "forwards" };
    function settle(anim) {
      anim.finished.then(function () { try { anim.commitStyles(); } catch (e) {} anim.cancel(); }, function () {});
    }
    setInterval(function () {
      if (document.hidden) return;
      var cur = words[i];
      i = (i + 1) % words.length;
      var nxt = words[i];
      settle(cur.animate([{ transform: "translateY(0)" }, { transform: "translateY(-100%)" }], opts));
      settle(nxt.animate([{ transform: "translateY(100%)" }, { transform: "translateY(0)" }], opts));
    }, 2000);
  })();

  /* ---- Hero headline: drifts down slower than the page and fades as it leaves ---- */
  var heroParallax = (function () {
    var title = $(".hero-title");
    if (!title || !animated) return function () {};
    return function () {
      var y = window.scrollY, vh = window.innerHeight;
      if (y > vh * 1.2) return;
      title.style.transform = "translate3d(0," + (y * 0.22 / zoom) + "px,0)";
      title.style.opacity = String(1 - clamp(y / (vh * 0.9), 0, 1) * 0.85);
    };
  })();

  /* ---- Product boxes: backdrop and product drift at different speeds inside the frame ---- */
  var cardParallax = (function () {
    var cards = $$(".card");
    if (!cards.length || !animated) return function () {};
    var items = cards.map(function (c) { return { el: c, bg: $(".card-bg", c), fg: $(".card-fg", c) }; });
    return function () {
      var vh = window.innerHeight;
      items.forEach(function (it) {
        var r = it.el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        var p = clamp(((r.top + r.height / 2) - vh / 2) / vh, -1, 1);   // -1 above centre ... 1 below
        it.bg.style.transform = "translate3d(0," + (p * -18) + "px,0)";
        it.fg.style.transform = "translate3d(0," + (p * -44) + "px,0) scale(1.06)";
      });
    };
  })();

  /* ---- Intro paragraph: grey -> black, word by word, forwards and back ---- */
  var intro = (function () {
    var big = $(".intro-r .big");
    if (!big) return function () {};
    var text = big.textContent.replace(/\s+/g, " ").trim().split(" ");
    big.textContent = "";
    var spans = text.map(function (w, i) {
      var s = document.createElement("span");
      s.className = "w"; s.textContent = w;
      big.appendChild(s);
      if (i < text.length - 1) big.appendChild(document.createTextNode(" "));
      return s;
    });
    var last = -1;
    return function () {
      var r = big.getBoundingClientRect(), vh = window.innerHeight;
      var p = clamp((vh * 0.8 - r.top) / (vh * 0.35 + r.height), 0, 1);
      var on = Math.round(p * spans.length);
      if (on === last) return;
      last = on;
      spans.forEach(function (s, i) { s.classList.toggle("on", i < on); });
    };
  })();

  /* ---- Wall / Ceiling / Facade: each card slides in by itself once its mark is crossed ---- */
  var stack = (function () {
    var wrap = $("#stack");
    if (!wrap) return function () {};
    var cards = $$(".benefit", wrap);
    return function () {
      if (!animated) { cards.forEach(function (c) { c.classList.add("on"); }); return; }
      var r = wrap.getBoundingClientRect();
      var travel = r.height - window.innerHeight;
      var p = travel > 0 ? clamp(-r.top / travel, 0, 1) : 0;
      cards.forEach(function (c, k) {
        if (k === 0) return;
        // card k arrives at k/(n-1) of the runway, minus a lead so it has finished by then
        var mark = (k / (cards.length - 1)) * 0.82 - 0.12;
        c.classList.toggle("on", p >= mark);
      });
    };
  })();

  /* ---- Project slider: slow endless marquee, same-size tiles, hover to grow ---- */
  (function () {
    var sl = $("#slider");
    if (!sl) return;
    var tpl = $$(".sl", sl).map(function (el) { return el.innerHTML; });
    var n = tpl.length, COPIES = 2, L = n * COPIES;
    var TILE_W = MOBILE ? 200 : 290.413, TILE_H = MOBILE ? 166 : 241.86, GAP = MOBILE ? 14 : 24, CAP = 15.543 + 22, CX = (sl.clientWidth || 1402) / 2, CY = MOBILE ? 145 : 209;
    var PITCH = TILE_W + GAP;
    var SPEED = animated ? 0.15 : 0;                   // tiles per second (~47px/s)

    sl.textContent = "";
    var items = [];
    for (var i = 0; i < L; i++) {
      var el = document.createElement("figure");
      el.className = "sl";
      el.innerHTML = tpl[i % n];
      sl.appendChild(el);
      items.push(el);
    }
    var y = CY - (TILE_H + CAP) / 2;

    var pos = Math.floor(n / 2), dragging = false, visible = true, last = 0, sx = 0, sp = 0, hover = false, spd = SPEED;
    function render() {
      for (var i = 0; i < L; i++) {
        var d = (((i - pos + L / 2) % L) + L) % L - L / 2;
        items[i].style.transform = "translate3d(" + (CX + d * PITCH - TILE_W / 2) + "px," + y + "px,0)";
      }
    }
    function frame(t) {
      var dt = Math.min(0.05, (t - last) / 1000 || 0);
      last = t;
      spd += ((hover ? 0 : SPEED) - spd) * Math.min(1, dt * 7);   // ease to a stop / back up to speed
      if (visible && !dragging) pos = (pos + spd * dt) % L;
      if (visible) render();
      requestAnimationFrame(frame);
    }

    sl.addEventListener("pointerdown", function (e) {
      dragging = true; sx = e.clientX; sp = pos; sl.classList.add("drag");
      try { sl.setPointerCapture(e.pointerId); } catch (err) {}
    });
    sl.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      pos = (((sp - (e.clientX - sx) / zoom / PITCH) % L) + L) % L;
    });
    function end() { dragging = false; sl.classList.remove("drag"); }
    sl.addEventListener("pointerup", end);
    sl.addEventListener("pointercancel", end);
    sl.addEventListener("pointerenter", function (e) { if (e.pointerType !== "touch") hover = true; });
    sl.addEventListener("pointerleave", function () { hover = false; });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }, { rootMargin: "200px 0px" }).observe(sl);
    }
    render();
    requestAnimationFrame(frame);
  })();

  /* ---- Real spaces: "Real spaces," starts top-left, "real profiles." bottom-right, they meet on scroll ---- */
  var real = (function () {
    var sc = $("#real");
    if (!sc || !animated) return function () {};
    var pin = $(".real-pin", sc), r1 = $(".r1", sc), r2 = $(".r2", sc);
    return function () {
      var r = sc.getBoundingClientRect(), travel = r.height - window.innerHeight;
      var p = travel > 0 ? clamp(-r.top / travel, 0, 1) : 0;
      var H = pin.getBoundingClientRect().height / zoom;
      var d = Math.max(0, (H - r1.offsetHeight - r2.offsetHeight) / 2 - 28);
      var t = ease(clamp(p / 0.75, 0, 1));
      r1.style.transform = "translate3d(0," + (-d * (1 - t)) + "px,0)";
      r2.style.transform = "translate3d(0," + (d * (1 - t)) + "px,0)";
    };
  })();

  /* ---- Sourcing: headline pinned, photos rise past it; 2nd headline arrives with the last photo ---- */
  var source = (function () {
    var sc = $("#source");
    if (!sc) return function () {};
    var st = $(".source-pin", sc), ims = $$(".im", sc), p2 = $(".p2", sc), STEP = 0.3, WIN = 0.4;
    return function () {
      var r = sc.getBoundingClientRect(), travel = r.height - window.innerHeight;
      var p = travel > 0 ? clamp(-r.top / travel, 0, 1) : 0;
      var H = st.getBoundingClientRect().height / zoom;
      ims.forEach(function (im, k) {
        var h = im.offsetHeight || parseFloat(im.getAttribute("data-h"));
        var local = clamp((p - k * STEP) / WIN, 0, 1);
        im.style.transform = "translateY(" + lerp(H + 30, -h - 30, local) + "px)";
        im.firstElementChild.style.transform = "scale(" + (1 + 0.35 * (1 - ease(clamp(local * 2, 0, 1)))) + ")";
      });
      p2.classList.toggle("in", p > (ims.length - 1) * STEP + 0.03);
    };
  })();

  /* ---- Video circle: plays while in view, grows into the full-bleed video ---- */
  var circle = (function () {
    var sc = $("#circ");
    if (!sc) return function () {};
    var st = $(".circ-pin", sc), photo = $(".circ-photo", sc), vid = $("video", photo), shade = $(".circ-shade", sc);
    var playing = false;
    function play() {
      if (playing || !vid || !animated) return;
      playing = true;
      var pr = vid.play(); if (pr && pr.catch) pr.catch(function () { playing = false; });
    }
    function pause() { if (!playing) return; playing = false; vid.pause(); }
    return function () {
      var r = sc.getBoundingClientRect(), vh = window.innerHeight, travel = r.height - vh;
      var p = travel > 0 ? clamp(-r.top / travel, 0, 1) : 0;
      var s = st.getBoundingClientRect(), W = s.width / zoom, H = s.height / zoom;
      var a = ease(clamp(p / 0.12, 0, 1));                  // 1. circle settles in
      var t = ease(clamp((p - 0.12) / 0.62, 0, 1));         // 2. grows to fill the screen
      var R0 = Math.min(210, H * 0.27);
      var R = lerp(lerp(R0 * 0.8, R0, a), Math.hypot(W / 2, H / 2), t);
      photo.style.clipPath = "circle(" + R + "px at 50% 50%)";
      vid.style.transform = "scale(" + lerp(1.35, 1, t) + ")";
      shade.style.opacity = String(t);
      sc.classList.toggle("in", p > 0.82);
      if (r.top < vh * 0.85 && r.bottom > 0) play(); else pause();
    };
  })();

  /* ---- Projects: cards stack; the one underneath scales back and dims as the next covers it ---- */
  var projects = (function () {
    var wrap = $("#pstack");
    if (!wrap || !animated) return function () {};
    var rows = $$(".row", wrap);
    return function () {
      var vh = window.innerHeight;
      if (wrap.getBoundingClientRect().top > vh) return;
      rows.forEach(function (row, k) {
        var nx = rows[k + 1];
        if (!nx) return;
        var nr = nx.getBoundingClientRect(), rr = row.getBoundingClientRect();
        var stuckTop = parseFloat(getComputedStyle(nx).top) * zoom;
        var cover = clamp(1 - (nr.top - stuckTop) / Math.max(1, rr.height), 0, 1);
        row.style.transform = "scale(" + (1 - 0.035 * cover) + ")";
        row.style.setProperty("--cv", cover.toFixed(3));
      });
    };
  })();

  /* ---- Gallery: centre image grows to fill the viewport, then the text arrives ---- */
  var expand = (function () {
    var ex = $("#expand");
    if (!ex) return { measure: function () {}, update: function () {} };
    var st = $(".ex-stick", ex), big = $(".ex-big", ex), shade = $(".ex-shade", ex);
    var center = $(".ex-center", ex);
    var sides = $$(".ex-row .g", ex).filter(function (g) { return g !== center; });
    var geo = null;

    function measure() {
      var s = st.getBoundingClientRect(), c = center.getBoundingClientRect();
      geo = { x: (c.left - s.left) / zoom, y: (c.top - s.top) / zoom, w: c.width / zoom, h: c.height / zoom,
              W: s.width / zoom, H: s.height / zoom };
      update();
    }
    function update() {
      if (!geo) return;
      var r = ex.getBoundingClientRect();
      var travel = r.height - window.innerHeight;
      var p = travel > 0 ? clamp(-r.top / travel, 0, 1) : 0;
      var t = ease(clamp(p / 0.7, 0, 1));
      big.style.left = lerp(geo.x, 0, t) + "px";
      big.style.top = lerp(geo.y, 0, t) + "px";
      big.style.width = lerp(geo.w, geo.W, t) + "px";
      big.style.height = lerp(geo.h, geo.H, t) + "px";
      shade.style.opacity = String(t);
      var fade = 1 - clamp(t * 1.6, 0, 1);
      sides.forEach(function (g, i) {
        var dir = i < 2 ? -1 : 1, far = (i === 0 || i === 3) ? 1.25 : 1;
        g.style.transform = "translateX(" + dir * t * 280 * far + "px)";
        g.style.opacity = String(fade);
      });
      ex.classList.toggle("in", p > 0.78);
    }
    return { measure: measure, update: update };
  })();

  /* ---- Certifications: numbers count up from 0 each time they come into view ---- */
  (function () {
    if (!animated) return;
    $$(".stat").forEach(function (stat) {
      var c = $(".cnt", stat);
      if (!c) return;
      var to = parseFloat(c.getAttribute("data-to")), raf = 0, timer = 0;
      var delay = (parseFloat(stat.style.getPropertyValue("--i")) || 0) * 140 + 200;
      function fmt(v) { return Math.round(v).toLocaleString("en-US"); }
      function reset() { cancelAnimationFrame(raf); clearTimeout(timer); c.textContent = fmt(0); }
      function run() {
        reset();
        timer = setTimeout(function () {
          var t0 = performance.now(), dur = 1900;
          (function step(t) {
            var k = clamp((t - t0) / dur, 0, 1);
            c.textContent = fmt(to * (1 - Math.pow(1 - k, 4)));
            if (k < 1) raf = requestAnimationFrame(step);
          })(t0);
        }, delay);
      }
      reset();
      new MutationObserver(function () { if (stat.classList.contains("in")) run(); else reset(); })
        .observe(stat, { attributes: true, attributeFilter: ["class"] });
      if (stat.classList.contains("in")) run();
    });
  })();

  /* ---- Footer: wordmark stays put, the photos rise into place one by one ---- */
  var wordmark = (function () {
    var sc = $("#wmscene");
    if (!sc) return function () {};
    var wmW = 0;
    var pin = $(".wm-pin", sc), box = $(".wordmark", sc), sq = $$(".collage", sc);
    return function () {
      var r = sc.getBoundingClientRect(), travel = r.height - window.innerHeight;
      var p = travel > 0 ? clamp(-r.top / travel, 0, 1) : 0;
      var H = pin.getBoundingClientRect().height / zoom;
      if (!wmW && (!document.fonts || document.fonts.status === "loaded")) { var mk = $(".mk", box); if (mk) { var rg = document.createRange(); rg.selectNodeContents(mk); wmW = rg.getBoundingClientRect().width / zoom / (parseFloat(getComputedStyle(box).getPropertyValue("--wms")) || 1); } }
      var fitW = wmW ? Math.min(1, (pin.getBoundingClientRect().width / zoom - (MOBILE ? 32 : 100)) / wmW) : 1;
      box.style.setProperty("--wms", String(Math.min(1, H / 830, fitW)));
      sq.forEach(function (s, k) {
        var h = s.offsetHeight || parseFloat(s.getAttribute("data-h"));
        var local = clamp((p - k * 0.22) / 0.34, 0, 1);
        s.style.transform = "translateY(" + lerp(H + 30, -h - 30, local) + "px)";
      });
    };
  })();

  /* ---- Menu ---- */
  var menuFab = (function () {
    var menu = $("#menu"), fab = $(".menu-fab");
    if (!menu) return function () {};
    var openers = $$(".menu-btn, .menu-fab"), isOpen = false, logoEl = $(".site-logo");
    function open() {
      if (isOpen) return;
      isOpen = true;
      logoEl && logoEl.classList.add("light");
      menu.classList.add("open");
      menu.setAttribute("aria-hidden", "false");
      setTimeout(function () { if (isOpen) menu.classList.add("in"); }, 250);
      var cl = $(".menu-close", menu); if (cl) setTimeout(function () { cl.focus({ preventScroll: true }); }, 400);
    }
    function close(then) {
      if (!isOpen) return;
      isOpen = false;
      setTimeout(function () { onScroll(); }, 60);
      menu.classList.remove("in");
      menu.classList.remove("open");
      menu.setAttribute("aria-hidden", "true");
      if (then) setTimeout(then, 450);
    }
    openers.forEach(function (b) { b.addEventListener("click", open); });
    $(".menu-close", menu).addEventListener("click", function () { close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    $$("a[href^='#']", menu).forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var id = a.getAttribute("href"), target = id.length > 1 ? $(id) : null;
        close(function () {
          if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
          else window.scrollTo({ top: 0, behavior: "smooth" });
        });
      });
    });
    // keep the page still while the menu is open
    menu.addEventListener("wheel", function (e) { e.preventDefault(); }, { passive: false });
    menu.addEventListener("touchmove", function (e) { e.preventDefault(); }, { passive: false });
    var logo = $(".site-logo");
    var darks = $$("#stack, #circ, #expand, .materials");
    if (logo) logo.addEventListener("click", function (e) {
      if (logo.getAttribute("href") !== "#") return;
      e.preventDefault();
      close(function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
      if (!isOpen) window.scrollTo({ top: 0, behavior: "smooth" });
    });
    return function () {
      fab.classList.toggle("show", window.scrollY > 220);
      if (!logo) return;
      // white while the menu is open or when the logo sits over a dark section
      var lr = logo.getBoundingClientRect(), y = lr.top + lr.height / 2, light = isOpen;
      if (!light) darks.forEach(function (d) {
        if (d.id === "circ" && !d.classList.contains("in")) return;
        if (d.id === "expand" && !d.classList.contains("in")) return;
        var r = d.getBoundingClientRect();
        if (r.top <= y && r.bottom >= y) light = true;
      });
      logo.classList.toggle("light", light);
    };
  })();

  /* ---- Scroll / resize wiring ---- */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; heroParallax(); cardParallax(); intro(); stack(); real(); source(); circle(); projects(); wordmark(); menuFab(); expand.update(); });
  }
  function relayout() { fit(); expand.measure(); onScroll(); }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", relayout);
  window.addEventListener("orientationchange", relayout);
  window.addEventListener("load", relayout);
  expand.measure(); onScroll();
})();
