/* ============================================================
   سيزر جيم — الكباتن والموظفين + التدريب الخاص
   ============================================================ */
(function () {
  'use strict';
  var CZ = window.CZ, U = CZ.u, S = CZ.s, W = CZ.w;
  CZ.views = CZ.views || {};
  CZ.state = CZ.state || { user: null, branch: 'all', params: {} };

  var ROLES = { coach: 'كابتن', reception: 'ريسبشن', manager: 'مدير', cleaner: 'نضافة وصيانة', security: 'أمن', other: 'أخرى' };

  /* ================= الموظفين ================= */
  CZ.views.staff = {
    title: 'الكباتن والموظفين',
    sub: function () { return CZ.state.branch === 'all' ? 'كل الفروع' : S.branchName(CZ.state.branch); },
    perm: 'staff',
    render: function () {
      var b = CZ.state.branch;
      var list = S.scope(S.all('staff'), b);
      var coaches = list.filter(function (s) { return s.role === 'coach'; });
      var salaries = U.sum(list.filter(function (s) { return s.active !== false; }), 'salary');
      var month = U.today().slice(0, 8) + '01';
      var paid = U.sum(S.expense(month, U.today(), b).filter(function (x) { return x.cat === 'salary'; }), 'amount');

      return '<div class="grid g-4 mb">' +
        W.stat({ t: 'إجمالي الفريق', v: U.n(list.filter(function (s) { return s.active !== false; }).length), ico: 'users', tone: 'info' }) +
        W.stat({ t: 'كباتن', v: U.n(coaches.length), ico: 'whistle', tone: 'lime' }) +
        W.stat({ t: 'مرتبات الشهر', v: U.n(salaries), cur: CZ.CUR, ico: 'wallet', tone: 'gold' }) +
        W.stat({ t: 'المصروف فعلاً الشهر ده', v: U.n(paid), cur: CZ.CUR, ico: 'receipt',
          tone: paid >= salaries ? 'ok' : 'warn', d: paid < salaries ? 'فاضل ' + U.m(salaries - paid) : 'اتصرفت' }) +
        '</div>' +

        '<div class="row-b mb"><div></div><div class="row">' +
        '<button class="btn btn-ghost btn-sm" id="sf-pay">' + U.ico('wallet') + 'صرف مرتبات</button>' +
        '<button class="btn btn-lime btn-sm" id="sf-new">' + U.ico('plus') + 'موظف جديد</button>' +
        '</div></div>' +

        W.card({
          flush: true,
          body: W.table([
            { k: 'name', t: 'الاسم', sort: false, render: function (s) {
              return '<div class="who"><span class="ava ' + (s.gender === 'f' ? 'f' : 'm') + '">' +
                U.esc(U.initials(s.name)) + '</span><div class="who-t"><b>' + U.esc(s.name) + '</b>' +
                '<span>' + U.esc(s.specialty || ROLES[s.role] || '') + '</span></div></div>';
            }},
            { t: 'الدور', sort: false, render: function (s) {
              return '<span class="badge ' + (s.role === 'coach' ? 'lime' : '') + '">' + (ROLES[s.role] || s.role) + '</span>';
            }},
            { t: 'الفرع', sort: false, render: function (s) { return W.branchTag(s.branchId); } },
            { t: 'التليفون', sort: false, render: function (s) {
              return s.phone ? '<a href="' + U.tel(s.phone) + '" class="num sm">' + U.fPhone(s.phone) + '</a>' : '<span class="fnt">—</span>';
            }},
            { t: 'الوردية', sort: false, render: function (s) { return '<span class="sm">' + U.esc(s.shift || '—') + '</span>'; } },
            { t: 'المرتب', sort: false, cls: 'num end', render: function (s) { return U.money(s.salary); } },
            { t: 'عمولة', sort: false, cls: 'num mid', render: function (s) { return s.commission ? s.commission + '%' : '—'; } },
            { t: 'عملاء برايفيت', sort: false, cls: 'num mid', render: function (s) {
              var n = S.where('pt', function (p) { return p.coachId === s.id && p.status === 'active'; }).length;
              return n ? '<span class="badge ok">' + n + '</span>' : '<span class="fnt">0</span>';
            }},
            { t: 'من', sort: false, render: function (s) { return '<span class="sm">' + U.fDate(s.joinedAt, 'short') + '</span>'; } },
            { t: '', sort: false, cls: 'end', render: function (s) {
              return '<div class="rowact">' +
                '<button class="btn btn-sm btn-soft btn-ico" data-staff="' + s.id + '">' + U.ico('eye') + '</button>' +
                '<button class="btn btn-sm btn-soft btn-ico" data-sedit="' + s.id + '">' + U.ico('edit') + '</button></div>';
            }}
          ], list.sort(U.by('role')), { emptyT: 'مفيش موظفين', emptyIco: 'users' })
        }) +

        (coaches.length ? W.sectH('أداء الكباتن') + '<div class="grid g-2">' +
          W.card({
            title: 'عملاء البرايفيت لكل كابتن', ico: 'dumbbell',
            body: CZ.c.rank(coaches.map(function (c) {
              return {
                t: c.name,
                v: S.where('pt', function (p) { return p.coachId === c.id; }).length,
                sub: S.where('ptlog', function (l) { return l.coachId === c.id; }).length + ' جلسة اتعملت'
              };
            }).sort(U.by('v', 'desc')), { unit: ' عميل' })
          }) +
          W.card({
            title: 'الاشتراكات المنسوبة لكل كابتن', ico: 'star', tone: 'gold',
            sub: 'الاشتراكات اللي اتسجّل عليها اسم الكابتن',
            body: CZ.c.rank(coaches.map(function (c) {
              var ss = S.where('subs', function (s) { return s.coachId === c.id; });
              return {
                t: c.name, v: U.sum(ss, 'paid'),
                sub: ss.length + ' اشتراك · عمولة تقديرية ' + U.m(Math.round(U.sum(ss, 'paid') * (c.commission || 0) / 100))
              };
            }).sort(U.by('v', 'desc')), { money: true })
          }) + '</div>' : '');
    },
    after: function () {
      var e;
      if ((e = U.$('#sf-new'))) e.addEventListener('click', function () { staffForm(); });
      if ((e = U.$('#sf-pay'))) e.addEventListener('click', paySalaries);
    }
  };

  U.on('click', '[data-sedit]', function (e, el) { staffForm(el.getAttribute('data-sedit')); });

  function staffForm(id) {
    var s = id ? S.get('staff', id) : null;
    var x = s || { active: true, role: 'coach', gender: 'm', joinedAt: U.today() };
    var mo = U.modal({
      title: s ? 'تعديل بيانات موظف' : 'موظف جديد',
      sub: s ? s.name : '',
      width: 'lg',
      body: '<div class="f" id="stf">' +
        '<div class="f-row c3">' +
        W.fld({ label: 'الاسم', name: 'name', val: x.name, req: true, span: 2 }) +
        W.fld({ label: 'الدور', name: 'role', type: 'select', val: x.role,
          opts: Object.keys(ROLES).map(function (k) { return [k, ROLES[k]]; }) }) +
        '</div>' +
        '<div class="f-row c3">' +
        W.fld({ label: 'التليفون', name: 'phone', type: 'tel', val: x.phone, ico: 'phone' }) +
        W.fld({ label: 'النوع', name: 'gender', type: 'select', val: x.gender, opts: [['m', 'ذكر'], ['f', 'أنثى']] }) +
        W.branchField(x.branchId) +
        '</div>' +
        '<div class="f-row c3">' +
        W.fld({ label: 'التخصص', name: 'specialty', val: x.specialty, ph: 'كمال أجسام، ملاكمة...' }) +
        W.fld({ label: 'الوردية', name: 'shift', val: x.shift, ph: 'صباحي 7ص–3م' }) +
        W.fld({ label: 'تاريخ التعيين', name: 'joinedAt', type: 'date', val: x.joinedAt }) +
        '</div>' +
        '<div class="f-row c3">' +
        W.fld({ label: 'المرتب الشهري', name: 'salary', type: 'number', val: x.salary, suffix: CZ.CUR }) +
        W.fld({ label: 'نسبة العمولة', name: 'commission', type: 'number', val: x.commission, suffix: '%',
          hint: 'على الاشتراكات المنسوبة له' }) +
        W.fld({ label: 'الرقم القومي', name: 'nationalId', val: x.nationalId }) +
        '</div>' +
        W.fld({ label: 'ملاحظات', name: 'note', type: 'textarea', val: x.note, rows: 2 }) +
        W.check({ name: 'active', t: 'الموظف على رأس العمل', on: x.active !== false }) +
        '</div>',
      footer: (s ? '<button class="btn btn-danger btn-sm" id="stf-del">' + U.ico('trash') + 'حذف</button>' : '') +
        '<div class="grow"></div><button class="btn btn-ghost" data-close>إلغاء</button>' +
        '<button class="btn btn-lime" id="stf-ok">' + U.ico('save') + 'احفظ</button>'
    });
    U.$('#stf-ok', mo.el).addEventListener('click', function () {
      var d = W.form(U.$('#stf', mo.el));
      if (!d.name) { U.toast('اكتب الاسم', 'err'); return; }
      if (s) S.upd('staff', s.id, d); else S.add('staff', d);
      U.toast('اتحفظ'); mo.close(); CZ.render();
    });
    if (s) U.$('#stf-del', mo.el).addEventListener('click', function () {
      U.confirm({ title: 'حذف ' + s.name + '؟', danger: true, body: 'الأحسن تشيل علامة «على رأس العمل» بدل الحذف.', ok: 'احذف' })
        .then(function (y) { if (y) { S.del('staff', s.id); mo.close(); CZ.render(); } });
    });
  }

  /* ---------- ملف الموظف ---------- */
  U.on('click', '[data-staff]', function (e, el) {
    var s = S.get('staff', el.getAttribute('data-staff'));
    if (!s) return;
    var pts = S.where('pt', function (p) { return p.coachId === s.id; });
    var logs = S.where('ptlog', function (l) { return l.coachId === s.id; }).sort(U.by('at', 'desc'));
    var classes = S.where('classes', function (c) { return c.coachId === s.id; });
    var subs = S.where('subs', function (x) { return x.coachId === s.id; });
    U.drawer({
      head: '<div class="row" style="gap:12px;flex:1"><span class="ava lg ' + (s.gender === 'f' ? 'f' : 'm') + '">' +
        U.esc(U.initials(s.name)) + '</span><div><b style="font-size:18px">' + U.esc(s.name) + '</b>' +
        '<div class="mut sm">' + (ROLES[s.role] || s.role) + ' · ' + U.esc(s.specialty || '') + '</div></div></div>',
      body:
        '<div class="grid g-3 mb">' +
        W.stat({ t: 'عملاء برايفيت', v: U.n(pts.filter(function (p) { return p.status === 'active'; }).length), ico: 'dumbbell', tone: 'lime' }) +
        W.stat({ t: 'جلسات اتعملت', v: U.n(logs.length), ico: 'check', tone: 'ok' }) +
        W.stat({ t: 'حصص أسبوعية', v: U.n(classes.length), ico: 'calendar', tone: 'info' }) +
        '</div>' +
        W.card({
          title: 'بياناته', ico: 'user',
          body: '<dl class="kv">' +
            '<dt>التليفون</dt><dd>' + (s.phone ? '<a href="' + U.tel(s.phone) + '">' + U.fPhone(s.phone) + '</a>' : '—') + '</dd>' +
            '<dt>الفرع</dt><dd>' + W.branchTag(s.branchId) + '</dd>' +
            '<dt>الوردية</dt><dd>' + U.esc(s.shift || '—') + '</dd>' +
            '<dt>المرتب</dt><dd>' + U.money(s.salary) + '</dd>' +
            '<dt>العمولة</dt><dd>' + (s.commission || 0) + '%</dd>' +
            '<dt>من</dt><dd>' + U.fDate(s.joinedAt) + ' (' + U.ago(s.joinedAt) + ')</dd>' +
            '<dt>عمولة مستحقة تقديريًا</dt><dd class="money">' +
            U.n(Math.round(U.sum(subs, 'paid') * (s.commission || 0) / 100)) + ' ' + CZ.CUR + '</dd>' +
            '</dl>' + (s.note ? '<div class="alert mt">' + U.ico('info') + '<div>' + U.esc(s.note) + '</div></div>' : '')
        }) +
        (classes.length ? '<div class="mt">' + W.card({
          title: 'حصصه في الجدول', ico: 'calendar', flush: true,
          body: classes.map(function (c) {
            return '<div class="list-i"><div class="li-t"><b>' + U.esc(c.name) + '</b><span>' +
              U.DAYS[c.day] + ' · ' + U.fMin(c.from) + ' — ' + U.fMin(c.to) + '</span></div>' +
              '<span class="badge ' + (c.gender === 'women' ? 'gold' : '') + '">' +
              (c.gender === 'women' ? 'سيدات' : 'رجالة') + '</span></div>';
          }).join('')
        }) + '</div>' : '') +
        (pts.length ? '<div class="mt">' + W.card({
          title: 'عملاء البرايفيت', ico: 'dumbbell', flush: true,
          body: pts.map(function (p) {
            var m = S.member(p.memberId);
            return '<div class="list-i' + (m ? ' clickable" data-mem="' + m.id + '"' : '"') + '>' +
              (m ? W.ava(m, 'sm') : '') + '<div class="li-t"><b>' + U.esc(m ? m.name : '—') + '</b>' +
              '<span>' + U.esc(p.planName) + ' · ' + (p.sessionsUsed || 0) + '/' + p.sessionsTotal + ' جلسة</span></div>' +
              '<span class="badge ' + (p.status === 'active' ? 'ok' : '') + '">' +
              (p.status === 'active' ? 'شغّال' : 'خلص') + '</span></div>';
          }).join('')
        }) + '</div>' : ''),
      foot: '<button class="btn btn-lime" data-sedit="' + s.id + '">' + U.ico('edit') + 'تعديل</button>' +
        (s.phone ? '<a class="btn btn-ok" href="' + U.wa(s.phone) + '" target="_blank" rel="noopener">' + U.ico('msg') + 'واتساب</a>' : '')
    });
  });

  function paySalaries() {
    var b = CZ.state.branch;
    var list = S.scope(S.all('staff'), b).filter(function (s) { return s.active !== false && s.salary; });
    var tot = U.sum(list, 'salary');
    var mo = U.modal({
      title: 'صرف مرتبات', sub: U.MONTHS[new Date().getMonth()] + ' — ' + list.length + ' موظف',
      width: 'lg',
      body: '<div class="tw"><table class="t"><thead><tr><th>الموظف</th><th>الفرع</th><th class="num end">المرتب</th>' +
        '<th class="num end">عمولة</th><th class="num end">الإجمالي</th><th class="mid">صرف</th></tr></thead><tbody>' +
        list.map(function (s) {
          var comm = Math.round(U.sum(S.where('subs', function (x) {
            return x.coachId === s.id && x.createdAt >= U.today().slice(0, 8) + '01';
          }), 'paid') * (s.commission || 0) / 100);
          return '<tr><td><b>' + U.esc(s.name) + '</b><div class="xs fnt">' + (ROLES[s.role] || '') + '</div></td>' +
            '<td>' + W.branchTag(s.branchId) + '</td>' +
            '<td class="num end">' + U.n(s.salary) + '</td>' +
            '<td class="num end">' + (comm ? U.n(comm) : '—') + '</td>' +
            '<td class="num end"><b class="money">' + U.n(s.salary + comm) + '</b></td>' +
            '<td class="mid"><label class="check" style="justify-content:center"><input type="checkbox" name="pay" value="' +
            s.id + '|' + (s.salary + comm) + '" checked></label></td></tr>';
        }).join('') + '</tbody><tfoot><tr><td colspan="4">الإجمالي</td><td class="num end">' +
        U.n(tot) + '</td><td></td></tr></tfoot></table></div>' +
        '<div class="mt">' + W.fld({
          label: 'طريقة الصرف', name: 'method', type: 'select',
          opts: Object.keys(S.METHODS).map(function (k) { return [k, S.METHODS[k]]; })
        }) + '</div>',
      footer: '<div class="grow"></div><button class="btn btn-ghost" data-close>إلغاء</button>' +
        '<button class="btn btn-ink" id="pay-ok">' + U.ico('wallet') + 'اصرف وسجّل في الخزنة</button>'
    });
    U.$('#pay-ok', mo.el).addEventListener('click', function () {
      var method = U.$('[name=method]', mo.el).value;
      var n = 0, sum = 0;
      U.$$('[name=pay]:checked', mo.el).forEach(function (c) {
        var p = c.value.split('|');
        var st = S.get('staff', p[0]);
        S.addMoney({
          kind: 'out', amount: +p[1], cat: 'salary', method: method,
          branchId: st.branchId, note: 'مرتب ' + st.name + ' — ' + U.MONTHS[new Date().getMonth()]
        });
        n++; sum += +p[1];
      });
      S.log('صرف مرتبات', 'staff', '', n + ' موظف — ' + U.m(sum));
      S.save(true);
      U.toast('اتصرف ' + U.m(sum) + ' لـ ' + n + ' موظف');
      mo.close(); CZ.render();
    });
  }

  /* ================= التدريب الخاص ================= */
  CZ.views.pt = {
    title: 'التدريب الخاص',
    sub: 'برايفيت فردي وجروب',
    perm: 'pt',
    render: function () {
      var b = CZ.state.branch;
      var pkgs = S.scope(S.all('pt'), b).sort(U.by('startAt', 'desc'));
      var act = pkgs.filter(function (p) { return p.status === 'active'; });
      var rev = U.sum(pkgs, 'paid');
      var coaches = S.where('staff', function (s) { return s.role === 'coach'; });

      return '<div class="grid g-4 mb">' +
        W.stat({ t: 'باقات شغّالة', v: U.n(act.length), ico: 'dumbbell', tone: 'lime' }) +
        W.stat({ t: 'إجمالي الباقات', v: U.n(pkgs.length), ico: 'layers' }) +
        W.stat({ t: 'إيراد البرايفيت', v: U.n(rev), cur: CZ.CUR, ico: 'wallet', tone: 'gold' }) +
        W.stat({ t: 'جلسات متبقية', v: U.n(U.sum(act, function (p) { return p.sessionsTotal - (p.sessionsUsed || 0); })),
          ico: 'zap', tone: 'info', d: 'شغل مستحق على الكباتن' }) +
        '</div>' +

        '<div class="row-b mb"><div></div>' +
        '<button class="btn btn-lime btn-sm" id="pt-new">' + U.ico('plus') + 'باقة برايفيت</button></div>' +

        W.card({
          flush: true,
          body: W.table([
            { t: 'العضو', sort: false, render: function (p) {
              var m = S.member(p.memberId);
              return m ? W.who(m, U.fPhone(m.phone)) : '<span class="fnt">—</span>';
            }},
            { t: 'الكابتن', sort: false, render: function (p) {
              var c = S.get('staff', p.coachId);
              return c ? '<b class="sm">' + U.esc(c.name) + '</b>' : '<span class="fnt">—</span>';
            }},
            { t: 'الباقة', sort: false, render: function (p) { return '<span class="sm">' + U.esc(p.planName) + '</span>'; } },
            { t: 'التقدّم', sort: false, render: function (p) {
              var pct = U.pct(p.sessionsUsed || 0, p.sessionsTotal);
              return '<div class="bar-l"><span class="lbl">' + (p.sessionsUsed || 0) + '/' + p.sessionsTotal + '</span>' +
                '<div class="bar" style="width:70px"><i style="width:' + pct + '%"></i></div></div>';
            }},
            { t: 'الفترة', sort: false, render: function (p) {
              return '<span class="sm">' + U.fDate(p.startAt, 'short') + ' → ' + U.fDate(p.endAt, 'short') + '</span>';
            }},
            { t: 'الهدف', sort: false, render: function (p) { return '<span class="badge">' + U.esc(p.goal || '—') + '</span>'; } },
            { t: 'المدفوع', sort: false, cls: 'num end', render: function (p) {
              return U.money(p.paid) + (p.price > p.paid ? '<div class="xs neg">باقي ' + U.n(p.price - p.paid) + '</div>' : '');
            }},
            { t: 'الفرع', sort: false, render: function (p) { return W.branchTag(p.branchId); } },
            { t: '', sort: false, cls: 'end', render: function (p) {
              return '<div class="rowact">' +
                (p.status === 'active' ? '<button class="btn btn-sm btn-lime" data-ptlog="' + p.id + '">' +
                  U.ico('check') + 'جلسة</button>' : '<span class="badge">خلصت</span>') +
                '<button class="btn btn-sm btn-soft btn-ico" data-ptview="' + p.id + '">' + U.ico('eye') + '</button></div>';
            }}
          ], pkgs, { emptyT: 'مفيش باقات برايفيت', emptyS: 'البرايفيت أعلى بند ربح في أي جيم — ابدأ سجّل باقة.', emptyIco: 'dumbbell' })
        }) +

        (coaches.length ? '<div class="mt">' + W.card({
          title: 'الجلسات اللي اتعملت — آخر 30 يوم', ico: 'chart',
          body: CZ.c.bars(coaches.map(function (c) {
            return {
              t: c.name.replace('كابتن ', ''),
              v: S.where('ptlog', function (l) {
                return l.coachId === c.id && l.at >= U.addDays(U.today(), -30);
              }).length
            };
          }).sort(U.by('v', 'desc')), { h: 190, unit: ' جلسة' })
        }) + '</div>' : '');
    },
    after: function () {
      var e = U.$('#pt-new');
      if (e) e.addEventListener('click', function () { ptForm(); });
    }
  };

  function ptForm() {
    var plans = S.all('plans').filter(function (p) { return p.type === 'pt'; });
    var coaches = S.where('staff', function (s) { return s.role === 'coach' && s.active !== false; });
    var mo = U.modal({
      title: 'باقة تدريب خاص',
      body: '<div class="f" id="ptf">' +
        W.memberPicker({ label: 'العضو' }) +
        '<div class="f-row">' +
        W.fld({ label: 'الباقة', name: 'planId', type: 'select',
          opts: plans.map(function (p) { return [p.id, p.name + ' — ' + U.m(p.price)]; }) }) +
        W.fld({ label: 'الكابتن', name: 'coachId', type: 'select',
          opts: coaches.map(function (c) { return [c.id, c.name]; }) }) +
        '</div>' +
        '<div class="f-row c3">' +
        W.fld({ label: 'عدد الجلسات', name: 'sessionsTotal', type: 'number', val: plans[0] ? plans[0].sessions : 12 }) +
        W.fld({ label: 'يبدأ', name: 'startAt', type: 'date', val: U.today() }) +
        W.fld({ label: 'ينتهي', name: 'endAt', type: 'date', val: U.addMonths(U.today(), 2) }) +
        '</div>' +
        '<div class="f-row c3">' +
        W.fld({ label: 'السعر', name: 'price', type: 'number', val: plans[0] ? plans[0].price : 1500, suffix: CZ.CUR }) +
        W.fld({ label: 'المدفوع', name: 'paid', type: 'number', val: plans[0] ? plans[0].price : 1500, suffix: CZ.CUR }) +
        W.fld({ label: 'طريقة الدفع', name: 'method', type: 'select',
          opts: Object.keys(S.METHODS).map(function (k) { return [k, S.METHODS[k]]; }) }) +
        '</div>' +
        '<div class="f-row">' +
        W.fld({ label: 'الهدف', name: 'goal', type: 'select',
          opts: ['تنشيف', 'تضخيم', 'لياقة عامة', 'إنقاص وزن', 'تأهيل بعد إصابة', 'قوة وتحمّل']
            .map(function (x) { return [x, x]; }) }) +
        W.branchField() + '</div>' +
        W.fld({ label: 'ملاحظة', name: 'note' }) +
        '</div>',
      footer: '<div class="grow"></div><button class="btn btn-ghost" data-close>إلغاء</button>' +
        '<button class="btn btn-lime" id="ptf-ok">' + U.ico('check') + 'اعتمد</button>'
    });
    U.$('[name=planId]', mo.el).addEventListener('change', function (e) {
      var p = S.plan(e.target.value);
      U.$('[name=sessionsTotal]', mo.el).value = p.sessions;
      U.$('[name=price]', mo.el).value = p.price;
      U.$('[name=paid]', mo.el).value = p.price;
    });
    U.$('#ptf-ok', mo.el).addEventListener('click', function () {
      var d = W.form(U.$('#ptf', mo.el));
      if (!d.memberId) { U.toast('اختار العضو', 'err'); return; }
      var pl = S.plan(d.planId);
      d.planName = pl ? pl.name : 'برايفيت';
      d.sessionsUsed = 0;
      d.status = 'active';
      var pkg = S.add('pt', d);
      if (d.paid > 0) {
        S.addMoney({
          kind: 'in', amount: d.paid, cat: 'pt', method: d.method,
          memberId: d.memberId, branchId: d.branchId,
          note: d.planName + ' — ' + ((S.get('staff', d.coachId) || {}).name || '')
        });
      }
      U.toast('الباقة اتسجّلت');
      mo.close(); CZ.render();
    });
  }

  U.on('click', '[data-ptlog]', function (e, el) {
    var pkg = S.get('pt', el.getAttribute('data-ptlog'));
    var mo = U.modal({
      title: 'تسجيل جلسة برايفيت', width: 'sm',
      sub: S.memberName(pkg.memberId) + ' — الجلسة رقم ' + ((pkg.sessionsUsed || 0) + 1),
      body: '<div class="f">' +
        W.fld({ label: 'التاريخ', name: 'at', type: 'date', val: U.today() }) +
        W.fld({ label: 'الجلسة كانت على إيه', name: 'focus', type: 'select',
          opts: ['صدر وترايسبس', 'ظهر وبايسبس', 'رجل', 'كتف', 'فُل بودي', 'كارديو وحرق', 'بطن وكور', 'تأهيل']
            .map(function (x) { return [x, x]; }) }) +
        W.fld({ label: 'ملاحظة الكابتن', name: 'note', type: 'textarea', rows: 2, ph: 'أداءه، أوزانه، أي حاجة مهمة' }) +
        W.fld({ label: 'تقييم الالتزام', name: 'rating', type: 'select', val: 4,
          opts: [[5, '5 — ممتاز'], [4, '4 — كويس'], [3, '3 — عادي'], [2, '2 — ضعيف'], [1, '1 — مش ملتزم']] }) +
        '</div>',
      footer: '<div class="grow"></div><button class="btn btn-ghost" data-close>إلغاء</button>' +
        '<button class="btn btn-lime" id="ptl-ok">' + U.ico('check') + 'سجّل</button>'
    });
    U.$('#ptl-ok', mo.el).addEventListener('click', function () {
      var d = W.form(mo.el);
      d.pkgId = pkg.id; d.memberId = pkg.memberId; d.coachId = pkg.coachId;
      d.at = d.at + 'T' + U.isoT().slice(11);
      S.add('ptlog', d, true);
      var used = (pkg.sessionsUsed || 0) + 1;
      S.upd('pt', pkg.id, { sessionsUsed: used, status: used >= pkg.sessionsTotal ? 'done' : 'active' }, true);
      S.log('جلسة برايفيت', 'pt', pkg.id, S.memberName(pkg.memberId) + ' — ' + used + '/' + pkg.sessionsTotal);
      S.save(true);
      U.toast(used >= pkg.sessionsTotal ? 'خلصت آخر جلسة — كلّمه للتجديد' : 'اتسجّلت الجلسة');
      mo.close(); CZ.render();
    });
  });

  U.on('click', '[data-ptview]', function (e, el) {
    var pkg = S.get('pt', el.getAttribute('data-ptview'));
    var m = S.member(pkg.memberId), c = S.get('staff', pkg.coachId);
    var logs = S.where('ptlog', function (l) { return l.pkgId === pkg.id; }).sort(U.by('at', 'desc'));
    U.modal({
      title: 'باقة برايفيت', sub: (m ? m.name : '') + ' مع ' + (c ? c.name : ''), width: 'lg',
      body: '<dl class="kv mb">' +
        '<dt>الباقة</dt><dd>' + U.esc(pkg.planName) + '</dd>' +
        '<dt>الجلسات</dt><dd>' + (pkg.sessionsUsed || 0) + ' من ' + pkg.sessionsTotal + '</dd>' +
        '<dt>الفترة</dt><dd>' + U.fDate(pkg.startAt) + ' → ' + U.fDate(pkg.endAt) + '</dd>' +
        '<dt>السعر</dt><dd>' + U.money(pkg.price) + ' (مدفوع ' + U.n(pkg.paid) + ')</dd>' +
        '<dt>الهدف</dt><dd>' + U.esc(pkg.goal || '—') + '</dd></dl>' +
        W.card({
          flush: true, title: 'سجل الجلسات',
          body: W.table([
            { t: 'التاريخ', sort: false, render: function (l) { return U.fDate(l.at); } },
            { t: 'التمرين', sort: false, render: function (l) { return U.esc(l.focus || '—'); } },
            { t: 'ملاحظة', sort: false, render: function (l) { return '<span class="sm mut">' + U.esc(l.note || '—') + '</span>'; } },
            { t: 'التقييم', sort: false, cls: 'mid', render: function (l) {
              return '<span class="badge ' + (l.rating >= 4 ? 'ok' : l.rating >= 3 ? 'warn' : 'danger') + '">' + (l.rating || '—') + '</span>';
            }}
          ], logs, { emptyT: 'مفيش جلسات لسه' })
        }),
      footer: '<div class="grow"></div><button class="btn btn-ghost" data-close>إغلاق</button>' +
        (m ? '<button class="btn btn-lime" data-mem="' + m.id + '">ملف العضو</button>' : '')
    });
  });
})();
