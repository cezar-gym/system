/* ============================================================
   سيزر جيم — الحصص والجدول + المهام
   ============================================================ */
(function () {
  'use strict';
  var CZ = window.CZ, U = CZ.u, S = CZ.s, W = CZ.w;
  CZ.views = CZ.views || {};
  CZ.state = CZ.state || { user: null, branch: 'all', params: {} };

  /* ================= الحصص ================= */
  var CT = 'week';

  CZ.views.classes = {
    title: 'الحصص والجدول',
    sub: function () { return CZ.state.branch === 'all' ? 'كل الفروع' : S.branchName(CZ.state.branch); },
    perm: 'classes',
    render: function (p) {
      if (p.tab) { CT = p.tab; delete p.tab; }
      var b = CZ.state.branch;
      var classes = S.scope(S.all('classes'), b).filter(function (c) { return c.active !== false; });
      var today = new Date().getDay();
      var todayCls = classes.filter(function (c) { return c.day === today; }).sort(U.by('from'));
      var weekBookings = S.where('bookings', function (bk) {
        return bk.date >= U.today() && bk.date <= U.addDays(U.today(), 7);
      });

      return '<div class="grid g-4 mb">' +
        W.stat({ t: 'حصص في الأسبوع', v: U.n(classes.length), ico: 'calendar', tone: 'info' }) +
        W.stat({ t: 'حصص النهاردة', v: U.n(todayCls.length), ico: 'clock', tone: 'lime' }) +
        W.stat({ t: 'حجوزات الأسبوع', v: U.n(weekBookings.length), ico: 'check', tone: 'ok' }) +
        W.stat({ t: 'حصص السيدات', v: U.n(classes.filter(function (c) { return c.gender === 'women'; }).length),
          ico: 'star', tone: 'gold' }) +
        '</div>' +

        '<div class="row-b mb">' +
        '<div class="tabs" style="border:0">' + [['week', 'الجدول الأسبوعي'], ['today', 'حصص النهاردة'], ['hours', 'مواعيد الفرع']]
          .map(function (t) {
            return '<button data-ctab="' + t[0] + '"' + (CT === t[0] ? ' class="on"' : '') + '>' + t[1] + '</button>';
          }).join('') + '</div>' +
        '<button class="btn btn-lime btn-sm" id="cl-new">' + U.ico('plus') + 'حصة جديدة</button></div>' +

        (CT === 'week' ? weekView(classes, today)
          : CT === 'today' ? todayView(todayCls)
            : hoursView(b));
    },
    after: function () {
      var e = U.$('#cl-new');
      if (e) e.addEventListener('click', function () { classForm(); });
    }
  };

  U.on('click', '[data-ctab]', function (e, el) {
    if (!U.$('#cl-new')) return;
    CT = el.getAttribute('data-ctab'); CZ.render();
  });

  function weekView(classes, today) {
    return '<div class="tw">' + '<div class="week">' + U.DAYS.map(function (d, i) {
      var day = classes.filter(function (c) { return c.day === i; }).sort(U.by('from'));
      return '<div class="week-d' + (i === today ? ' today' : '') + '">' +
        '<h4>' + d + (i === today ? ' — النهاردة' : '') + '</h4>' +
        '<div class="week-b">' + (day.length ? day.map(function (c) {
          var coach = S.get('staff', c.coachId);
          var booked = S.where('bookings', function (bk) {
            return bk.classId === c.id && bk.date >= U.today();
          }).length;
          return '<button class="cls' + (c.gender === 'women' ? ' women' : '') +
            (booked >= c.capacity ? ' full' : '') + '" data-cls="' + c.id + '">' +
            '<b>' + U.esc(c.name) + '</b>' +
            '<span>' + U.fMin(c.from) + ' — ' + U.fMin(c.to) + '</span>' +
            '<span style="color:var(--ink);font-family:Tajawal">' + U.esc(coach ? coach.name.replace('كابتن ', '') : '—') + '</span>' +
            '<div class="bar" style="margin-top:5px"><i style="width:' + U.pct(booked, c.capacity) + '%"></i></div>' +
            '<span>' + booked + '/' + c.capacity + '</span>' +
            (CZ.state.branch === 'all' ? '<span>' + U.esc(S.branchShort(c.branchId)) + '</span>' : '') +
            '</button>';
        }).join('') : '<div class="xs fnt center" style="padding:14px">مفيش حصص</div>') +
        '</div></div>';
    }).join('') + '</div></div>' +
      '<div class="row mt" style="gap:14px">' +
      '<span class="row xs" style="gap:5px"><i style="width:11px;height:11px;border-radius:3px;background:var(--lime-deep)"></i>حصص رجالة</span>' +
      '<span class="row xs" style="gap:5px"><i style="width:11px;height:11px;border-radius:3px;background:var(--gold)"></i>حصص سيدات</span>' +
      '</div>';
  }

  function todayView(list) {
    var now = new Date().getHours() * 60 + new Date().getMinutes();
    return list.length ? '<div class="grid g-2">' + list.map(function (c) {
      var coach = S.get('staff', c.coachId);
      var bookings = S.where('bookings', function (bk) { return bk.classId === c.id && bk.date === U.today(); });
      var live = now >= c.from && now < c.to;
      var done = now >= c.to;
      return W.card({
        title: c.name, ico: 'whistle', tone: c.gender === 'women' ? 'gold' : 'lime',
        sub: U.fMin(c.from) + ' — ' + U.fMin(c.to) + ' · ' + (coach ? coach.name : '—'),
        act: live ? '<span class="badge ok live"><i class="dot"></i>شغّالة دلوقتي</span>'
          : done ? '<span class="badge">خلصت</span>' : '<span class="badge info">لسه</span>',
        body: '<div class="row-b mb"><span class="sm mut">الحجوزات</span>' +
          '<b class="num">' + bookings.length + ' / ' + c.capacity + '</b></div>' +
          '<div class="bar ' + (bookings.length >= c.capacity ? 'danger' : '') + '">' +
          '<i style="width:' + U.pct(bookings.length, c.capacity) + '%"></i></div>' +
          (bookings.length ? '<div class="mt" style="display:grid;gap:5px;max-height:190px;overflow-y:auto">' +
            bookings.map(function (bk) {
              var m = S.member(bk.memberId);
              if (!m) return '';
              return '<div class="row" style="gap:8px;flex-wrap:nowrap">' + W.ava(m, 'sm') +
                '<span class="sm" style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' +
                U.esc(m.name) + '</span>' +
                (S.isInGym(m.id) ? '<span class="badge ok">حاضر</span>' : '<span class="badge">لسه</span>') + '</div>';
            }).join('') + '</div>' : '<div class="xs fnt mt">مفيش حجوزات</div>'),
        foot: '<button class="btn btn-sm btn-ghost" data-book="' + c.id + '">' + U.ico('plus') + 'احجز لعضو</button>'
      });
    }).join('') + '</div>' : W.empty('مفيش حصص النهاردة', 'الجدول الأسبوعي فيه باقي الأيام.', 'calendar');
  }

  function hoursView(b) {
    var branches = b === 'all' ? S.branches() : [S.branch(b)];
    return '<div class="grid g-' + (branches.length > 1 ? '2' : '1') + '">' + branches.map(function (br) {
      return W.card({
        title: 'مواعيد ' + br.name, ico: 'clock',
        sub: 'فترات الرجالة والسيدات — دي اللي شاشة الدخول بتتحقق منها',
        body: U.DAYS.map(function (d, i) {
          var segs = (br.schedule || {})[String(i)] || [];
          return '<div style="margin-bottom:13px">' +
            '<div class="row-b" style="margin-bottom:5px"><b class="sm">' + d + '</b>' +
            '<span class="xs mut">' + (segs.length ? segs.map(function (s) {
              return (s.g === 'women' ? 'سيدات ' : 'رجالة ') + U.fMin(s.from) + '–' + U.fMin(s.to);
            }).join(' · ') : 'مقفول') + '</span></div>' +
            W.segbar(br.id, i, i === new Date().getDay()) + '</div>';
        }).join(''),
        foot: '<a href="#/branches" style="color:var(--lime-deep);font-weight:700">عدّل المواعيد من صفحة الفروع ←</a>'
      });
    }).join('') + '</div>';
  }

  function classForm(id) {
    var c = id ? S.get('classes', id) : null;
    var x = c || { day: new Date().getDay(), from: 1140, to: 1200, capacity: 15, gender: 'men', active: true };
    var coaches = S.where('staff', function (s) { return s.role === 'coach' && s.active !== false; });
    function toTime(m) { return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
    var mo = U.modal({
      title: c ? 'تعديل حصة' : 'حصة جديدة',
      body: '<div class="f" id="cf">' +
        '<div class="f-row">' +
        W.fld({ label: 'اسم الحصة', name: 'name', val: x.name, req: true, ph: 'كروس فيت، ملاكمة، زومبا...' }) +
        W.fld({ label: 'الكابتن', name: 'coachId', type: 'select', val: x.coachId,
          opts: coaches.map(function (s) { return [s.id, s.name]; }) }) +
        '</div>' +
        '<div class="f-row c3">' +
        W.fld({ label: 'اليوم', name: 'day', type: 'select', val: x.day,
          opts: U.DAYS.map(function (d, i) { return [i, d]; }) }) +
        W.fld({ label: 'من', name: 'fromT', type: 'time', val: toTime(x.from) }) +
        W.fld({ label: 'لحد', name: 'toT', type: 'time', val: toTime(x.to) }) +
        '</div>' +
        '<div class="f-row c3">' +
        W.fld({ label: 'السعة', name: 'capacity', type: 'number', val: x.capacity, min: 1 }) +
        W.fld({ label: 'الفئة', name: 'gender', type: 'select', val: x.gender,
          opts: [['men', 'رجالة'], ['women', 'سيدات'], ['all', 'الاتنين']] }) +
        W.fld({ label: 'المكان', name: 'room', val: x.room, ph: 'الصالة الكبيرة' }) +
        '</div>' +
        W.branchField(x.branchId) +
        W.check({ name: 'active', t: 'الحصة شغّالة', on: x.active !== false }) +
        '</div>',
      footer: (c ? '<button class="btn btn-danger btn-sm" id="cf-del">' + U.ico('trash') + '</button>' : '') +
        '<div class="grow"></div><button class="btn btn-ghost" data-close>إلغاء</button>' +
        '<button class="btn btn-lime" id="cf-ok">' + U.ico('save') + 'احفظ</button>'
    });
    U.$('#cf-ok', mo.el).addEventListener('click', function () {
      var d = W.form(U.$('#cf', mo.el));
      if (!d.name) { U.toast('اكتب اسم الحصة', 'err'); return; }
      d.from = (+d.fromT.split(':')[0]) * 60 + (+d.fromT.split(':')[1]);
      d.to = (+d.toT.split(':')[0]) * 60 + (+d.toT.split(':')[1]);
      delete d.fromT; delete d.toT;
      d.day = +d.day;
      if (c) S.upd('classes', c.id, d); else S.add('classes', d);
      U.toast('اتحفظت'); mo.close(); CZ.render();
    });
    if (c) U.$('#cf-del', mo.el).addEventListener('click', function () {
      U.confirm({ title: 'حذف الحصة؟', danger: true, body: 'الحجوزات المرتبطة بيها هتتشال.', ok: 'احذف' })
        .then(function (y) {
          if (!y) return;
          S.db().bookings = S.all('bookings').filter(function (bk) { return bk.classId !== c.id; });
          S.del('classes', c.id); mo.close(); CZ.render();
        });
    });
  }

  U.on('click', '[data-cls]', function (e, el) {
    var c = S.get('classes', el.getAttribute('data-cls'));
    var coach = S.get('staff', c.coachId);
    var next = U.addDays(U.today(), (c.day - new Date().getDay() + 7) % 7);
    var bookings = S.where('bookings', function (bk) { return bk.classId === c.id && bk.date === next; });
    U.modal({
      title: c.name, sub: U.DAYS[c.day] + ' ' + U.fMin(c.from) + ' — ' + U.fMin(c.to),
      body: '<dl class="kv mb">' +
        '<dt>الكابتن</dt><dd>' + U.esc(coach ? coach.name : '—') + '</dd>' +
        '<dt>المكان</dt><dd>' + U.esc(c.room || '—') + '</dd>' +
        '<dt>الفئة</dt><dd>' + (c.gender === 'women' ? 'سيدات' : c.gender === 'men' ? 'رجالة' : 'الاتنين') + '</dd>' +
        '<dt>الفرع</dt><dd>' + W.branchTag(c.branchId) + '</dd>' +
        '<dt>أقرب موعد</dt><dd>' + U.fDay(next) + '</dd>' +
        '<dt>الحجوزات</dt><dd>' + bookings.length + ' من ' + c.capacity + '</dd></dl>' +
        '<div class="bar ' + (bookings.length >= c.capacity ? 'danger' : '') + ' mb">' +
        '<i style="width:' + U.pct(bookings.length, c.capacity) + '%"></i></div>' +
        (bookings.length ? '<div style="display:grid;gap:6px;max-height:230px;overflow-y:auto">' +
          bookings.map(function (bk) {
            var m = S.member(bk.memberId);
            if (!m) return '';
            return '<div class="list-i">' + W.ava(m, 'sm') +
              '<div class="li-t"><b>' + U.esc(m.name) + '</b><span>' + U.fPhone(m.phone) + '</span></div>' +
              '<button class="btn btn-sm btn-danger btn-ico" data-unbook="' + bk.id + '">' + U.ico('x') + '</button></div>';
          }).join('') + '</div>' : '<div class="xs fnt">مفيش حجوزات للموعد الجاي</div>'),
      footer: '<button class="btn btn-ghost btn-sm" data-cedit="' + c.id + '">' + U.ico('edit') + 'تعديل</button>' +
        '<div class="grow"></div><button class="btn btn-ghost" data-close>إغلاق</button>' +
        '<button class="btn btn-lime" data-book="' + c.id + '">' + U.ico('plus') + 'احجز لعضو</button>'
    });
  });
  U.on('click', '[data-cedit]', function (e, el) { classForm(el.getAttribute('data-cedit')); });
  U.on('click', '[data-unbook]', function (e, el) {
    S.del('bookings', el.getAttribute('data-unbook'));
    U.toast('الحجز اتلغى'); CZ.render();
  });
  U.on('click', '[data-book]', function (e, el) {
    var c = S.get('classes', el.getAttribute('data-book'));
    var next = U.addDays(U.today(), (c.day - new Date().getDay() + 7) % 7);
    var mo = U.modal({
      title: 'حجز في ' + c.name, sub: U.fDay(next), width: 'sm',
      body: '<div class="f" id="bkf">' + W.memberPicker({ label: 'العضو' }) +
        W.fld({ label: 'التاريخ', name: 'date', type: 'date', val: next }) + '</div>',
      footer: '<div class="grow"></div><button class="btn btn-ghost" data-close>إلغاء</button>' +
        '<button class="btn btn-lime" id="bk-ok">احجز</button>'
    });
    U.$('#bk-ok', mo.el).addEventListener('click', function () {
      var d = W.form(U.$('#bkf', mo.el));
      if (!d.memberId) { U.toast('اختار العضو', 'err'); return; }
      var dup = S.find('bookings', function (bk) {
        return bk.classId === c.id && bk.memberId === d.memberId && bk.date === d.date;
      });
      if (dup) { U.toast('محجوز بالفعل', 'err'); return; }
      var cnt = S.where('bookings', function (bk) { return bk.classId === c.id && bk.date === d.date; }).length;
      if (cnt >= c.capacity) { U.toast('الحصة كاملة', 'err'); return; }
      S.add('bookings', { classId: c.id, memberId: d.memberId, date: d.date, status: 'booked', branchId: c.branchId });
      U.toast('اتحجز'); mo.close(); CZ.render();
    });
  });

  /* ================= المهام ================= */
  var TF = 'open';

  CZ.views.tasks = {
    title: 'المهام',
    sub: 'اللي محتاج يتعمل عشان ما يضيعش',
    perm: 'tasks',
    render: function () {
      var b = CZ.state.branch;
      var all = S.scope(S.all('tasks'), b);
      var open = all.filter(function (t) { return !t.done; });
      var late = open.filter(function (t) { return t.due && t.due < U.today(); });
      var list = TF === 'open' ? open : TF === 'done' ? all.filter(function (t) { return t.done; })
        : TF === 'late' ? late : all;
      list = list.sort(function (a, c) {
        if (a.done !== c.done) return a.done ? 1 : -1;
        return (a.due || '9999') < (c.due || '9999') ? -1 : 1;
      });

      return '<div class="row-b mb">' +
        W.chips([
          { v: 'open', t: 'مفتوحة', n: open.length },
          { v: 'late', t: 'متأخرة', n: late.length },
          { v: 'done', t: 'خلصت', n: all.length - open.length },
          { v: 'all', t: 'الكل', n: all.length }
        ], TF, 'data-ttab') +
        '<button class="btn btn-lime btn-sm" id="tk-new">' + U.ico('plus') + 'مهمة جديدة</button></div>' +

        W.card({
          flush: true,
          body: list.length ? list.map(function (t) {
            var late2 = !t.done && t.due && t.due < U.today();
            var st = t.assignee ? S.get('staff', t.assignee) : null;
            return '<div class="list-i">' +
              '<label class="check"><input type="checkbox" data-tdone="' + t.id + '"' + (t.done ? ' checked' : '') + '></label>' +
              '<div class="li-t"><b style="' + (t.done ? 'text-decoration:line-through;opacity:.55' : '') + '">' +
              U.esc(t.title) + '</b><span>' +
              (t.due ? U.fDate(t.due) : 'من غير ميعاد') +
              (t.branchId ? ' · ' + S.branchShort(t.branchId) : ' · كل الفروع') +
              (st ? ' · ' + st.name : '') + '</span></div>' +
              (t.priority === 'high' ? '<span class="badge danger">مهمة</span>' : '') +
              (late2 ? '<span class="badge warn">متأخرة</span>' : '') +
              '<button class="btn btn-sm btn-soft btn-ico" data-tedit="' + t.id + '">' + U.ico('edit') + '</button>' +
              '<button class="btn btn-sm btn-danger btn-ico" data-tdel="' + t.id + '">' + U.ico('trash') + '</button>' +
              '</div>';
          }).join('') : W.empty('مفيش مهام', 'اكتب اللي محتاج يتعمل — طلبية، صيانة، مكالمة.', 'check')
        });
    },
    after: function () {
      var e = U.$('#tk-new');
      if (e) e.addEventListener('click', function () { CZ.taskModal(); });
    }
  };

  U.on('click', '[data-ttab]', function (e, el) {
    if (!U.$('#tk-new')) return;
    TF = el.getAttribute('data-ttab'); CZ.render();
  });
  U.on('change', '[data-tdone]', function (e, el) {
    var id = el.getAttribute('data-tdone');
    S.upd('tasks', id, { done: el.checked, doneAt: el.checked ? U.isoT() : null });
    setTimeout(CZ.render, 200);
  });
  U.on('click', '[data-tdel]', function (e, el) {
    S.del('tasks', el.getAttribute('data-tdel')); CZ.render();
  });
  U.on('click', '[data-tedit]', function (e, el) { CZ.taskModal(el.getAttribute('data-tedit')); });

  CZ.taskModal = function (id) {
    var t = id ? S.get('tasks', id) : null;
    var x = t || { due: U.addDays(U.today(), 1), priority: 'normal' };
    var mo = U.modal({
      title: t ? 'تعديل مهمة' : 'مهمة جديدة', width: 'sm',
      body: '<div class="f" id="tkf">' +
        W.fld({ label: 'المهمة', name: 'title', val: x.title, req: true, ph: 'اتصل بـ...، اطلب...، صلّح...' }) +
        '<div class="f-row">' +
        W.fld({ label: 'الميعاد', name: 'due', type: 'date', val: x.due }) +
        W.fld({ label: 'الأهمية', name: 'priority', type: 'select', val: x.priority,
          opts: [['normal', 'عادية'], ['high', 'مهمة']] }) +
        '</div>' +
        '<div class="f-row">' +
        W.fld({ label: 'الفرع', name: 'branchId', type: 'select', val: x.branchId,
          opts: [['', 'كل الفروع']].concat(S.branches().map(function (b) { return [b.id, b.name]; })) }) +
        W.fld({ label: 'مسؤول عنها', name: 'assignee', type: 'select', val: x.assignee,
          opts: [['', 'مفيش']].concat(S.all('staff').filter(function (s) { return s.active !== false; })
            .map(function (s) { return [s.id, s.name]; })) }) +
        '</div></div>',
      footer: '<div class="grow"></div><button class="btn btn-ghost" data-close>إلغاء</button>' +
        '<button class="btn btn-lime" id="tkf-ok">' + U.ico('save') + 'احفظ</button>'
    });
    U.$('#tkf-ok', mo.el).addEventListener('click', function () {
      var d = W.form(U.$('#tkf', mo.el));
      if (!d.title) { U.toast('اكتب المهمة', 'err'); return; }
      d.branchId = d.branchId || null;
      if (t) S.upd('tasks', t.id, d); else { d.done = false; S.add('tasks', d); }
      U.toast('اتحفظت'); mo.close(); CZ.render();
    });
  };
})();
