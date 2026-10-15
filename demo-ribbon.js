/* شريط «نسخة عرض» فوق الصفحة */
(function (d) {
  var s = d.currentScript, t = (s && s.getAttribute("data-text")) || "نسخة عرض تجريبية";
  var r = d.createElement("div");
  r.setAttribute("role", "note");
  r.textContent = t;
  if (s && s.hasAttribute("data-fixed")) {
    /* النظام بيعيد رسم الـbody كله، فالشارة بتتحط برّه */
    r.style.cssText = "position:fixed;left:14px;bottom:14px;z-index:99999;max-width:calc(100vw - 28px);padding:8px 14px;border-radius:999px;background:#111;color:#F7F5F2;font:600 12px/1.5 system-ui,sans-serif;direction:rtl;box-shadow:0 10px 24px -10px rgba(0,0,0,.5);pointer-events:none";
    d.addEventListener("DOMContentLoaded", function () { d.documentElement.appendChild(r); });
    return;
  }
  r.style.cssText = "position:relative;z-index:5;padding:9px 14px;background:#111;color:#F7F5F2;font:600 12px/1.5 system-ui,sans-serif;text-align:center;direction:rtl";
  d.addEventListener("DOMContentLoaded", function () { d.body.insertBefore(r, d.body.firstChild); });
})(document);
