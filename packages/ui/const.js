const yaMetrika = `<!-- Yandex.Metrika counter -->
<script async type="text/javascript" >
   if (!('__AVALON_PRERENDER__' in window) && !/^\\/password-recovery\\/?$/.test(location.pathname)) {
   (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
   m[i].l=1*new Date();
   for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
   k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
   (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

   ym(96679204, "init", {
        clickmap:true,
        trackLinks:true,
        accurateTrackBounce:true
   });
   }
</script>
<noscript><div><img src="https://mc.yandex.ru/watch/96679204" style="position:absolute; left:-9999px;" alt="" /></div></noscript>
<!-- /Yandex.Metrika counter -->`;

const gtag = `<!-- Google tag (gtag.js) -->
<script>
  if (!('__AVALON_PRERENDER__' in window) && !/^\\/password-recovery\\/?$/.test(location.pathname)) {
  if (!window.__avalonGoogleAnalyticsStarted) {
  window.__avalonGoogleAnalyticsStarted = true;
  var analyticsScript = document.createElement('script');
  analyticsScript.async = true;
  analyticsScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-DL67HPGX9T';
  document.head.appendChild(analyticsScript);
	window.dataLayer = window.dataLayer || [];
	function gtag() {
		dataLayer.push(arguments);
	}
	gtag('js', new Date());

	gtag('config', 'G-DL67HPGX9T');
  }
  }
</script>`;

module.exports = {
  gtag,
  yaMetrika,
};
