// инвайт-ссылки канала @sirka_cpa. ключ берётся из ?inv=..., иначе дефолт страницы.
// пока в ссылке есть TODO - кнопка ведёт на DEFAULT_INVITE.
var INVITES = {
  meta_face: 'https://t.me/+inwZqBGL_ZAwODMy',
  meta_agency: 'https://t.me/+C2C01SB5NuZhYTEy',
  meta_video: 'https://t.me/+X-a2bVTnvYllNjIy'
};
var DEFAULT_INVITE = 'https://t.me/sirka_cpa';

(function () {
  var REDIRECT_DELAY_MS = 350;
  var PIXEL_WAIT_MS = 1500;   // сколько ждать загрузки fbevents.js после клика, дальше уходим без гарантии Lead
  var PAGE_DEFAULT_KEY = { face: 'meta_face', agency: 'meta_agency' };

  var page = document.body.getAttribute('data-page') || 'face';
  var btn = document.getElementById('subscribe');

  function resolveInvite() {
    var key = null;
    try {
      key = new URLSearchParams(window.location.search).get('inv');
    } catch (e) {}
    if (!key || !Object.prototype.hasOwnProperty.call(INVITES, key)) {
      key = PAGE_DEFAULT_KEY[page];
    }
    var url = INVITES[key];
    if (!url || url.indexOf('TODO') !== -1 || url.indexOf('https://t.me/') !== 0) {
      return DEFAULT_INVITE;
    }
    return url;
  }

  function uuid() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  // базовый код пикселя сразу ставит заглушку fbq; callMethod появляется только когда fbevents.js реально загрузился
  function pixelReady() {
    return typeof window.fbq === 'function' && typeof window.fbq.callMethod === 'function';
  }

  var invite = resolveInvite();
  var leadSent = false;
  var navigating = false;

  btn.setAttribute('href', invite);

  function go() {
    window.location.href = invite;
  }

  btn.addEventListener('click', function (e) {
    e.preventDefault();
    if (navigating) return;
    navigating = true;

    if (leadSent) {
      go();
      return;
    }
    leadSent = true;

    if (typeof window.fbq !== 'function') {
      go();
      return;
    }
    try {
      // если fbevents.js ещё грузится, заглушка fbq ставит Lead в очередь и отправит его после загрузки
      window.fbq('track', 'Lead',
        { content_name: page, content_category: 'tg_channel' },
        { eventID: uuid() });
    } catch (err) {
      go();
      return;
    }
    var waited = 0;
    (function wait() {
      if (pixelReady() || waited >= PIXEL_WAIT_MS) {
        setTimeout(go, REDIRECT_DELAY_MS);
        return;
      }
      waited += 100;
      setTimeout(wait, 100);
    })();
  });

  // вернулись кнопкой «назад» из bfcache - кнопка снова кликается, повторный Lead не шлём
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) navigating = false;
  });
})();
