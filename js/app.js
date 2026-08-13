(function () {
  'use strict';

  function formatCurrency(value) {
    return 'R$ ' + Number(value).toLocaleString('pt-BR');
  }

  function bindWizardGo(el, getValue) {
    if (!el) return;

    el.addEventListener('click', function (e) {
      e.preventDefault();
      try {
        localStorage.setItem('credpix:valor_emprestimo', String(getValue()));
      } catch (_) {}
      window.location.href = '/simular';
    });
  }

  function initSidebar() {
    function toggle(open) {
      document.getElementById('sidebar')?.classList.toggle('open', open);
      document.getElementById('sidebar-overlay')?.classList.toggle('show', open);
    }

    document.addEventListener('click', function (e) {
      var t = e.target;
      if (!t) return;
      if (t.closest('[data-sidebar-open]')) toggle(true);
      if (t.closest('[data-sidebar-close]')) toggle(false);
    });
  }

  function initSimulator() {
    var slider = document.querySelector('[data-simulador-slider]');
    var amount = document.querySelector('[data-simulador-amount]');
    var btn = document.querySelector('[data-simulador-btn]');
    if (!slider || !amount || !btn) return;

    function getVal() {
      return slider.value;
    }

    function update() {
      var val = parseInt(slider.value, 10);
      amount.textContent = formatCurrency(val);
      var min = parseInt(slider.min, 10);
      var max = parseInt(slider.max, 10);
      var pct = ((val - min) / (max - min)) * 100;
      slider.style.background =
        'linear-gradient(to right, #045acd ' + pct + '%, rgba(4,90,205,0.18) ' + pct + '%)';
    }

    slider.addEventListener('input', update);
    bindWizardGo(btn, getVal);

    document.querySelectorAll('[data-hero-cta]').forEach(function (el) {
      bindWizardGo(el, getVal);
    });

    update();
  }

  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      if (a.hasAttribute('data-hero-cta') || a.hasAttribute('data-simulador-btn')) return;
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (!id || id === '#') return;
        var el = document.querySelector(id);
        if (!el) return;
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth' });
        document.getElementById('sidebar')?.classList.remove('open');
        document.getElementById('sidebar-overlay')?.classList.remove('show');
      });
    });
  }

  function boot() {
    initSidebar();
    initSimulator();
    initSmoothScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
