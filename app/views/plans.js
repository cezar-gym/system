/* ============================================================
   سيزر جيم — الباقات والأسعار
   ------------------------------------------------------------
   نقطة مهمة: كل باقة ليها سعر أساسي، وممكن يتحطلها سعر مختلف
   لكل فرع (priceBy). ده اللي بيخلّي الفرعين يشتغلوا من نفس
   النظام من غير ما يكون لازم أسعارهم واحدة.
   ============================================================ */
(function () {
  'use strict';
  var CZ = window.CZ, U = CZ.u, S = CZ.s, W = CZ.w;
  CZ.views = CZ.views || {};
  CZ.state = CZ.state || { user: null, branch: 'all', params: {} };

  var T = 'monthly';

  CZ.views.plans = {
    title: 'الباقات والأسعار',
    sub: 'مصدر الأسعار الوحيد في النظام',
    perm: 'plans',
    render: function (p) {
      var branches = S.branches();
      var plans = S.all('plans').sort(U.by('order'));
      var byType = U.groupBy(plans, 'type');
      var subs = S.scope(S.all('subs'), CZ.state.branch);
      var usage = {};
      subs.forEach(function (s) { usage[s.planId] = (usage[s.planId] || 0) + 1; });
      var revenue = {};
      subs.forEach(function (s) { revenue[s.planId] = (revenue[s.planId] || 0) + (s.paid || 0); });
      var active = {};
      S.all('subs').filter(function (s) { return s.status === 'active'; })
        .forEach(function (s) { active[s.planId] = (active[s.planId] || 0) + 1; });

      var top = Object.keys(usage).sort(function (a, b) { return usage[b] - usage[a]; }).slice(0, 5);

      return '<div class="row-b mb">' +
        '<div class="seg">' + Object.keys(S.PLAN_TYPES).map(function (k) {
          return '<button data-ptype="' + k + '"' + (T === k ? ' class="on"' : '') + '>' +
            S.PLAN_TYPES[k] + ' <span class="num xs">' + ((byType[k] || []).length) + '</span></button>';
        }).join('') + '</div>' +
        '<div class="row">' +
        '<button class="btn btn-ghost btn-sm" id="pl-print">' + U.ico('print') + 'قائمة أسعار</button>' +
        '<button class="btn btn-lime btn-sm" id="pl-new">' + U.ico('plus') + 'باقة جديدة</button>' +
        '</div></div>' +

        W.card({
          flush: true,
          body: W.table([
            { k: 'name', t: 'الباقة', sort: false, render: function (x) {
              return '<b>' + U.esc(x.name) + '</b>' + (x.popular ? ' <span class="badge lime">الأكتر طلبًا</span>' : '') +
                (x.active === false ? ' <span class="badge danger">موقوفة</span>' : '') +
                (x.note ? '<div class="xs fnt">' + U.esc(x.note) + '</div>' : '');
            }},
            { t: 'الجلسات', sort: false, cls: 'num mid', render: function (x) { return x.sessions || '—'; } },
            { t: 'المدة', sort: false, cls: 'mid', render: function (x) { return (x.months || 1) + ' شهر'; } },
            { t: 'السعر الأساسي', sort: false, cls: 'num end', render: function (x) {
              return '<b class="money" style="font-size:15px">' + U.n(x.price) + '</b>';
            }}
          ].concat(branches.length > 1 ? branches.map(function (b) {
            return {
              t: 'سعر ' + b.short, sort: false, cls: 'num end', render: function (x) {
                var pr = x.priceBy && x.priceBy[b.id];
                return pr !== undefined && pr !== null
                  ? '<span class="money" style="color:' + b.color + '">' + U.n(pr) + '</span>'
                  : '<span class="fnt xs">نفس الأساسي</span>';
              }
            };
          }) : []).concat([
            { t: 'مشتركين حاليًا', sort: false, cls: 'num mid', render: function (x) {
              return active[x.id] ? '<span class="badge ok">' + active[x.id] + '</span>' : '<span class="fnt">0</span>';
            }},
            { t: 'إجمالي البيع', sort: false, cls: 'num end', render: function (x) {
              return revenue[x.id] ? U.money(revenue[x.id]) : '<span class="fnt">—</span>';
            }},
            { t: '', sort: false, cls: 'end', render: function (x) {
              return '<div class="rowact">' +
                '<button class="btn btn-sm btn-soft btn-ico" data-pedit="' + x.id + '">' + U.ico('edit') + '</button>' +
                '<button class="btn btn-sm btn-danger btn-ico" data-pdel="' + x.id + '">' + U.ico('trash') + '</button></div>';
            }}
          ]), (byType[T] || []), { emptyT: 'مفيش باقات من النوع ده', emptyIco: 'tag' })
        }) +

        '<div class="grid g-2 mt">' +
        W.card({
          title: 'أكتر الباقات مبيعًا', ico: 'star', tone: 'gold',
          sub: 'على كل تاريخ الاشتراكات',
          body: top.length ? CZ.c.rank(top.map(function (id) {
            var pl = S.plan(id);
            return {
              t: pl ? pl.name : id, v: usage[id],
              sub: U.m(revenue[id] || 0) + ' إجمالي · ' + (active[id] || 0) + ' مشترك حاليًا'
            };
          }), { unit: ' اشتراك' }) : W.empty('مفيش بيانات', '', 'star')
        }) +
        W.card({
          title: 'متوسط سعر الاشتراك الفعلي', ico: 'trend',
          sub: 'بعد الخصومات — الرقم ده هو اللي بيدخل الخزنة فعلاً',
          body: (function () {
            var rows = (byType[T] || []).map(function (x) {
              var ss = subs.filter(function (s) { return s.planId === x.id; });
              var avg = ss.length ? Math.round(U.sum(ss, 'paid') / ss.length) : 0;
              var loss = x.price ? Math.round((x.price - avg) / x.price * 100) : 0;
              return {
                t: x.name, v: avg,
                sub: avg ? (loss > 0 ? 'أقل من السعر المعلن بـ ' + loss + '%' : 'بالسعر المعلن') : 'مفيش مبيعات'
              };
            }).filter(function (r) { return r.v; });
            return rows.length ? CZ.c.rank(rows, { money: true, rank: false })
              : W.empty('مفيش مبيعات على النوع ده', '', 'trend');
          })()
        }) +
        '</div>' +

        '<div class="mt">' + W.alert('info', 'إزاي الخصم بيشتغل',
          'السعر هنا هو السعر المعلن قبل أي خصم. وقت الاشتراك بتكتب نسبة الخصم وسببه، والنظام بيحسب ' +
          'السعر النهائي ويحتفظ بالاتنين — عشان تعرف بعدين إنت بتبيع بكام فعلاً مش بكام على الورق.') + '</div>';
    },
    after: function () {
      var e;
      if ((e = U.$('#pl-new'))) e.addEventListener('click', function () { planForm(); });
      if ((e = U.$('#pl-print'))) e.addEventListener('click', printPrices);
    }
  };

  U.on('click', '[data-ptype]', function (e, el) {
    if (!U.$('#pl-new')) return;
    T = el.getAttribute('data-ptype'); CZ.render();
  });
  U.on('click', '[data-pedit]', function (e, el) { planForm(el.getAttribute('data-pedit')); });
  U.on('click', '[data-pdel]', function (e, el) {
    var id = el.getAttribute('data-pdel'), pl = S.plan(id);
    var used = S.where('subs', function (s) { return s.planId === id; }).length;
    U.confirm({
      title: 'حذف «' + pl.name + '»؟', danger: true,
      body: used ? 'فيه ' + used + ' اشتراك مربوط بالباقة دي. الأحسن توقفها بدل ما تحذفها عشان التقارير القديمة تفضل صح.'
        : 'الباقة مش مستخدمة في أي اشتراك.',
      ok: used ? 'احذف برضه' : 'احذف'
    }).then(function (y) { if (y) { S.del('plans', id); U.toast('اتحذفت'); CZ.render(); } });
  });

  function planForm(id) {
    var pl = id ? S.plan(id) : null;
    var x = pl || { type: T, months: 1, sessions: 12, active: true };
    var branches = S.branches();
    var mo = U.modal({
      title: pl ? 'تعديل باقة' : 'باقة جديدة',
      sub: pl ? pl.name : '',
      body: '<div class="f" id="pf">' +
        '<div class="f-row">' +
        W.fld({ label: 'اسم الباقة', name: 'name', val: x.name, req: true, ph: 'جولد، برونز...' }) +
        W.fld({ label: 'النوع', name: 'type', type: 'select', val: x.type,
          opts: Object.keys(S.PLAN_TYPES).map(function (k) { return [k, S.PLAN_TYPES[k]]; }) }) +
        '</div>' +
        '<div class="f-row c3">' +
        W.fld({ label: 'عدد الجلسات', name: 'sessions', type: 'number', val: x.sessions, min: 1,
          hint: 'سيبها فاضية لو الباقة مفتوحة بلا حد' }) +
        W.fld({ label: 'المدة بالشهور', name: 'months', type: 'number', val: x.months || 1, min: 1, max: 36 }) +
        W.fld({ label: 'السعر الأساسي', name: 'price', type: 'number', val: x.price, suffix: CZ.CUR, req: true }) +
        '</div>' +
        (branches.length > 1 ? '<div class="hr"></div><div class="xs mut b mb">سعر مختلف لكل فرع (اختياري)</div>' +
          '<div class="f-row">' + branches.map(function (b) {
            return W.fld({
              label: 'سعر ' + b.name, name: 'pb_' + b.id, type: 'number',
              val: x.priceBy ? x.priceBy[b.id] : '', suffix: CZ.CUR, ph: 'سيبها فاضية = السعر الأساسي'
            });
          }).join('') + '</div>' : '') +
        '<div class="f-row">' +
        W.fld({ label: 'وصف مختصر', name: 'note', val: x.note, ph: '3 أيام في الأسبوع' }) +
        W.fld({ label: 'المزايا', name: 'perks', val: x.perks, ph: '3 دعوات + 3 جلسات ساونا' }) +
        '</div>' +
        '<div class="f-row">' +
        W.fld({ label: 'ترتيب العرض', name: 'order', type: 'number', val: x.order || 99 }) +
        '<div class="fld"><label>خيارات</label>' +
        W.check({ name: 'popular', t: 'علّمها «الأكتر طلبًا»', on: x.popular }) +
        W.check({ name: 'active', t: 'الباقة معروضة للبيع', on: x.active !== false }) +
        '</div></div>' +
        '</div>',
      footer: '<div class="grow"></div><button class="btn btn-ghost" data-close>إلغاء</button>' +
        '<button class="btn btn-lime" id="pf-ok">' + U.ico('save') + 'احفظ</button>'
    });
    U.$('#pf-ok', mo.el).addEventListener('click', function () {
      var d = W.form(U.$('#pf', mo.el));
      if (!d.name) { U.toast('اكتب اسم الباقة', 'err'); return; }
      var priceBy = {};
      branches.forEach(function (b) {
        var v = d['pb_' + b.id];
        if (v !== null && v !== '' && v !== undefined) priceBy[b.id] = v;
        delete d['pb_' + b.id];
      });
      d.priceBy = priceBy;
      if (pl) { S.upd('plans', pl.id, d); U.toast('اتحفظت'); }
      else { S.add('plans', d); U.toast('اتضافت'); }
      mo.close(); CZ.render();
    });
  }

  function printPrices() {
    var plans = S.all('plans').filter(function (p) { return p.active !== false; }).sort(U.by('order'));
    var byType = U.groupBy(plans, 'type');
    var b = CZ.state.branch !== 'all' ? CZ.state.branch : null;
    U.print('<div class="a4">' +
      '<div class="a4-h"><div><div class="logo">CEZAR</div><h1>قائمة الأسعار</h1></div>' +
      '<div class="meta">' + (b ? U.esc(S.branchName(b)) : 'كل الفروع') + '<br>' + U.fDate(U.today()) + '</div></div>' +
      Object.keys(S.PLAN_TYPES).filter(function (k) { return byType[k]; }).map(function (k) {
        return '<h2>' + S.PLAN_TYPES[k] + '</h2><table><thead><tr>' +
          '<th>الباقة</th><th>الجلسات</th><th>المدة</th><th>المزايا</th><th class="n">السعر</th></tr></thead><tbody>' +
          byType[k].map(function (p) {
            return '<tr><td><b>' + U.esc(p.name) + '</b>' + (p.note ? '<br><span style="font-size:10px;color:#777">' +
              U.esc(p.note) + '</span>' : '') + '</td>' +
              '<td class="n">' + (p.sessions || '—') + '</td>' +
              '<td>' + (p.months || 1) + ' شهر</td>' +
              '<td style="font-size:10.5px">' + U.esc(p.perks || '—') + '</td>' +
              '<td class="n"><b>' + U.n(S.planPrice(p, b)) + ' ' + CZ.CUR + '</b></td></tr>';
          }).join('') + '</tbody></table>';
      }).join('') +
      '<div class="a4-f"><span>' + U.esc(S.db().settings.gymName) + ' — ' + U.esc(S.db().settings.tagline) + '</span>' +
      '<span>الأسعار سارية من ' + U.fDate(U.today()) + '</span></div></div>');
  }
})();
