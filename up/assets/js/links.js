(function () {
    var LINKS = {
        whats: "https://www.pagamentos-seguro.link/checkout/58f94bc4-24c8-417b-b4ab-94ee52f24d15"
    };

    function targetFor(key) {
        if (LINKS[key]) return LINKS[key];
        if (/^up\d{1,2}$/.test(key)) return "/checkout/etapa" + key.slice(2);
        return null;
    }

    function redirect(key) {
        var target = targetFor(key);
        if (!target) return;
        if (window.credpixAppendUtms) target = window.credpixAppendUtms(target);
        if (window.CredPixAnalytics) {
            window.CredPixAnalytics.track("upsell_click", {
                funnel_step: "upsell",
                meta: { upsell_key: key }
            });
        }
        window.location.href = target;
    }

    window.redirect = redirect;

    document.addEventListener("click", function (ev) {
        var el = ev.target && ev.target.closest ? ev.target.closest("[data-credpix-checkout]") : null;
        if (!el) return;
        var key = el.getAttribute("data-credpix-checkout");
        if (key) redirect(key);
    });
})();