// Global components. Any <div data-component="footer"></div> is replaced by the shared footer
// (UNICEIL wordmark scene + link columns). Must load before script.js so its behaviours attach.
(function () {
  var FOOTER = [
    '<footer class="footer">',
    '  <div class="wm-scene" id="wmscene">',
    '    <div class="wm-pin">',
    '      <div class="wordmark">',
    '        <p class="word io"><span class="mask"><span class="mk">UNICEIL</span></span></p>',
    '      </div>',
    '      <div class="wm-imgs">',
    '        <div class="collage" data-h="215" style="left:400px;width:260px;height:215px;background:#d9a969"><img src="assets/ceiling.png" alt="Baffle" style="left:18px;top:16px;width:242px;height:199px"></div>',
    '        <div class="collage" data-h="250" style="left:20px;width:300px;height:250px;background:#6f3531"><img src="assets/soffit.png" alt="Soffit" style="left:0;top:0;width:282px;height:232px"></div>',
    '        <div class="collage" data-h="265" style="left:900px;width:320px;height:265px;background:#abb35b"><img src="assets/wpe.png" alt="WPE" style="left:0;top:17px;width:302px;height:248px;object-position:30% 50%"></div>',
    '      </div>',
    '    </div>',
    '  </div>',
    '  <div class="rule"></div>',
    '  <div class="footer-cols">',
    '    <div class="fbrand rv">',
    '      <img src="assets/logo.png" alt="Uniceil">',
    '      <p>Patent-protected uPVC systems for ceilings, walls and facades.</p>',
    '    </div>',
    '    <div class="fcol rv" style="--i:1"><p class="h">Products</p><p><a href="baffle.html">Baffle System</a></p><p>Soffit System</p><p>WPE</p><p>Finishes</p><p>Trims</p></div>',
    '    <div class="fcol rv" style="--i:2"><p class="h">Applications</p><p>Ceiling</p><p>Wall</p><p>Facade</p><p>Airport</p><p>Retail</p></div>',
    '    <div class="fcol rv" style="--i:3"><p class="h">Company</p><p>Why Uniceil</p><p>Resources</p><p><a href="index.html#contact">Contact</a></p><p>Privacy</p><p>Terms</p></div>',
    '    <div class="fcol rv" style="--i:4"><p class="h">Contact</p><p><a href="tel:1800203320">1800 203 320</a></p><p><a href="mailto:hello@theuniceil.com">hello@theuniceil.com</a></p><p>Newsletter</p></div>',
    '  </div>',
    '  <div class="footer-bottom rv rv-fade" style="--i:5">',
    '    <p>&copy; 2026 Uniceil</p>',
    '    <div><p>Privacy</p><p>Terms</p><p>Sitemap</p></div>',
    '  </div>',
    '</footer>'
  ].join("\n");

  var parts = { footer: FOOTER };
  Array.prototype.slice.call(document.querySelectorAll("[data-component]")).forEach(function (slot) {
    var html = parts[slot.getAttribute("data-component")];
    if (!html) return;
    slot.insertAdjacentHTML("beforebegin", html);
    slot.parentNode.removeChild(slot);
  });
})();
