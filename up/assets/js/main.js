(function() {
    function o() {
        var t = document.getElementById("customVideo"),
            n = document.getElementById("videoOverlay");
        if (!t || !n) return;
        n.addEventListener("click", function() {
            n.style.opacity = "0";
            setTimeout(function() {
                try {
                    t.muted = !1;
                    t.currentTime = 0;
                    t.play();
                    n.style.display = "none";
                } catch (e) {
                    n.style.opacity = "1";
                }
            }, 300);
        });
        t.addEventListener("ended", function() {
            n.style.display = "flex";
            n.style.opacity = "1";
        });
    }

    document.addEventListener("DOMContentLoaded", function() {
        if (typeof initBacktrap === "function") initBacktrap();
        o();
    });

    document.addEventListener("DOMContentLoaded", function() {
        var valorKey =
            typeof window.credpixStorageKey === "function" ?
            window.credpixStorageKey("valor_emprestimo") :
            "valor_emprestimo";
        var t = localStorage.getItem(valorKey) || localStorage.getItem("valor_emprestimo");
        if (!t) return;
        var n;
        if (isNaN(t)) {
            var e = t
                .replace(/[^\d,.-]/g, "")
                .replace(/\./g, "")
                .replace(",", ".");
            n = Number(e);
        } else n = Number(t);
        if (isNaN(n)) return;
        var o = n.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
                minimumFractionDigits: 2,
            }),
            r = document.getElementById("limiteDisponivelValor");
        r && (r.innerText = o);
        var a = document.getElementById("tituloValor");
        a && (a.innerText = a.innerText.replace(/R\$\s?[\d\.,]+/, o));
        document
            .querySelectorAll("body *:not(script):not(style)")
            .forEach(function(t) {
                t.childNodes.forEach(function(t) {
                    if (t.nodeType !== Node.TEXT_NODE) return;
                    var e = t.textContent;
                    if (!e) return;
                    var r = e.replace(/R\$\s?4\.600(,00)?/g, o);
                    r !== e && (t.textContent = r);
                });
            });
        var i = 107.56,
            l = n + i,
            u = l.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
                minimumFractionDigits: 2,
            }),
            c = document.getElementById("valorReceber");
        c && (c.innerText = u);
        var d = document.getElementById("pixValor");
        d && (d.innerText = d.innerText.replace(/R\$\s?[\d\.,]+/, u));
        document
            .querySelectorAll("body *:not(script):not(style)")
            .forEach(function(t) {
                t.childNodes.forEach(function(t) {
                    if (t.nodeType !== Node.TEXT_NODE) return;
                    var e = t.textContent;
                    if (!e) return;
                    var r = e.replace(/R\$\s?4\.730,35/g, u);
                    r !== e && (t.textContent = r);
                });
            });
    });

    (function() {
        var e =
            typeof window.credpixStorageKey === "function" ?
            window.credpixStorageKey("qs_entry") :
            "__qs_entry__";
        try {
            !sessionStorage.getItem(e) &&
                window.location.search &&
                sessionStorage.setItem(e, window.location.search);
        } catch (t) {}
        var t = location.pathname + (location.search || "") + location.hash;
        history.replaceState({
            backtrap: "root"
        }, "", t);
        history.pushState({
            backtrap: "guard"
        }, "");
        window.addEventListener("popstate", function(t) {
            var n = t.state || history.state;
            if (!n || "root" !== n.backtrap) return;
            var o = "";
            try {
                o = sessionStorage.getItem(e) || window.location.search || "";
            } catch (r) {}
            var a = "/up/upsell/backredirect.html";
            if (typeof window.credpixPath === "function") a = window.credpixPath(a);
            else if (window.CREDPIX_BASE_PATH) a = window.CREDPIX_BASE_PATH + a;
            if (window.credpixAppendUtms) a = window.credpixAppendUtms(a);
            else if (o) a += a.indexOf("?") >= 0 ? "&" + o.replace(/^\?/, "") : o;
            location.replace(a);
        });
    })();

    document.addEventListener(
        "contextmenu",
        function(t) {
            t.preventDefault();
        }, !1
    );
    if (!("ontouchstart" in window) && window.matchMedia("(hover: hover)").matches) {
        document.addEventListener(
            "selectstart",
            function(t) {
                t.preventDefault();
            }, !1
        );
    }
    document.addEventListener(
        "dragstart",
        function(t) {
            t.preventDefault();
        }, !1
    );
    document.addEventListener(
        "keydown",
        function(t) {
            if ("F12" === t.key) return t.preventDefault(), t.stopPropagation(), !1;
            if (
                t.ctrlKey &&
                t.shiftKey && ["I", "J", "C"].includes(t.key.toUpperCase())
            )
                return t.preventDefault(), t.stopPropagation(), !1;
            if (t.ctrlKey && ["U", "S"].includes(t.key.toUpperCase()))
                return t.preventDefault(), t.stopPropagation(), !1;
        }, !1
    );
})();

(function() {
    var e = document.createElement("link");
    e.rel = "icon";
    e.type = "image/svg+xml";
    var href = "/assets/img/fav.svg";
    if (typeof window.credpixPath === "function") href = window.credpixPath(href);
    else if (window.CREDPIX_BASE_PATH) href = window.CREDPIX_BASE_PATH + href;
    e.href = href;
    document.head.appendChild(e);
})();
