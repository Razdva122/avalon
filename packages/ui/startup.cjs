// Serialized into the HTML head: must work before the application bundle arrives.
function bootstrap() {
  if (window.__avalonDeferAnalytics || '__AVALON_PRERENDER__' in window) return;
  var ready = false;
  var pendingButton;
  var pendingPath;
  function captureClick(event) {
    var button = event.target.closest && event.target.closest('.create-room');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    pendingButton = button;
    pendingPath = location.pathname;
    button.setAttribute('aria-busy', 'true');
  }
  document.addEventListener('click', captureClick, true);
  window.addEventListener(
    'avalon:ready',
    function () {
      ready = true;
      document.removeEventListener('click', captureClick, true);
      if (pendingButton) {
        pendingButton.removeAttribute('aria-busy');
        if (pendingButton.isConnected && pendingPath === location.pathname) pendingButton.click();
        pendingButton = null;
      }
    },
    { once: true },
  );
  window.__avalonDeferAnalytics = function (load) {
    var started = false;
    function start() {
      if (started) return;
      started = true;
      document.removeEventListener('visibilitychange', onHidden);
      if (!/^\/password-recovery\/?$/.test(location.pathname)) load();
    }
    function onHidden() {
      if (document.visibilityState === 'hidden') start();
    }
    function schedule() {
      // Keep SDK execution out of hydration and the first interaction's task.
      setTimeout(function () {
        if (window.requestIdleCallback) window.requestIdleCallback(start, { timeout: 2000 });
        else start();
      }, 1000);
    }
    document.addEventListener('visibilitychange', onHidden);
    if (ready) schedule();
    else window.addEventListener('avalon:ready', schedule, { once: true });
  };
}
module.exports = `<script>(${bootstrap.toString()})();</script>`;
