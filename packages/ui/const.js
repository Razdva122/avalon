const startup = require('./startup.cjs');

const yaMetrika = `<!-- Yandex.Metrika counter -->
<script>
if (!('__AVALON_PRERENDER__' in window) && !/^\\/password-recovery\\/?$/.test(location.pathname) && !window.__avalonMetrikaStarted) {
  window.__avalonMetrikaStarted = true;
  window.ym = window.ym || function () { (window.ym.a = window.ym.a || []).push(arguments); };
  window.ym.l = Date.now();
  window.ym(96679204, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true });
  window.__avalonDeferAnalytics(function () {
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://mc.yandex.ru/metrika/tag.js';
    document.head.appendChild(script);
  });
}
</script>`;

const gtag = `<!-- Google tag (gtag.js) -->
<script>
if (!('__AVALON_PRERENDER__' in window) && !/^\\/password-recovery\\/?$/.test(location.pathname) && !window.__avalonGoogleAnalyticsStarted) {
  window.__avalonGoogleAnalyticsStarted = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', 'G-DL67HPGX9T');
  window.__avalonDeferAnalytics(function () {
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-DL67HPGX9T';
    document.head.appendChild(script);
  });
}
</script>`;

module.exports = { startup, gtag, yaMetrika };
