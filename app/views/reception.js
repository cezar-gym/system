(function () {
  'use strict';
  var CZ = window.CZ, U = CZ.u, S = CZ.s, W = CZ.w;
  var R = CZ.reception = {};
  var shownDay = U.today(), midnightTimer;

  function branchName() {
    return CZ.state.branch === 'all' ? 'كل الفروع' : S.branchName(CZ.state.branch);
  }
  function tile(key, title, hint, icon, number, extra) {
    return '<button class="rx-tile rx-' + key + '" data-rx="' + key + '">' +
      '<span class="rx-tile-top"><span class="rx-icon">' + U.ico(icon) + '</span><span class="rx-number num">' + number + '</span></span>' +
      '<span class="rx-tile-copy"><strong>' + title + '</strong><span>' + hint + '</span></span>' + (extra || '') + '</button>';
  }
  CZ.views.reception = {
    title: 'مكتب الريسبشن', perm: 'reception',
    sub: function () { return branchName() + ' · ' + U.fDay(U.today()); },
    render: function () {
      shownDay = U.today();
      return '<section class="rx-home"><div class="rx-intro"><div><span class="rx-overline">التشغيل اليومي</span>' +
        '<h2>أهلاً، ' + U.esc(CZ.state.user.name.split(' ')[0]) + '</h2><p>كل اللي تحتاجه لاستقبال الأعضاء، في مكان واحد.</p></div>' +
        '<span class="rx-branch">' + U.ico('branch') + U.esc(branchName()) + '</span></div>' +
        '<div class="rx-primary">' +
        tile('checkin', 'تسجيل الحضور', 'بالاسم، كود العضو أو رقم التليفون', 'scan', '01') +
        tile('subscribe', 'اشتراك جديد', 'عضو جديد أو تجديد لعضو قديم', 'users', '02') +
        tile('sale', 'تسجيل مبيعات', 'اختار الأصناف وحصّل الفاتورة', 'shop', '03') + '</div>' +
        '<div class="rx-secondary">' +
        tile('revenue', 'الإيراد اليومي', 'اضغط واكتب الكود السري للعرض والطباعة', 'receipt', '04',
          '<span class="rx-private">' + U.ico('lock') + 'خاص</span>') +
        tile('expense', 'تسجيل مصروف', 'المبلغ وسبب الصرف', 'wallet', '05') + '</div>' +
        '<div class="rx-bottom"><span>' + U.ico('clock') + 'يوم جديد الساعة ١٢ بالليل · السجل محفوظ</span>' +
        '<a class="btn btn-ghost" href="#/reception-tools">' + U.ico('box') + 'أدوات أخرى</a></div></section>';
    },
    after: function () { scheduleMidnight(); }
  };
  CZ.views['reception-tools'] = {
    title: 'أدوات أخرى', perm: 'reception', sub: branchName,
    render: function () {
      var links = [
        ['checkin', 'checkin', 'سجل الحضور', 'دخول وخروج الأعضاء والزيارات', 'scan'],
        ['members', 'members', 'ملفات الأعضاء', 'الاشتراكات والقياسات والمتأخرات', 'users'],
        ['shop', 'shop?tab=stock', 'المخزون والمبيعات', 'الأصناف والتوريد وسجل البيع', 'shop'],
        ['classes', 'classes', 'الحصص والجدول', 'المواعيد والحجوزات', 'calendar'],
        ['leads', 'leads', 'العملاء المحتملين', 'المتابعات والاستفسارات', 'target'],
        ['messages', 'messages', 'مركز الرسايل', 'متابعة الاشتراكات والتواصل', 'msg'],
        ['tasks', 'tasks', 'المهام', 'الأعمال المطلوبة من الفريق', 'check'],
        ['lockers', 'lockers', 'اللوكرات', 'خريطة اللوكرات والحجوزات', 'door'],
        ['settings', 'settings', 'الإعدادات', 'الإعدادات والنسخ الاحتياطي', 'cog'],
        ['branches', 'branches', 'الفروع', 'بيانات الفروع ومواعيدها', 'branch']
      ];
      return '<section class="rx-home"><div class="rx-tools-head"><a class="btn btn-ghost" href="#/reception">' + U.ico('home') +
        'الرجوع للريسبشن</a></div><div class="rx-tools">' + links.filter(function (x) {
          return S.can(x[0]) || ['lockers', 'settings', 'branches'].indexOf(x[0]) > -1;
        }).map(function (x) {
          return '<a class="rx-tool" href="#/' + x[1] + '"><span class="rx-icon">' + U.ico(x[4]) +
            '</span><strong>' + x[2] + '</strong><span>' + x[3] + '</span></a>';
        }).join('') + '</div></section>';
    }
  };

  U.on('click', '[data-rx]', function (e, el) {
    if (!S.can('reception')) return;
    var action = el.getAttribute('data-rx');
    if (action === 'checkin') CZ.quickCheckin();
    if (action === 'subscribe') subscription();
    if (action === 'sale') CZ.saleModal();
    if (action === 'revenue') R.verifyRevenueAccess();
    if (action === 'expense') expense();
  });

  function subscription() {
    var mo = U.modal({ title: 'اشتراك جديد', sub: 'العضو مسجّل عندنا قبل كده؟', width: 'lg',
      body: '<div class="rx-choices"><button class="rx-choice" id="rx-new">' + U.ico('plus') +
        '<strong>عضو جديد</strong><span>سجّل بياناته واختار الباقة</span></button>' +
        '<button class="rx-choice" id="rx-existing">' + U.ico('refresh') +
        '<strong>عضو قديم</strong><span>دوّر عليه وجدّد اشتراكه</span></button></div>',
      footer: '<button class="btn btn-ghost" data-close>إلغاء</button>' });
    U.$('#rx-new', mo.el).onclick = function () { mo.close(); CZ.memberForm(null, { simple: true }); };
    U.$('#rx-existing', mo.el).onclick = function () {
      mo.close();
      var picker = U.modal({ title: 'اشتراك لعضو قديم', sub: 'دوّر بالاسم أو الكود أو رقم التليفون',
        body: W.memberPicker(), footer: '<button class="btn btn-ghost" data-close>إلغاء</button>' +
          '<button class="btn btn-lime" id="rx-renew">اختيار الباقة</button>' });
      U.$('#rx-renew', picker.el).onclick = function () {
        var id = W.form(picker.el).memberId;
        if (!id) { U.toast('اختار العضو الأول', 'err'); return; }
        picker.close(); CZ.renewModal(id);
      };
    };
  }

  function expense() {
    var mo = U.modal({ title: 'تسجيل مصروف', sub: branchName(),
      body: '<form id="rx-expense-form" class="f">' +
        W.fld({ label: 'المبلغ', name: 'amount', type: 'number', min: 0.01, step: '0.01', req: true, suffix: CZ.CUR, ph: '0' }) +
        W.fld({ label: 'سبب الصرف', name: 'note', type: 'textarea', req: true, rows: 3, ph: 'مثال: شراء أدوات نظافة للجيم' }) +
        '<div class="f-row">' + W.fld({ label: 'البند', name: 'cat', type: 'select', val: 'other',
          opts: Object.keys(S.CATS_OUT).map(function (k) { return [k, S.CATS_OUT[k]]; }) }) +
        W.fld({ label: 'طريقة الدفع', name: 'method', type: 'select', val: 'cash',
          opts: Object.keys(S.METHODS).map(function (k) { return [k, S.METHODS[k]]; }) }) + '</div>' +
        W.branchField(CZ.state.branch === 'all' ? null : CZ.state.branch) + '</form>',
      footer: '<button class="btn btn-ghost" data-close>إلغاء</button><button type="submit" form="rx-expense-form" class="btn btn-lime">' + U.ico('check') + 'سجّل المصروف</button>' });
    var saved = false;
    U.$('#rx-expense-form', mo.el).onsubmit = function (e) {
      e.preventDefault();
      var d = W.form(mo.el);
      if (saved) return;
      if (!Number.isFinite(d.amount) || d.amount <= 0 || !d.note) { U.toast('اكتب مبلغ صحيح وسبب الصرف', 'err'); return; }
      if (CZ.state.user.branchId && d.branchId !== CZ.state.user.branchId) { U.toast('اختار الفرع المسموح لك', 'err'); return; }
      saved = true;
      S.addMoney({ kind: 'out', amount: d.amount, note: d.note, cat: d.cat, method: d.method, branchId: d.branchId });
      S.log('صرف', 'money', '', U.m(d.amount) + ' — ' + d.note);
      S.save(true); mo.close(); CZ.render(); U.toast('المصروف اتسجّل');
    };
  }

  R.dailyData = function (day, branch) {
    var income = S.income(day, day, branch), expense = S.expense(day, day, branch);
    return { day: day, income: U.sum(income, 'amount'), expense: U.sum(expense, 'amount'),
      rows: income.concat(expense).sort(U.by('at', 'desc')) };
  };
  function dailyBody(data) {
    return '<div class="rx-summary">' + [
      ['إجمالي الإيراد', data.income], ['المصروفات', data.expense], ['الصافي', data.income - data.expense]
    ].map(function (x) { return '<div><span>' + x[0] + '</span><strong class="num">' + U.n(x[1]) +
      ' <small>' + U.esc(CZ.CUR) + '</small></strong></div>'; }).join('') + '</div>' +
      W.table([
        { t: 'الوقت', render: function (x) { return U.fTime(x.at); } },
        { t: 'البيان', render: function (x) { return '<b>' + U.esc(x.note || (x.kind === 'in' ? S.CATS_IN : S.CATS_OUT)[x.cat] || 'حركة خزنة') +
          '</b>' + (x.memberId ? '<div class="mut">' + U.esc(S.memberName(x.memberId)) + '</div>' : ''); } },
        { t: 'الدفع', render: function (x) { return U.esc(S.METHODS[x.method] || x.method); } },
        { t: 'المبلغ', render: function (x) { return '<span class="money ' + (x.kind === 'in' ? 'pos' : 'neg') + '">' +
          (x.kind === 'in' ? '+ ' : '− ') + U.n(x.amount) + '</span>'; } }
      ], data.rows, { emptyT: 'لسه مفيش حركات في اليوم ده', emptyIco: 'receipt' });
  }
  R.dailyReport = function (day, branch) {
    var d = R.dailyData(day, branch);
    var name = branch === 'all' ? 'كل الفروع' : S.branchName(branch);
    return '<div class="a4" dir="rtl"><div class="a4-h"><div><div class="logo">CEZAR GYM</div>' +
      '<h1>تقرير الإيراد اليومي</h1></div><div class="meta">' + U.esc(name) + '<br>' + U.fDay(day) + '</div></div>' +
      '<div class="a4-grid">' + [['الإيراد', d.income], ['المصروفات', d.expense], ['الصافي', d.income - d.expense]].map(function (x) {
        return '<div class="a4-stat"><div class="t">' + x[0] + '</div><div class="v">' + U.n(x[1]) + ' ' + U.esc(CZ.CUR) + '</div></div>';
      }).join('') + '</div><table><thead><tr><th>الوقت</th><th>البيان</th><th>طريقة الدفع</th><th>إيراد</th><th>مصروف</th></tr></thead><tbody>' +
      d.rows.map(function (x) {
        return '<tr><td>' + U.fTime(x.at) + '</td><td>' + U.esc(x.note || (x.kind === 'in' ? S.CATS_IN : S.CATS_OUT)[x.cat] || '') +
          (x.memberId ? ' · ' + U.esc(S.memberName(x.memberId)) : '') + '</td><td>' + U.esc(S.METHODS[x.method] || x.method) +
          '</td><td class="n">' + (x.kind === 'in' ? U.n(x.amount) : '—') + '</td><td class="n">' + (x.kind === 'out' ? U.n(x.amount) : '—') + '</td></tr>';
      }).join('') + '</tbody></table>' + (!d.rows.length ? '<p>مفيش حركات في اليوم ده.</p>' : '') +
      '<div class="a4-f"><span>' + U.esc(CZ.state.user.name) + '</span><span>وقت الطباعة: ' + U.fDT(U.isoT()) + '</span></div></div>';
  };
  R.dailyModal = function () {
    var day = U.today(), branch = CZ.state.branch;
    var mo = U.modal({ title: 'الإيراد اليومي', sub: branchName(), width: 'lg',
      body: '<div class="rx-report-date"><b>' + U.fDay(day) + '</b>' +
        '<span>تقرير النهاردة فقط · يوم جديد يبدأ الساعة ١٢ بالليل.</span></div><div id="rx-daily-body"></div>',
      footer: '<button class="btn btn-ghost" data-close>إغلاق</button><button class="btn btn-lime" id="rx-print">' + U.ico('print') + 'طباعة التقرير اليومي</button>',
      onClose: function () { R.refreshDaily = null; } });
    function paint() { U.$('#rx-daily-body', mo.el).innerHTML = dailyBody(R.dailyData(day, branch)); }
    U.$('#rx-print', mo.el).onclick = function () { U.print(R.dailyReport(day, branch)); };
    R.refreshDaily = function (previousDay) {
      if (day === previousDay) day = U.today();
      paint();
    };
    paint();
  };

  R.verifyRevenueAccess = function () {
    var pin = '', user = CZ.state.user;
    var mo = U.modal({
      title: 'عرض الإيراد اليومي',
      sub: 'اكتب الكود السري الخاص بك',
      width: 'sm',
      body: '<div class="rx-pin"><span class="rx-pin-avatar">' + U.esc(U.initials(user.name)) + '</span>' +
        '<b>' + U.esc(user.name) + '</b><div class="pindots" id="rx-pin-dots"><i></i><i></i><i></i><i></i></div>' +
        '<div class="pinpad" id="rx-pin-pad">' +
        [1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (n) { return '<button type="button" data-rx-pin="' + n + '">' + n + '</button>'; }).join('') +
        '<button type="button" data-rx-clear>' + U.ico('x') + '</button><button type="button" data-rx-pin="0">0</button>' +
        '<button type="button" data-rx-delete>' + U.ico('left') + '</button></div></div>',
      footer: '<button class="btn btn-ghost" data-close>إلغاء</button>'
    });
    var dots = U.$('#rx-pin-dots', mo.el);
    function draw() {
      dots.className = 'pindots';
      dots.innerHTML = [0, 1, 2, 3].map(function (i) { return '<i class="' + (i < pin.length ? 'on' : '') + '"></i>'; }).join('');
    }
    function check() {
      if (pin === String(user.pin)) { mo.close(); R.dailyModal(); return; }
      dots.classList.add('bad');
      if (navigator.vibrate) navigator.vibrate(120);
      U.toast('الكود غلط', 'err');
      setTimeout(function () { pin = ''; draw(); }, 420);
    }
    function add(n) { if (pin.length < 4) pin += n; draw(); if (pin.length === 4) setTimeout(check, 130); }
    U.$('#rx-pin-pad', mo.el).addEventListener('click', function (e) {
      var n = e.target.closest('[data-rx-pin]');
      if (n) add(n.getAttribute('data-rx-pin'));
      else if (e.target.closest('[data-rx-clear]')) { pin = ''; draw(); }
      else if (e.target.closest('[data-rx-delete]')) { pin = pin.slice(0, -1); draw(); }
    });
    mo.el.addEventListener('keydown', function (e) {
      if (/^[0-9]$/.test(e.key)) { e.preventDefault(); add(e.key); }
      else if (e.key === 'Backspace') { e.preventDefault(); pin = pin.slice(0, -1); draw(); }
    });
  };

  function checkDay() {
    var current = U.today();
    if (current !== shownDay) {
      var previous = shownDay; shownDay = current;
      if (R.refreshDaily) R.refreshDaily(previous);
      if (CZ.state.user && CZ.view && CZ.view.name === 'reception') CZ.render();
    }
    scheduleMidnight();
  }
  function scheduleMidnight() {
    clearTimeout(midnightTimer);
    var now = new Date(), next = new Date(now);
    next.setHours(24, 0, 0, 0);
    midnightTimer = setTimeout(checkDay, next.getTime() - now.getTime() + 30);
  }
  window.addEventListener('focus', checkDay);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) checkDay(); });
})();
