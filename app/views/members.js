/* ============================================================
   سيزر جيم — الأعضاء
   الملف ده فيه: القايمة + ملف العضو + إضافة/تعديل + تجديد +
   تجميد + تحصيل متأخرات + كارت العضوية.
   ============================================================ */
(function () {
  'use strict';
  var CZ = window.CZ, U = CZ.u, S = CZ.s, W = CZ.w;
  CZ.views = CZ.views || {};
  CZ.state = CZ.state || { user: null, branch: 'all', params: {} };

  var F = { q: '', f: 'all', g: 'all', plan: 'all' };

  /* ---------- الفلاتر ---------- */
  function filtered() {
    var list = S.scope(S.all('members'), CZ.state.branch);
    if (F.q) list = list.filter(function (m) {
      return U.match(m.name, F.q) || String(m.code).indexOf(F.q) > -1 ||
        U.phone(m.phone).indexOf(U.phone(F.q)) > -1 || U.match(m.job, F.q);
    });
    if (F.g !== 'all') list = list.filter(function (m) { return m.gender === F.g; });
    if (F.plan !== 'all') list = list.filter(function (m) {
      var s = S.activeSub(m.id); return s && s.planId === F.plan;
    });
    if (F.f !== 'all') list = list.filter(function (m) {
      var st = S.status(m);
      if (F.f === 'active') return st.k === 'active';
      if (F.f === 'expiring') return st.k === 'expiring';
      if (F.f === 'expired') return st.k === 'expired';
      if (F.f === 'frozen') return st.k === 'frozen';
      if (F.f === 'debt') return S.debt(m.id) > 0;
      if (F.f === 'absent') {
        if (['active', 'expiring'].indexOf(st.k) < 0) return false;
        var lv = S.lastVisit(m.id);
        return !lv || U.diffDays(lv.inAt) < -(S.db().settings.absentWarnDays || 10);
      }
      if (F.f === 'new') return U.diffDays(m.joinedAt) > -30;
      if (F.f === 'blocked') return m.status === 'blocked';
      return true;
    });
    return list;
  }

  function counts() {
    var all = S.scope(S.all('members'), CZ.state.branch);
    var c = { all: all.length, active: 0, expiring: 0, expired: 0, frozen: 0, debt: 0, absent: 0, new: 0, blocked: 0 };
    var absD = S.db().settings.absentWarnDays || 10;
    all.forEach(function (m) {
      var st = S.status(m);
      if (st.k === 'active') c.active++;
      if (st.k === 'expiring') c.expiring++;
      if (st.k === 'expired') c.expired++;
      if (st.k === 'frozen') c.frozen++;
      if (m.status === 'blocked') c.blocked++;
      if (S.debt(m.id) > 0) c.debt++;
      if (U.diffDays(m.joinedAt) > -30) c.new++;
      if (['active', 'expiring'].indexOf(st.k) > -1) {
        var lv = S.lastVisit(m.id);
        if (!lv || U.diffDays(lv.inAt) < -absD) c.absent++;
      }
    });
    return c;
  }

  /* ---------- الصفحة ---------- */
  CZ.views.members = {
    title: 'الأعضاء',
    sub: function () {
      var c = S.scope(S.all('members'), CZ.state.branch).length;
      return U.n(c) + ' عضو · ' + (CZ.state.branch === 'all' ? 'كل الفروع' : S.branchName(CZ.state.branch));
    },
    perm: 'members',
    render: function (p) {
      if (p.f) { F.f = p.f; delete p.f; }
      if (p.id) { setTimeout(function () { CZ.memberDrawer(p.id); }, 60); delete p.id; }
      var c = counts();
      var list = W.sorted(filtered(), {
        name: 'name', code: function (m) { return +m.code; },
        joinedAt: 'joinedAt',
        status: function (m) { return S.status(m).k; },
        end: function (m) { var s = S.activeSub(m.id); return s ? s.endAt : '0'; },
        left: function (m) { var s = S.activeSub(m.id); return s ? S.sessionsLeft(s) : -1; },
        last: function (m) { var v = S.lastVisit(m.id); return v ? v.inAt : '0'; },
        debt: function (m) { return S.debt(m.id); }
      });

      return W.toolbar({
        ph: 'دوّر باسم أو كود أو تليفون', q: F.q,
        filters: '<select class="inp" data-g style="width:auto;height:38px;border-radius:100px">' +
          '<option value="all"' + (F.g === 'all' ? ' selected' : '') + '>الكل</option>' +
          '<option value="m"' + (F.g === 'm' ? ' selected' : '') + '>رجالة</option>' +
          '<option value="f"' + (F.g === 'f' ? ' selected' : '') + '>سيدات</option></select>' +
          '<select class="inp" data-plan style="width:auto;height:38px;border-radius:100px;max-width:180px">' +
          '<option value="all">كل الباقات</option>' +
          S.all('plans').filter(function (x) { return x.active !== false; }).map(function (x) {
            return '<option value="' + x.id + '"' + (F.plan === x.id ? ' selected' : '') + '>' + U.esc(x.name) + '</option>';
          }).join('') + '</select>',
        act: '<button class="btn btn-ghost btn-sm" id="mb-export">' + U.ico('export') + '<span class="hide-sm">تصدير</span></button>' +
          '<button class="btn btn-ghost btn-sm" id="mb-cards">' + U.ico('card') + '<span class="hide-sm">كروت</span></button>' +
          '<button class="btn btn-lime" id="mb-new">' + U.ico('plus') + 'عضو جديد</button>'
      }) +

        W.chips([
          { v: 'all', t: 'الكل', n: c.all }, { v: 'active', t: 'ساري', n: c.active },
          { v: 'expiring', t: 'قرب يخلص', n: c.expiring }, { v: 'expired', t: 'منتهي', n: c.expired },
          { v: 'absent', t: 'غايب', n: c.absent }, { v: 'debt', t: 'عليه متأخرات', n: c.debt },
          { v: 'frozen', t: 'مجمّد', n: c.frozen }, { v: 'new', t: 'جديد (30 يوم)', n: c.new },
          { v: 'blocked', t: 'موقوف', n: c.blocked }
        ], F.f) +

        '<div class="mt">' + W.card({
          flush: true,
          body: W.table([
            { k: 'code', t: 'الكود', w: '72px', cls: 'num' },
            { k: 'name', t: 'العضو', render: function (m) {
              return W.who(m, U.fPhone(m.phone) + (m.job ? ' · ' + m.job : ''));
            }},
            { k: 'status', t: 'الحالة', render: function (m) {
              return W.statusBadge(m) + (S.isInGym(m.id) ? ' <span class="badge ok live"><i class="dot"></i>جوّه</span>' : '');
            }},
            { k: 'plan', t: 'الباقة', sort: false, render: function (m) {
              var s = S.activeSub(m.id) || S.lastSub(m.id);
              return s ? '<b class="sm">' + U.esc(s.planName) + '</b>' : '<span class="fnt">—</span>';
            }},
            { k: 'left', t: 'الجلسات', cls: 'mid', render: function (m) {
              var s = S.activeSub(m.id);
              if (!s || !s.sessionsTotal) return '<span class="fnt">—</span>';
              var left = S.sessionsLeft(s), pct = U.pct(left, s.sessionsTotal);
              return '<div class="bar-l"><span class="lbl">' + left + '/' + s.sessionsTotal + '</span>' +
                '<div class="bar ' + (pct < 20 ? 'danger' : pct < 45 ? 'warn' : '') + '" style="width:52px">' +
                '<i style="width:' + pct + '%"></i></div></div>';
            }},
            { k: 'end', t: 'لحد', cls: 'num', render: function (m) {
              var s = S.activeSub(m.id) || S.lastSub(m.id);
              if (!s) return '<span class="fnt">—</span>';
              var d = U.diffDays(s.endAt);
              return '<span style="color:' + (d < 0 ? 'var(--danger)' : d <= 7 ? 'var(--warn)' : 'inherit') + '">' +
                U.fDate(s.endAt, 'short') + '</span>';
            }},
            { k: 'last', t: 'آخر زيارة', render: function (m) {
              var v = S.lastVisit(m.id);
              return v ? '<span class="sm">' + U.ago(v.inAt) + '</span>' : '<span class="fnt sm">عمره ما جه</span>';
            }},
            { k: 'debt', t: 'متأخرات', cls: 'num end', render: function (m) {
              var d = S.debt(m.id);
              return d ? '<span class="money neg">' + U.n(d) + '</span>' : '<span class="fnt">—</span>';
            }},
            { k: 'branchId', t: 'الفرع', render: function (m) { return W.branchTag(m.branchId); } },
            { t: '', sort: false, cls: 'end', w: '130px', render: function (m) {
              return '<div class="rowact">' +
                '<a class="btn btn-sm btn-ok btn-ico" href="' + U.wa(m.phone) + '" target="_blank" rel="noopener" title="واتساب">' + U.ico('msg') + '</a>' +
                '<button class="btn btn-sm btn-soft btn-ico" data-renew="' + m.id + '" title="تجديد">' + U.ico('refresh') + '</button>' +
                '<button class="btn btn-sm btn-soft btn-ico" data-mem="' + m.id + '" title="الملف">' + U.ico('eye') + '</button>' +
                '</div>';
            }}
          ], list, {
            sort: W.sortOpts(), rowId: function (m) { return m.id; }, click: true,
            emptyT: 'مفيش أعضاء بالفلتر ده',
            emptyS: F.q ? 'جرّب تبحث بحاجة تانية.' : 'ابدأ بإضافة أول عضو.',
            emptyIco: 'users'
          }),
          foot: 'ظاهر ' + U.n(list.length) + ' من ' + U.n(counts().all) + ' عضو'
        }) + '</div>';
    },
    after: function () {
      var q = U.$('[data-q]');
      if (q) q.addEventListener('input', U.debounce(function (e) { F.q = e.target.value; CZ.render(); U.$('[data-q]').focus(); }, 260));
      var g = U.$('[data-g]'); if (g) g.addEventListener('change', function (e) { F.g = e.target.value; CZ.render(); });
      var pl = U.$('[data-plan]'); if (pl) pl.addEventListener('change', function (e) { F.plan = e.target.value; CZ.render(); });
      var nb = U.$('#mb-new'); if (nb) nb.addEventListener('click', function () { CZ.memberForm(); });
      var ex = U.$('#mb-export'); if (ex) ex.addEventListener('click', exportCsv);
      var cr = U.$('#mb-cards'); if (cr) cr.addEventListener('click', printCards);
    }
  };

  U.on('click', '.chip[data-f]', function (e, el) {
    if (!U.$('#mb-new')) return;
    F.f = el.getAttribute('data-f'); CZ.render();
  });
  U.on('click', 'tr[data-row]', function (e, el) {
    if (e.target.closest('button,a')) return;
    if (!U.$('#mb-new')) return;
    CZ.memberDrawer(el.getAttribute('data-row'));
  });
  U.on('click', '[data-mem]', function (e, el) { CZ.memberDrawer(el.getAttribute('data-mem')); });
  U.on('click', '[data-renew]', function (e, el) { CZ.renewModal(el.getAttribute('data-renew')); });

  function exportCsv() {
    var rows = [['الكود', 'الاسم', 'التليفون', 'النوع', 'الفرع', 'تاريخ الاشتراك', 'الحالة', 'الباقة',
      'الجلسات المتبقية', 'ينتهي في', 'آخر زيارة', 'متأخرات', 'الوظيفة', 'الهدف', 'ملاحظة طبية']];
    filtered().forEach(function (m) {
      var s = S.activeSub(m.id) || S.lastSub(m.id), v = S.lastVisit(m.id);
      rows.push([m.code, m.name, m.phone, m.gender === 'f' ? 'أنثى' : 'ذكر', S.branchShort(m.branchId),
        m.joinedAt, S.status(m).t, s ? s.planName : '', s ? S.sessionsLeft(s) : '',
        s ? s.endAt : '', v ? v.inAt.slice(0, 10) : '', S.debt(m.id), m.job || '', m.goal || '', m.medical || '']);
    });
    U.csv('أعضاء-سيزر-' + U.today(), rows);
    U.toast('اتصدّر ' + (rows.length - 1) + ' عضو');
  }

  function printCards() {
    var list = filtered().slice(0, 60);
    if (!list.length) { U.toast('مفيش أعضاء للطباعة', 'err'); return; }
    U.print('<div class="pcards">' + list.map(function (m) { return W.memberCard(m); }).join('') + '</div>');
  }

  /* ============ ملف العضو ============ */
  CZ.memberDrawer = function (id, tab) {
    var m = S.member(id);
    if (!m) { U.toast('العضو مش موجود', 'err'); return; }
    tab = tab || 'over';
    var st = S.status(m);
    var sub = st.sub || S.lastSub(m.id);
    var debt = S.debt(m.id);

    var head = '<div class="row" style="gap:12px;flex:1;min-width:0">' + W.ava(m, 'lg') +
      '<div style="min-width:0"><div class="row" style="gap:7px"><b style="font-size:18px">' + U.esc(m.name) + '</b>' +
      W.statusBadge(m) + '</div>' +
      '<div class="mut sm">' + U.esc(m.code) + ' · ' + U.fPhone(m.phone) + ' · ' + S.branchShort(m.branchId) + '</div></div></div>';

    var d = U.drawer({
      wide: true, head: head,
      body: '<div class="tabs" id="md-tabs">' +
        [['over', 'نظرة عامة'], ['subs', 'الاشتراكات'], ['att', 'الحضور'],
        ['money', 'الفلوس'], ['body', 'القياسات'], ['note', 'ملاحظات']]
          .map(function (t) {
            return '<button data-tab="' + t[0] + '"' + (tab === t[0] ? ' class="on"' : '') + '>' + t[1] + '</button>';
          }).join('') + '</div><div id="md-body" class="mt"></div>',
      foot: '<button class="btn btn-lime" data-renew="' + m.id + '">' + U.ico('refresh') + 'تجديد / اشتراك جديد</button>' +
        '<a class="btn btn-ok" href="' + U.wa(m.phone) + '" target="_blank" rel="noopener">' + U.ico('msg') + 'واتساب</a>' +
        '<div style="flex:1"></div>' +
        '<button class="btn btn-ghost btn-ico" data-mcard="' + m.id + '" title="كارت العضوية">' + U.ico('card') + '</button>' +
        '<button class="btn btn-ghost btn-ico" data-medit="' + m.id + '" title="تعديل">' + U.ico('edit') + '</button>'
    });

    function paint() {
      U.$$('#md-tabs button', d.el).forEach(function (b) {
        b.classList.toggle('on', b.getAttribute('data-tab') === tab);
      });
      U.html(U.$('#md-body', d.el), TABS[tab]());
    }

    var TABS = {
      over: function () {
        var visits30 = S.where('attend', function (a) {
          return a.memberId === m.id && a.inAt >= U.addDays(U.today(), -30);
        }).length;
        var totalPaid = U.sum(S.where('money', function (x) {
          return x.memberId === m.id && x.kind === 'in';
        }), 'amount');
        var lv = S.lastVisit(m.id);
        var series = [];
        for (var i = 11; i >= 0; i--) {
          var mo = U.addMonths(U.today(), -i).slice(0, 7);
          series.push(S.where('attend', function (a) {
            return a.memberId === m.id && a.inAt.slice(0, 7) === mo;
          }).length);
        }
        return '' +
          (st.k === 'expired' ? W.alert('danger', 'الاشتراك منتهي',
            'خلص من ' + Math.abs(st.days || 0) + ' يوم — ده أنسب وقت تكلّمه.',
            '<button class="btn btn-sm btn-lime" data-renew="' + m.id + '">جدّد</button>') : '') +
          (st.k === 'expiring' ? W.alert('warn', 'قرب يخلص', 'فاضل ' + st.days + ' يوم على انتهاء الاشتراك.',
            '<button class="btn btn-sm btn-lime" data-renew="' + m.id + '">جدّد</button>') : '') +
          (debt > 0 ? W.alert('danger', 'عليه متأخرات', U.m(debt) + ' متفق عليها ومش متحصّلة.',
            '<button class="btn btn-sm btn-ink" data-pay="' + m.id + '">حصّل</button>') : '') +
          (m.medical ? W.alert('warn', 'ملاحظة طبية', m.medical) : '') +
          (m.status === 'blocked' ? W.alert('danger', 'العضو موقوف', m.blockReason || '') : '') +

          '<div class="grid g-4 mt">' +
          W.stat({ t: 'الجلسات المتبقية', v: sub ? (S.sessionsLeft(sub) === Infinity ? '∞' : U.n(S.sessionsLeft(sub))) : '0', ico: 'zap', tone: 'lime' }) +
          W.stat({ t: 'أيام متبقية', v: sub ? U.n(Math.max(0, U.diffDays(sub.endAt))) : '0', ico: 'clock', tone: 'info' }) +
          W.stat({ t: 'زيارات آخر 30 يوم', v: U.n(visits30), ico: 'fire', tone: 'ok' }) +
          W.stat({ t: 'إجمالي اللي دفعه', v: U.n(totalPaid), cur: CZ.CUR, ico: 'wallet', tone: 'gold' }) +
          '</div>' +

          '<div class="grid g-2 mt">' +
          W.card({
            title: 'الاشتراك الحالي', ico: 'tag',
            body: sub ? '<dl class="kv">' +
              '<dt>الباقة</dt><dd>' + U.esc(sub.planName) + '</dd>' +
              '<dt>من</dt><dd>' + U.fDate(sub.startAt) + '</dd>' +
              '<dt>لحد</dt><dd>' + U.fDate(sub.endAt) + ' <span class="xs mut">(' + U.ago(sub.endAt) + ')</span></dd>' +
              '<dt>الجلسات</dt><dd>' + (sub.sessionsUsed || 0) + ' من ' + (sub.sessionsTotal || '∞') + '</dd>' +
              '<dt>السعر</dt><dd>' + U.money(sub.price) + (sub.discount ? ' <span class="badge lime">خصم ' + sub.discount + '%</span>' : '') + '</dd>' +
              '<dt>المدفوع</dt><dd>' + U.money(sub.paid) + (sub.price > sub.paid ? ' <span class="badge danger">باقي ' + U.n(sub.price - sub.paid) + '</span>' : '') + '</dd>' +
              (sub.coachId ? '<dt>الكابتن</dt><dd>' + U.esc((S.get('staff', sub.coachId) || {}).name || '—') + '</dd>' : '') +
              '</dl>' +
              '<div class="row mt" style="gap:7px">' +
              (sub.status === 'frozen'
                ? '<button class="btn btn-sm btn-ink" data-unfreeze="' + sub.id + '">' + U.ico('play') + 'فك التجميد</button>'
                : '<button class="btn btn-sm btn-ghost" data-freeze="' + sub.id + '">' + U.ico('snow') + 'تجميد</button>') +
              '<button class="btn btn-sm btn-ghost" data-subedit="' + sub.id + '">' + U.ico('edit') + 'تعديل</button>' +
              '<button class="btn btn-sm btn-ghost" data-rc="' + sub.id + '">' + U.ico('print') + 'إيصال</button>' +
              '</div>'
              : W.empty('مفيش اشتراك', 'العضو ده لسه ما اشتركش أو اشتراكه اتلغى.', 'tag',
                '<button class="btn btn-sm btn-lime" data-renew="' + m.id + '">اعمل اشتراك</button>')
          }) +
          W.card({
            title: 'بياناته', ico: 'user',
            body: '<dl class="kv">' +
              '<dt>التليفون</dt><dd><a href="' + U.tel(m.phone) + '">' + U.fPhone(m.phone) + '</a>' +
              (m.phone2 ? ' · ' + U.fPhone(m.phone2) : '') + '</dd>' +
              '<dt>النوع</dt><dd>' + (m.gender === 'f' ? 'أنثى' : 'ذكر') + '</dd>' +
              (m.birth ? '<dt>السن</dt><dd>' + Math.floor(-U.diffDays(m.birth) / 365) + ' سنة <span class="xs mut">(' + U.fDate(m.birth) + ')</span></dd>' : '') +
              '<dt>مشترك من</dt><dd>' + U.fDate(m.joinedAt) + ' <span class="xs mut">(' + U.ago(m.joinedAt) + ')</span></dd>' +
              (m.job ? '<dt>الوظيفة</dt><dd>' + U.esc(m.job) + '</dd>' : '') +
              (m.goal ? '<dt>الهدف</dt><dd>' + U.esc(m.goal) + '</dd>' : '') +
              (m.address ? '<dt>السكن</dt><dd>' + U.esc(m.address) + '</dd>' : '') +
              (m.source ? '<dt>عرف الجيم من</dt><dd>' + U.esc(m.source) + '</dd>' : '') +
              (m.lockerNo ? '<dt>اللوكر</dt><dd class="num">' + U.esc(m.lockerNo) + '</dd>' : '') +
              (m.emergencyPhone ? '<dt>للطوارئ</dt><dd>' + U.esc(m.emergencyName || '') + ' — ' +
                '<a href="' + U.tel(m.emergencyPhone) + '">' + U.fPhone(m.emergencyPhone) + '</a></dd>' : '') +
              '<dt>الفرع</dt><dd>' + W.branchTag(m.branchId) + '</dd>' +
              '<dt>آخر زيارة</dt><dd>' + (lv ? U.fDay(lv.inAt) + ' <span class="xs mut">(' + U.ago(lv.inAt) + ')</span>' : 'عمره ما جه') + '</dd>' +
              '</dl>' +
              (m.tags && m.tags.length ? '<div class="row mt" style="gap:5px">' + m.tags.map(function (t) {
                return '<span class="badge lime">' + U.esc(t) + '</span>';
              }).join('') + '</div>' : '')
          }) +
          '</div>' +

          '<div class="mt">' + W.card({
            title: 'انتظامه على مدار السنة', ico: 'activity',
            sub: 'عدد الزيارات في كل شهر',
            body: CZ.c.bars(series.map(function (v, i) {
              return { t: U.MONTHS[U.parse(U.addMonths(U.today(), -(11 - i))).getMonth()].slice(0, 4), v: v };
            }), { h: 170, unit: ' زيارة' })
          }) + '</div>';
      },

      subs: function () {
        var subs = S.memberSubs(m.id);
        return W.card({
          flush: true,
          title: 'كل الاشتراكات (' + subs.length + ')',
          act: '<button class="btn btn-sm btn-lime" data-renew="' + m.id + '">' + U.ico('plus') + 'اشتراك</button>',
          body: W.table([
            { k: 'planName', t: 'الباقة', sort: false },
            { k: 'startAt', t: 'من', sort: false, cls: 'num', render: function (s) { return U.fDate(s.startAt, 'short'); } },
            { k: 'endAt', t: 'لحد', sort: false, cls: 'num', render: function (s) { return U.fDate(s.endAt, 'short'); } },
            { t: 'الجلسات', sort: false, cls: 'mid', render: function (s) {
              return s.sessionsTotal ? (s.sessionsUsed || 0) + '/' + s.sessionsTotal : '—';
            }},
            { t: 'السعر', sort: false, cls: 'num end', render: function (s) {
              return U.money(s.price) + (s.discount ? '<div class="xs fnt">خصم ' + s.discount + '%</div>' : '');
            }},
            { t: 'المدفوع', sort: false, cls: 'num end', render: function (s) {
              return U.money(s.paid) + (s.price > s.paid ? '<div class="xs neg">باقي ' + U.n(s.price - s.paid) + '</div>' : '');
            }},
            { t: 'الحالة', sort: false, render: function (s) {
              var map = { active: ['ok', 'ساري'], frozen: ['info', 'مجمّد'], expired: ['', 'منتهي'],
                replaced: ['', 'اتبدل'], cancelled: ['danger', 'ملغي'] };
              var x = map[s.status] || ['', s.status];
              return '<span class="badge ' + x[0] + '">' + x[1] + '</span>';
            }},
            { t: '', sort: false, cls: 'end', render: function (s) {
              return '<div class="rowact"><button class="btn btn-sm btn-soft btn-ico" data-rc="' + s.id + '">' + U.ico('print') + '</button>' +
                '<button class="btn btn-sm btn-soft btn-ico" data-subedit="' + s.id + '">' + U.ico('edit') + '</button></div>';
            }}
          ], subs, { emptyT: 'مفيش اشتراكات', emptyIco: 'tag' })
        });
      },

      att: function () {
        var att = S.where('attend', function (a) { return a.memberId === m.id; }).sort(U.by('inAt', 'desc'));
        var byDow = [0, 0, 0, 0, 0, 0, 0];
        att.forEach(function (a) { byDow[U.dow(a.inAt)]++; });
        var favHour = {};
        att.forEach(function (a) { var h = U.parse(a.inAt).getHours(); favHour[h] = (favHour[h] || 0) + 1; });
        var topH = Object.keys(favHour).sort(function (a, b) { return favHour[b] - favHour[a]; })[0];
        return '<div class="grid g-3 mb">' +
          W.stat({ t: 'إجمالي الزيارات', v: U.n(att.length), ico: 'fire', tone: 'lime' }) +
          W.stat({ t: 'أكتر يوم بيجي فيه', v: byDow.indexOf(Math.max.apply(null, byDow)) > -1 ? U.DAYS[byDow.indexOf(Math.max.apply(null, byDow))] : '—', ico: 'calendar' }) +
          W.stat({ t: 'ميعاده المفضّل', v: topH !== undefined ? U.fMin(topH * 60) : '—', ico: 'clock', tone: 'info' }) +
          '</div>' +
          W.card({
            flush: true, title: 'سجل الحضور',
            body: W.table([
              { k: 'inAt', t: 'اليوم', sort: false, render: function (a) { return U.fDay(a.inAt); } },
              { t: 'دخول', sort: false, cls: 'num', render: function (a) { return U.fTime(a.inAt); } },
              { t: 'خروج', sort: false, cls: 'num', render: function (a) { return a.outAt ? U.fTime(a.outAt) : '<span class="badge ok">لسه جوّه</span>'; } },
              { t: 'المدة', sort: false, cls: 'num', render: function (a) {
                if (!a.outAt) return '—';
                return U.dur((U.parse(a.outAt) - U.parse(a.inAt)) / 60000);
              }},
              { t: 'الفرع', sort: false, render: function (a) { return W.branchTag(a.branchId); } },
              { t: 'النوع', sort: false, render: function (a) {
                return '<span class="badge">' + (a.type === 'session' ? 'جلسة' : a.type === 'guest' ? 'دعوة' : 'منفصل') + '</span>';
              }}
            ], att.slice(0, 120), { emptyT: 'عمره ما جه', emptyS: 'مفيش زيارات مسجّلة للعضو ده.', emptyIco: 'door' })
          });
      },

      money: function () {
        var mon = S.where('money', function (x) { return x.memberId === m.id; }).sort(U.by('at', 'desc'));
        var tot = U.sum(mon.filter(function (x) { return x.kind === 'in'; }), 'amount');
        return '<div class="grid g-3 mb">' +
          W.stat({ t: 'إجمالي المدفوع', v: U.n(tot), cur: CZ.CUR, ico: 'wallet', tone: 'ok' }) +
          W.stat({ t: 'متأخرات', v: U.n(debt), cur: CZ.CUR, ico: 'alert', tone: debt ? 'danger' : '' }) +
          W.stat({ t: 'متوسط الشهر', v: U.n(Math.round(tot / Math.max(1, Math.abs(U.diffDays(m.joinedAt)) / 30))), cur: CZ.CUR, ico: 'trend' }) +
          '</div>' +
          (debt > 0 ? '<div class="mb">' + W.alert('danger', 'متأخرات ' + U.m(debt),
            'المبلغ ده متفق عليه ومش متحصّل.',
            '<button class="btn btn-sm btn-ink" data-pay="' + m.id + '">حصّل دلوقتي</button>') + '</div>' : '') +
          W.card({
            flush: true, title: 'حركة الفلوس',
            body: W.table([
              { k: 'at', t: 'التاريخ', sort: false, render: function (x) { return U.fDate(x.at) + ' <span class="xs fnt">' + U.fTime(x.at) + '</span>'; } },
              { t: 'البند', sort: false, render: function (x) {
                return '<b class="sm">' + U.esc(S.CATS_IN[x.cat] || S.CATS_OUT[x.cat] || x.cat) + '</b>' +
                  (x.note ? '<div class="xs fnt">' + U.esc(x.note) + '</div>' : '');
              }},
              { t: 'الطريقة', sort: false, render: function (x) { return '<span class="badge">' + (S.METHODS[x.method] || '—') + '</span>'; } },
              { t: 'الفرع', sort: false, render: function (x) { return W.branchTag(x.branchId); } },
              { t: 'المبلغ', sort: false, cls: 'num end', render: function (x) {
                return '<span class="money ' + (x.kind === 'in' ? 'pos' : 'neg') + '">' +
                  (x.kind === 'in' ? '+' : '−') + U.n(x.amount) + '</span>';
              }}
            ], mon, { emptyT: 'مفيش حركة فلوس', emptyIco: 'wallet' })
          });
      },

      body: function () {
        var ms = S.where('measures', function (x) { return x.memberId === m.id; }).sort(U.by('at'));
        var first = ms[0], last = ms[ms.length - 1];
        return '<div class="row-b mb"><h3 style="font-size:16px">القياسات والتقدّم</h3>' +
          '<button class="btn btn-sm btn-lime" data-meas="' + m.id + '">' + U.ico('plus') + 'قياس جديد</button></div>' +
          (ms.length > 1 ? '<div class="grid g-4 mb">' +
            ['weight,الوزن,كجم', 'fat,نسبة الدهون,%', 'muscle,الكتلة العضلية,كجم', 'waist,الوسط,سم'].map(function (k) {
              var p = k.split(','), key = p[0];
              var diff = (last[key] || 0) - (first[key] || 0);
              var good = key === 'muscle' ? diff > 0 : diff < 0;
              return W.stat({
                t: p[1], v: U.n(last[key] || 0, key === 'muscle' ? 1 : 0), cur: p[2],
                ico: key === 'muscle' ? 'dumbbell' : 'scale',
                tone: diff === 0 ? '' : good ? 'ok' : 'danger',
                d: (diff > 0 ? '+' : '') + U.n(diff, 1) + ' من أول قياس',
                dir: diff === 0 ? '' : (good ? 'up' : 'down')
              });
            }).join('') + '</div>' : '') +
          (ms.length ? W.card({
            flush: true,
            body: W.table([
              { k: 'at', t: 'التاريخ', sort: false, render: function (x) { return U.fDate(x.at); } },
              { t: 'الوزن', sort: false, cls: 'num', render: function (x) { return x.weight ? x.weight + ' كجم' : '—'; } },
              { t: 'الطول', sort: false, cls: 'num', render: function (x) { return x.height || '—'; } },
              { t: 'BMI', sort: false, cls: 'num', render: function (x) {
                if (!x.weight || !x.height) return '—';
                var b = x.weight / Math.pow(x.height / 100, 2);
                return '<span style="color:' + (b < 18.5 || b > 30 ? 'var(--danger)' : b > 25 ? 'var(--warn)' : 'var(--ok)') + '">' + b.toFixed(1) + '</span>';
              }},
              { t: 'دهون %', sort: false, cls: 'num', render: function (x) { return x.fat || '—'; } },
              { t: 'عضل', sort: false, cls: 'num', render: function (x) { return x.muscle || '—'; } },
              { t: 'صدر', sort: false, cls: 'num', render: function (x) { return x.chest || '—'; } },
              { t: 'وسط', sort: false, cls: 'num', render: function (x) { return x.waist || '—'; } },
              { t: 'ذراع', sort: false, cls: 'num', render: function (x) { return x.arm || '—'; } },
              { t: 'فخذ', sort: false, cls: 'num', render: function (x) { return x.thigh || '—'; } }
            ], ms.slice().reverse(), { emptyT: 'مفيش قياسات' })
          }) : W.empty('مفيش قياسات', 'القياسات هي اللي بتخلّي العضو يشوف إنه بيتقدّم — وده اللي بيخلّيه يفضل معاك.', 'scale',
            '<button class="btn btn-sm btn-lime" data-meas="' + m.id + '">' + U.ico('plus') + 'سجّل أول قياس</button>'));
      },

      note: function () {
        var logs = S.where('log', function (l) { return l.entityId === m.id; }).slice(0, 40);
        return W.card({
          title: 'ملاحظات داخلية', ico: 'file',
          sub: 'الكلام ده للإدارة بس — العضو مش بيشوفه',
          body: '<textarea class="inp" id="md-note" rows="5" placeholder="أي حاجة مهمة عن العضو ده...">' +
            U.esc(m.note || '') + '</textarea>' +
            '<div class="f-row mt">' +
            W.fld({ label: 'ملاحظة طبية / إصابات', name: 'medical', val: m.medical, ph: 'مثال: إصابة في الركبة', id: 'md-med' }) +
            W.fld({ label: 'تاجات', name: 'tags', val: (m.tags || []).join('، '), ph: 'محارب الشهر، طالب...', id: 'md-tags' }) +
            '</div>' +
            '<div class="row mt"><button class="btn btn-lime btn-sm" id="md-savenote">' + U.ico('save') + 'احفظ</button>' +
            (m.status === 'blocked'
              ? '<button class="btn btn-sm btn-ok" data-unblock="' + m.id + '">' + U.ico('check') + 'فك الإيقاف</button>'
              : '<button class="btn btn-sm btn-danger" data-block="' + m.id + '">' + U.ico('lock') + 'أوقف العضو</button>') +
            '<div style="flex:1"></div>' +
            '<button class="btn btn-sm btn-danger" data-mdel="' + m.id + '">' + U.ico('trash') + 'حذف العضو</button></div>' +
            '<div class="hr"></div>' +
            '<div class="xs mut b mb">سجل الحركات على العضو ده</div>' +
            (logs.length ? '<div style="display:grid;gap:6px;max-height:250px;overflow-y:auto">' + logs.map(function (l) {
              return '<div class="row xs" style="gap:8px;flex-wrap:nowrap"><span class="fnt num" style="width:96px;flex:none">' +
                U.fDate(l.at, 'short') + ' ' + U.fTime(l.at) + '</span><b>' + U.esc(l.action) + '</b>' +
                '<span class="mut">' + U.esc(l.detail || '') + '</span>' +
                '<span class="fnt" style="margin-inline-start:auto">' + U.esc(l.userName || '') + '</span></div>';
            }).join('') + '</div>' : '<div class="xs fnt">مفيش حركات مسجّلة</div>')
        });
      }
    };

    d.el.addEventListener('click', function (e) {
      var t = e.target.closest('[data-tab]');
      if (t) { tab = t.getAttribute('data-tab'); paint(); return; }
      if (e.target.closest('#md-savenote')) {
        S.upd('members', m.id, {
          note: U.$('#md-note', d.el).value,
          medical: U.$('#md-med', d.el).value,
          tags: U.$('#md-tags', d.el).value.split(/[،,]/).map(function (x) { return x.trim(); }).filter(Boolean)
        });
        U.toast('اتحفظ');
      }
    });
    paint();
    CZ.curDrawer = d;
  };

  /* ============ إضافة / تعديل عضو ============ */
  CZ.memberForm = function (id, options) {
    var m = id ? S.member(id) : null;
    var isNew = !m;
    var code = m ? m.code : S.nextCode();
    var mm = m || {};
    var modal = U.modal({
      title: isNew ? 'عضو جديد' : 'تعديل بيانات العضو',
      sub: isNew ? 'الكود الجديد: ' + code : mm.name,
      width: 'lg',
      body: '<div class="f" id="mf">' +
        '<div class="f-row c3">' +
        W.fld({ label: 'الاسم', name: 'name', val: mm.name, req: true, ph: 'الاسم بالكامل', span: 2 }) +
        W.fld({ label: 'الكود', name: 'code', val: code, req: true, cls: 'mono' }) +
        '</div>' +
        '<div class="f-row c3">' +
        W.fld({ label: 'التليفون', name: 'phone', type: 'tel', val: mm.phone, req: true, ico: 'phone', ph: '01xxxxxxxxx' }) +
        W.fld({ label: 'تليفون تاني', name: 'phone2', type: 'tel', val: mm.phone2, ph: 'اختياري' }) +
        W.fld({ label: 'النوع', name: 'gender', type: 'select', val: mm.gender || 'm', opts: [['m', 'ذكر'], ['f', 'أنثى']] }) +
        '</div>' +
        '<div class="f-row c3">' +
        W.fld({ label: 'تاريخ الميلاد', name: 'birth', type: 'date', val: mm.birth }) +
        W.fld({ label: 'تاريخ الاشتراك', name: 'joinedAt', type: 'date', val: mm.joinedAt || U.today(), req: true }) +
        W.branchField(mm.branchId) +
        '</div>' +
        '<div class="f-row c3">' +
        W.fld({ label: 'الوظيفة', name: 'job', val: mm.job, ph: 'طالب، مدرس...' }) +
        W.fld({ label: 'الهدف من التمرين', name: 'goal', type: 'select', val: mm.goal,
          opts: [['', '—']].concat(['تنشيف', 'تضخيم', 'لياقة عامة', 'إنقاص وزن', 'تأهيل بعد إصابة', 'تجهيز للكلية العسكرية', 'قوة وتحمّل']
            .map(function (x) { return [x, x]; })) }) +
        W.fld({ label: 'عرف الجيم منين', name: 'source', type: 'select', val: mm.source,
          opts: [['', '—']].concat(['إنستجرام', 'فيسبوك', 'صديق', 'مشي جنب الجيم', 'واتساب', 'إعلان ممول', 'توصية عضو']
            .map(function (x) { return [x, x]; })) }) +
        '</div>' +
        '<div class="f-row c3">' +
        W.fld({ label: 'السكن', name: 'address', val: mm.address, ph: 'المنطقة' }) +
        W.fld({ label: 'الرقم القومي', name: 'nationalId', val: mm.nationalId, cls: 'mono', ph: 'اختياري' }) +
        W.fld({ label: 'رقم اللوكر', name: 'lockerNo', val: mm.lockerNo, cls: 'mono', ph: 'اختياري' }) +
        '</div>' +
        '<div class="f-row c3">' +
        W.fld({ label: 'اسم شخص للطوارئ', name: 'emergencyName', val: mm.emergencyName, ph: 'الوالد، الأخ...' }) +
        W.fld({ label: 'تليفون الطوارئ', name: 'emergencyPhone', type: 'tel', val: mm.emergencyPhone }) +
        W.fld({ label: 'ملاحظة طبية', name: 'medical', val: mm.medical, ph: 'إصابات، أمراض مزمنة' }) +
        '</div>' +
        (isNew ? '<div class="hr"></div>' +
          W.check({ name: 'withSub', t: 'اعمله اشتراك دلوقتي', sub: 'هيفتحلك شاشة الاشتراك بعد الحفظ', on: true }) : '') +
        '</div>',
      footer: '<div class="grow"></div><button class="btn btn-ghost" data-close>إلغاء</button>' +
        '<button class="btn btn-lime" id="mf-save">' + U.ico('save') + (isNew ? 'أضف العضو' : 'احفظ') + '</button>'
    });

    if (isNew && options && options.simple) {
      var form = U.$('#mf', modal.el);
      var main = document.createElement('div'); main.className = 'f-row';
      var details = document.createElement('details'); details.className = 'rx-member-details';
      details.innerHTML = '<summary>بيانات إضافية (اختياري)</summary><div class="f-row"></div>';
      var extra = U.$('.f-row', details);
      U.$$('.fld', form).forEach(function (field) {
        field.style.gridColumn = '';
        var input = U.$('input,select,textarea', field);
        (input && ['name', 'phone', 'gender', 'branchId'].indexOf(input.name) > -1 ? main : extra).appendChild(field);
      });
      var hiddenBranch = U.$('input[type=hidden][name=branchId]', form);
      form.replaceChildren(main, details);
      if (hiddenBranch) form.appendChild(hiddenBranch);
      var withSub = document.createElement('input'); withSub.type = 'checkbox'; withSub.name = 'withSub'; withSub.checked = true; withSub.hidden = true;
      form.appendChild(withSub);
      U.$('#mf-save', modal.el).textContent = 'حفظ واختيار الباقة';
    }

    U.$('#mf-save', modal.el).addEventListener('click', function () {
      var d = W.form(U.$('#mf', modal.el));
      if (!d.name) { U.toast('اكتب اسم العضو', 'err'); return; }
      if (!U.phone(d.phone) || U.phone(d.phone).length < 10) { U.toast('التليفون مش مظبوط', 'err'); return; }
      var dupe = S.find('members', function (x) {
        return x.id !== (m ? m.id : '') && (String(x.code) === String(d.code) || U.phone(x.phone) === U.phone(d.phone));
      });
      if (dupe) {
        U.toast('في عضو تاني بنفس الكود أو التليفون: ' + dupe.name, 'err');
        return;
      }
      d.phone = U.phone(d.phone);
      d.tags = mm.tags || [];
      var withSub = d.withSub; delete d.withSub;
      if (m) {
        S.upd('members', m.id, d);
        U.toast('البيانات اتحفظت');
        modal.close();
        CZ.render();
        if (CZ.curDrawer) CZ.memberDrawer(m.id);
      } else {
        d.status = 'expired';
        var nm = S.add('members', d);
        U.toast('اتضاف ' + nm.name);
        modal.close();
        CZ.render();
        if (withSub) CZ.renewModal(nm.id);
      }
    });
  };
  U.on('click', '[data-medit]', function (e, el) { CZ.memberForm(el.getAttribute('data-medit')); });
  U.on('click', '[data-mdel]', function (e, el) {
    var id = el.getAttribute('data-mdel'), m = S.member(id);
    U.confirm({
      title: 'حذف ' + m.name + '؟', danger: true,
      body: 'هيتشال هو وكل اشتراكاته وحضوره من النظام نهائي. لو عايز توقفه بس، استخدم «أوقف العضو».',
      ok: 'احذف نهائي'
    }).then(function (y) {
      if (!y) return;
      S.db().subs = S.all('subs').filter(function (s) { return s.memberId !== id; });
      S.db().attend = S.all('attend').filter(function (a) { return a.memberId !== id; });
      S.del('members', id);
      U.toast('اتحذف');
      if (CZ.curDrawer) CZ.curDrawer.close();
      CZ.render();
    });
  });
  U.on('click', '[data-block]', function (e, el) {
    var id = el.getAttribute('data-block');
    var mo = U.modal({
      title: 'إيقاف عضو', width: 'sm',
      body: W.fld({ label: 'سبب الإيقاف', name: 'reason', type: 'textarea', ph: 'السبب هيبان لأي حد يفتح ملفه' }),
      footer: '<div class="grow"></div><button class="btn btn-ghost" data-close>إلغاء</button>' +
        '<button class="btn btn-danger" id="bl-ok">أوقف</button>'
    });
    U.$('#bl-ok', mo.el).addEventListener('click', function () {
      S.upd('members', id, { status: 'blocked', blockReason: W.form(mo.el).reason });
      U.toast('اتوقف'); mo.close(); CZ.memberDrawer(id, 'note'); CZ.render();
    });
  });
  U.on('click', '[data-unblock]', function (e, el) {
    var id = el.getAttribute('data-unblock');
    S.upd('members', id, { status: 'active', blockReason: '' });
    S.reconcile(); U.toast('اترفع الإيقاف'); CZ.memberDrawer(id, 'note'); CZ.render();
  });

  /* ============ تجديد / اشتراك جديد ============ */
  CZ.renewModal = function (memberId) {
    var m = S.member(memberId);
    if (!m) return;
    var prev = S.lastSub(memberId);
    var plans = S.all('plans').filter(function (p) { return p.active !== false; });
    var branch = m.branchId;
    var sel = prev ? S.plan(prev.planId) : plans[0];
    if (!sel) sel = plans[0];
    var startDefault = prev && U.diffDays(prev.endAt) > 0 ? U.addDays(prev.endAt, 1) : U.today();

    var modal = U.modal({
      title: prev ? 'تجديد اشتراك' : 'اشتراك جديد',
      sub: m.name + ' · ' + m.code,
      width: 'lg',
      body: '<div id="rn"></div>',
      footer: '<div class="grow" id="rn-sum"></div>' +
        '<button class="btn btn-ghost" data-close>إلغاء</button>' +
        '<button class="btn btn-lime" id="rn-save">' + U.ico('check') + 'اعتمد الاشتراك</button>'
    });

    function types() {
      var t = {};
      plans.forEach(function (p) { (t[p.type] = t[p.type] || []).push(p); });
      return t;
    }
    var curType = sel ? sel.type : 'monthly';

    function paint() {
      var T = types();
      var list = T[curType] || [];
      U.html(U.$('#rn', modal.el),
        (prev ? '<div class="alert info mb">' + U.ico('history') +
          '<div><b>آخر اشتراك</b>' + U.esc(prev.planName) + ' — من ' + U.fDate(prev.startAt) + ' لحد ' + U.fDate(prev.endAt) +
          (U.diffDays(prev.endAt) < 0 ? ' (خلص من ' + Math.abs(U.diffDays(prev.endAt)) + ' يوم)' : ' (لسه ساري)') + '</div></div>' : '') +

        '<div class="seg mb">' + Object.keys(S.PLAN_TYPES).filter(function (k) { return T[k]; }).map(function (k) {
          return '<button data-type="' + k + '"' + (curType === k ? ' class="on"' : '') + '>' + S.PLAN_TYPES[k] + '</button>';
        }).join('') + '</div>' +

        '<div class="pick mb">' + list.map(function (p) {
          var price = S.planPrice(p, branch);
          return '<button type="button" class="pick-i' + (sel && sel.id === p.id ? ' on' : '') + '" data-plan="' + p.id + '">' +
            '<span class="pi-t"><b>' + U.esc(p.name) + (p.popular ? ' <span class="badge lime">الأكتر طلبًا</span>' : '') + '</b>' +
            '<span class="pi-sub">' + (p.sessions ? p.sessions + ' جلسة · ' : '') + (p.months > 1 ? p.months + ' شهور' : 'شهر') +
            (p.note ? ' · ' + U.esc(p.note) : '') + '</span></span>' +
            '<span class="pi-p">' + U.n(price) + ' ' + CZ.CUR + '</span></button>';
        }).join('') + '</div>' +

        '<div class="f" id="rn-f">' +
        '<div class="f-row c3">' +
        W.fld({ label: 'يبدأ من', name: 'startAt', type: 'date', val: startDefault, req: true }) +
        W.fld({ label: 'المدة (شهور)', name: 'months', type: 'number', val: sel ? sel.months || 1 : 1, min: 1, max: 24 }) +
        W.fld({ label: 'عدد الجلسات', name: 'sessionsTotal', type: 'number', val: sel ? sel.sessions : 12, min: 1,
          hint: 'باقات سيزر بالجلسات — سيبها زي ما هي غير لو فيه اتفاق خاص' }) +
        '</div>' +
        '<div class="f-row c3">' +
        W.fld({ label: 'السعر قبل الخصم', name: 'listPrice', type: 'number', val: sel ? S.planPrice(sel, branch) : 0, suffix: CZ.CUR }) +
        W.fld({ label: 'الخصم %', name: 'discount', type: 'number', val: 0, min: 0, max: 100, suffix: '%' }) +
        W.fld({ label: 'السعر النهائي', name: 'price', type: 'number', val: sel ? S.planPrice(sel, branch) : 0, suffix: CZ.CUR }) +
        '</div>' +
        '<div class="f-row c3">' +
        W.fld({ label: 'المدفوع دلوقتي', name: 'paid', type: 'number', val: sel ? S.planPrice(sel, branch) : 0, suffix: CZ.CUR,
          hint: 'لو دفع جزء، الباقي هيتسجّل متأخرات عليه' }) +
        W.fld({ label: 'طريقة الدفع', name: 'method', type: 'select',
          opts: Object.keys(S.METHODS).map(function (k) { return [k, S.METHODS[k]]; }) }) +
        W.fld({ label: 'الكابتن المسؤول', name: 'coachId', type: 'select',
          opts: [['', 'مفيش']].concat(S.where('staff', function (s) {
            return s.role === 'coach' && s.active !== false;
          }).map(function (s) { return [s.id, s.name]; })) }) +
        '</div>' +
        '<div class="f-row">' +
        W.fld({ label: 'سبب الخصم', name: 'discountNote', ph: 'عرض الشهر، عرض الصحاب، طالب...' }) +
        W.branchField(branch) +
        '</div>' +
        W.fld({ label: 'ملاحظة', name: 'note', ph: 'أي اتفاق خاص' }) +
        '</div>');
      if (CZ.state.user.role === 'reception' || (CZ.view && CZ.view.name === 'reception')) {
        var simpleForm = U.$('#rn-f', modal.el);
        var essential = document.createElement('div'); essential.className = 'f-row';
        var details = document.createElement('details'); details.className = 'rx-member-details';
        details.innerHTML = '<summary>تفاصيل الاشتراك والخصم</summary><div class="f-row"></div>';
        var advanced = U.$('.f-row', details);
        U.$$('.fld', simpleForm).forEach(function (field) {
          var input = U.$('input,select,textarea', field);
          (input && ['startAt', 'paid', 'method', 'branchId'].indexOf(input.name) > -1 ? essential : advanced).appendChild(field);
        });
        var hiddenBranch = U.$('input[type=hidden][name=branchId]', simpleForm);
        simpleForm.replaceChildren(essential, details);
        if (hiddenBranch) simpleForm.appendChild(hiddenBranch);
      }
      sum();
    }

    function sum() {
      var d = W.form(U.$('#rn-f', modal.el));
      var rest = (d.price || 0) - (d.paid || 0);
      var end = U.addMonths(d.startAt || U.today(), d.months || 1);
      U.html(U.$('#rn-sum', modal.el),
        '<div class="row" style="gap:14px">' +
        '<div><div class="xs mut">لحد</div><b class="sm">' + U.fDate(end) + '</b></div>' +
        '<div><div class="xs mut">الإجمالي</div><b class="money">' + U.n(d.price || 0) + '</b></div>' +
        (rest > 0 ? '<div><div class="xs mut">متأخر</div><b class="money neg">' + U.n(rest) + '</b></div>' : '') +
        '</div>');
    }

    modal.el.addEventListener('click', function (e) {
      var t = e.target.closest('[data-type]');
      if (t) { curType = t.getAttribute('data-type'); sel = (types()[curType] || [])[0]; paint(); return; }
      var p = e.target.closest('[data-plan]');
      if (p) { sel = S.plan(p.getAttribute('data-plan')); paint(); }
    });
    modal.el.addEventListener('input', function (e) {
      if (!e.target.name) return;
      var f = U.$('#rn-f', modal.el);
      if (e.target.name === 'discount' || e.target.name === 'listPrice') {
        var d = W.form(f);
        U.$('[name=price]', f).value = U.round5((d.listPrice || 0) * (1 - (d.discount || 0) / 100));
        U.$('[name=paid]', f).value = U.$('[name=price]', f).value;
      }
      if (e.target.name === 'price') U.$('[name=paid]', f).value = e.target.value;
      sum();
    });

    U.$('#rn-save', modal.el).addEventListener('click', function () {
      var d = W.form(U.$('#rn-f', modal.el));
      if (!sel) { U.toast('اختار باقة', 'err'); return; }
      if (!d.price && d.price !== 0) { U.toast('اكتب السعر', 'err'); return; }
      var sub = S.createSub({
        memberId: memberId, planId: sel.id, branchId: d.branchId,
        startAt: d.startAt, months: d.months || 1,
        sessionsTotal: d.sessionsTotal, price: d.price, listPrice: d.listPrice,
        discount: d.discount, discountNote: d.discountNote, paid: d.paid,
        method: d.method, coachId: d.coachId || null, note: d.note,
        isRenew: !!prev
      });
      U.toast('الاشتراك اتعمل — لحد ' + U.fDate(sub.endAt));
      modal.close();
      CZ.render();
      if (CZ.curDrawer) CZ.memberDrawer(memberId);
      setTimeout(function () { askReceipt(sub); }, 200);
    });

    paint();
  };

  function askReceipt(sub) {
    var m = S.member(sub.memberId);
    U.confirm({ title: 'تطبع إيصال؟', body: 'إيصال بمقاس 80 مم يتطبع على طابعة الكاشير أو يتحوّل PDF.', ok: 'اطبع' })
      .then(function (y) { if (y) printReceipt(sub.id); });
  }
  function printReceipt(subId) {
    var s = S.get('subs', subId);
    if (!s) return;
    var m = S.member(s.memberId);
    U.print(W.receipt({
      no: s.id.slice(-6).toUpperCase(), at: s.createdAt, member: m, branchId: s.branchId,
      title: 'إيصال اشتراك',
      lines: [['الباقة', s.planName], ['المدة', s.months + ' شهر'],
      ['الجلسات', String(s.sessionsTotal || '—')],
      ['من', U.fDate(s.startAt)], ['لحد', U.fDate(s.endAt)],
      ['السعر', U.n(s.listPrice || s.price) + ' ' + CZ.CUR]]
        .concat(s.discount ? [['الخصم', s.discount + '% (' + (s.discountNote || '') + ')']] : []),
      total: s.price, paid: s.paid, rest: Math.max(0, s.price - s.paid), method: s.method,
      by: CZ.state.user.name
    }));
  }
  U.on('click', '[data-rc]', function (e, el) { printReceipt(el.getAttribute('data-rc')); });

  /* ============ تجميد ============ */
  U.on('click', '[data-freeze]', function (e, el) {
    var subId = el.getAttribute('data-freeze');
    var s = S.get('subs', subId);
    var maxD = S.db().settings.maxFreezeDays || 14;
    var mo = U.modal({
      title: 'تجميد الاشتراك', width: 'sm',
      sub: 'الأيام بتتضاف على تاريخ الانتهاء',
      body: '<div class="f">' +
        W.fld({ label: 'عدد الأيام', name: 'days', type: 'number', val: 7, min: 1, max: 90, suffix: 'يوم',
          hint: 'المسموح في سياسة الجيم: ' + maxD + ' يوم في الاشتراك' }) +
        W.fld({ label: 'السبب', name: 'reason', type: 'select',
          opts: [['سفر', 'سفر'], ['مرض', 'مرض'], ['إصابة', 'إصابة'], ['شغل', 'ظروف شغل'], ['امتحانات', 'امتحانات'], ['أخرى', 'أخرى']] }) +
        '<div id="fz-prev" class="alert info"></div></div>',
      footer: '<div class="grow"></div><button class="btn btn-ghost" data-close>إلغاء</button>' +
        '<button class="btn btn-ink" id="fz-ok">' + U.ico('snow') + 'جمّد</button>'
    });
    function prev() {
      var d = W.form(mo.el);
      U.html(U.$('#fz-prev', mo.el), U.ico('info') + '<div><b>بعد التجميد</b>الاشتراك هينتهي يوم ' +
        U.fDate(U.addDays(s.endAt, d.days || 0)) + ' بدل ' + U.fDate(s.endAt) + '</div>');
    }
    prev();
    mo.el.addEventListener('input', prev);
    U.$('#fz-ok', mo.el).addEventListener('click', function () {
      var d = W.form(mo.el);
      S.freeze(subId, d.days, d.reason);
      U.toast('الاشتراك اتجمّد ' + d.days + ' يوم');
      mo.close(); CZ.render();
      if (CZ.curDrawer) CZ.memberDrawer(s.memberId);
    });
  });
  U.on('click', '[data-unfreeze]', function (e, el) {
    var s = S.get('subs', el.getAttribute('data-unfreeze'));
    S.unfreeze(s.id);
    U.toast('التجميد اتفك');
    CZ.render();
    if (CZ.curDrawer) CZ.memberDrawer(s.memberId);
  });

  /* ============ تعديل اشتراك ============ */
  U.on('click', '[data-subedit]', function (e, el) {
    var s = S.get('subs', el.getAttribute('data-subedit'));
    var mo = U.modal({
      title: 'تعديل الاشتراك', sub: s.planName,
      body: '<div class="f">' +
        '<div class="f-row c3">' +
        W.fld({ label: 'يبدأ', name: 'startAt', type: 'date', val: s.startAt }) +
        W.fld({ label: 'ينتهي', name: 'endAt', type: 'date', val: s.endAt }) +
        W.fld({ label: 'إجمالي الجلسات', name: 'sessionsTotal', type: 'number', val: s.sessionsTotal }) +
        '</div>' +
        '<div class="f-row c3">' +
        W.fld({ label: 'جلسات مستخدمة', name: 'sessionsUsed', type: 'number', val: s.sessionsUsed || 0 }) +
        W.fld({ label: 'السعر', name: 'price', type: 'number', val: s.price, suffix: CZ.CUR }) +
        W.fld({ label: 'المدفوع', name: 'paid', type: 'number', val: s.paid, suffix: CZ.CUR }) +
        '</div>' +
        W.fld({ label: 'الحالة', name: 'status', type: 'select', val: s.status,
          opts: [['active', 'ساري'], ['frozen', 'مجمّد'], ['expired', 'منتهي'], ['cancelled', 'ملغي']] }) +
        W.fld({ label: 'ملاحظة', name: 'note', val: s.note }) +
        '</div>',
      footer: '<button class="btn btn-danger btn-sm" id="se-del">' + U.ico('trash') + 'حذف</button>' +
        '<div class="grow"></div><button class="btn btn-ghost" data-close>إلغاء</button>' +
        '<button class="btn btn-lime" id="se-ok">' + U.ico('save') + 'احفظ</button>'
    });
    U.$('#se-ok', mo.el).addEventListener('click', function () {
      S.upd('subs', s.id, W.form(mo.el));
      S.reconcile();
      U.toast('اتحفظ'); mo.close(); CZ.render();
      if (CZ.curDrawer) CZ.memberDrawer(s.memberId);
    });
    U.$('#se-del', mo.el).addEventListener('click', function () {
      U.confirm({ title: 'حذف الاشتراك؟', danger: true, body: 'الحركة دي مش بترجع.', ok: 'احذف' })
        .then(function (y) {
          if (!y) return;
          S.del('subs', s.id); S.reconcile(); mo.close(); CZ.render();
          if (CZ.curDrawer) CZ.memberDrawer(s.memberId);
        });
    });
  });

  /* ============ تحصيل متأخرات ============ */
  U.on('click', '[data-pay]', function (e, el) {
    var id = el.getAttribute('data-pay'), m = S.member(id);
    var debt = S.debt(id);
    var open = S.where('subs', function (s) {
      return s.memberId === id && s.status !== 'cancelled' && (s.price - (s.paid || 0)) > 0;
    });
    var mo = U.modal({
      title: 'تحصيل متأخرات', sub: m.name + ' — عليه ' + U.m(debt), width: 'sm',
      body: '<div class="f">' +
        '<div class="pop-t lat">اشتراكات عليها متبقي</div>' +
        open.map(function (s) {
          return '<div class="list-i"><div class="li-t"><b>' + U.esc(s.planName) + '</b><span>' +
            U.fDate(s.startAt) + ' → ' + U.fDate(s.endAt) + '</span></div>' +
            '<div class="li-e"><b class="neg">' + U.n(s.price - s.paid) + '</b><span>متبقي</span></div></div>';
        }).join('') +
        '<div class="hr"></div>' +
        W.fld({ label: 'المبلغ المحصّل', name: 'amount', type: 'number', val: debt, suffix: CZ.CUR, req: true }) +
        W.fld({ label: 'طريقة الدفع', name: 'method', type: 'select',
          opts: Object.keys(S.METHODS).map(function (k) { return [k, S.METHODS[k]]; }) }) +
        W.fld({ label: 'ملاحظة', name: 'note', ph: 'اختياري' }) +
        '</div>',
      footer: '<div class="grow"></div><button class="btn btn-ghost" data-close>إلغاء</button>' +
        '<button class="btn btn-lime" id="py-ok">' + U.ico('check') + 'حصّل</button>'
    });
    U.$('#py-ok', mo.el).addEventListener('click', function () {
      var d = W.form(mo.el);
      var rest = d.amount;
      open.sort(U.by('startAt')).forEach(function (s) {
        if (rest <= 0) return;
        var need = s.price - (s.paid || 0);
        var take = Math.min(need, rest);
        s.paid = (s.paid || 0) + take;
        rest -= take;
      });
      S.addMoney({
        kind: 'in', amount: d.amount, cat: 'renew', method: d.method,
        memberId: id, branchId: m.branchId, note: 'تحصيل متأخرات' + (d.note ? ' — ' + d.note : '')
      });
      S.log('حصّل متأخرات', 'members', id, m.name + ' — ' + U.m(d.amount));
      S.save(true);
      U.toast('اتحصّل ' + U.m(d.amount));
      mo.close(); CZ.render();
      if (CZ.curDrawer) CZ.memberDrawer(id, 'money');
    });
  });

  /* ============ قياسات ============ */
  U.on('click', '[data-meas]', function (e, el) {
    var id = el.getAttribute('data-meas');
    var last = S.where('measures', function (x) { return x.memberId === id; }).sort(U.by('at', 'desc'))[0] || {};
    var mo = U.modal({
      title: 'قياس جديد', sub: S.memberName(id),
      body: '<div class="f">' +
        '<div class="f-row c3">' +
        W.fld({ label: 'التاريخ', name: 'at', type: 'date', val: U.today() }) +
        W.fld({ label: 'الوزن', name: 'weight', type: 'number', val: last.weight, suffix: 'كجم', step: '0.1' }) +
        W.fld({ label: 'الطول', name: 'height', type: 'number', val: last.height, suffix: 'سم' }) +
        '</div>' +
        '<div class="f-row c3">' +
        W.fld({ label: 'نسبة الدهون', name: 'fat', type: 'number', val: last.fat, suffix: '%', step: '0.1' }) +
        W.fld({ label: 'الكتلة العضلية', name: 'muscle', type: 'number', val: last.muscle, suffix: 'كجم', step: '0.1' }) +
        W.fld({ label: 'محيط الصدر', name: 'chest', type: 'number', val: last.chest, suffix: 'سم' }) +
        '</div>' +
        '<div class="f-row c3">' +
        W.fld({ label: 'الوسط', name: 'waist', type: 'number', val: last.waist, suffix: 'سم' }) +
        W.fld({ label: 'الذراع', name: 'arm', type: 'number', val: last.arm, suffix: 'سم' }) +
        W.fld({ label: 'الفخذ', name: 'thigh', type: 'number', val: last.thigh, suffix: 'سم' }) +
        '</div>' +
        W.fld({ label: 'ملاحظة الكابتن', name: 'note', type: 'textarea', rows: 2 }) +
        '</div>',
      footer: '<div class="grow"></div><button class="btn btn-ghost" data-close>إلغاء</button>' +
        '<button class="btn btn-lime" id="ms-ok">' + U.ico('save') + 'احفظ</button>'
    });
    U.$('#ms-ok', mo.el).addEventListener('click', function () {
      var d = W.form(mo.el);
      d.memberId = id;
      S.add('measures', d);
      U.toast('اتسجّل القياس');
      mo.close();
      if (CZ.curDrawer) CZ.memberDrawer(id, 'body');
    });
  });

  /* ============ كارت العضوية ============ */
  U.on('click', '[data-mcard]', function (e, el) {
    var m = S.member(el.getAttribute('data-mcard'));
    var mo = U.modal({
      title: 'كارت العضوية', sub: m.name, width: 'sm',
      body: '<div style="display:flex;justify-content:center">' +
        (function () {
          var sub = S.activeSub(m.id);
          var b = S.branch(m.branchId) || {};
          return '<div class="mcard"><div class="mcard-top">' +
            '<div><div class="lat" style="font-family:Archivo;font-weight:800;letter-spacing:4px;font-size:14px;color:var(--lime)">CEZAR</div>' +
            '<div class="xs" style="color:#9A9B91">' + U.esc(b.short || '') + '</div></div>' +
            '<div class="mcard-code">' + U.esc(m.code) + '</div></div>' +
            '<div><div class="mcard-n">' + U.esc(m.name) + '</div>' +
            '<div class="xs" style="color:#9A9B91;margin-top:2px">' +
            U.esc(sub ? sub.planName + ' · لحد ' + U.fDate(sub.endAt) : 'من غير اشتراك') + '</div></div>' +
            U.barcode(m.code) + '</div>';
        })() + '</div>' +
        '<p class="xs mut center mt">الكارت ده بيطبع بمقاس بطاقة (85×54 مم). الكود اللي تحت هو اللي بيتكتب في شاشة الدخول.</p>',
      footer: '<div class="grow"></div><button class="btn btn-ghost" data-close>إغلاق</button>' +
        '<button class="btn btn-lime" id="mc-print">' + U.ico('print') + 'اطبع</button>'
    });
    U.$('#mc-print', mo.el).addEventListener('click', function () {
      U.print('<div class="pcards">' + W.memberCard(m) + '</div>');
    });
  });
})();
