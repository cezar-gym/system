/* ============================================================
   سيزر جيم — لوحة القيادة
   القاعدة اللي اتبنت عليها: الشاشة دي مش للعرض، دي للقرار.
   كل رقم فيها ورا كل تنبيه فيها زرار بيوديك تعمل حاجة.
   ============================================================ */
(function () {
  'use strict';
  var CZ = window.CZ, U = CZ.u, S = CZ.s, W = CZ.w;
  CZ.views = CZ.views || {};
  CZ.state = CZ.state || { user: null, branch: 'all', params: {} };

  CZ.views[''] = {
    title: 'لوحة القيادة',
    sub: function () {
      return (CZ.state.branch === 'all' ? 'كل الفروع' : S.branchName(CZ.state.branch)) + ' · ' + U.fDay(U.today());
    },
    perm: 'dash',
    render: function () {
      var b = CZ.state.branch;
      var st = S.stats(b);
      var alerts = S.alerts(b);
      var money30 = S.moneySeries(30, b);
      var visits30 = S.visitSeries(30, b);
      var inGym = S.inGym(b).sort(U.by('inAt', 'desc'));
      var cap = b === 'all' ? U.sum(S.branches(), 'capacity') : (S.branch(b) || {}).capacity || 50;
      var growth = st.lastMonthIn ? Math.round((st.monthIn - st.lastMonthIn) / st.lastMonthIn * 100) : 0;
      var hour = new Date().getHours();
      var hi = hour < 12 ? 'صباح الخير' : hour < 17 ? 'مساء الخير' : 'مساء الخير';

      return '' +
        /* الترحيب + الأزرار السريعة */
        '<div class="row-b mb">' +
        '<div><h2 style="font-size:22px">' + hi + ' يا ' + U.esc(CZ.state.user.name.split(' ')[0]) + '</h2>' +
        '<p class="mut sm">' + summaryLine(st, inGym.length) + '</p></div>' +
        '<div class="row">' +
        '<button class="btn btn-ghost btn-sm" id="d-guest">' + U.ico('plus') + 'زيارة</button>' +
        '<button class="btn btn-ghost btn-sm" id="d-newmem">' + U.ico('users') + 'عضو جديد</button>' +
        '<button class="btn btn-ink btn-sm" id="d-money">' + U.ico('wallet') + 'حركة خزنة</button>' +
        '</div></div>' +

        /* التنبيهات */
        (alerts.length ? '<div class="grid g-3 mb">' + alerts.slice(0, 6).map(function (a) {
          return '<button class="stat" data-go="' + a.go + '" style="text-align:start;cursor:pointer;border-inline-start:3px solid var(--' +
            (a.cls === 'lime' ? 'lime-deep' : a.cls) + ')">' +
            '<div class="stat-top"><span class="stat-ico ' + a.cls + '">' + U.ico(a.ico) + '</span>' +
            '<span class="stat-t" style="color:var(--ink);font-weight:800">' + U.esc(a.t) + '</span></div>' +
            '<div class="sm mut" style="line-height:1.5">' + U.esc(a.s) + '</div></button>';
        }).join('') + '</div>'
          : W.alert('ok', 'كل حاجة تمام', 'مفيش تنبيهات مستحقة دلوقتي.') + '<div class="mb"></div>') +

        /* الأرقام */
        '<div class="grid g-4">' +
        W.stat({
          t: 'في الجيم دلوقتي', v: U.n(inGym.length), ico: 'fire', tone: 'lime', dark: true,
          d: U.pct(inGym.length, cap) + '% من السعة (' + cap + ')', go: '#/checkin'
        }) +
        W.stat({
          t: 'أعضاء نشطين', v: U.n(st.active), ico: 'users', tone: 'ok',
          d: U.n(st.members) + ' إجمالي · ' + U.n(st.women) + ' سيدات', go: '#/members?f=active',
          spark: visits30.map(function (x) { return x.v; })
        }) +
        W.stat({
          t: 'تحصيل الشهر', v: U.n(st.monthIn), cur: CZ.CUR, ico: 'wallet', tone: 'gold',
          d: growth === 0 ? 'زي الشهر اللي فات' : Math.abs(growth) + '% عن الشهر اللي فات',
          dir: growth > 0 ? 'up' : growth < 0 ? 'down' : '', go: '#/finance',
          spark: money30.map(function (x) { return x.v; })
        }) +
        W.stat({
          t: 'صافي الشهر', v: U.n(st.monthIn - st.monthOut), cur: CZ.CUR, ico: 'trend',
          tone: st.monthIn - st.monthOut >= 0 ? 'ok' : 'danger',
          d: 'مصروفات ' + U.n(st.monthOut) + ' ' + CZ.CUR, go: '#/reports'
        }) +
        '</div>' +

        '<div class="grid g-4 mt">' +
        W.stat({ t: 'حضور النهاردة', v: U.n(st.todayVisits), ico: 'scan', tone: 'info', go: '#/checkin' }) +
        W.stat({ t: 'تحصيل النهاردة', v: U.n(st.todayIn), cur: CZ.CUR, ico: 'receipt', tone: 'ok', go: '#/finance' }) +
        W.stat({ t: 'أعضاء جدد الشهر ده', v: U.n(st.newThisMonth), ico: 'sparkle', tone: 'lime',
          d: st.newLastMonth ? 'الشهر اللي فات ' + st.newLastMonth : '', go: '#/members?f=new' }) +
        W.stat({ t: 'متأخرات', v: U.n(st.debt), cur: CZ.CUR, ico: 'alert', tone: st.debt ? 'danger' : '',
          d: 'فلوس متفق عليها ومش متحصّلة', go: '#/members?f=debt' }) +
        '</div>' +

        /* الرسوم */
        '<div class="grid g-2-1 mt">' +
        W.card({
          title: 'الإيراد والمصروف — آخر 30 يوم', ico: 'chart',
          act: '<span class="badge lime">صافي ' + U.n(U.sum(money30, 'v') - U.sum(money30, 'e')) + ' ' + CZ.CUR + '</span>',
          body: CZ.c.line([
            { name: 'إيراد', data: money30.map(function (x) { return x.v; }), color: '#6F9410' },
            { name: 'مصروف', data: money30.map(function (x) { return x.e; }), color: '#C0492B', area: false, dash: true }
          ], { h: 230, labels: money30.map(function (x) { return U.fDate(x.d, 'short'); }) })
        }) +
        W.card({
          title: 'اللي جوّه دلوقتي', ico: 'fire', tone: 'lime', flush: true,
          sub: inGym.length + ' عضو',
          body: inGym.length ? '<div style="max-height:286px;overflow-y:auto">' + inGym.slice(0, 12).map(function (a) {
            var mem = a.memberId ? S.member(a.memberId) : null;
            var mins = Math.round((new Date() - U.parse(a.inAt)) / 60000);
            return '<div class="list-i' + (mem ? ' clickable' : '') + '"' + (mem ? ' data-mem="' + mem.id + '"' : '') + '>' +
              (mem ? W.ava(mem, 'sm') : '<span class="ava sm">' + U.ico('user') + '</span>') +
              '<div class="li-t"><b>' + U.esc(mem ? mem.name : (a.guestName || 'زائر')) + '</b>' +
              '<span>دخل ' + U.fTime(a.inAt) + '</span></div>' +
              '<span class="dur">' + U.dur(mins) + '</span></div>';
          }).join('') + '</div>' : W.empty('الجيم فاضي', '', 'door'),
          foot: '<a href="#/checkin" style="color:var(--lime-deep);font-weight:700">افتح شاشة الحضور ←</a>'
        }) +
        '</div>' +

        /* مقارنة الفروع */
        (S.branches().length > 1 && CZ.state.branch === 'all' ? W.sectH('الفرعين جنب بعض',
          '<a class="btn btn-sm btn-ghost" href="#/reports">' + U.ico('chart') + 'تقرير مفصّل</a>') +
          '<div class="grid g-2">' + S.branches().map(function (br) {
            var bs = S.stats(br.id);
            var bIn = S.inGym(br.id).length;
            return W.card({
              cls: 'card',
              title: br.name, ico: 'branch',
              act: '<span class="badge" style="background:' + br.color + '18;color:' + br.color + '">' +
                U.n(bs.active) + ' نشط</span>',
              body: '<div class="grid g-3" style="gap:10px">' +
                mini('جوّه دلوقتي', U.n(bIn)) +
                mini('حضور النهاردة', U.n(bs.todayVisits)) +
                mini('جدد الشهر', U.n(bs.newThisMonth)) +
                mini('تحصيل الشهر', U.n(bs.monthIn) + ' ' + CZ.CUR) +
                mini('مصروف الشهر', U.n(bs.monthOut) + ' ' + CZ.CUR) +
                mini('صافي الشهر', U.n(bs.monthIn - bs.monthOut) + ' ' + CZ.CUR,
                  bs.monthIn - bs.monthOut >= 0 ? 'pos' : 'neg') +
                '</div>' +
                (br.needsSetup ? '<div class="mt">' + W.alert('warn', 'الفرع ده لسه محتاج ظبط',
                  'العنوان والتليفون والمواعيد لسه فاضية.',
                  '<a class="btn btn-sm btn-ghost" href="#/branches">ظبّط</a>') + '</div>' : '') +
                '<div class="hr" style="margin:12px 0"></div>' +
                '<div class="xs mut b mb">فترات النهاردة</div>' + W.segbar(br.id, new Date().getDay(), true),
              foot: U.esc(br.address || 'العنوان لسه مش مكتوب')
            });
          }).join('') + '</div>' : '') +

        /* قوايم العمل */
        W.sectH('محتاج تصرّف') +
        '<div class="grid g-3">' +
        listCard('اشتراكات بتخلص قريب', 'clock', 'warn',
          S.scope(S.all('members'), b).filter(function (m) { return S.status(m).k === 'expiring'; })
            .sort(function (x, y) {
              return U.diffDays(S.activeSub(x.id).endAt) - U.diffDays(S.activeSub(y.id).endAt);
            }).slice(0, 8),
          function (m) {
            var s = S.activeSub(m.id);
            return { e: U.diffDays(s.endAt) + ' يوم', es: U.fDate(s.endAt, 'short') };
          }, '#/members?f=expiring', 'tp_expire') +

        listCard('غايبين وأسبوعهم عدّى', 'user', 'warn',
          S.scope(S.all('members'), b).filter(function (m) {
            var k = S.status(m).k;
            if (k !== 'active' && k !== 'expiring') return false;
            var lv = S.lastVisit(m.id);
            return !lv || U.diffDays(lv.inAt) < -(S.db().settings.absentWarnDays || 10);
          }).slice(0, 8),
          function (m) {
            var lv = S.lastVisit(m.id);
            return { e: lv ? Math.abs(U.diffDays(lv.inAt)) + ' يوم' : '—', es: 'من غير تمرين' };
          }, '#/members?f=absent', 'tp_absent') +

        listCard('عليهم متأخرات', 'wallet', 'danger',
          S.scope(S.all('members'), b).filter(function (m) { return S.debt(m.id) > 0; })
            .sort(function (x, y) { return S.debt(y.id) - S.debt(x.id); }).slice(0, 8),
          function (m) { return { e: U.n(S.debt(m.id)) + ' ' + CZ.CUR, es: 'متبقي' }; },
          '#/members?f=debt', 'tp_debt') +
        '</div>' +

        /* المهام + آخر الحركات */
        '<div class="grid g-2 mt">' +
        (function () {
          var tasks = S.scope(S.all('tasks'), b).filter(function (t) { return !t.done; })
            .sort(U.by('due')).slice(0, 7);
          return W.card({
            title: 'مهام مفتوحة', ico: 'check', flush: true,
            act: '<button class="btn btn-sm btn-ghost" id="d-task">' + U.ico('plus') + 'مهمة</button>',
            body: tasks.length ? tasks.map(function (t) {
              var late = t.due && t.due < U.today();
              return '<div class="list-i"><label class="check" style="flex:1"><input type="checkbox" data-task="' + t.id + '">' +
                '<span class="ct">' + U.esc(t.title) +
                '<small>' + (t.due ? (late ? 'متأخرة — ' : '') + U.fDate(t.due) : 'من غير ميعاد') +
                (t.branchId ? ' · ' + S.branchShort(t.branchId) : '') + '</small></span></label>' +
                (late ? '<span class="badge danger">متأخرة</span>' : '') + '</div>';
            }).join('') : W.empty('مفيش مهام مفتوحة', 'اكتب اللي محتاج يتعمل عشان ما يضيعش.', 'check'),
            foot: '<a href="#/tasks" style="color:var(--lime-deep);font-weight:700">كل المهام ←</a>'
          });
        })() +
        (function () {
          var logs = S.all('log').slice(0, 9);
          return W.card({
            title: 'آخر الحركات في النظام', ico: 'history', flush: true,
            body: logs.length ? logs.map(function (l) {
              return '<div class="list-i"><span class="ava sm">' + U.esc(U.initials(l.userName || 'ن')) + '</span>' +
                '<div class="li-t"><b>' + U.esc(l.action) + (l.detail ? ' — ' + U.esc(l.detail) : '') + '</b>' +
                '<span>' + U.esc(l.userName || '') + '</span></div>' +
                '<span class="xs fnt nowrap">' + U.fTime(l.at) + '</span></div>';
            }).join('') : W.empty('مفيش حركات', '', 'history'),
            foot: 'كل حركة في النظام بتتسجّل باسم اللي عملها.'
          });
        })() +
        '</div>';
    },
    after: function () {
      var q;
      if ((q = U.$('#d-newmem'))) q.addEventListener('click', function () { CZ.memberForm(); });
      if ((q = U.$('#d-guest'))) q.addEventListener('click', function () { CZ.guestModal(); });
      if ((q = U.$('#d-money'))) q.addEventListener('click', function () { CZ.moneyModal(); });
      if ((q = U.$('#d-task'))) q.addEventListener('click', function () { CZ.taskModal(); });
    }
  };

  function mini(t, v, cls) {
    return '<div><div class="xs mut">' + U.esc(t) + '</div>' +
      '<b class="num ' + (cls || '') + '" style="font-size:17px">' + v + '</b></div>';
  }

  function summaryLine(st, inGym) {
    var bits = [];
    bits.push(U.n(st.todayVisits) + ' حضور النهاردة');
    if (inGym) bits.push(U.n(inGym) + ' جوّه دلوقتي');
    bits.push('تحصيل ' + U.n(st.todayIn) + ' ' + CZ.CUR);
    return bits.join(' · ');
  }

  function listCard(title, ico, tone, list, meta, go, tpl) {
    return W.card({
      title: title, ico: ico, tone: tone, flush: true,
      act: '<span class="badge ' + tone + '">' + U.n(list.length) + '</span>',
      body: list.length ? list.map(function (m) {
        var mt = meta(m);
        return '<div class="list-i clickable" data-mem="' + m.id + '">' + W.ava(m, 'sm') +
          '<div class="li-t"><b>' + U.esc(m.name) + '</b><span>' + U.fPhone(m.phone) + '</span></div>' +
          '<div class="li-e"><b>' + U.esc(mt.e) + '</b><span>' + U.esc(mt.es) + '</span></div>' +
          '<a class="btn btn-sm btn-ok btn-ico" href="' + U.wa(m.phone, W.fillTpl((S.get('templates', tpl) || {}).body || '', m)) +
          '" target="_blank" rel="noopener" onclick="event.stopPropagation()" title="واتساب">' + U.ico('msg') + '</a></div>';
      }).join('') : W.empty('مفيش حد هنا', 'تمام كده.', 'check'),
      foot: list.length ? '<a href="' + go + '" style="color:var(--lime-deep);font-weight:700">شوف الكل ←</a>' : ''
    });
  }

  U.on('change', '[data-task]', function (e, el) {
    S.upd('tasks', el.getAttribute('data-task'), { done: true, doneAt: U.isoT() });
    U.toast('اتعملت');
    setTimeout(CZ.render, 260);
  });
})();
