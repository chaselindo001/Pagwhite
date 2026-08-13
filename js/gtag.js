(function () {
  'use strict';

  var config = null;
  var gtagReady = false;
  var initStarted = false;

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }

  function loadGtagScript(googleAdsId) {
    if (!googleAdsId || initStarted) return;
    initStarted = true;
    gtag('js', new Date());
    gtag('config', googleAdsId);

    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(googleAdsId);
    var first = document.getElementsByTagName('script')[0];
    if (first && first.parentNode) {
      first.parentNode.insertBefore(script, first);
    } else {
      document.head.appendChild(script);
    }
    gtagReady = true;
  }

  function fetchConfig() {
    return fetch('/api/tracking-config', { credentials: 'same-origin' })
      .then(function (res) {
        if (!res.ok) return null;
        return res.json();
      })
      .then(function (data) {
        if (!data || !data.success || !data.google_ads_id) return null;
        config = data;
        loadGtagScript(data.google_ads_id);
        return config;
      })
      .catch(function () {
        return null;
      });
  }

  var configPromise = fetchConfig();

  function fireConversion(tagKey, options, dedupePrefix) {
    configPromise.then(function (cfg) {
      if (!cfg || !gtagReady) return;

      var tag = cfg.tags && cfg.tags[tagKey];
      if (!tag || !tag.enabled || !tag.send_to) return;

      var transactionId = (options && options.transactionId) || '';
      var dedupeKey = dedupePrefix + ':' + cfg.site_id + ':' + String(transactionId || 'default');
      try {
        if (sessionStorage.getItem(dedupeKey)) return;
        sessionStorage.setItem(dedupeKey, '1');
      } catch (e) {}

      gtag('event', 'conversion', {
        send_to: tag.send_to,
        value: options && options.value != null ? options.value : tag.default_value,
        currency: (options && options.currency) || tag.currency || 'BRL',
        transaction_id: transactionId,
      });
    });
  }

  window.credpixFireBeginCheckoutConversion = function (options) {
    fireConversion('ic', options, 'credpix:begin_checkout');
  };

  window.credpixTrackComprovantePage = function (options) {
    fireConversion('purchase', options, 'credpix:purchase');
  };
})();
