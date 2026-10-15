/* نسخة عرض: أي لينك تواصل (انستقرام، فيسبوك، واتساب، اتصال، خرائط، تقييم قوقل…)
   بيبقى ضغطة فاضية — مبيفتحش حاجة ومبيوصلش لصاحب المكان الحقيقي.
   أي لينك عليه data-keep بيفضل شغال عادي. */
(function () {
  var RX = /^\s*(tel:|mailto:|sms:)|instagram\.com|facebook\.com|fb\.com|fb\.me|m\.me\/|wa\.me|whatsapp\.com|tiktok\.com|snapchat\.com|twitter\.com|\/\/(www\.)?x\.com|t\.me\/|maps\.google|google\.[a-z.]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps|g\.page|search\.google\.com\/local|g\.co\/kgs/i;
  function isContact(u) { return !!u && RX.test(String(u)); }

  function neuter(a) {
    if (!a || a.hasAttribute("data-keep") || a.getAttribute("data-demo-dead")) return;
    if (!isContact(a.getAttribute("href"))) return;
    a.setAttribute("data-demo-dead", "1");
    a.setAttribute("href", "#");
    a.removeAttribute("target");
    a.setAttribute("aria-disabled", "true");
  }
  function scan(root) {
    if (root.matches && root.matches("a[href]")) neuter(root);
    if (root.querySelectorAll) Array.prototype.forEach.call(root.querySelectorAll("a[href]"), neuter);
  }

  // الضغطة نفسها: مفيش فتح ولا قفزة لأول الصفحة
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a") : null;
    if (!a || a.hasAttribute("data-keep")) return;
    if (a.getAttribute("data-demo-dead") || isContact(a.getAttribute("href"))) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);

  // واتساب الطلبات/التقييم اللي بيتفتح بالكود
  var open = window.open;
  window.open = function (u) {
    if (isContact(u)) return null;
    return open.apply(window, arguments);
  };

  function start() {
    scan(document);
    new MutationObserver(function (ms) {
      ms.forEach(function (m) {
        if (m.type === "attributes") neuter(m.target);
        Array.prototype.forEach.call(m.addedNodes, function (n) { if (n.nodeType === 1) scan(n); });
      });
    }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["href"] });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
