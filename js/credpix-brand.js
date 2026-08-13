(function () {
  'use strict';

  var BRAND_NAME = '13.212.952 A&G ASSESSORIA FINANCEIRA LTDA';
  var BRAND_CNPJ = '13.212.952';
  var BRAND_LEGAL_NAME = 'A&G ASSESSORIA FINANCEIRA LTDA';
  var LEGAL_TEXT =
    'A&G ASSESSORIA FINANCEIRA LTDA — CNPJ: 13.212.952/0001-10. Todos os serviços são de responsabilidade da empresa acima identificada.';

  function brandHtml(extraClass) {
    var cls = 'credpix-brand-text' + (extraClass ? ' ' + extraClass : '');
    return (
      '<span class="' +
      cls +
      '" aria-label="' +
      BRAND_NAME +
      '">' +
      '<span class="credpix-brand-cnpj">' +
      BRAND_CNPJ +
      '</span> ' +
      '<span class="credpix-brand-name">' +
      BRAND_LEGAL_NAME +
      '</span></span>'
    );
  }

  function ensureStyles() {
    if (document.getElementById('credpix-brand-styles')) return;
    var link = document.createElement('link');
    link.id = 'credpix-brand-styles';
    link.rel = 'stylesheet';
    var href = '/css/credpix-brand.css';
    if (typeof window.credpixPath === 'function') href = window.credpixPath(href);
    link.href = href;
    document.head.appendChild(link);
  }

  function guessBrandClass(img) {
    if (img.classList.contains('credpix-logo-img--wizard')) return 'credpix-brand-text--wizard';
    if (img.classList.contains('credpix-logo-img--header')) return 'credpix-brand-text--header';
    if (img.classList.contains('credpix-logo-img--sidebar')) return 'credpix-brand-text--sidebar';
    if (img.classList.contains('credpix-logo-img--footer')) return 'credpix-brand-text--footer';
    if (img.classList.contains('h-12') || img.classList.contains('h-14')) {
      return 'credpix-brand-text--upsell credpix-brand-text--center';
    }
    if (img.classList.contains('h-8') || img.classList.contains('h-10')) {
      return 'credpix-brand-text--upsell-header';
    }
    if (img.classList.contains('h-10')) return 'credpix-brand-text--dark credpix-brand-text--center';
    return 'credpix-brand-text--dark';
  }

  function replaceLogoImage(img) {
    if (!img || img.getAttribute('data-credpix-brand-replaced') === '1') return;
    var extra = guessBrandClass(img);
    var wrap = document.createElement('span');
    wrap.innerHTML = brandHtml(extra);
    var brand = wrap.firstChild;
    img.replaceWith(brand);
    brand.setAttribute('data-credpix-brand-replaced', '1');
  }

  function applyBrandLogos(root) {
    (root || document).querySelectorAll('img[src*="credpix-logo"], img[data-credpix-logo]').forEach(replaceLogoImage);
  }

  function applyBrandCopy(root) {
    var scope = root || document.body;
    if (!scope) return;

    scope.querySelectorAll('.credpix-legal-text, .credpix-site-footer p').forEach(function (el) {
      if (el.textContent.indexOf('CredPix') !== -1 || el.textContent.indexOf('LEILA APARECIDA') !== -1) {
        el.textContent = LEGAL_TEXT;
      }
    });

    if (document.title.indexOf('CredPix') !== -1) {
      document.title = document.title.replace(/CredPix/g, BRAND_NAME);
    }
  }

  function applyBrandToContainer(container) {
    if (!container) return;
    var img = container.querySelector('img[data-credpix-logo], img.credpix-logo-img, img[src*="credpix-logo"]');
    if (img) {
      replaceLogoImage(img);
      return;
    }
    if (!container.querySelector('.credpix-brand-text')) {
      container.insertAdjacentHTML('afterbegin', brandHtml('credpix-brand-text--wizard'));
    }
    container.querySelectorAll('.logo-text, .logo-mark').forEach(function (el) {
      el.remove();
    });
  }

  function init() {
    ensureStyles();
    applyBrandLogos(document);
    applyBrandCopy(document);
    document.querySelectorAll('.brand-logo').forEach(applyBrandToContainer);
  }

  window.CREDPIX_BRAND = {
    name: BRAND_NAME,
    cnpj: BRAND_CNPJ,
    legalName: BRAND_LEGAL_NAME,
    legalText: LEGAL_TEXT,
    html: brandHtml,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  new MutationObserver(function () {
    init();
  }).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
})();
