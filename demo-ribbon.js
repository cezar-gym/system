/* شريط «نسخة تجريبية» فوق الصفحة — نفس الملف في كل نسخ العرض
   data-text  = السطر اللي جنب الشارة (اختياري)
   data-outside = يتحط برّه الـbody (للأنظمة اللي بتعيد رسم الـbody كله زي سيزر) */
(function (d) {
  var s = d.currentScript;
  var text = (s && s.getAttribute("data-text")) || "الطلبات والأرقام هنا للتوضيح بس — ما لها أي علاقة بالمكان الحقيقي";
  var outside = s && s.hasAttribute("data-outside");
  var css = "#demo-banner{position:relative;z-index:2147483000;display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;" +
    "padding:9px 14px;background:#111;color:#F7F5F2;direction:rtl;text-align:center;" +
    "font:500 12.5px/1.6 system-ui,-apple-system,'Segoe UI',Tahoma,sans-serif}" +
    "#demo-banner b{flex:none;background:#F24A3D;color:#fff;font-weight:700;font-size:13px;border-radius:999px;padding:2px 12px;letter-spacing:0}";
  function mount() {
    if (d.getElementById("demo-banner")) return;
    var st = d.createElement("style"); st.textContent = css; d.head.appendChild(st);
    var r = d.createElement("div");
    r.id = "demo-banner"; r.setAttribute("role", "note");
    var b = d.createElement("b"); b.textContent = "نسخة تجريبية";
    var t = d.createElement("span"); t.textContent = text;
    r.appendChild(b); r.appendChild(t);
    if (outside) d.documentElement.insertBefore(r, d.body);
    else d.body.insertBefore(r, d.body.firstChild);
  }
  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", mount); else mount();
})(document);
