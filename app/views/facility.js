/* ============================================================
   سيزر جيم — الأجهزة والصيانة + اللوكرات
   ------------------------------------------------------------
   جهاز واقف = أعضاء بتزعل وتمشي. الشاشة دي بتخلّي كل جهاز
   ليه تاريخ صيانة، وبتنبّه قبل ما يقع مش بعد ما يقع.
   ============================================================ */
(function () {
  'use strict';
  var CZ = window.CZ, U = CZ.u, S = CZ.s, W = CZ.w;
  CZ.views = CZ.views || {};
  CZ.state = CZ.state || { user: null, branch: 'all', params: {} };

  var ST = { ok: ['ok', 'شغّال'], maintenance: ['warn', 'تحت الصيانة'], broken: ['danger', 'عطلان'], retired: ['', 'خرج الخدمة'] };
  var EF = 'all';

  function due(e) {
    if (!e.serviceEvery || !e.lastService) return null;
    return U.addDays(e.lastService, e.serviceEvery);
  }
  function isDue(e) {
    var d = due(e);
    return d && U.diffDays(d) <= 0;
  }

  /* ================= الأجهزة ================= */
  CZ.views.equipment = {
    title: 'الأجهزة والصيانة',
    sub: function () { return CZ.state.branch === 'all' ? 'كل الفروع' : S.branchName(CZ.state.branch); },
    perm: 'equip',
    render: function () {
      var b = CZ.state.branch;
      var all = S.scope(S.all('equip'), b);
      var broken = all.filter(function (e) { return e.status === 'broken'; });
      var maint = all.filter(function (e) { return e.status === 'maintenance'; });
      var dueList = all.filter(function (e) { return e.status === 'ok' && isDue(e); });
      var value = U.sum(all, 'cost');
      var year = U.today().slice(0, 5) + '01-01';
      var maintCost = U.sum(S.where('maint', function (m) {
        var eq = S.get('equip', m.equipId);
        return m.at >= year && eq && S.inScope(eq, b);
      }), 'cost');

      var list = all;
      if (EF === 'broken') list = broken;
      else if (EF === 'maint') list = maint;
      else if (EF === 'due') list = dueList;
      else if (EF !== 'all') list = all.filter(function (e) { return e.cat === EF; });

      var cats = U.uniq(all.map(function (e) { return e.cat; }));

      return '<div class="grid g-4 mb">' +
        W.stat({ t: 'إجمالي الأجهزة', v: U.n(all.length), ico: 'dumbbell', tone: 'info' }) +
        W.stat({ t: 'عطلانة', v: U.n(broken.length), ico: 'alert', tone: broken.length ? 'danger' : 'ok',
          d: broken.length ? 'كل جهاز واقف = أعضاء بتزهق' : 'كله شغّال' }) +
        W.stat({ t: 'محتاجة صيانة', v: U.n(dueList.length), ico: 'wrench', tone: dueList.length ? 'warn' : 'ok' }) +
        W.stat({ t: 'قيمة الأجهزة', v: U.n(value), cur: CZ.CUR, ico: 'box', tone: 'gold',
          d: 'صيانة السنة ' + U.m(maintCost) }) +
        '</div>' +

        (broken.length ? W.alert('danger', broken.length + ' جهاز عطلان دلوقتي',
          broken.slice(0, 4).map(function (e) { return e.name; }).join('، '),
          '<button class="btn btn-sm btn-ink" data-efilter="broken">شوفهم</button>') + '<div class="mb"></div>' : '') +

        '<div class="row-b mb">' +
        W.chips([{ v: 'all', t: 'الكل', n: all.length },
        { v: 'broken', t: 'عطلانة', n: broken.length },
        { v: 'maint', t: 'تحت الصيانة', n: maint.length },
        { v: 'due', t: 'ميعاد صيانتها', n: dueList.length }]
          .concat(cats.map(function (c) {
            return { v: c, t: c, n: all.filter(function (e) { return e.cat === c; }).length };
          })), EF, 'data-efilter') +
        '<div class="row">' +
        '<button class="btn btn-ghost btn-sm" id="eq-export">' + U.ico('export') + 'جرد</button>' +
        '<button class="btn btn-lime btn-sm" id="eq-new">' + U.ico('plus') + 'جهاز جديد</button></div></div>' +

        W.card({
          flush: true,
          body: W.table([
            { t: 'الجهاز', sort: false, render: function (e) {
              return '<b>' + U.esc(e.name) + '</b><div class="xs fnt">' + U.esc(e.cat) +
                (e.serial ? ' · ' + e.serial : '') + '</div>';
            }},
            { t: 'الحالة', sort: false, render: function (e) {
              var s = ST[e.status] || ST.ok;
              return '<span class="badge ' + s[0] + '">' + s[1] + '</span>' +
                (e.note ? '<div class="xs neg">' + U.esc(e.note) + '</div>' : '');
            }},
            { t: 'الفرع', sort: false, render: function (e) { return W.branchTag(e.branchId); } },
            { t: 'الشراء', sort: false, render: function (e) {
              return '<span class="sm">' + U.fDate(e.purchasedAt, 'short') + '</span>' +
                '<div class="xs fnt">' + U.ago(e.purchasedAt) + '</div>';
            }},
            { t: 'التكلفة', sort: false, cls: 'num end', render: function (e) { return U.n(e.cost); } },
            { t: 'آخر صيانة', sort: false, render: function (e) {
              return e.lastService ? '<span class="sm">' + U.fDate(e.lastService, 'short') + '</span>' : '<span class="fnt">—</span>';
            }},
            { t: 'الصيانة الجاية', sort: false, render: function (e) {
              var d = due(e);
              if (!d) return '<span class="fnt">—</span>';
              var n = U.diffDays(d);
              return '<span class="' + (n <= 0 ? 'neg b' : n < 14 ? 'b' : '') + '">' + U.fDate(d, 'short') + '</span>' +
                '<div class="xs fnt">' + U.ago(d) + '</div>';
            }},
            { t: '', sort: false, cls: 'end', render: function (e) {
              return '<div class="rowact">' +
                '<button class="btn btn-sm btn-ok" data-maint="' + e.id + '">' + U.ico('wrench') + 'صيانة</button>' +
                '<button class="btn btn-sm btn-soft btn-ico" data-eqview="' + e.id + '">' + U.ico('eye') + '</button>' +
                '<button class="btn btn-sm btn-soft btn-ico" data-eqedit="' + e.id + '">' + U.ico('edit') + '</button></div>';
            }}
          ], list.sort(U.by('cat')), { emptyT: 'مفيش أجهزة', emptyIco: 'dumbbell' })
        }) +

        W.sectH('مصاريف الصيانة على مدار السنة') +
        W.card({
          body: (function () {
            var months = [];
            for (var i = 11; i >= 0; i--) {
              var mo = U.addMonths(U.today(), -i).slice(0, 7);
              months.push({
                t: U.MONTHS[+mo.slice(5) - 1].slice(0, 4),
                v: U.sum(S.where('maint', function (m) {
                  var eq = S.get('equip', m.equipId);
                  return m.at.slice(0, 7) === mo && eq && S.inScope(eq, b);
                }), 'cost')
              });
            }
            return CZ.c.bars(months, { h: 190, unit: ' ' + CZ.CUR });
          })()
        });
    },
    after: function () {
      var e;
      if ((e = U.$('#eq-new'))) e.addEventListener('click', function () { eqForm(); });
      if ((e = U.$('#eq-export'))) e.addEventListener('click', function () {
        var rows = [['الجهاز', 'الفئة', 'السيريال', 'الفرع', 'الحالة', 'تاريخ الشراء', 'التكلفة', 'آخر صيانة', 'كل كام يوم', 'ملاحظة']];
        S.scope(S.all('equip'), CZ.state.branch).forEach(function (x) {
          rows.push([x.name, x.cat, x.serial, S.branchShort(x.branchId), (ST[x.status] || [])[1],
            x.purchasedAt, x.cost, x.lastService, x.serviceEvery, x.note]);
        });
        U.csv('جرد-أجهزة-' + U.today(), rows);
      });
    }
  };

  U.on('click', '[data-efilter]', function (e, el) {
    if (!U.$('#eq-new')) return;
    EF = el.getAttribute('data-efilter'); CZ.render();
  });

  function eqForm(id) {
    var e = id ? S.get('equip', id) : null;
    var x = e || { status: 'ok', purchasedAt: U.today(), serviceEvery: 180, lastService: U.today() };
    var mo = U.modal({
      title: e ? 'تعديل جهاز' : 'جهاز جديد',
      body: '<div class="f" id="eqf">' +
        '<div class="f-row">' +
        W.fld({ label: 'اسم الجهاز', name: 'name', val: x.name, req: true }) +
        W.fld({ label: 'الفئة', name: 'cat', val: x.cat, ph: 'كارديو / أوزان / أجهزة / مرافق' }) +
        '</div>' +
        '<div class="f-row c3">' +
        W.fld({ label: 'السيريال', name: 'serial', val: x.serial }) +
        W.fld({ label: 'تاريخ الشراء', name: 'purchasedAt', type: 'date', val: x.purchasedAt }) +
        W.fld({ label: 'التكلفة', name: 'cost', type: 'number', val: x.cost, suffix: CZ.CUR }) +
        '</div>' +
        '<div class="f-row c3">' +
        W.fld({ label: 'الحالة', name: 'status', type: 'select', val: x.status,
          opts: Object.keys(ST).map(function (k) { return [k, ST[k][1]]; }) }) +
        W.fld({ label: 'آخر صيانة', name: 'lastService', type: 'date', val: x.lastService }) +
        W.fld({ label: 'صيانة كل', name: 'serviceEvery', type: 'number', val: x.serviceEvery, suffix: 'يوم' }) +
        '</div>' +
        W.branchField(x.branchId) +
        W.fld({ label: 'ملاحظة / وصف العطل', name: 'note', val: x.note, type: 'textarea', rows: 2 }) +
        '</div>',
      footer: (e ? '<button class="btn btn-danger btn-sm" id="eqf-del">' + U.ico('trash') + '</button>' : '') +
        '<div class="grow"></div><button class="btn btn-ghost" data-close>إلغاء</button>' +
        '<button class="btn btn-lime" id="eqf-ok">' + U.ico('save') + 'احفظ</button>'
    });
    U.$('#eqf-ok', mo.el).addEventListener('click', function () {
      var d = W.form(U.$('#eqf', mo.el));
      if (!d.name) { U.toast('اكتب اسم الجهاز', 'err'); return; }
      if (e) S.upd('equip', e.id, d); else S.add('equip', d);
      U.toast('اتحفظ'); mo.close(); CZ.render();
    });
    if (e) U.$('#eqf-del', mo.el).addEventListener('click', function () {
      S.del('equip', e.id); mo.close(); CZ.render();
    });
  }
  U.on('click', '[data-eqedit]', function (e, el) { eqForm(el.getAttribute('data-eqedit')); });

  U.on('click', '[data-maint]', function (e, el) {
    var eq = S.get('equip', el.getAttribute('data-maint'));
    var mo = U.modal({
      title: 'تسجيل صيانة', sub: eq.name, width: 'sm',
      body: '<div class="f" id="mtf">' +
        '<div class="f-row">' +
        W.fld({ label: 'التاريخ', name: 'at', type: 'date', val: U.today() }) +
        W.fld({ label: 'النوع', name: 'type', type: 'select',
          opts: ['دورية', 'إصلاح عطل', 'تغيير قطعة', 'فحص'].map(function (t) { return [t, t]; }) }) +
        '</div>' +
        '<div class="f-row">' +
        W.fld({ label: 'التكلفة', name: 'cost', type: 'number', val: 0, suffix: CZ.CUR }) +
        W.fld({ label: 'اللي عملها', name: 'by', val: 'فني الجيم' }) +
        '</div>' +
        W.fld({ label: 'اتعمل إيه', name: 'note', type: 'textarea', rows: 2, ph: 'تشحيم، تغيير سير...' }) +
        W.fld({ label: 'حالة الجهاز بعد الصيانة', name: 'status', type: 'select', val: 'ok',
          opts: Object.keys(ST).map(function (k) { return [k, ST[k][1]]; }) }) +
        W.check({ name: 'expense', t: 'سجّل التكلفة كمصروف في الخزنة', on: true }) +
        '</div>',
      footer: '<div class="grow"></div><button class="btn btn-ghost" data-close>إلغاء</button>' +
        '<button class="btn btn-lime" id="mt-ok">' + U.ico('check') + 'سجّل</button>'
    });
    U.$('#mt-ok', mo.el).addEventListener('click', function () {
      var d = W.form(U.$('#mtf', mo.el));
      S.add('maint', {
        equipId: eq.id, at: d.at, type: d.type, cost: d.cost, by: d.by, note: d.note
      }, true);
      S.upd('equip', eq.id, {
        lastService: d.at, status: d.status,
        note: d.status === 'ok' ? '' : eq.note
      }, true);
      if (d.expense && d.cost > 0) {
        S.addMoney({
          kind: 'out', amount: d.cost, cat: 'maint', method: 'cash',
          branchId: eq.branchId, at: d.at + 'T12:00', note: 'صيانة ' + eq.name + ' — ' + (d.note || d.type)
        });
      }
      S.log('صيانة', 'equip', eq.id, eq.name + ' — ' + d.type);
      S.save(true);
      U.toast('الصيانة اتسجّلت');
      mo.close(); CZ.render();
    });
  });

  U.on('click', '[data-eqview]', function (e, el) {
    var eq = S.get('equip', el.getAttribute('data-eqview'));
    var logs = S.where('maint', function (m) { return m.equipId === eq.id; }).sort(U.by('at', 'desc'));
    var s = ST[eq.status] || ST.ok;
    U.modal({
      title: eq.name, sub: eq.cat + (eq.serial ? ' · ' + eq.serial : ''),
      body: '<dl class="kv mb">' +
        '<dt>الحالة</dt><dd><span class="badge ' + s[0] + '">' + s[1] + '</span></dd>' +
        '<dt>الفرع</dt><dd>' + W.branchTag(eq.branchId) + '</dd>' +
        '<dt>تاريخ الشراء</dt><dd>' + U.fDate(eq.purchasedAt) + ' (' + U.ago(eq.purchasedAt) + ')</dd>' +
        '<dt>التكلفة</dt><dd>' + U.money(eq.cost) + '</dd>' +
        '<dt>آخر صيانة</dt><dd>' + (eq.lastService ? U.fDate(eq.lastService) : '—') + '</dd>' +
        '<dt>الصيانة الجاية</dt><dd>' + (due(eq) ? U.fDate(due(eq)) + ' (' + U.ago(due(eq)) + ')' : '—') + '</dd>' +
        '<dt>إجمالي الصيانة</dt><dd class="money">' + U.n(U.sum(logs, 'cost')) + ' ' + CZ.CUR + '</dd>' +
        '</dl>' +
        (eq.note ? W.alert('warn', 'ملاحظة', eq.note) + '<div class="mb"></div>' : '') +
        W.card({
          flush: true, title: 'سجل الصيانة',
          body: W.table([
            { t: 'التاريخ', sort: false, render: function (m) { return U.fDate(m.at); } },
            { t: 'النوع', sort: false, render: function (m) { return '<span class="badge">' + U.esc(m.type) + '</span>'; } },
            { t: 'اتعمل إيه', sort: false, render: function (m) { return '<span class="sm">' + U.esc(m.note || '—') + '</span>'; } },
            { t: 'مين', sort: false, render: function (m) { return U.esc(m.by || '—'); } },
            { t: 'التكلفة', sort: false, cls: 'num end', render: function (m) { return U.money(m.cost); } }
          ], logs, { emptyT: 'مفيش صيانة مسجّلة' })
        }),
      footer: '<button class="btn btn-ghost btn-sm" data-eqedit="' + eq.id + '">' + U.ico('edit') + 'تعديل</button>' +
        '<div class="grow"></div><button class="btn btn-lime" data-maint="' + eq.id + '">' + U.ico('wrench') + 'سجّل صيانة</button>'
    });
  });

  /* ================= اللوكرات ================= */
  CZ.views.lockers = {
    title: 'اللوكرات',
    sub: 'مين واخد إيه',
    render: function () {
      var b = CZ.state.branch;
      var lockers = S.scope(S.all('lockers'), b).sort(function (a, c) { return (+a.no) - (+c.no); });
      var taken = lockers.filter(function (l) { return l.memberId; });
      var broken = lockers.filter(function (l) { return l.status === 'broken'; });
      var branches = b === 'all' ? S.branches() : [S.branch(b)];

      return '<div class="grid g-4 mb">' +
        W.stat({ t: 'إجمالي اللوكرات', v: U.n(lockers.length), ico: 'door', tone: 'info' }) +
        W.stat({ t: 'متاخدة', v: U.n(taken.length), ico: 'lock', tone: 'ok',
          d: U.pct(taken.length, lockers.length) + '% مشغولة' }) +
        W.stat({ t: 'فاضية', v: U.n(lockers.length - taken.length - broken.length), ico: 'key', tone: 'lime' }) +
        W.stat({ t: 'مكسورة', v: U.n(broken.length), ico: 'alert', tone: broken.length ? 'danger' : 'ok' }) +
        '</div>' +

        '<div class="row-b mb"><div></div>' +
        '<button class="btn btn-lime btn-sm" id="lk-add">' + U.ico('plus') + 'ضيف لوكرات</button></div>' +

        branches.map(function (br) {
          var ls = lockers.filter(function (l) { return l.branchId === br.id; });
          if (!ls.length) return '';
          return W.card({
            title: br.name, ico: 'branch',
            sub: ls.filter(function (l) { return l.memberId; }).length + ' من ' + ls.length + ' مشغولة',
            body: '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(78px,1fr));gap:8px">' +
              ls.map(function (l) {
                var m = l.memberId ? S.member(l.memberId) : null;
                var bg = l.status === 'broken' ? 'var(--danger-wash)' : m ? 'var(--ink)' : 'var(--panel)';
                var fg = l.status === 'broken' ? 'var(--danger)' : m ? 'var(--lime)' : 'var(--muted)';
                return '<button data-locker="' + l.id + '" style="padding:9px 6px;border-radius:10px;background:' + bg +
                  ';color:' + fg + ';text-align:center;border:1px solid var(--hair);min-height:62px">' +
                  '<div class="num" style="font-size:17px;font-weight:800">' + U.esc(l.no) + '</div>' +
                  '<div style="font-size:10px;line-height:1.25;opacity:.85;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' +
                  (l.status === 'broken' ? 'مكسور' : m ? U.esc(m.name.split(' ')[0]) : 'فاضي') + '</div></button>';
              }).join('') + '</div>'
          });
        }).join('<div class="mb"></div>');
    },
    after: function () {
      var e = U.$('#lk-add');
      if (e) e.addEventListener('click', function () {
        var mo = U.modal({
          title: 'إضافة لوكرات', width: 'sm',
          body: '<div class="f" id="lkf">' +
            '<div class="f-row">' +
            W.fld({ label: 'من رقم', name: 'from', type: 'number', val: 1 }) +
            W.fld({ label: 'لحد رقم', name: 'to', type: 'number', val: 20 }) +
            '</div>' + W.branchField() + '</div>',
          footer: '<div class="grow"></div><button class="btn btn-lime" id="lkf-ok">ضيف</button>'
        });
        U.$('#lkf-ok', mo.el).addEventListener('click', function () {
          var d = W.form(U.$('#lkf', mo.el));
          var n = 0;
          for (var i = d.from; i <= d.to; i++) {
            if (S.find('lockers', function (l) { return l.branchId === d.branchId && l.no === String(i); })) continue;
            S.add('lockers', { no: String(i), branchId: d.branchId, memberId: null, status: 'free' }, true);
            n++;
          }
          S.save(true);
          U.toast('اتضاف ' + n + ' لوكر'); mo.close(); CZ.render();
        });
      });
    }
  };

  U.on('click', '[data-locker]', function (e, el) {
    var l = S.get('lockers', el.getAttribute('data-locker'));
    var m = l.memberId ? S.member(l.memberId) : null;
    var mo = U.modal({
      title: 'لوكر رقم ' + l.no, sub: S.branchName(l.branchId), width: 'sm',
      body: (m ? '<div class="pick-i on mb" style="cursor:default">' + W.ava(m, 'sm') +
        '<span class="pi-t"><b>' + U.esc(m.name) + '</b><span class="pi-sub">' + U.esc(m.code) + ' · ' +
        U.fPhone(m.phone) + '</span></span></div>' +
        '<div class="xs mut mb">من ' + (l.since ? U.fDate(l.since) : '—') + '</div>' : '') +
        '<div class="f" id="lkv">' +
        (m ? '' : W.memberPicker({ label: 'اديه لمين' })) +
        W.fld({ label: 'الحالة', name: 'status', type: 'select', val: l.status,
          opts: [['free', 'فاضي'], ['taken', 'متاخد'], ['broken', 'مكسور']] }) +
        '</div>',
      footer: (m ? '<button class="btn btn-danger btn-sm" id="lk-free">' + U.ico('x') + 'فضّيه</button>' : '') +
        '<div class="grow"></div><button class="btn btn-ghost" data-close>إلغاء</button>' +
        '<button class="btn btn-lime" id="lk-ok">' + U.ico('save') + 'احفظ</button>'
    });
    U.$('#lk-ok', mo.el).addEventListener('click', function () {
      var d = W.form(U.$('#lkv', mo.el));
      var patch = { status: d.status };
      if (d.memberId) {
        patch.memberId = d.memberId; patch.status = 'taken'; patch.since = U.today();
        S.upd('members', d.memberId, { lockerNo: l.no }, true);
      }
      S.upd('lockers', l.id, patch);
      U.toast('اتحفظ'); mo.close(); CZ.render();
    });
    if (m) U.$('#lk-free', mo.el).addEventListener('click', function () {
      S.upd('lockers', l.id, { memberId: null, status: 'free', since: null });
      S.upd('members', m.id, { lockerNo: '' }, true);
      U.toast('اتفضّى'); mo.close(); CZ.render();
    });
  });
})();
