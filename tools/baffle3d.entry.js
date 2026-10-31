import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Box3, Vector3, PMREMGenerator, SRGBColorSpace,
  DirectionalLight, HemisphereLight, MathUtils, NoToneMapping,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

// One fixed transparent canvas draws every baffle, scissored to the box of its placeholder element.
// Roles: "main" (wood, draggable, travels down the page) and "left"/"right" (pale, clickable to select).
(function () {
  var GLB = window.BAFFLE_GLB;
  var els = Array.prototype.slice.call(document.querySelectorAll("[data-b3d]"));
  if (!GLB || !els.length) return;

  var canvas = document.createElement("canvas");
  canvas.className = "b3d-canvas";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);

  var renderer;
  try {
    renderer = new WebGLRenderer({ canvas: canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  } catch (e) { canvas.remove(); document.documentElement.classList.add("no-webgl"); return; }
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NoToneMapping;
  renderer.autoClear = false;
  renderer.setClearColor(0x000000, 0);

  var env = new PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;

  function fit() {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  }
  fit();
  window.addEventListener("resize", fit);

  function decode(b64) {
    var s = atob(b64), n = s.length, u = new Uint8Array(n);
    for (var i = 0; i < n; i++) u[i] = s.charCodeAt(i);
    return u.buffer;
  }

  var STYLE = {
    main: { color: [0.5, 0.46, 0.46], sat: 0.85 },
    pale: { color: [1.7, 1.6, 1.62], sat: 0.12 },
  };
  var KEYS = ["direct", "cove", "indirect"];
  var LENGTH = 2.7;

  var loader = new GLTFLoader();
  var gltfs = {};
  var views = {};
  var order = { left: "indirect", main: "direct", right: "cove" };

  function parseVariant(key) {
    return new Promise(function (res, rej) { loader.parse(decode(GLB[key]), "", function (g) { gltfs[key] = g; res(); }, rej); });
  }

  function makeModel(key) {
    var model = gltfs[key].scene.clone(true), mats = [];
    model.traverse(function (o) {
      if (!o.isMesh) return;
      o.material = o.material.clone();
      var m = o.material;
      m.envMapIntensity = 0.95;
      if (m.map) {
        var u = { value: 1 };
        m.onBeforeCompile = function (sh) {
          sh.uniforms.uSat = u;
          sh.fragmentShader = "uniform float uSat;\n" + sh.fragmentShader.replace("#include <map_fragment>",
            "#include <map_fragment>\n float lm = dot(diffuseColor.rgb, vec3(.2126,.7152,.0722)); diffuseColor.rgb = mix(vec3(lm), diffuseColor.rgb, uSat);");
        };
        m.customProgramCacheKey = function () { return "sat"; };
        mats.push({ m: m, u: u });
      }
    });
    model.scale.z = LENGTH;
    model.updateMatrixWorld(true);
    var box = new Box3().setFromObject(model), c = box.getCenter(new Vector3()), r = box.getSize(new Vector3()).length() / 2;
    model.position.set(-c.x, -c.y, -c.z);
    var pivot = new Group();
    pivot.add(model);
    pivot.scale.setScalar(1 / r);
    pivot.visible = false;
    return { pivot: pivot, mats: mats };
  }

  function buildView(el) {
    var role = el.getAttribute("data-role") || "main";
    var scene = new Scene();
    scene.environment = env;
    var rig = new Group();
    scene.add(rig);
    var models = {};
    KEYS.forEach(function (k) { models[k] = makeModel(k); rig.add(models[k].pivot); });
    scene.add(new HemisphereLight(0xffffff, 0xd8d8d2, 0.55));
    var key1 = new DirectionalLight(0xffffff, 1.35); key1.position.set(-2.5, 4, 3); scene.add(key1);
    var fill = new DirectionalLight(0xfff3e6, 0.45); fill.position.set(3, 1, -2); scene.add(fill);

    var v = {
      el: el, role: role, scene: scene, cam: new PerspectiveCamera(22, 1, 0.1, 50), rig: rig, models: models, variant: null,
      yaw: parseFloat(el.getAttribute("data-yaw") || "1.12"), pitch: parseFloat(el.getAttribute("data-pitch") || "0.5"),
      fit: parseFloat(el.getAttribute("data-fit") || "1"), spin: 0, ty: 0, dragging: false, lx: 0, ly: 0,
      fade: 1, t0: Math.random() * 6, rect: null,
    };
    v.show = function (key) {
      v.variant = key;
      KEYS.forEach(function (k) {
        models[k].pivot.visible = k === key;
        var st = STYLE[role === "main" ? "main" : "pale"];
        models[k].mats.forEach(function (x) { x.m.color.setRGB(st.color[0], st.color[1], st.color[2]); x.u.value = st.sat; });
      });
    };
    v.show(order[role]);
    views[role] = v;
    return v;
  }

  function swapTo(role) {
    if (role === "main") return;
    var old = { left: order.left, main: order.main, right: order.right };
    order = role === "right" ? { left: old.main, main: old.right, right: old.left } : { left: old.right, main: old.left, right: old.main };
    ["left", "main", "right"].forEach(function (r) {
      var v = views[r]; if (!v) return;
      v.show(order[r]); v.fade = 0; v.spin = r === "main" ? -1.6 : 0.8;
    });
    window.dispatchEvent(new CustomEvent("baffle-select", { detail: { variant: order.main } }));
  }

  function alphaOf(el) {
    var a = 1;
    for (var n = el; n && n.nodeType === 1; n = n.parentElement) {
      var o = parseFloat(getComputedStyle(n).opacity);
      if (o < 1) a *= o;
      if (a <= 0.003) return 0;
    }
    return a;
  }
  function inside(r, x, y) { return r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; }

  // Pointer handling is done on the window (placeholders never block clicks on the page itself).
  var drag = null, down = null;
  window.addEventListener("pointerdown", function (e) {
    if (e.target.closest && e.target.closest("a,button,input,textarea,[role=dialog]")) return;
    ["left", "right"].forEach(function (r) {
      var v = views[r];
      if (v && v.alpha > 0.2 && inside(v.rect, e.clientX, e.clientY)) down = { role: r, x: e.clientX, y: e.clientY, t: performance.now() };
    });
    var m = views.main;
    if (!down && m && m.alpha > 0.2 && inside(m.rect, e.clientX, e.clientY)) {
      drag = m; m.dragging = true; m.lx = e.clientX; m.ly = e.clientY;
    }
  });
  window.addEventListener("pointermove", function (e) {
    if (drag) {
      drag.spin += (e.clientX - drag.lx) * 0.008;
      drag.ty = MathUtils.clamp(drag.ty + (e.clientY - drag.ly) * 0.004, -0.5, 0.5);
      drag.lx = e.clientX; drag.ly = e.clientY;
    }
    var hot = false;
    ["left", "right"].forEach(function (r) { var v = views[r]; if (v && v.alpha > 0.2 && inside(v.rect, e.clientX, e.clientY)) hot = true; });
    canvas.style.cursor = "";
    document.documentElement.classList.toggle("b3d-hot", hot);
  });
  function up(e) {
    if (drag) { drag.dragging = false; drag = null; }
    if (down) {
      var moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      if (moved < 10 && performance.now() - down.t < 600) swapTo(down.role);
      down = null;
    }
  }
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", up);

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    var W = window.innerWidth, H = window.innerHeight, drew = false;
    renderer.setScissorTest(false);
    renderer.clear();
    renderer.setScissorTest(true);
    ["left", "right", "main"].forEach(function (role) {
      var v = views[role]; if (!v) return;
      var r = v.el.getBoundingClientRect(); v.rect = r; v.alpha = 0;
      if (r.width < 4 || r.height < 4 || r.bottom < 0 || r.top > H || r.right < 0 || r.left > W) return;
      v.fade = Math.min(1, v.fade + dt / 0.55);
      var a = alphaOf(v.el) * (v.fade * v.fade * (3 - 2 * v.fade));
      v.alpha = a;
      if (a <= 0.003) return;
      if (!v.dragging) { v.spin *= Math.pow(0.12, dt); v.ty *= Math.pow(0.04, dt); }
      var tt = reduced ? 0 : now / 1000 + v.t0;
      v.rig.rotation.set(v.pitch + v.ty + Math.sin(tt * 0.6) * 0.012, v.yaw + v.spin + Math.sin(tt * 0.45) * 0.035, 0, "YXZ");
      var asp = r.width / r.height; v.cam.aspect = asp;
      var dist = (1 / v.fit) / Math.tan(MathUtils.degToRad(v.cam.fov / 2)); if (asp < 1) dist /= asp;
      v.cam.position.set(0, 0, dist); v.cam.lookAt(0, 0, 0); v.cam.updateProjectionMatrix();
      renderer.setViewport(r.left, H - r.bottom, r.width, r.height);
      renderer.setScissor(r.left, H - r.bottom, r.width, r.height);
      v.scene.traverse(function (o) { if (o.isMesh) { o.material.transparent = a < 0.999; o.material.opacity = a; } });
      renderer.render(v.scene, v.cam);
      drew = true;
    });
    if (drew && !window.__b3dReady) { window.__b3dReady = true; document.documentElement.classList.add("b3d-ready"); }
  }

  Promise.all(KEYS.map(parseVariant)).then(function () {
    els.forEach(buildView);
    window.Baffle3D = { views: views, get order() { return order; }, select: swapTo };
    requestAnimationFrame(frame);
    window.dispatchEvent(new Event("b3d-loaded"));
  }).catch(function (e) { console.error("Baffle 3D failed", e); canvas.remove(); document.documentElement.classList.add("no-webgl"); });
})();
