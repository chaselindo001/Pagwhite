(function () {
  'use strict';

  var LEGAL_TEXT =
    'A&G ASSESSORIA FINANCEIRA LTDA — CNPJ: 13.212.952/0001-10. ' +
    'Todos os serviços são de responsabilidade da empresa acima identificada.';

  function ensureStyles() {
    if (document.getElementById('credpix-footer-styles')) return;
    var link = document.createElement('link');
    link.id = 'credpix-footer-styles';
    link.rel = 'stylesheet';
    var href = '/css/credpix-footer.css';
    if (typeof window.credpixPath === 'function') href = window.credpixPath(href);
    link.href = href;
    document.head.appendChild(link);
  }

  function injectFooter() {
    if (document.querySelector('[data-credpix-legal-footer="skip"]')) return;
    if (document.querySelector('.credpix-site-footer')) return;

    ensureStyles();

    var footer = document.createElement('footer');
    footer.className = 'credpix-site-footer';
    footer.setAttribute('data-credpix-legal-footer', 'injected');
    footer.innerHTML = '<p>' + LEGAL_TEXT + '</p>';

    document.body.appendChild(footer);
  }

  window.CREDPIX_LEGAL_TEXT = LEGAL_TEXT;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectFooter);
  } else {
    injectFooter();
  }
})();
