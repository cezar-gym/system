/* ============================================================
   سيزر جيم — نظام الإدارة | الأدوات المشتركة
   كل الأرقام في النظام إنجليزي (1,2,3) — طلب صريح من الجيم.
   ============================================================ */
(function () {
  'use strict';
  var CZ = (window.CZ = window.CZ || {});
  var U = (CZ.u = {});
  /* بيتعرّفوا هنا عشان ملفات الوحدات بتتحمّل قبل المحرّك */
  CZ.views = CZ.views || {};
  CZ.state = CZ.state || { user: null, branch: 'all', params: {} };

  /* ---------- 1. نصوص وتواريخ ---------- */

  U.DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  U.DAYS_S = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
  U.MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

  U.esc = function (s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  };

  /* تاريخ داخلي دايمًا ISO: YYYY-MM-DD (بدون منطقة زمنية عشان مايزحلقش يوم) */
  U.iso = function (d) {
    d = d ? new Date(d) : new Date();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + dd;
  };
  U.isoT = function (d) {
    d = d ? new Date(d) : new Date();
    return U.iso(d) + 'T' + String(d.getHours()).padStart(2, '0') + ':' +
      String(d.getMinutes()).padStart(2, '0');
  };
  U.parse = function (s) {
    if (!s) return null;
    if (s instanceof Date) return s;
    var m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(String(s));
    if (!m) return new Date(s);
    return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0));
  };
  U.today = function () { return U.iso(new Date()); };
  U.now = function () { return new Date(); };

  U.addDays = function (d, n) {
    var x = U.parse(d) || new Date();
    x.setDate(x.getDate() + n);
    return U.iso(x);
  };
  U.addMonths = function (d, n) {
    var x = U.parse(d) || new Date();
    var day = x.getDate();
    x.setDate(1);
    x.setMonth(x.getMonth() + n);
    x.setDate(Math.min(day, new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate()));
    return U.iso(x);
  };
  U.diffDays = function (a, b) {
    var x = U.parse(a), y = U.parse(b || new Date());
    if (!x || !y) return 0;
    return Math.round((new Date(x.getFullYear(), x.getMonth(), x.getDate()) -
      new Date(y.getFullYear(), y.getMonth(), y.getDate())) / 86400000);
  };
  U.dow = function (d) { var x = U.parse(d); return x ? x.getDay() : 0; };

  /* عرض التاريخ: 12 أغسطس 2026 */
  U.fDate = function (d, opt) {
    var x = U.parse(d);
    if (!x) return '—';
    var s = x.getDate() + ' ' + U.MONTHS[x.getMonth()];
    if (opt !== 'short') s += ' ' + x.getFullYear();
    return s;
  };
  U.fDay = function (d) {
    var x = U.parse(d);
    return x ? U.DAYS[x.getDay()] + ' ' + U.fDate(d) : '—';
  };
  U.fTime = function (d) {
    var x = U.parse(d);
    if (!x) return '—';
    return U.fMin(x.getHours() * 60 + x.getMinutes());
  };
  /* دقايق من نص الليل → 7:30 م */
  U.fMin = function (m) {
    m = ((Math.round(m) % 1440) + 1440) % 1440;
    var h = Math.floor(m / 60), mm = String(m % 60).padStart(2, '0');
    var ap = h < 12 ? 'ص' : 'م';
    var h12 = h % 12; if (h12 === 0) h12 = 12;
    return h12 + ':' + mm + ' ' + ap;
  };
  U.fDT = function (d) { return U.fDate(d) + ' · ' + U.fTime(d); };

  /* «من 3 أيام» / «النهاردة» */
  U.ago = function (d) {
    var n = U.diffDays(d, new Date());
    if (n === 0) return 'النهاردة';
    if (n === -1) return 'إمبارح';
    if (n === 1) return 'بكرة';
    if (n < 0) {
      var a = -n;
      if (a < 7) return 'من ' + a + ' أيام';
      if (a < 30) return 'من ' + Math.round(a / 7) + ' أسابيع';
      if (a < 365) return 'من ' + Math.round(a / 30) + ' شهور';
      return 'من ' + (a / 365).toFixed(1) + ' سنة';
    }
    if (n < 7) return 'بعد ' + n + ' أيام';
    if (n < 30) return 'بعد ' + Math.round(n / 7) + ' أسابيع';
    return 'بعد ' + Math.round(n / 30) + ' شهور';
  };
  U.dur = function (mins) {
    mins = Math.max(0, Math.round(mins));
    var h = Math.floor(mins / 60), m = mins % 60;
    if (h && m) return h + ' س ' + m + ' د';
    if (h) return h + ' ساعة';
    return m + ' دقيقة';
  };

  /* ---------- 2. أرقام وفلوس ---------- */

  U.n = function (v, dec) {
    var x = Number(v || 0);
    if (!isFinite(x)) x = 0;
    return x.toLocaleString('en-US', {
      minimumFractionDigits: dec || 0, maximumFractionDigits: dec === undefined ? 0 : dec
    });
  };
  U.money = function (v, opts) {
    opts = opts || {};
    var cls = 'money' + (opts.cls ? ' ' + opts.cls : '');
    var sign = opts.sign && Number(v) > 0 ? '+' : '';
    return '<span class="' + cls + '">' + sign + U.n(v) +
      '<span class="cur">' + (CZ.CUR || 'ج') + '</span></span>';
  };
  U.m = function (v) { return U.n(v) + ' ' + (CZ.CUR || 'ج'); };
  U.pct = function (a, b) { return b ? Math.round((a / b) * 100) : 0; };
  U.clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  /* f ممكن يكون اسم حقل أو دالة أو يتساب فاضي لو المصفوفة أرقام */
  U.sum = function (arr, f) {
    var get = typeof f === 'function' ? f
      : typeof f === 'string' ? function (x) { return x ? x[f] : 0; }
        : function (x) { return x; };
    return (arr || []).reduce(function (t, x) { return t + (+get(x) || 0); }, 0);
  };
  U.round5 = function (v) { return Math.ceil(v / 5) * 5; };

  /* ---------- 3. تليفونات وواتساب ---------- */

  U.phone = function (p) {
    p = String(p || '').replace(/[^\d+]/g, '');
    if (p.indexOf('+2') === 0) p = p.slice(2);
    if (p.indexOf('20') === 0 && p.length > 11) p = '0' + p.slice(2);
    return p;
  };
  U.fPhone = function (p) {
    p = U.phone(p);
    if (p.length === 11) return p.slice(0, 4) + ' ' + p.slice(4, 7) + ' ' + p.slice(7);
    return p || '—';
  };
  U.wa = function (p, text) {
    p = U.phone(p);
    if (p.indexOf('0') === 0) p = '20' + p.slice(1);
    return 'https://wa.me/' + p + (text ? '?text=' + encodeURIComponent(text) : '');
  };
  U.tel = function (p) { return 'tel:' + U.phone(p); };

  /* ---------- 4. أدوات عامة ---------- */

  U.uid = function (pre) {
    return (pre || 'x') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  };
  U.initials = function (name) {
    var p = String(name || '').trim().split(/\s+/);
    return ((p[0] || '')[0] || '') + ((p[1] || '')[0] || '');
  };
  U.by = function (key, dir) {
    dir = dir === 'desc' ? -1 : 1;
    return function (a, b) {
      var x = typeof key === 'function' ? key(a) : a[key];
      var y = typeof key === 'function' ? key(b) : b[key];
      if (x === y) return 0;
      if (x === null || x === undefined) return 1;
      if (y === null || y === undefined) return -1;
      if (typeof x === 'string') return x.localeCompare(y, 'ar') * dir;
      return (x > y ? 1 : -1) * dir;
    };
  };
  U.groupBy = function (arr, f) {
    var o = {};
    (arr || []).forEach(function (x) {
      var k = typeof f === 'function' ? f(x) : x[f];
      (o[k] = o[k] || []).push(x);
    });
    return o;
  };
  U.uniq = function (a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); };
  U.debounce = function (fn, ms) {
    var t; return function () {
      var a = arguments, s = this;
      clearTimeout(t); t = setTimeout(function () { fn.apply(s, a); }, ms || 220);
    };
  };
  /* بحث عربي متسامح: بيشيل التشكيل ويوحّد الألف والياء والتاء المربوطة */
  U.norm = function (s) {
    return String(s || '').toLowerCase()
      .replace(/[ً-ْـ]/g, '')
      .replace(/[أإآا]/g, 'ا').replace(/[ىي]/g, 'ي')
      .replace(/ة/g, 'ه').replace(/[ؤئء]/g, 'ء')
      .replace(/\s+/g, ' ').trim();
  };
  U.match = function (hay, needle) {
    if (!needle) return true;
    return U.norm(hay).indexOf(U.norm(needle)) > -1;
  };

  /* ---------- 5. الأيقونات (Lucide-style) ---------- */

  var P = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
    users: '<circle cx="9" cy="8" r="3.2"/><path d="M2.5 20c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5"/><path d="M17 11.2a3 3 0 0 0 0-5.9"/><path d="M18.5 20c0-2.2-.8-3.8-2-4.8"/>',
    user: '<circle cx="12" cy="8" r="3.4"/><path d="M4.5 20c0-3.6 3.3-6 7.5-6s7.5 2.4 7.5 6"/>',
    scan: '<path d="M3 8V5a2 2 0 0 1 2-2h3"/><path d="M16 3h3a2 2 0 0 1 2 2v3"/><path d="M21 16v3a2 2 0 0 1-2 2h-3"/><path d="M8 21H5a2 2 0 0 1-2-2v-3"/><path d="M3.5 12h17"/>',
    card: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19"/><path d="M6 14.5h4"/>',
    wallet: '<path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H18a2 2 0 0 1 2 2v1"/><path d="M3 7.5V17a2.5 2.5 0 0 0 2.5 2.5H19a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H5.5"/><circle cx="16.5" cy="13.5" r="1.1"/>',
    chart: '<path d="M3 3v18h18"/><path d="M7 15l3.5-4 3 2.5L20 7"/>',
    bar: '<path d="M3 21h18"/><rect x="5" y="11" width="3.4" height="7" rx="1"/><rect x="10.3" y="6" width="3.4" height="12" rx="1"/><rect x="15.6" y="14" width="3.4" height="4" rx="1"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.2 2"/>',
    dumbbell: '<path d="M6.5 6.5v11M3 9v6M17.5 6.5v11M21 9v6M6.5 12h11"/>',
    shop: '<path d="M3.5 8h17l-1.2 11.2a2 2 0 0 1-2 1.8H6.7a2 2 0 0 1-2-1.8Z"/><path d="M8.5 8V6a3.5 3.5 0 1 1 7 0v2"/>',
    box: '<path d="M21 8.5 12 3.5 3 8.5v7L12 20.5l9-5Z"/><path d="M3 8.5 12 13.5l9-5M12 13.5V20.5"/>',
    wrench: '<path d="M14.7 6.3a4.5 4.5 0 0 0 5.9 5.9l-8.5 8.5a2.5 2.5 0 0 1-3.5-3.5Z"/><path d="M18.5 3.5 21 6l-2 2-2.5-2.5Z"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
    msg: '<path d="M20.5 12.5c0 4.1-3.8 7.4-8.5 7.4a10 10 0 0 1-2.6-.34L4.5 21l1.2-3.6A7 7 0 0 1 3.5 12.5C3.5 8.4 7.3 5 12 5s8.5 3.4 8.5 7.5Z"/>',
    cog: '<circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.3a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-2.8-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3.5 14H3a2 2 0 1 1 0-4h.2A1.6 1.6 0 0 0 4.3 7.2l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3h.1A1.6 1.6 0 0 0 10 3.2V3a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.3a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.3 1.2Z"/>',
    branch: '<path d="M4 21V8.5L12 3l8 5.5V21"/><path d="M9.5 21v-6h5v6"/><path d="M2.5 21h19"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4 2v-8Z"/>',
    down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    left: '<path d="m15 5-7 7 7 7"/>',
    right: '<path d="m9 5 7 7-7 7"/>',
    chevD: '<path d="m6 9 6 6 6-6"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    bell: '<path d="M18 8.5a6 6 0 1 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 14.5 18 8.5Z"/><path d="M13.7 20a2 2 0 0 1-3.4 0"/>',
    alert: '<path d="M12 3.5 22 20H2Z"/><path d="M12 10v4M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    trash: '<path d="M4 7h16M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2"/><path d="M6 7v12.5A1.5 1.5 0 0 0 7.5 21h9a1.5 1.5 0 0 0 1.5-1.5V7"/><path d="M10 11.5v5.5M14 11.5v5.5"/>',
    edit: '<path d="M15.5 4.5 19.5 8.5"/><path d="M4 20h4L20 8a2.8 2.8 0 0 0-4-4L4 16Z"/>',
    print: '<path d="M6.5 9V3.5h11V9"/><rect x="3" y="9" width="18" height="7.5" rx="2"/><path d="M6.5 14h11v6.5h-11Z"/>',
    export: '<path d="M12 15V3"/><path d="M8 7l4-4 4 4"/><path d="M4 15v3.5A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5V15"/>',
    save: '<path d="M5 3h11l3 3v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M7.5 3v5.5h7V3M7.5 21v-6h9v6"/>',
    logout: '<path d="M9.5 21H6a2.5 2.5 0 0 1-2.5-2.5v-13A2.5 2.5 0 0 1 6 3h3.5"/><path d="M16 16.5 20.5 12 16 7.5M20 12H9"/>',
    lock: '<rect x="4.5" y="10" width="15" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>',
    phone: '<path d="M6 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6.5 6.5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 3.5 5.7 2 2 0 0 1 5.5 3.5Z"/>',
    map: '<path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>',
    star: '<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 17l-5.3 2.7 1.1-5.9-4.3-4.1 5.9-.8Z"/>',
    fire: '<path d="M12 21c3.6 0 6-2.4 6-5.6 0-4.4-4.5-5.6-3.6-11.4C11.5 5.5 9 8.4 9 11c0 1.4.6 2.3.6 2.3S8 12.5 7.5 10.6C6.6 12 6 13.6 6 15.4 6 18.6 8.4 21 12 21Z"/>',
    pause: '<rect x="6.5" y="4.5" width="4" height="15" rx="1.4"/><rect x="13.5" y="4.5" width="4" height="15" rx="1.4"/>',
    play: '<path d="M7 4.8v14.4l12-7.2Z"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 4v5h-5"/>',
    scale: '<path d="M12 3v18"/><path d="M5 8h14"/><path d="m5 8-3 7h6ZM19 8l-3 7h6Z"/>',
    heart: '<path d="M12 20.5S3.5 15 3.5 9.4A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 8.5 2.4C20.5 15 12 20.5 12 20.5Z"/>',
    trend: '<path d="M3 17.5 9.5 11l4 4L21 7"/><path d="M15.5 7H21v5.5"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5"/>',
    copy: '<rect x="8.5" y="8.5" width="12" height="12" rx="2"/><path d="M15.5 5.5v-1a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h1"/>',
    key: '<circle cx="8" cy="14" r="4.5"/><path d="m11.5 11 8-8M17 5.5l2 2M15 7.5l2 2"/>',
    grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.6"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
    door: '<path d="M4 21h16"/><path d="M6 21V4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21"/><path d="M14.5 12h.01"/>',
    whistle: '<path d="M14 8a6 6 0 1 0 0 8h6.5a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 20.5 8Z"/><circle cx="8" cy="12" r="2"/>',
    sparkle: '<path d="m12 3 1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4Z"/><path d="M18.5 16.5 19.3 19l2.5.8-2.5.8-.8 2.5-.8-2.5-2.5-.8 2.5-.8Z"/>',
    shield: '<path d="M12 3 5 5.8v5.4c0 4.5 3 7.9 7 9.8 4-1.9 7-5.3 7-9.8V5.8Z"/><path d="m9 12 2 2 4-4"/>',
    receipt: '<path d="M5 3h14v18l-2.3-1.5L14.4 21l-2.4-1.5L9.6 21l-2.3-1.5L5 21Z"/><path d="M9 8h6M9 12h6"/>',
    zap: '<path d="M13.5 3 5 13.5h6L10.5 21 19 10.5h-6Z"/>',
    snow: '<path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9"/>',
    tag: '<path d="M11.5 3H21v9.5L11 22.5 1.5 13Z"/><circle cx="16.5" cy="7.5" r="1.4"/>',
    building: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01"/><path d="M10 21v-3h4v3"/>',
    activity: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5Z"/><path d="m3 13 9 5 9-5"/>',
    history: '<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1"/><path d="M3 4v5h5"/><path d="M12 7.5V12l3 2"/>',
  };
  U.ico = function (name, cls) {
    var d = P[name] || P.info;
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" stroke-linejoin="round"' + (cls ? ' class="' + cls + '"' : '') +
      ' aria-hidden="true">' + d + '</svg>';
  };
  U.hasIco = function (n) { return !!P[n]; };

  /* ---------- 6. DOM ---------- */

  U.$ = function (s, r) { return (r || document).querySelector(s); };
  U.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  U.html = function (elOrSel, h) {
    var el = typeof elOrSel === 'string' ? U.$(elOrSel) : elOrSel;
    if (el) el.innerHTML = h;
    return el;
  };
  U.on = function (ev, sel, fn) {
    document.addEventListener(ev, function (e) {
      var t = e.target.closest ? e.target.closest(sel) : null;
      if (t && document.contains(t)) fn(e, t);
    });
  };

  /* ---------- 7. توست ---------- */

  U.toast = function (msg, kind) {
    var box = U.$('.toasts');
    if (!box) { box = document.createElement('div'); box.className = 'toasts'; document.body.appendChild(box); }
    var t = document.createElement('div');
    t.className = 'toast ' + (kind || 'ok');
    t.innerHTML = U.ico(kind === 'err' ? 'alert' : kind === 'info' ? 'info' : 'check') +
      '<span>' + U.esc(msg) + '</span>';
    box.appendChild(t);
    setTimeout(function () {
      t.style.transition = 'opacity .22s,transform .22s';
      t.style.opacity = '0'; t.style.transform = 'translateY(8px)';
      setTimeout(function () { t.remove(); }, 240);
    }, kind === 'err' ? 4200 : 2600);
  };

  /* ---------- 8. مودال ---------- */

  var stack = [];
  U.modal = function (opts) {
    var previousFocus = document.activeElement;
    var ovl = document.createElement('div');
    ovl.className = 'ovl';
    var w = opts.width ? ' w-' + opts.width : '';
    ovl.innerHTML =
      '<div class="modal' + w + '" role="dialog" aria-modal="true" aria-label="' + U.esc(opts.title || '') + '">' +
      '<div class="modal-h"><div><h3>' + U.esc(opts.title || '') + '</h3>' +
      (opts.sub ? '<div class="sub">' + U.esc(opts.sub) + '</div>' : '') + '</div>' +
      '<button class="icon-btn x" data-close aria-label="إغلاق">' + U.ico('x') + '</button></div>' +
      '<div class="modal-b">' + (opts.body || '') + '</div>' +
      (opts.footer === null ? '' : '<div class="modal-f">' + (opts.footer || '') + '</div>') +
      '</div>';
    document.body.appendChild(ovl);
    document.body.style.overflow = 'hidden';
    stack.push(ovl);

    function close() {
      var i = stack.indexOf(ovl);
      if (i > -1) stack.splice(i, 1);
      ovl.remove();
      if (!stack.length) document.body.style.overflow = '';
      if (opts.onClose) opts.onClose();
      if (previousFocus && previousFocus.isConnected) previousFocus.focus();
    }
    ovl.addEventListener('mousedown', function (e) {
      if (e.target === ovl && opts.dismissable !== false) close();
    });
    ovl.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) close();
    });
    ovl.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' || stack[stack.length - 1] !== ovl) return;
      var focusable = Array.from(ovl.querySelectorAll('button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),a[href],summary,[tabindex="0"]'))
        .filter(function (el) { return el.getClientRects().length > 0; });
      var first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    var api = { el: ovl, body: ovl.querySelector('.modal-b'), foot: ovl.querySelector('.modal-f'), close: close };
    if (opts.onOpen) opts.onOpen(api);
    setTimeout(function () {
      var f = ovl.querySelector('[autofocus],input:not([type=hidden]),select,textarea');
      if (!opts.noFocus && ovl.isConnected) (f || ovl.querySelector('[data-close]')).focus();
    }, 60);
    return api;
  };

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && stack.length) {
      var top = stack[stack.length - 1];
      var btn = top.querySelector('[data-close]');
      if (btn) btn.click();
    }
  });

  U.confirm = function (opts) {
    return new Promise(function (res) {
      var m = U.modal({
        title: opts.title || 'متأكد؟',
        width: 'sm',
        body: '<p style="font-size:14.5px;line-height:1.7">' + (opts.body || '') + '</p>',
        footer: '<div class="grow"></div>' +
          '<button class="btn btn-ghost" data-close>إلغاء</button>' +
          '<button class="btn ' + (opts.danger ? 'btn-danger' : 'btn-ink') + '" data-yes>' +
          U.esc(opts.ok || 'تمام') + '</button>',
        onClose: function () { res(false); }
      });
      m.el.querySelector('[data-yes]').addEventListener('click', function () {
        res(true); m.close();
      });
    });
  };

  /* ---------- 9. دروَر ---------- */

  U.drawer = function (opts) {
    var old = U.$('.drawer'); if (old) { old.remove(); var o = U.$('.drawer-ovl'); if (o) o.remove(); }
    var ovl = document.createElement('div'); ovl.className = 'drawer-ovl';
    var d = document.createElement('aside');
    d.className = 'drawer' + (opts.wide ? ' wide' : '');
    d.innerHTML =
      '<div class="drawer-h">' + (opts.head || '') +
      '<button class="icon-btn" data-dclose style="margin-inline-start:auto">' + U.ico('x') + '</button></div>' +
      '<div class="drawer-b">' + (opts.body || '') + '</div>' +
      (opts.foot ? '<div class="drawer-f">' + opts.foot + '</div>' : '');
    document.body.appendChild(ovl); document.body.appendChild(d);
    document.body.style.overflow = 'hidden';
    function close() {
      d.remove(); ovl.remove();
      if (!stack.length) document.body.style.overflow = '';
      if (opts.onClose) opts.onClose();
    }
    ovl.addEventListener('click', close);
    d.addEventListener('click', function (e) { if (e.target.closest('[data-dclose]')) close(); });
    var api = { el: d, body: d.querySelector('.drawer-b'), close: close };
    if (opts.onOpen) opts.onOpen(api);
    return api;
  };

  /* ---------- 10. تصدير ---------- */

  U.download = function (name, content, mime) {
    var blob = content instanceof Blob ? content : new Blob(['﻿' + content], { type: mime || 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 400);
  };
  U.csv = function (name, rows) {
    var out = rows.map(function (r) {
      return r.map(function (c) {
        c = c === null || c === undefined ? '' : String(c);
        return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c;
      }).join(',');
    }).join('\r\n');
    U.download(name.replace(/\.csv$/, '') + '.csv', out, 'text/csv;charset=utf-8');
  };

  /* ---------- 11. طباعة ---------- */

  U.print = function (html) {
    var root = U.$('#printroot');
    if (!root) {
      root = document.createElement('div'); root.id = 'printroot';
      document.body.appendChild(root);
    }
    root.innerHTML = html;
    setTimeout(function () { window.print(); }, 90);
  };
  /* باركود بسيط (خطوط من كود العضو) — للقراءة البصرية مش لماسح ضوئي حقيقي */
  U.barcode = function (code, h) {
    var s = String(code || ''), out = '', seed = 0;
    for (var i = 0; i < s.length; i++) seed += s.charCodeAt(i) * (i + 3);
    for (var j = 0; j < 44; j++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      var w = 1 + (seed >> 8) % 3;
      out += '<i style="width:' + w + 'px"></i>';
    }
    return '<div class="barcode"' + (h ? ' style="height:' + h + '"' : '') + '>' + out + '</div>';
  };

  /* ---------- 12. عشوائي بذرة ثابتة (للبيانات التجريبية) ---------- */

  U.rng = function (seed) {
    var s = seed || 12345;
    function r() { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }
    r.int = function (a, b) { return a + Math.floor(r() * (b - a + 1)); };
    r.pick = function (arr) { return arr[Math.floor(r() * arr.length)]; };
    r.chance = function (p) { return r() < p; };
    r.shuffle = function (arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
      return a;
    };
    r.weighted = function (pairs) {
      var tot = pairs.reduce(function (t, p) { return t + p[1]; }, 0), x = r() * tot;
      for (var i = 0; i < pairs.length; i++) { x -= pairs[i][1]; if (x <= 0) return pairs[i][0]; }
      return pairs[pairs.length - 1][0];
    };
    return r;
  };
})();
