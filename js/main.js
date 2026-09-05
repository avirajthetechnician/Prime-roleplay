/* Prime Roleplay compatibility loader.
   Existing pages reference js/main.js while the canonical script lives at ../main.js. */
(function () {
  var canonical = new URL('../main.js', document.currentScript.src).href;
  var script = document.createElement('script');
  script.src = canonical;
  script.defer = false;
  document.head.appendChild(script);
})();
