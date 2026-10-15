/* ============================================================
   سيزر جيم — الخزنة والمالية
   ------------------------------------------------------------
   الفكرة: كل جنيه داخل أو خارج بيتسجّل هنا بفرعه وبتاريخه
   وباسم اللي عمله. وفي آخر اليوم فيه «تقفيل» بيقارن الورق
   بالكاش اللي في الدرج فعلاً.
   ============================================================ */
(function () {
  'use strict';
  var CZ = window.CZ, U = CZ.u, S = CZ.s, W = CZ.w;
  CZ.views = CZ.views || {};
  CZ.state = CZ.state || { user: null, branch: 'all', params: {} };

  var F = { tab: 'today', from: '', to: '', cat: 'all', method: 'all', q: '' };

  function range() {
    var to = F.to || U.today();
    var from = F.from || U.addDays(to, -29);
    return { from: from, to: to };
  }

  CZ.views.finance = {
    title: 'الخزنة والمالية',
    sub: function () { return CZ.state.branch === 'all' ? 'كل الفروع' : S.branchName(CZ.state.branch); },
    perm: 'finance',
    render: function (p) {
      if (p.tab) { F.tab = p.tab; delete p.tab; }
      var b = CZ.state.branch;
      var r = range();
      var today = U.today();
      var inc = S.income(r.from, r.to, b), exp = S.expense(r.from, r.to, b);
      var tIn = U.sum(inc, 'amount'), tOut = U.sum(exp, 'amount');
      var todayIn = U.sum(S.income(today, today, b), 'amount');
      var todayOut = U.sum(S.expense(today, today, b), 'amount');
      var cashToday = U.sum(S.income(today, today, b).filter(function (x) { return x.method === 'cash'; }), 'amount') -
        U.sum(S.expense(today, today, b).filter(function (x) { return x.method === 'cash'; }), 'amount');

      var head = '<div class="grid g-4 mb">' +
        W.stat({ t: 'إيراد الفترة', v: U.n(tIn), cur: CZ.CUR, ico: 'wallet', tone: 'ok' }) +
        W.stat({ t: 'مصروف الفترة', v: U.n(tOut), cur: CZ.CUR, ico: 'down', tone: 'danger' }) +
        W.stat({ t: 'الصافي', v: U.n(tIn - tOut), cur: CZ.CUR, ico: 'trend', tone: tIn - tOut >= 0 ? 'lime' : 'danger', dark: true }) +
        W.stat({ t: 'كاش النهاردة في الدرج', v: U.n(cashToday), cur: CZ.CUR, ico: 'receipt', tone: 'gold',
          d: 'إيراد ' + U.n(todayIn) + ' · مصروف ' + U.n(todayOut) }) +
        '</div>';

      var tabs = '<div class="tabs mb">' + [
        ['today', 'اليوم'], ['moves', 'كل الحركات'], ['exp', 'المصروفات'],
        ['debt', 'المتأخرات'], ['close', 'تقفيل اليوم'], ['analysis', 'تحليل']
      ].map(function (t) {
        return '<button data-ftab="' + t[0] + '"' + (F.tab === t[0] ? ' class="on"' : '') + '>' + t[1] + '</button>';
      }).join('') + '</div>';

      var bar = '<div class="row-b mb"><div class="row">' +
        '<div class="fld" style="flex-direction:row;align-items:center;gap:7px">' +
        '<label class="xs mut nowrap">من</label><input type="date" class="inp" data-from value="' + r.from + '" style="width:150px;height:36px"></div>' +
        '<div class="fld" style="flex-direction:row;align-items:center;gap:7px">' +
        '<label class="xs mut nowrap">لحد</label><input type="date" class="inp" data-to value="' + r.to + '" style="width:150px;height:36px"></div>' +
        '<div class="seg">' +
        [['today', 'النهاردة'], ['week', 'الأسبوع'], ['month', 'الشهر'], ['q', '3 شهور'], ['year', 'السنة']]
          .map(function (x) { return '<button data-range="' + x[0] + '">' + x[1] + '</button>'; }).join('') +
        '</div></div>' +
        '<div class="row">' +
        '<button class="btn btn-ghost btn-sm" id="fn-export">' + U.ico('export') + 'تصدير</button>' +
        '<button class="btn btn-ghost btn-sm" id="fn-print">' + U.ico('print') + 'تقرير</button>' +
        '<button class="btn btn-lime btn-sm" id="fn-add">' + U.ico('plus') + 'حركة</button>' +
        '</div></div>';

      return bar + head + tabs + VIEWS[F.tab](r, b, inc, exp);
    },
    after: function () {
      var e;
      if ((e = U.$('[data-from]'))) e.addEventListener('change', function (ev) { F.from = ev.target.value; CZ.render(); });
      if ((e = U.$('[data-to]'))) e.addEventListener('change', function (ev) { F.to = ev.target.value; CZ.render(); });
      if ((e = U.$('#fn-add'))) e.addEventListener('click', function () { CZ.moneyModal(); });
      if ((e = U.$('#fn-export'))) e.addEventListener('click', exportMoves);
      if ((e = U.$('#fn-print'))) e.addEventListener('click', printReport);
      U.$$('[data-range]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var k = btn.getAttribute('data-range'), t = U.today();
          if (k === 'today') { F.from = t; F.to = t; }
          if (k === 'week') { F.from = U.addDays(t, -6); F.to = t; }
          if (k === 'month') { F.from = t.slice(0, 8) + '01'; F.to = t; }
          if (k === 'q') { F.from = U.addMonths(t, -3); F.to = t; }
          if (k === 'year') { F.from = t.slice(0, 5) + '01-01'; F.to = t; }
          CZ.render();
        });
      });
      var q = U.$('[data-q]');
      if (q) q.addEventListener('input', U.debounce(function (ev) { F.q = ev.target.value; CZ.render(); U.$('[data-q]').focus(); }, 250));
      var c = U.$('[data-cat]'); if (c) c.addEventListener('change', function (ev) { F.cat = ev.target.value; CZ.render(); });
      var mth = U.$('[data-method]'); if (mth) mth.addEventListener('change', function (ev) { F.method = ev.target.value; CZ.render(); });
    }
  };

  U.on('click', '[data-ftab]', function (e, el) {
    if (!U.$('#fn-add')) return;
    F.tab = el.getAttribute('data-ftab'); CZ.render();
  });

  /* ---------- التبويبات ---------- */
  var VIEWS = {
    today: function (r, b) {
      var t = U.today();
      var inc = S.income(t, t, b).sort(U.by('at', 'desc'));
      var exp = S.expense(t, t, b).sort(U.by('at', 'desc'));
      var byMethod = {};
      inc.forEach(function (x) { byMethod[x.method] = (byMethod[x.method] || 0) + x.amount; });
      return '<div class="grid g-2">' +
        W.card({
          title: 'إيرادات النهاردة', ico: 'up', tone: 'ok', flush: true,
          act: '<b class="money pos">' + U.n(U.sum(inc, 'amount')) + '</b>',
          body: inc.length ? moveTable(inc) : W.empty('لسه مفيش تحصيل النهاردة', '', 'wallet')
        }) +
        W.card({
          title: 'مصروفات النهاردة', ico: 'down', tone: 'danger', flush: true,
          act: '<b class="money neg">' + U.n(U.sum(exp, 'amount')) + '</b>',
          body: exp.length ? moveTable(exp) : W.empty('مفيش مصروفات النهاردة', '', 'wallet')
        }) +
        '</div>' +
        '<div class="grid g-2 mt">' +
        W.card({
          title: 'التحصيل حسب طريقة الدفع', ico: 'card',
          body: Object.keys(byMethod).length ? CZ.c.donut(Object.keys(byMethod).map(function (k, i) {
            return {
              t: S.METHODS[k] || k, v: byMethod[k],
              color: ['#6F9410', '#C0492B', '#3A6EA5', '#E8B14C', '#6B5AA8'][i % 5]
            };
          }), { center: U.n(U.sum(inc, 'amount')), centerSub: 'إجمالي' })
            : W.empty('لسه مفيش', '', 'card')
        }) +
        W.card({
          title: 'التحصيل حسب البند', ico: 'tag',
          body: (function () {
            var byCat = {};
            inc.forEach(function (x) { byCat[x.cat] = (byCat[x.cat] || 0) + x.amount; });
            var arr = Object.keys(byCat).map(function (k) { return { t: S.CATS_IN[k] || k, v: byCat[k] }; })
              .sort(U.by('v', 'desc'));
            return arr.length ? CZ.c.rank(arr, { money: true }) : W.empty('لسه مفيش', '', 'tag');
          })()
        }) +
        '</div>';
    },

    moves: function (r, b, inc, exp) {
      var all = inc.concat(exp).sort(U.by('at', 'desc'));
      if (F.cat !== 'all') all = all.filter(function (x) { return x.cat === F.cat; });
      if (F.method !== 'all') all = all.filter(function (x) { return x.method === F.method; });
      if (F.q) all = all.filter(function (x) {
        return U.match(x.note, F.q) || (x.memberId && U.match(S.memberName(x.memberId), F.q));
      });
      return W.toolbar({
        ph: 'دوّر في الملاحظات أو الأعضاء', q: F.q,
        filters: '<select class="inp" data-cat style="width:auto;height:38px;border-radius:100px">' +
          '<option value="all">كل البنود</option>' +
          Object.keys(S.CATS_IN).map(function (k) {
            return '<option value="' + k + '"' + (F.cat === k ? ' selected' : '') + '>' + S.CATS_IN[k] + '</option>';
          }).join('') +
          Object.keys(S.CATS_OUT).map(function (k) {
            return '<option value="' + k + '"' + (F.cat === k ? ' selected' : '') + '>' + S.CATS_OUT[k] + ' (مصروف)</option>';
          }).join('') + '</select>' +
          '<select class="inp" data-method style="width:auto;height:38px;border-radius:100px">' +
          '<option value="all">كل الطرق</option>' +
          Object.keys(S.METHODS).map(function (k) {
            return '<option value="' + k + '"' + (F.method === k ? ' selected' : '') + '>' + S.METHODS[k] + '</option>';
          }).join('') + '</select>',
        act: ''
      }) + W.card({ flush: true, body: moveTable(all, true) });
    },

    exp: function (r, b, inc, exp) {
      var byCat = {};
      exp.forEach(function (x) { byCat[x.cat] = (byCat[x.cat] || 0) + x.amount; });
      var arr = Object.keys(byCat).map(function (k) { return { t: S.CATS_OUT[k] || k, v: byCat[k], k: k }; })
        .sort(U.by('v', 'desc'));
      var tot = U.sum(arr, 'v');
      return '<div class="grid g-1-2">' +
        W.card({
          title: 'المصروفات حسب البند', ico: 'chart',
          body: arr.length ? CZ.c.donut(arr.map(function (a, i) {
            return { t: a.t, v: a.v, color: ['#C0492B', '#E8B14C', '#3A6EA5', '#6B5AA8', '#6F9410', '#9A9B91', '#7A5407', '#255E3A'][i % 8] };
          }), { center: U.n(tot), centerSub: CZ.CUR }) : W.empty('مفيش مصروفات', '', 'wallet')
        }) +
        W.card({
          flush: true, title: 'كل المصروفات في الفترة',
          act: '<button class="btn btn-sm btn-ghost" id="fn-add2">' + U.ico('plus') + 'مصروف</button>',
          body: moveTable(exp.sort(U.by('at', 'desc')), true)
        }) +
        '</div>' +
        '<div class="mt">' + W.alert('info', 'ملاحظة مهمة',
          'المرتبات والإيجار والكهربا بتتسجّل مرة كل شهر. لو دخّلتها كل مرة تدفعها هتلاقي صافي الشهر واقعي.') + '</div>';
    },

    debt: function (r, b) {
      var members = S.scope(S.all('members'), b).filter(function (m) { return S.debt(m.id) > 0; })
        .sort(function (x, y) { return S.debt(y.id) - S.debt(x.id); });
      var tot = U.sum(members, function (m) { return S.debt(m.id); });
      return (tot > 0 ? W.alert('danger', 'إجمالي المتأخرات ' + U.m(tot),
        'على ' + members.length + ' عضو. دي فلوس شغلك اللي اتعمل واتفق عليه — أسهل جنيه تجيبه هو ده.') + '<div class="mb"></div>' : '') +
        W.card({
          flush: true,
          title: 'الأعضاء اللي عليهم متأخرات',
          act: members.length ? '<button class="btn btn-sm btn-ghost" id="fn-debtwa">' + U.ico('msg') + 'رسايل للكل</button>' : '',
          body: W.table([
            { k: 'name', t: 'العضو', sort: false, render: function (m) { return W.who(m, U.fPhone(m.phone)); } },
            { t: 'الحالة', sort: false, render: function (m) { return W.statusBadge(m); } },
            { t: 'الفرع', sort: false, render: function (m) { return W.branchTag(m.branchId); } },
            { t: 'آخر زيارة', sort: false, render: function (m) {
              var v = S.lastVisit(m.id);
              return v ? U.ago(v.inAt) : '<span class="fnt">عمره ما جه</span>';
            }},
            { t: 'المتأخر', sort: false, cls: 'num end', render: function (m) {
              return '<span class="money neg" style="font-size:15px">' + U.n(S.debt(m.id)) + '</span>';
            }},
            { t: '', sort: false, cls: 'end', render: function (m) {
              return '<div class="row" style="gap:5px;justify-content:flex-end">' +
                '<a class="btn btn-sm btn-ok btn-ico" href="' + U.wa(m.phone,
                  W.fillTpl((S.get('templates', 'tp_debt') || {}).body || '', m)) + '" target="_blank" rel="noopener">' + U.ico('msg') + '</a>' +
                '<button class="btn btn-sm btn-lime" data-pay="' + m.id + '">حصّل</button></div>';
            }}
          ], members, { emptyT: 'مفيش متأخرات', emptyS: 'كل الفلوس متحصّلة. تمام.', emptyIco: 'check' }),
          foot: members.length ? 'الإجمالي: ' + U.m(tot) : ''
        });
    },

    close: function (r, b) {
      var t = U.today();
      var bid = b === 'all' ? null : b;
      var branches = bid ? [S.branch(bid)] : S.branches();
      return '<div class="grid g-2">' + branches.map(function (br) {
        var inc = S.income(t, t, br.id), exp = S.expense(t, t, br.id);
        var cash = U.sum(inc.filter(function (x) { return x.method === 'cash'; }), 'amount') -
          U.sum(exp.filter(function (x) { return x.method === 'cash'; }), 'amount');
        var digital = U.sum(inc.filter(function (x) { return x.method !== 'cash'; }), 'amount');
        return W.card({
          title: 'تقفيل ' + br.name, ico: 'lock',
          sub: U.fDay(t),
          body: '<dl class="kv">' +
            '<dt>إيراد كاش</dt><dd class="money pos">' + U.n(U.sum(inc.filter(function (x) { return x.method === 'cash'; }), 'amount')) + '</dd>' +
            '<dt>مصروف كاش</dt><dd class="money neg">' + U.n(U.sum(exp.filter(function (x) { return x.method === 'cash'; }), 'amount')) + '</dd>' +
            '<dt>المفروض في الدرج</dt><dd class="money" style="font-size:18px">' + U.n(cash) + ' ' + CZ.CUR + '</dd>' +
            '<dt>تحويلات ومحافظ</dt><dd class="money">' + U.n(digital) + '</dd>' +
            '<dt>عدد العمليات</dt><dd class="num">' + (inc.length + exp.length) + '</dd>' +
            '</dl>' +
            '<div class="hr"></div>' +
            '<div class="f-row">' +
            W.fld({ label: 'العدّ الفعلي في الدرج', name: 'actual_' + br.id, type: 'number', suffix: CZ.CUR, ph: 'اعدّ الفلوس واكتبها' }) +
            W.fld({ label: 'الفرق', name: 'diff_' + br.id, dis: true, val: '—' }) +
            '</div>' +
            '<button class="btn btn-ink btn-blk mt" data-close-day="' + br.id + '">' + U.ico('lock') + 'اقفل اليوم واطبع</button>',
          foot: 'التقفيل بيطبع ورقة فيها كل حركات اليوم — وقّعها وحطها في الملف.'
        });
      }).join('') + '</div>' +
        '<div class="mt">' + W.card({
          title: 'آخر 14 يوم — الإيراد اليومي', ico: 'chart',
          body: CZ.c.bars(S.moneySeries(14, b).map(function (x) {
            return { t: U.fDate(x.d, 'short'), v: x.v };
          }), { h: 200, unit: ' ' + CZ.CUR })
        }) + '</div>';
    },

    analysis: function (r, b, inc, exp) {
      var byCat = {}; inc.forEach(function (x) { byCat[x.cat] = (byCat[x.cat] || 0) + x.amount; });
      var byBranch = {}; inc.forEach(function (x) { byBranch[x.branchId] = (byBranch[x.branchId] || 0) + x.amount; });
      var byMonth = {};
      inc.forEach(function (x) {
        var k = x.at.slice(0, 7);
        byMonth[k] = byMonth[k] || { in: 0, out: 0 };
        byMonth[k].in += x.amount;
      });
      exp.forEach(function (x) {
        var k = x.at.slice(0, 7);
        byMonth[k] = byMonth[k] || { in: 0, out: 0 };
        byMonth[k].out += x.amount;
      });
      var months = Object.keys(byMonth).sort();
      var tIn = U.sum(inc, 'amount'), tOut = U.sum(exp, 'amount');
      var active = S.scope(S.all('members'), b).filter(function (m) {
        var k = S.status(m).k; return k === 'active' || k === 'expiring';
      }).length;

      return '<div class="grid g-4 mb">' +
        W.stat({ t: 'متوسط الإيراد اليومي', v: U.n(Math.round(tIn / Math.max(1, Math.abs(U.diffDays(r.from, r.to)) + 1))), cur: CZ.CUR, ico: 'trend', tone: 'ok' }) +
        W.stat({ t: 'متوسط دخل العضو', v: U.n(active ? Math.round(tIn / active) : 0), cur: CZ.CUR, ico: 'user', tone: 'info',
          d: 'على ' + U.n(active) + ' عضو نشط' }) +
        W.stat({ t: 'نسبة المصروف من الإيراد', v: U.pct(tOut, tIn) + '<span class="cur">%</span>', ico: 'bar',
          tone: U.pct(tOut, tIn) > 70 ? 'danger' : U.pct(tOut, tIn) > 55 ? 'warn' : 'ok' }) +
        W.stat({ t: 'هامش الربح', v: U.pct(tIn - tOut, tIn) + '<span class="cur">%</span>', ico: 'sparkle',
          tone: 'lime', dark: true }) +
        '</div>' +
        '<div class="grid g-2">' +
        W.card({
          title: 'الإيراد شهر بشهر', ico: 'chart',
          body: months.length ? CZ.c.line([
            { name: 'إيراد', data: months.map(function (m) { return byMonth[m].in; }), color: '#6F9410' },
            { name: 'مصروف', data: months.map(function (m) { return byMonth[m].out; }), color: '#C0492B', area: false }
          ], { h: 220, labels: months.map(function (m) { return U.MONTHS[+m.slice(5) - 1].slice(0, 4); }) })
            : W.empty('مفيش بيانات كفاية', '', 'chart')
        }) +
        W.card({
          title: 'مصدر الفلوس', ico: 'tag',
          body: CZ.c.rank(Object.keys(byCat).map(function (k) {
            return { t: S.CATS_IN[k] || k, v: byCat[k], sub: U.pct(byCat[k], tIn) + '% من الإيراد' };
          }).sort(U.by('v', 'desc')), { money: true })
        }) +
        '</div>' +
        (S.branches().length > 1 ? '<div class="mt">' + W.card({
          title: 'الفروع جنب بعض', ico: 'branch',
          body: CZ.c.bars(S.branches().map(function (br) {
            return { t: br.short, v: byBranch[br.id] || 0, color: br.color };
          }), { h: 200, unit: ' ' + CZ.CUR })
        }) + '</div>' : '');
    }
  };

  function moveTable(list, full) {
    return W.table([
      { k: 'at', t: 'التاريخ', sort: false, w: '150px', render: function (x) {
        return '<span class="sm">' + U.fDate(x.at, 'short') + '</span> <span class="xs fnt num">' + U.fTime(x.at) + '</span>';
      }},
      { t: 'البند', sort: false, render: function (x) {
        return '<b class="sm">' + U.esc(S.CATS_IN[x.cat] || S.CATS_OUT[x.cat] || x.cat) + '</b>' +
          (x.note ? '<div class="xs fnt">' + U.esc(x.note) + '</div>' : '');
      }},
      { t: 'العضو', sort: false, render: function (x) {
        if (!x.memberId) return '<span class="fnt">—</span>';
        var m = S.member(x.memberId);
        return m ? '<button class="btn btn-sm btn-soft" data-mem="' + m.id + '">' + U.esc(m.name) + '</button>' : '<span class="fnt">—</span>';
      }},
      { t: 'الطريقة', sort: false, render: function (x) {
        return '<span class="badge' + (x.method === 'cash' ? '' : ' info') + '">' + (S.METHODS[x.method] || '—') + '</span>';
      }},
      { t: 'الفرع', sort: false, render: function (x) { return W.branchTag(x.branchId); } },
      { t: 'المبلغ', sort: false, cls: 'num end', render: function (x) {
        return '<span class="money ' + (x.kind === 'in' ? 'pos' : 'neg') + '">' +
          (x.kind === 'in' ? '+' : '−') + U.n(x.amount) + '</span>';
      }},
      { t: '', sort: false, cls: 'end', render: function (x) {
        return '<div class="rowact"><button class="btn btn-sm btn-soft btn-ico" data-medit-money="' + x.id + '">' + U.ico('edit') + '</button>' +
          '<button class="btn btn-sm btn-danger btn-ico" data-mdel-money="' + x.id + '">' + U.ico('trash') + '</button></div>';
      }}
    ], full ? list : list.slice(0, 40), { emptyT: 'مفيش حركات', emptyIco: 'wallet' });
  }

  /* ---------- حركة خزنة ---------- */
  CZ.moneyModal = function (kind, presetCat) {
    kind = kind || 'in';
    var branch = CZ.state.branch !== 'all' ? CZ.state.branch : S.branches()[0].id;
    var mo = U.modal({
      title: 'حركة خزنة',
      sub: 'أي فلوس داخلة أو خارجة',
      body: '<div class="f" id="mm">' +
        '<div class="seg" style="width:100%">' +
        '<button type="button" data-kind="in" class="on" style="flex:1">فلوس داخلة</button>' +
        '<button type="button" data-kind="out" style="flex:1">فلوس خارجة</button></div>' +
        '<input type="hidden" name="kind" value="in">' +
        '<div class="f-row">' +
        W.fld({ label: 'المبلغ', name: 'amount', type: 'number', req: true, suffix: CZ.CUR, ph: '0' }) +
        W.fld({ label: 'البند', name: 'cat', type: 'select', val: presetCat,
          opts: Object.keys(S.CATS_IN).map(function (k) { return [k, S.CATS_IN[k]]; }) }) +
        '</div>' +
        '<div class="f-row">' +
        W.fld({ label: 'طريقة الدفع', name: 'method', type: 'select',
          opts: Object.keys(S.METHODS).map(function (k) { return [k, S.METHODS[k]]; }) }) +
        W.branchField(branch) +
        '</div>' +
        W.fld({ label: 'التاريخ والوقت', name: 'at', type: 'datetime-local', val: U.isoT() }) +
        '<div id="mm-member">' + W.memberPicker({ label: 'العضو (اختياري)' }) + '</div>' +
        W.fld({ label: 'البيان', name: 'note', ph: 'مثال: فاتورة كهربا شهر 8', type: 'textarea', rows: 2 }) +
        '</div>',
      footer: '<div class="grow"></div><button class="btn btn-ghost" data-close>إلغاء</button>' +
        '<button class="btn btn-lime" id="mm-ok">' + U.ico('check') + 'سجّل</button>'
    });
    mo.el.addEventListener('click', function (e) {
      var k = e.target.closest('[data-kind]');
      if (!k) return;
      var kk = k.getAttribute('data-kind');
      U.$$('[data-kind]', mo.el).forEach(function (x) { x.classList.toggle('on', x === k); });
      U.$('[name=kind]', mo.el).value = kk;
      var cats = kk === 'in' ? S.CATS_IN : S.CATS_OUT;
      U.$('[name=cat]', mo.el).innerHTML = Object.keys(cats).map(function (c) {
        return '<option value="' + c + '">' + cats[c] + '</option>';
      }).join('');
      U.$('#mm-member', mo.el).style.display = kk === 'in' ? '' : 'none';
    });
    U.$('#mm-ok', mo.el).addEventListener('click', function () {
      var d = W.form(U.$('#mm', mo.el));
      if (!d.amount || d.amount <= 0) { U.toast('اكتب المبلغ', 'err'); return; }
      S.addMoney({
        kind: d.kind, amount: d.amount, cat: d.cat, method: d.method,
        branchId: d.branchId, memberId: d.memberId || null,
        at: d.at ? d.at.replace('T', 'T') : U.isoT(), note: d.note
      });
      S.log(d.kind === 'in' ? 'قبض' : 'صرف', 'money', '', U.m(d.amount) + ' — ' + (d.note || ''));
      S.save(true);
      U.toast('اتسجّلت الحركة');
      mo.close(); CZ.render();
    });
  };
  U.on('click', '#fn-add2', function () { CZ.moneyModal('out'); });

  U.on('click', '[data-mdel-money]', function (e, el) {
    U.confirm({ title: 'حذف الحركة؟', danger: true, body: 'هتتشال من الخزنة نهائي.', ok: 'احذف' })
      .then(function (y) { if (y) { S.del('money', el.getAttribute('data-mdel-money')); U.toast('اتحذفت'); CZ.render(); } });
  });
  U.on('click', '[data-medit-money]', function (e, el) {
    var x = S.get('money', el.getAttribute('data-medit-money'));
    var cats = x.kind === 'in' ? S.CATS_IN : S.CATS_OUT;
    var mo = U.modal({
      title: 'تعديل الحركة', width: 'sm',
      body: '<div class="f">' +
        W.fld({ label: 'المبلغ', name: 'amount', type: 'number', val: x.amount, suffix: CZ.CUR }) +
        W.fld({ label: 'البند', name: 'cat', type: 'select', val: x.cat,
          opts: Object.keys(cats).map(function (k) { return [k, cats[k]]; }) }) +
        W.fld({ label: 'الطريقة', name: 'method', type: 'select', val: x.method,
          opts: Object.keys(S.METHODS).map(function (k) { return [k, S.METHODS[k]]; }) }) +
        W.fld({ label: 'البيان', name: 'note', val: x.note }) + '</div>',
      footer: '<div class="grow"></div><button class="btn btn-ghost" data-close>إلغاء</button>' +
        '<button class="btn btn-lime" id="me-ok">احفظ</button>'
    });
    U.$('#me-ok', mo.el).addEventListener('click', function () {
      S.upd('money', x.id, W.form(mo.el)); U.toast('اتحفظ'); mo.close(); CZ.render();
    });
  });

  /* ---------- تقفيل اليوم ---------- */
  U.on('input', '[name^=actual_]', function (e, el) {
    var bid = el.name.replace('actual_', '');
    var t = U.today();
    var cash = U.sum(S.income(t, t, bid).filter(function (x) { return x.method === 'cash'; }), 'amount') -
      U.sum(S.expense(t, t, bid).filter(function (x) { return x.method === 'cash'; }), 'amount');
    var diff = (+el.value || 0) - cash;
    var f = U.$('[name=diff_' + bid + ']');
    if (f) {
      f.value = (diff === 0 ? 'مظبوط' : (diff > 0 ? 'زيادة ' : 'عجز ') + U.n(Math.abs(diff)) + ' ' + CZ.CUR);
      f.style.color = diff === 0 ? 'var(--ok)' : 'var(--danger)';
      f.style.fontWeight = '800';
    }
  });

  U.on('click', '[data-close-day]', function (e, el) {
    var bid = el.getAttribute('data-close-day');
    var t = U.today();
    var br = S.branch(bid);
    var inc = S.income(t, t, bid), exp = S.expense(t, t, bid);
    var cash = U.sum(inc.filter(function (x) { return x.method === 'cash'; }), 'amount') -
      U.sum(exp.filter(function (x) { return x.method === 'cash'; }), 'amount');
    var actual = +(U.$('[name=actual_' + bid + ']') || {}).value || 0;
    var diff = actual - cash;
    S.log('قفل اليوم', 'money', bid, br.name + ' — المفروض ' + U.m(cash) + ' والفعلي ' + U.m(actual) +
      (diff ? ' (' + (diff > 0 ? 'زيادة ' : 'عجز ') + U.m(Math.abs(diff)) + ')' : ''));
    S.save(true);
    U.print('<div class="a4">' +
      '<div class="a4-h"><div><div class="logo">CEZAR</div><h1>تقفيل يومي</h1></div>' +
      '<div class="meta">' + U.esc(br.name) + '<br>' + U.fDay(t) + '<br>' + U.esc(CZ.state.user.name) + '</div></div>' +
      '<div class="a4-grid">' +
      '<div class="a4-stat"><div class="t">إيراد اليوم</div><div class="v">' + U.n(U.sum(inc, 'amount')) + '</div></div>' +
      '<div class="a4-stat"><div class="t">مصروف اليوم</div><div class="v">' + U.n(U.sum(exp, 'amount')) + '</div></div>' +
      '<div class="a4-stat"><div class="t">المفروض في الدرج</div><div class="v">' + U.n(cash) + '</div></div>' +
      '<div class="a4-stat"><div class="t">العدّ الفعلي</div><div class="v">' + U.n(actual) + '</div></div>' +
      '</div>' +
      (diff ? '<p style="color:#C0492B;font-weight:800">فرق: ' + (diff > 0 ? 'زيادة ' : 'عجز ') + U.n(Math.abs(diff)) + ' ' + CZ.CUR + '</p>' : '') +
      '<h2>حركات اليوم</h2>' +
      '<table><thead><tr><th>الوقت</th><th>النوع</th><th>البند</th><th>البيان</th><th>الطريقة</th><th class="n">المبلغ</th></tr></thead><tbody>' +
      inc.concat(exp).sort(U.by('at')).map(function (x) {
        return '<tr><td>' + U.fTime(x.at) + '</td><td>' + (x.kind === 'in' ? 'وارد' : 'منصرف') + '</td>' +
          '<td>' + U.esc(S.CATS_IN[x.cat] || S.CATS_OUT[x.cat] || x.cat) + '</td>' +
          '<td>' + U.esc(x.note || '') + '</td><td>' + U.esc(S.METHODS[x.method] || '') + '</td>' +
          '<td class="n">' + (x.kind === 'in' ? '' : '−') + U.n(x.amount) + '</td></tr>';
      }).join('') +
      '</tbody><tfoot><tr><td colspan="5">الصافي</td><td class="n">' +
      U.n(U.sum(inc, 'amount') - U.sum(exp, 'amount')) + '</td></tr></tfoot></table>' +
      '<div style="margin-top:14mm;display:flex;justify-content:space-between">' +
      '<div>توقيع الموظف: ..........................</div><div>توقيع الإدارة: ..........................</div></div>' +
      '<div class="a4-f"><span>' + U.esc(S.db().settings.gymName) + '</span><span>' + U.isoT() + '</span></div></div>');
    U.toast('اتقفل اليوم');
  });

  U.on('click', '#fn-debtwa', function () {
    var list = S.scope(S.all('members'), CZ.state.branch).filter(function (m) { return S.debt(m.id) > 0; });
    CZ.go('messages?list=debt');
  });

  function exportMoves() {
    var r = range(), b = CZ.state.branch;
    var rows = [['التاريخ', 'الوقت', 'النوع', 'البند', 'البيان', 'العضو', 'الطريقة', 'الفرع', 'المبلغ']];
    S.income(r.from, r.to, b).concat(S.expense(r.from, r.to, b)).sort(U.by('at')).forEach(function (x) {
      rows.push([x.at.slice(0, 10), U.fTime(x.at), x.kind === 'in' ? 'وارد' : 'منصرف',
        S.CATS_IN[x.cat] || S.CATS_OUT[x.cat] || x.cat, x.note || '',
        x.memberId ? S.memberName(x.memberId) : '', S.METHODS[x.method] || '',
        S.branchShort(x.branchId), (x.kind === 'in' ? '' : '-') + x.amount]);
    });
    U.csv('خزنة-' + r.from + '_' + r.to, rows);
    U.toast('اتصدّر ' + (rows.length - 1) + ' حركة');
  }

  function printReport() {
    var r = range(), b = CZ.state.branch;
    var inc = S.income(r.from, r.to, b), exp = S.expense(r.from, r.to, b);
    var byCatIn = {}, byCatOut = {};
    inc.forEach(function (x) { byCatIn[x.cat] = (byCatIn[x.cat] || 0) + x.amount; });
    exp.forEach(function (x) { byCatOut[x.cat] = (byCatOut[x.cat] || 0) + x.amount; });
    var tIn = U.sum(inc, 'amount'), tOut = U.sum(exp, 'amount');
    U.print('<div class="a4">' +
      '<div class="a4-h"><div><div class="logo">CEZAR</div><h1>تقرير مالي</h1></div>' +
      '<div class="meta">' + (b === 'all' ? 'كل الفروع' : U.esc(S.branchName(b))) + '<br>' +
      'من ' + U.fDate(r.from) + ' لحد ' + U.fDate(r.to) + '</div></div>' +
      '<div class="a4-grid">' +
      '<div class="a4-stat"><div class="t">إجمالي الإيراد</div><div class="v">' + U.n(tIn) + '</div></div>' +
      '<div class="a4-stat"><div class="t">إجمالي المصروف</div><div class="v">' + U.n(tOut) + '</div></div>' +
      '<div class="a4-stat"><div class="t">الصافي</div><div class="v">' + U.n(tIn - tOut) + '</div></div>' +
      '<div class="a4-stat"><div class="t">هامش الربح</div><div class="v">' + U.pct(tIn - tOut, tIn) + '%</div></div>' +
      '</div>' +
      '<h2>الإيرادات حسب البند</h2><table><thead><tr><th>البند</th><th class="n">المبلغ</th><th class="n">%</th></tr></thead><tbody>' +
      Object.keys(byCatIn).sort(function (a, c) { return byCatIn[c] - byCatIn[a]; }).map(function (k) {
        return '<tr><td>' + U.esc(S.CATS_IN[k] || k) + '</td><td class="n">' + U.n(byCatIn[k]) + '</td>' +
          '<td class="n">' + U.pct(byCatIn[k], tIn) + '%</td></tr>';
      }).join('') + '</tbody><tfoot><tr><td>الإجمالي</td><td class="n">' + U.n(tIn) + '</td><td class="n">100%</td></tr></tfoot></table>' +
      '<h2>المصروفات حسب البند</h2><table><thead><tr><th>البند</th><th class="n">المبلغ</th><th class="n">%</th></tr></thead><tbody>' +
      Object.keys(byCatOut).sort(function (a, c) { return byCatOut[c] - byCatOut[a]; }).map(function (k) {
        return '<tr><td>' + U.esc(S.CATS_OUT[k] || k) + '</td><td class="n">' + U.n(byCatOut[k]) + '</td>' +
          '<td class="n">' + U.pct(byCatOut[k], tOut) + '%</td></tr>';
      }).join('') + '</tbody><tfoot><tr><td>الإجمالي</td><td class="n">' + U.n(tOut) + '</td><td class="n">100%</td></tr></tfoot></table>' +
      '<div class="a4-f"><span>' + U.esc(S.db().settings.gymName) + ' — تقرير مطبوع من النظام</span>' +
      '<span>' + U.esc(CZ.state.user.name) + ' · ' + U.fDate(U.today()) + '</span></div></div>');
  }
})();
