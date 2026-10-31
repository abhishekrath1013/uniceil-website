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
    '        <div class="collage" data-h="270" style="left:1010px;width:270px;height:270px;background:#027b49"><img src="assets/copper.png" alt="" style="left:-135px;top:27px;width:594px;height:314.28px"></div>',
    '        <div class="collage" data-h="300" style="left:20px;width:300px;height:300px;background:#f19ec8"><img src="assets/copper.png" alt="" style="left:-150px;top:30px;width:660px;height:349.2px"></div>',
    '        <div class="collage" data-h="240" style="left:350px;width:240px;height:240px;background:#fbb833"><img src="assets/copper.png" alt="" style="left:-120px;top:24px;width:528px;height:279.36px"></div>',
    '        <div class="collage" data-h="210" style="left:720px;width:210px;height:210px;background:#fa4d43"><img src="assets/copper.png" alt="" style="left:-105px;top:21px;width:462px;height:244.44px"></div>',
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
