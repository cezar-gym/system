/* ============================================================
   سيزر جيم — نظام الإدارة | طبقة البيانات
   ------------------------------------------------------------
   كل البيانات بتتخزّن في متصفّح الجهاز نفسه (localStorage).
   يعني: مفيش سيرفر، مفيش اشتراك شهري، والداتا مش بتطلع بره الجهاز.
   الفرعين بيتداروا من نفس النظام — كل سجل فيه branchId.
   النسخ الاحتياطي = ملف JSON بيتصدّر من الإعدادات.
   ============================================================ */
(function () {
  'use strict';
  var CZ = window.CZ, U = CZ.u;
  var KEY = 'cezar.system.v1';
  var S = (CZ.s = {});

  CZ.CUR = 'ج';

  /* المجموعات — أي مجموعة جديدة تتضاف هنا وبس */
  var COLLS = ['branches', 'users', 'plans', 'members', 'subs', 'attend', 'money',
    'staff', 'shifts', 'classes', 'bookings', 'pt', 'ptlog', 'products', 'sales',
    'equip', 'maint', 'leads', 'measures', 'templates', 'lockers', 'log', 'tasks'];

  var db = null;

  function blank() {
    var o = { meta: { v: 1, created: U.isoT(), updated: U.isoT() }, settings: {} };
    COLLS.forEach(function (c) { o[c] = []; });
    return o;
  }

  /* ---------- تحميل / حفظ ---------- */

  S.load = function () {
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { }
    if (raw) {
      try { db = JSON.parse(raw); } catch (e) { db = null; }
    }
    if (!db || !db.members) {
      db = blank();
      if (CZ.seed) CZ.seed(db);
      S.save();
    }
    COLLS.forEach(function (c) { if (!Array.isArray(db[c])) db[c] = []; });
    db.settings = Object.assign({}, S.defaults, db.settings || {});
    return db;
  };

  S.defaults = {
    gymName: 'سيزر جيم',
    gymLatin: 'CEZAR GYM',
    tagline: 'اصنع المحارب اللي جوّاك',
    currency: 'ج',
    expiryWarnDays: 7,
    absentWarnDays: 10,
    lowStockOn: true,
    sessionGraceDays: 5,
    maxFreezeDays: 14,
    autoLogoutMin: 0,
    receiptFooter: 'شكرًا لاشتراكك في سيزر جيم — الإيصال ده إثبات دفع.',
    waCountry: '20'
  };

  var saveT = null;
  S.save = function (now) {
    if (!db) return;
    db.meta.updated = U.isoT();
    function w() {
      try { localStorage.setItem(KEY, JSON.stringify(db)); }
      catch (e) {
        U.toast('مساحة التخزين اتملت — صدّر نسخة احتياطية وامسح بيانات قديمة', 'err');
      }
    }
    if (now) { clearTimeout(saveT); w(); return; }
    clearTimeout(saveT); saveT = setTimeout(w, 260);
  };

  S.db = function () { return db || S.load(); };
  S.all = function (c) { return (db && db[c]) || []; };
  S.get = function (c, id) {
    var a = S.all(c);
    for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i];
    return null;
  };
  S.where = function (c, f) { return S.all(c).filter(f); };
  S.find = function (c, f) { var a = S.all(c); for (var i = 0; i < a.length; i++) if (f(a[i])) return a[i]; return null; };

  S.add = function (c, obj, quiet) {
    obj.id = obj.id || U.uid(c.slice(0, 3));
    obj.createdAt = obj.createdAt || U.isoT();
    db[c].push(obj);
    if (!quiet) S.log('أضاف', c, obj.id, obj.name || obj.title || '');
    S.save();
    return obj;
  };
  S.upd = function (c, id, patch, quiet) {
    var o = S.get(c, id);
    if (!o) return null;
    Object.assign(o, patch);
    o.updatedAt = U.isoT();
    if (!quiet) S.log('عدّل', c, id, o.name || o.title || '');
    S.save();
    return o;
  };
  S.del = function (c, id) {
    var o = S.get(c, id);
    db[c] = db[c].filter(function (x) { return x.id !== id; });
    if (o) S.log('حذف', c, id, o.name || o.title || '');
    S.save();
    return o;
  };

  /* ---------- سجل النشاط ---------- */

  S.log = function (action, entity, entityId, detail) {
    if (!db.log) db.log = [];
    db.log.unshift({
      id: U.uid('lg'), at: U.isoT(), userId: CZ.state && CZ.state.user ? CZ.state.user.id : null,
      userName: CZ.state && CZ.state.user ? CZ.state.user.name : 'النظام',
      branchId: CZ.state ? CZ.state.branch : null,
      action: action, entity: entity, entityId: entityId, detail: detail || ''
    });
    if (db.log.length > 900) db.log.length = 900;
  };

  /* ---------- الفروع ---------- */

  S.branches = function () { return S.all('branches').filter(function (b) { return b.active !== false; }); };
  S.branch = function (id) { return S.get('branches', id); };
  S.branchName = function (id) { var b = S.branch(id); return b ? b.name : '—'; };
  S.branchShort = function (id) { var b = S.branch(id); return b ? (b.short || b.name) : '—'; };
  S.branchColor = function (id) { var b = S.branch(id); return b ? b.color : '#9A9B91'; };
  /* فلترة أي مجموعة على الفرع المختار حاليًا */
  S.scope = function (arr, branchId) {
    var b = branchId === undefined ? (CZ.state ? CZ.state.branch : 'all') : branchId;
    if (!b || b === 'all') return arr;
    return arr.filter(function (x) { return x.branchId === b; });
  };
  S.inScope = function (x, branchId) {
    var b = branchId === undefined ? (CZ.state ? CZ.state.branch : 'all') : branchId;
    return !b || b === 'all' || x.branchId === b;
  };

  /* ---------- الأعضاء والاشتراكات ---------- */

  S.member = function (id) { return S.get('members', id); };
  S.memberName = function (id) { var m = S.member(id); return m ? m.name : '—'; };

  /* الاشتراك الشغّال حاليًا (الأحدث اللي لسه ساري أو مجمّد) */
  S.activeSub = function (memberId) {
    var subs = S.where('subs', function (s) {
      return s.memberId === memberId && (s.status === 'active' || s.status === 'frozen');
    }).sort(U.by('endAt', 'desc'));
    return subs[0] || null;
  };
  S.lastSub = function (memberId) {
    return S.where('subs', function (s) { return s.memberId === memberId; })
      .sort(U.by('endAt', 'desc'))[0] || null;
  };
  S.memberSubs = function (memberId) {
    return S.where('subs', function (s) { return s.memberId === memberId; }).sort(U.by('startAt', 'desc'));
  };

  S.daysLeft = function (sub) { return sub ? U.diffDays(sub.endAt) : 0; };
  S.sessionsLeft = function (sub) {
    if (!sub) return 0;
    if (sub.sessionsTotal === null || sub.sessionsTotal === undefined) return Infinity;
    return Math.max(0, sub.sessionsTotal - (sub.sessionsUsed || 0));
  };

  /* حالة العضو — دي أهم دالة في النظام كله */
  S.status = function (m) {
    if (!m) return { k: 'none', t: 'غير معروف', cls: '' };
    if (m.status === 'blocked') return { k: 'blocked', t: 'موقوف', cls: 'danger' };
    var s = S.activeSub(m.id);
    if (!s) {
      var last = S.lastSub(m.id);
      if (!last) return { k: 'nosub', t: 'من غير اشتراك', cls: '' };
      return { k: 'expired', t: 'منتهي', cls: 'danger', sub: last, days: U.diffDays(last.endAt) };
    }
    if (s.status === 'frozen') return { k: 'frozen', t: 'مجمّد', cls: 'info', sub: s };
    var d = U.diffDays(s.endAt);
    var left = S.sessionsLeft(s);
    if (d < 0) return { k: 'expired', t: 'منتهي', cls: 'danger', sub: s, days: d };
    if (left === 0) return { k: 'nosessions', t: 'الجلسات خلصت', cls: 'warn', sub: s, days: d };
    if (d <= (db.settings.expiryWarnDays || 7))
      return { k: 'expiring', t: 'بيخلص خلال ' + d + ' يوم', cls: 'warn', sub: s, days: d };
    return { k: 'active', t: 'ساري', cls: 'ok', sub: s, days: d, left: left };
  };

  /* المتأخرات على العضو (اللي اتفق عليه وما اتدفعش) */
  S.debt = function (memberId) {
    return U.sum(S.where('subs', function (s) {
      return s.memberId === memberId && s.status !== 'cancelled';
    }), function (s) { return Math.max(0, (s.price || 0) - (s.paid || 0)); });
  };
  S.totalDebt = function (branchId) {
    return U.sum(S.scope(S.where('subs', function (s) { return s.status !== 'cancelled'; }), branchId),
      function (s) { return Math.max(0, (s.price || 0) - (s.paid || 0)); });
  };

  /* آخر حضور */
  S.lastVisit = function (memberId) {
    var a = S.where('attend', function (x) { return x.memberId === memberId; }).sort(U.by('inAt', 'desc'));
    return a[0] || null;
  };
  S.visitCount = function (memberId, sinceISO) {
    return S.where('attend', function (x) {
      return x.memberId === memberId && (!sinceISO || x.inAt >= sinceISO);
    }).length;
  };
  S.inGym = function (branchId) {
    var t = U.today();
    return S.scope(S.where('attend', function (a) {
      return !a.outAt && a.inAt.slice(0, 10) === t;
    }), branchId);
  };
  S.isInGym = function (memberId) {
    return !!S.find('attend', function (a) {
      return a.memberId === memberId && !a.outAt && a.inAt.slice(0, 10) === U.today();
    });
  };

  /* توليد كود عضو جديد — CZ + رقم متسلسل */
  S.nextCode = function () {
    var max = 1000;
    S.all('members').forEach(function (m) {
      var n = parseInt(String(m.code || '').replace(/\D/g, ''), 10);
      if (n && n > max) max = n;
    });
    return String(max + 1);
  };

  /* ---------- الفترات (رجالة / سيدات) ---------- */

  S.segments = function (branchId, dow) {
    var b = S.branch(branchId) || S.branches()[0];
    if (!b || !b.schedule) return [];
    return b.schedule[String(dow)] || [];
  };
  S.segAt = function (branchId, date) {
    date = date || new Date();
    var mins = date.getHours() * 60 + date.getMinutes();
    var d = date.getDay();
    var segs = S.segments(branchId, d);
    for (var i = 0; i < segs.length; i++) {
      if (mins >= segs[i].from && mins < segs[i].to) return segs[i].g;
    }
    /* الفترات اللي بتعدّي نص الليل بتتسجّل في اليوم اللي فات */
    var prev = S.segments(branchId, (d + 6) % 7);
    for (var j = 0; j < prev.length; j++) {
      if (prev[j].to > 1440 && mins + 1440 >= prev[j].from && mins + 1440 < prev[j].to) return prev[j].g;
    }
    return null;
  };

  /* ---------- تسجيل الدخول والخروج ---------- */

  /* بيرجّع {ok, reason, warn, member, sub} — الفحص كله في مكان واحد */
  S.checkEligible = function (member, branchId) {
    var r = { ok: false, member: member, warns: [] };
    if (!member) { r.reason = 'مفيش عضو بالكود ده'; return r; }
    if (member.status === 'blocked') { r.reason = 'العضو موقوف: ' + (member.blockReason || 'من غير سبب مكتوب'); return r; }
    if (S.isInGym(member.id)) { r.reason = 'العضو مسجّل دخول بالفعل ولسه ما خرجش'; r.dup = true; return r; }

    var sub = S.activeSub(member.id);
    r.sub = sub;
    if (!sub) { r.reason = 'مفيش اشتراك ساري — لازم يجدّد أو يدفع تمرين منفصل'; r.renew = true; return r; }
    if (sub.status === 'frozen') { r.reason = 'الاشتراك مجمّد لحد ' + U.fDate(sub.freezeTo); r.frozen = true; return r; }

    var d = U.diffDays(sub.endAt);
    if (d < 0) { r.reason = 'الاشتراك خلص من ' + (-d) + ' يوم'; r.renew = true; return r; }

    var left = S.sessionsLeft(sub);
    if (left <= 0) { r.reason = 'الجلسات خلصت (' + sub.sessionsTotal + ' جلسة)'; r.renew = true; return r; }

    /* تحذيرات مش مانعة */
    if (d <= 3) r.warns.push('الاشتراك بيخلص بعد ' + d + ' يوم — فكّره بالتجديد');
    if (left <= 2) r.warns.push('فاضل ' + left + ' جلسة بس');
    var debt = S.debt(member.id);
    if (debt > 0) r.warns.push('عليه متأخرات ' + U.m(debt));
    if (member.branchId !== branchId && branchId && branchId !== 'all')
      r.warns.push('العضو مسجّل في ' + S.branchShort(member.branchId) + ' — دي زيارة لفرع تاني');

    var seg = S.segAt(branchId || member.branchId);
    if (seg === null) r.warns.push('الجيم مقفول في الوقت ده حسب الجدول');
    else if (seg === 'women' && member.gender === 'm') r.warns.push('دلوقتي فترة السيدات');
    else if (seg === 'men' && member.gender === 'f') r.warns.push('دلوقتي فترة الرجالة');

    r.ok = true;
    r.left = left; r.days = d;
    return r;
  };

  S.checkIn = function (memberId, branchId, opts) {
    opts = opts || {};
    var m = S.member(memberId);
    var sub = S.activeSub(memberId);
    var rec = {
      id: U.uid('at'), memberId: memberId,
      branchId: branchId && branchId !== 'all' ? branchId : (m ? m.branchId : null),
      subId: sub ? sub.id : null,
      inAt: U.isoT(), outAt: null,
      type: opts.type || 'session',
      seg: S.segAt(branchId, new Date()),
      by: CZ.state && CZ.state.user ? CZ.state.user.id : null,
      note: opts.note || ''
    };
    db.attend.push(rec);
    if (sub && rec.type === 'session' && sub.sessionsTotal) {
      sub.sessionsUsed = (sub.sessionsUsed || 0) + 1;
    }
    if (m) m.lastVisit = rec.inAt;
    S.log('سجّل دخول', 'members', memberId, m ? m.name : '');
    S.save();
    return rec;
  };

  S.checkOut = function (attendId) {
    var a = S.get('attend', attendId);
    if (!a || a.outAt) return null;
    a.outAt = U.isoT();
    S.save();
    return a;
  };

  /* إلغاء تسجيل دخول بالغلط — بيرجّع الجلسة */
  S.undoCheckIn = function (attendId) {
    var a = S.get('attend', attendId);
    if (!a) return null;
    if (a.subId && a.type === 'session') {
      var s = S.get('subs', a.subId);
      if (s && s.sessionsUsed > 0) s.sessionsUsed--;
    }
    db.attend = db.attend.filter(function (x) { return x.id !== attendId; });
    S.log('ألغى دخول', 'members', a.memberId, S.memberName(a.memberId));
    S.save();
    return a;
  };

  /* ---------- الفلوس ---------- */

  S.addMoney = function (o) {
    o.id = o.id || U.uid('mn');
    o.at = o.at || U.isoT();
    o.by = o.by || (CZ.state && CZ.state.user ? CZ.state.user.id : null);
    o.branchId = o.branchId && o.branchId !== 'all' ? o.branchId : (CZ.state && CZ.state.branch !== 'all' ? CZ.state.branch : S.branches()[0].id);
    db.money.push(o);
    S.save();
    return o;
  };
  S.income = function (from, to, branchId) {
    return S.scope(S.where('money', function (x) {
      return x.kind === 'in' && x.at >= from && x.at < U.addDays(to, 1);
    }), branchId);
  };
  S.expense = function (from, to, branchId) {
    return S.scope(S.where('money', function (x) {
      return x.kind === 'out' && x.at >= from && x.at < U.addDays(to, 1);
    }), branchId);
  };
  S.net = function (from, to, branchId) {
    return U.sum(S.income(from, to, branchId), 'amount') - U.sum(S.expense(from, to, branchId), 'amount');
  };

  S.CATS_IN = {
    sub: 'اشتراك', renew: 'تجديد', single: 'تمرين منفصل', pt: 'تدريب خاص',
    activity: 'نشاط', sauna: 'ساونا', shop: 'بوفيه ومكملات', locker: 'لوكر',
    guest: 'دعوة', fine: 'غرامة', other: 'إيراد آخر'
  };
  S.CATS_OUT = {
    rent: 'إيجار', salary: 'مرتبات', power: 'كهربا ومياه', maint: 'صيانة',
    equip: 'شراء أجهزة', supplies: 'مستلزمات ونضافة', marketing: 'تسويق وإعلانات',
    stock: 'شراء بضاعة', tax: 'ضرايب ورسوم', internet: 'نت وتليفون', other: 'مصروف آخر'
  };
  S.METHODS = {
    cash: 'كاش', vodafone: 'فودافون كاش', instapay: 'إنستاباي', visa: 'فيزا', bank: 'تحويل بنكي'
  };

  /* ---------- الباقات ---------- */

  S.plan = function (id) { return S.get('plans', id); };
  S.planName = function (id) { var p = S.plan(id); return p ? p.name : '—'; };
  S.planPrice = function (plan, branchId) {
    if (!plan) return 0;
    if (plan.priceBy && branchId && plan.priceBy[branchId] !== undefined) return plan.priceBy[branchId];
    return plan.price || 0;
  };
  S.PLAN_TYPES = {
    monthly: 'شهري', yearly: 'طويل المدى', activity: 'أنشطة', single: 'منفصل', pt: 'تدريب خاص'
  };

  /* إنشاء اشتراك جديد — القلب المالي للنظام */
  S.createSub = function (o) {
    var plan = S.plan(o.planId);
    var start = o.startAt || U.today();
    var months = o.months || (plan && plan.months) || 1;
    var sub = {
      id: U.uid('sb'),
      memberId: o.memberId,
      planId: o.planId,
      planName: plan ? plan.name : (o.planName || '—'),
      branchId: o.branchId,
      startAt: start,
      endAt: o.endAt || U.addMonths(start, months),
      months: months,
      sessionsTotal: o.sessionsTotal !== undefined ? o.sessionsTotal : (plan ? plan.sessions : null),
      sessionsUsed: 0,
      price: o.price || 0,
      listPrice: o.listPrice || o.price || 0,
      discount: o.discount || 0,
      discountNote: o.discountNote || '',
      paid: o.paid || 0,
      method: o.method || 'cash',
      coachId: o.coachId || null,
      status: 'active',
      note: o.note || '',
      by: CZ.state && CZ.state.user ? CZ.state.user.id : null,
      createdAt: U.isoT()
    };
    db.subs.push(sub);

    /* أي اشتراك قديم ساري يتقفل */
    S.where('subs', function (s) {
      return s.memberId === o.memberId && s.id !== sub.id && (s.status === 'active' || s.status === 'frozen');
    }).forEach(function (s) { s.status = 'replaced'; });

    if (sub.paid > 0) {
      S.addMoney({
        kind: 'in', amount: sub.paid, cat: o.isRenew ? 'renew' : 'sub',
        method: sub.method, memberId: o.memberId, subId: sub.id, branchId: sub.branchId,
        note: sub.planName + (sub.discount ? ' (خصم ' + sub.discount + '%)' : '')
      });
    }
    var m = S.member(o.memberId);
    if (m) { m.status = 'active'; }
    S.log(o.isRenew ? 'جدّد اشتراك' : 'اشتراك جديد', 'members', o.memberId, (m ? m.name : '') + ' — ' + sub.planName);
    S.save();
    return sub;
  };

  /* تجميد */
  S.freeze = function (subId, days, reason) {
    var s = S.get('subs', subId);
    if (!s) return null;
    s.status = 'frozen';
    s.freezeFrom = U.today();
    s.freezeTo = U.addDays(U.today(), days);
    s.freezeDays = (s.freezeDays || 0) + days;
    s.endAt = U.addDays(s.endAt, days);
    s.freezes = s.freezes || [];
    s.freezes.push({ from: s.freezeFrom, to: s.freezeTo, days: days, reason: reason || '' });
    S.log('جمّد اشتراك', 'members', s.memberId, S.memberName(s.memberId) + ' — ' + days + ' يوم');
    S.save();
    return s;
  };
  S.unfreeze = function (subId) {
    var s = S.get('subs', subId);
    if (!s) return null;
    /* لو رجّع بدري، الأيام اللي ما اتستخدمتش تترجّع */
    if (s.freezeTo) {
      var unused = U.diffDays(s.freezeTo);
      if (unused > 0) s.endAt = U.addDays(s.endAt, -unused);
    }
    s.status = 'active';
    s.freezeFrom = null; s.freezeTo = null;
    S.log('فكّ تجميد', 'members', s.memberId, S.memberName(s.memberId));
    S.save();
    return s;
  };

  /* بيشتغل مرة عند فتح النظام: يقفل الاشتراكات المنتهية ويفك التجميد الخلصان */
  S.reconcile = function () {
    var today = U.today(), n = 0;
    S.all('subs').forEach(function (s) {
      if (s.status === 'frozen' && s.freezeTo && s.freezeTo < today) { s.status = 'active'; s.freezeFrom = null; s.freezeTo = null; n++; }
      if (s.status === 'active' && s.endAt < today) { s.status = 'expired'; n++; }
    });
    S.all('members').forEach(function (m) {
      var st = S.status(m);
      var want = st.k === 'active' || st.k === 'expiring' || st.k === 'nosessions' ? 'active'
        : st.k === 'frozen' ? 'frozen' : m.status === 'blocked' ? 'blocked' : 'expired';
      if (m.status !== want) { m.status = want; n++; }
    });
    /* أي حد نسي يعمل خروج امبارح أو قبله — يتقفل تلقائي */
    S.all('attend').forEach(function (a) {
      if (!a.outAt && a.inAt.slice(0, 10) < today) {
        var d = U.parse(a.inAt); d.setHours(d.getHours() + 2);
        a.outAt = U.isoT(d); a.autoOut = true; n++;
      }
    });
    if (n) S.save();
    return n;
  };

  /* ---------- التنبيهات — قلب لوحة القيادة ---------- */

  S.alerts = function (branchId) {
    var out = [];
    var warnD = db.settings.expiryWarnDays || 7;
    var absD = db.settings.absentWarnDays || 10;

    var expiring = S.scope(S.all('members'), branchId).filter(function (m) {
      var st = S.status(m);
      return st.k === 'expiring';
    });
    if (expiring.length) out.push({
      k: 'expiring', cls: 'warn', ico: 'clock',
      t: expiring.length + ' اشتراك بيخلص خلال ' + warnD + ' أيام',
      s: 'ابعتلهم رسالة تجديد قبل ما يمشوا', n: expiring.length, go: '#/members?f=expiring'
    });

    var expired = S.scope(S.all('members'), branchId).filter(function (m) {
      var st = S.status(m);
      return st.k === 'expired' && st.days > -45;
    });
    if (expired.length) out.push({
      k: 'expired', cls: 'danger', ico: 'alert',
      t: expired.length + ' اشتراك خلص من أقل من 45 يوم',
      s: 'دول أسهل ناس ترجّعهم — كلّمهم', n: expired.length, go: '#/members?f=expired'
    });

    var absent = S.scope(S.all('members'), branchId).filter(function (m) {
      var st = S.status(m);
      if (st.k !== 'active' && st.k !== 'expiring') return false;
      var lv = S.lastVisit(m.id);
      return !lv || U.diffDays(lv.inAt) < -absD;
    });
    if (absent.length) out.push({
      k: 'absent', cls: 'warn', ico: 'user',
      t: absent.length + ' عضو مشترك وغايب من أكتر من ' + absD + ' يوم',
      s: 'الغياب أول خطوة في الفقدان — اطمن عليهم', n: absent.length, go: '#/members?f=absent'
    });

    var debt = S.totalDebt(branchId);
    if (debt > 0) {
      var cnt = S.scope(S.all('members'), branchId).filter(function (m) { return S.debt(m.id) > 0; }).length;
      out.push({
        k: 'debt', cls: 'danger', ico: 'wallet',
        t: 'متأخرات ' + U.m(debt) + ' على ' + cnt + ' عضو',
        s: 'فلوس متفق عليها ومش متحصّلة', n: cnt, go: '#/finance?tab=debt'
      });
    }

    var low = S.scope(S.all('products'), branchId).filter(function (p) {
      return p.active !== false && p.stock <= (p.minStock || 0);
    });
    if (low.length) out.push({
      k: 'stock', cls: 'warn', ico: 'box',
      t: low.length + ' صنف في البوفيه خلص أو قرب يخلص',
      s: low.slice(0, 3).map(function (p) { return p.name; }).join('، '), n: low.length, go: '#/shop?tab=stock'
    });

    var due = S.scope(S.all('equip'), branchId).filter(function (e) {
      if (e.status === 'broken') return true;
      if (!e.serviceEvery || !e.lastService) return false;
      return U.diffDays(U.addDays(e.lastService, e.serviceEvery)) <= 0;
    });
    if (due.length) out.push({
      k: 'maint', cls: 'danger', ico: 'wrench',
      t: due.length + ' جهاز محتاج صيانة أو عطلان',
      s: due.slice(0, 3).map(function (e) { return e.name; }).join('، '), n: due.length, go: '#/equipment'
    });

    var follow = S.scope(S.all('leads'), branchId).filter(function (l) {
      return ['new', 'contacted', 'visited', 'trial'].indexOf(l.stage) > -1 &&
        l.nextFollow && l.nextFollow <= U.today();
    });
    if (follow.length) out.push({
      k: 'leads', cls: 'info', ico: 'target',
      t: follow.length + ' عميل محتمل ميعاد متابعته النهاردة أو فات',
      s: 'الليد اللي مش بيترد عليه بيروح لجيم تاني', n: follow.length, go: '#/leads'
    });

    var tasks = S.scope(S.all('tasks'), branchId).filter(function (t) {
      return !t.done && t.due && t.due <= U.today();
    });
    if (tasks.length) out.push({
      k: 'tasks', cls: 'info', ico: 'check',
      t: tasks.length + ' مهمة مستحقة', s: tasks.slice(0, 2).map(function (t) { return t.title; }).join('، '),
      n: tasks.length, go: '#/tasks'
    });

    var bdays = S.scope(S.all('members'), branchId).filter(function (m) {
      if (!m.birth) return false;
      var b = U.parse(m.birth), n = new Date();
      return b.getMonth() === n.getMonth() && b.getDate() === n.getDate();
    });
    if (bdays.length) out.push({
      k: 'bday', cls: 'lime', ico: 'sparkle',
      t: bdays.length + ' عضو عيد ميلاده النهاردة',
      s: bdays.map(function (m) { return m.name; }).join('، '), n: bdays.length, go: '#/messages?tpl=bday'
    });

    return out;
  };

  /* ---------- الإحصائيات ---------- */

  S.stats = function (branchId) {
    var members = S.scope(S.all('members'), branchId);
    var active = members.filter(function (m) {
      var k = S.status(m).k; return k === 'active' || k === 'expiring' || k === 'nosessions';
    });
    var today = U.today();
    var mStart = today.slice(0, 8) + '01';
    var lastMonthStart = U.addMonths(mStart, -1);
    var lastMonthEnd = U.addDays(mStart, -1);

    return {
      members: members.length,
      active: active.length,
      frozen: members.filter(function (m) { return S.status(m).k === 'frozen'; }).length,
      expired: members.filter(function (m) { return S.status(m).k === 'expired'; }).length,
      women: active.filter(function (m) { return m.gender === 'f'; }).length,
      inGym: S.inGym(branchId).length,
      todayVisits: S.scope(S.where('attend', function (a) { return a.inAt.slice(0, 10) === today; }), branchId).length,
      todayIn: U.sum(S.income(today, today, branchId), 'amount'),
      todayOut: U.sum(S.expense(today, today, branchId), 'amount'),
      monthIn: U.sum(S.income(mStart, today, branchId), 'amount'),
      monthOut: U.sum(S.expense(mStart, today, branchId), 'amount'),
      lastMonthIn: U.sum(S.income(lastMonthStart, lastMonthEnd, branchId), 'amount'),
      newThisMonth: members.filter(function (m) { return m.joinedAt >= mStart; }).length,
      newLastMonth: members.filter(function (m) { return m.joinedAt >= lastMonthStart && m.joinedAt <= lastMonthEnd; }).length,
      debt: S.totalDebt(branchId)
    };
  };

  /* حضور آخر N يوم — للرسوم */
  S.visitSeries = function (days, branchId) {
    var out = [], t = U.today();
    for (var i = days - 1; i >= 0; i--) {
      var d = U.addDays(t, -i);
      out.push({
        d: d,
        v: S.scope(S.where('attend', function (a) { return a.inAt.slice(0, 10) === d; }), branchId).length
      });
    }
    return out;
  };
  S.moneySeries = function (days, branchId) {
    var out = [], t = U.today();
    for (var i = days - 1; i >= 0; i--) {
      var d = U.addDays(t, -i);
      out.push({
        d: d,
        v: U.sum(S.income(d, d, branchId), 'amount'),
        e: U.sum(S.expense(d, d, branchId), 'amount')
      });
    }
    return out;
  };
  /* توزيع الحضور على الساعات (خريطة الزحمة) */
  S.heat = function (branchId, days) {
    days = days || 60;
    var since = U.addDays(U.today(), -days);
    var grid = [];
    for (var d = 0; d < 7; d++) { grid.push(new Array(24).fill(0)); }
    S.scope(S.where('attend', function (a) { return a.inAt >= since; }), branchId).forEach(function (a) {
      var x = U.parse(a.inAt);
      if (x) grid[x.getDay()][x.getHours()]++;
    });
    return grid;
  };

  /* ---------- المستخدمين والصلاحيات ---------- */

  S.ROLES = {
    owner: { t: 'صاحب الجيم', can: '*' },
    manager: { t: 'مدير فرع', can: ['dash', 'members', 'checkin', 'plans', 'finance', 'staff', 'classes', 'pt', 'shop', 'equip', 'leads', 'reports', 'messages', 'tasks'] },
    reception: { t: 'ريسبشن', can: ['dash', 'members', 'checkin', 'shop', 'leads', 'messages', 'classes', 'tasks'] },
    coach: { t: 'كابتن', can: ['dash', 'members', 'checkin', 'classes', 'pt'] }
  };
  S.can = function (key) {
    var u = CZ.state && CZ.state.user;
    if (!u) return false;
    var r = S.ROLES[u.role];
    if (!r) return false;
    if (r.can === '*') return true;
    if (key === 'reception') return u.role === 'reception' || u.role === 'manager';
    return r.can.indexOf(key) > -1;
  };

  /* ---------- نسخ احتياطي ---------- */

  S.export = function () {
    return JSON.stringify(db, null, 1);
  };
  S.import = function (json) {
    var o = typeof json === 'string' ? JSON.parse(json) : json;
    if (!o || !o.members) throw new Error('الملف مش نسخة سيزر صالحة');
    COLLS.forEach(function (c) { if (!Array.isArray(o[c])) o[c] = []; });
    db = o;
    db.settings = Object.assign({}, S.defaults, db.settings || {});
    S.save(true);
    return db;
  };
  S.reset = function () {
    db = blank();
    if (CZ.seed) CZ.seed(db);
    S.save(true);
    return db;
  };
  S.wipe = function () {
    db = blank();
    /* بيسيب الفروع والباقات والمستخدمين — بيمسح الداتا التشغيلية بس */
    if (CZ.seedBase) CZ.seedBase(db);
    S.save(true);
    return db;
  };
  S.size = function () {
    try { return new Blob([localStorage.getItem(KEY) || '']).size; } catch (e) { return 0; }
  };
  /* المتصفح بيدي حوالي 5 ميجا. الحضور هو اللي بيكبر بسرعة (كل زيارة سطر)،
     فالأرشفة بتشيل اللي أقدم من التاريخ ده بعد ما يتصدّر CSV. */
  S.LIMIT = 5 * 1024 * 1024;
  S.archiveAttendance = function (beforeISO) {
    var old = S.all('attend').filter(function (a) { return a.inAt < beforeISO; });
    db.attend = S.all('attend').filter(function (a) { return a.inAt >= beforeISO; });
    S.log('أرشف حضور', 'attend', '', old.length + ' سجل قبل ' + beforeISO);
    S.save(true);
    return old;
  };
})();
