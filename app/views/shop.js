/* ============================================================
   سيزر جيم — البوفيه والمكملات
   نقطة بيع بسيطة: تدوس على الصنف يتزوّد في السلة، تختار العضو
   لو حابب، وتقفل. المخزون بينقص لوحده والفلوس بتروح الخزنة.
   ============================================================ */
(function () {
  'use strict';
  var CZ = window.CZ, U = CZ.u, S = CZ.s, W = CZ.w;
  CZ.views = CZ.views || {};
  CZ.state = CZ.state || { user: null, branch: 'all', params: {} };

  var T = 'pos';
  var cart = [];
  var cartMember = null;
  var saleModal = null, saleMethod = 'cash', saleBranch = null;

  function bindMember(root) {
    var input = U.$('#pos-member', root);
    if (input) input.onchange = function () { cartMember = input.value || null; };
    var method = U.$('[name=method]', root);
    if (method) { method.value = saleMethod; method.onchange = function () { saleMethod = method.value; }; }
  }
  function repaintSale() {
    if (!saleModal) { CZ.render(); return; }
    saleModal.body.innerHTML = VIEWS.pos(saleBranch, S.scope(S.all('products'), saleBranch));
    bindMember(saleModal.el);
  }
  CZ.saleModal = function (branch) {
    if (!S.can('shop') || saleModal) return;
    var selectedBranch = branch || CZ.state.branch;
    if (selectedBranch === 'all') {
      var picker = U.modal({ title: 'تسجيل مبيعات', sub: 'اختار الفرع اللي هتسجّل فيه البيع', body: W.branchField(),
        footer: '<button class="btn btn-ghost" data-close>إلغاء</button><button class="btn btn-lime" id="rx-sale-branch">ابدأ البيع</button>' });
      U.$('#rx-sale-branch', picker.el).onclick = function () { var id = W.form(picker.el).branchId; picker.close(); CZ.saleModal(id); };
      return;
    }
    cart = []; cartMember = null; saleMethod = 'cash'; saleBranch = selectedBranch;
    saleModal = U.modal({ title: 'تسجيل مبيعات', sub: S.branchName(saleBranch), width: 'xl', body: '',
      footer: '<button class="btn btn-ghost" data-close>إغلاق</button>',
      onClose: function () { saleModal = null; saleBranch = null; cart = []; cartMember = null; } });
    saleModal.el.classList.add('rx-sale');
    repaintSale();
  };

  CZ.views.shop = {
    title: 'البوفيه والمكملات',
    sub: function () { return CZ.state.branch === 'all' ? 'اختار فرع عشان تبيع' : S.branchName(CZ.state.branch); },
    perm: 'shop',
    render: function (p) {
      if (p.tab) { T = p.tab; delete p.tab; }
      var b = CZ.state.branch;
      var prods = S.scope(S.all('products'), b);
      var low = prods.filter(function (x) { return x.active !== false && x.stock <= (x.minStock || 0) && x.stock < 900; });
      var today = U.today();
      var salesToday = S.scope(S.where('sales', function (s) { return s.at.slice(0, 10) === today; }), b);
      var sales30 = S.scope(S.where('sales', function (s) { return s.at >= U.addDays(today, -29); }), b);
      var profit30 = U.sum(sales30, 'total') - U.sum(sales30, 'cost');
      var stockValue = U.sum(prods.filter(function (x) { return x.stock < 900; }), function (x) { return x.stock * x.cost; });

      return '<div class="grid g-4 mb">' +
        W.stat({ t: 'مبيعات النهاردة', v: U.n(U.sum(salesToday, 'total')), cur: CZ.CUR, ico: 'shop', tone: 'ok',
          d: salesToday.length + ' عملية' }) +
        W.stat({ t: 'مبيعات 30 يوم', v: U.n(U.sum(sales30, 'total')), cur: CZ.CUR, ico: 'chart', tone: 'info' }) +
        W.stat({ t: 'ربح 30 يوم', v: U.n(profit30), cur: CZ.CUR, ico: 'trend', tone: 'lime', dark: true,
          d: 'هامش ' + U.pct(profit30, U.sum(sales30, 'total')) + '%' }) +
        W.stat({ t: 'قيمة المخزون', v: U.n(stockValue), cur: CZ.CUR, ico: 'box', tone: 'gold',
          d: low.length ? low.length + ' صنف محتاج طلب' : 'المخزون تمام', go: '#/shop?tab=stock' }) +
        '</div>' +

        (low.length ? W.alert('warn', low.length + ' صنف خلص أو قرب يخلص',
          low.slice(0, 5).map(function (x) { return x.name + ' (' + x.stock + ')'; }).join('، '),
          '<button class="btn btn-sm btn-ghost" data-shtab="stock">شوف</button>') + '<div class="mb"></div>' : '') +

        '<div class="tabs mb">' + [['pos', 'بيع سريع'], ['stock', 'المخزون'], ['sales', 'سجل المبيعات'], ['an', 'تحليل']]
          .map(function (t) {
            return '<button data-shtab="' + t[0] + '"' + (T === t[0] ? ' class="on"' : '') + '>' + t[1] + '</button>';
          }).join('') + '</div>' +
        VIEWS[T](b, prods);
    },
    after: function () {
      var e;
      if ((e = U.$('#sh-new'))) e.addEventListener('click', function () { prodForm(); });
      if ((e = U.$('#sh-restock'))) e.addEventListener('click', restockAll);
      if ((e = U.$('#sh-export'))) e.addEventListener('click', function () {
        var rows = [['الصنف', 'الفئة', 'التكلفة', 'سعر البيع', 'الربح', 'المخزون', 'حد الطلب', 'الفرع']];
        S.scope(S.all('products'), CZ.state.branch).forEach(function (x) {
          rows.push([x.name, x.cat, x.cost, x.price, x.price - x.cost, x.stock, x.minStock, S.branchShort(x.branchId)]);
        });
        U.csv('مخزون-' + U.today(), rows);
      });
      bindMember(U.$('#page'));
    }
  };

  U.on('click', '[data-shtab]', function (e, el) {
    if (!U.$('.tabs [data-shtab]')) return;
    T = el.getAttribute('data-shtab'); CZ.render();
  });

  var VIEWS = {
    /* ---------- نقطة البيع ---------- */
    pos: function (b, prods) {
      if (b === 'all') {
        return W.empty('اختار فرع الأول', 'البيع بيتسجّل على فرع معيّن — بدّل الفرع من فوق.', 'branch');
      }
      var cats = U.uniq(prods.map(function (x) { return x.cat; }));
      var tot = U.sum(cart, function (c) { return c.price * c.qty; });
      return '<div class="grid g-3-2">' +
        '<div>' + cats.map(function (c) {
          var items = prods.filter(function (x) { return x.cat === c && x.active !== false; });
          return W.sectH(c) + '<div class="grid g-4" style="gap:9px">' + items.map(function (x) {
            var out = x.stock <= 0 && x.stock < 900;
            return '<button class="stat" data-add="' + x.id + '"' + (out ? ' disabled' : '') +
              ' style="text-align:start;cursor:pointer;' + (out ? 'opacity:.45' : '') + '">' +
              '<div class="stat-t" style="color:var(--ink);font-weight:800;font-size:13.5px;line-height:1.35">' + U.esc(x.name) + '</div>' +
              '<div class="row-b mt-s"><b class="money" style="font-size:16px">' + U.n(x.price) + '</b>' +
              (x.stock < 900 ? '<span class="xs ' + (x.stock <= x.minStock ? 'neg' : 'fnt') + '">' + x.stock + ' متاح</span>' : '') +
              '</div></button>';
          }).join('') + '</div>';
        }).join('') + '</div>' +

        W.card({
          title: 'الفاتورة', ico: 'receipt', tone: 'lime',
          act: cart.length ? '<button class="btn btn-sm btn-danger" id="pos-clear">' + U.ico('trash') + '</button>' : '',
          body: (cart.length ? '<div style="display:grid;gap:8px">' + cart.map(function (c, i) {
            return '<div class="list-i" style="padding:8px 0;border-color:var(--hair)">' +
              '<div class="li-t"><b>' + U.esc(c.name) + '</b><span>' + U.n(c.price) + ' × ' + c.qty + '</span></div>' +
              '<div class="row" style="gap:4px;flex-wrap:nowrap">' +
              '<button class="btn btn-sm btn-soft btn-ico" data-qty="' + i + '|-1">' + U.ico('minus') + '</button>' +
              '<b class="num" style="width:24px;text-align:center">' + c.qty + '</b>' +
              '<button class="btn btn-sm btn-soft btn-ico" data-qty="' + i + '|1">' + U.ico('plus') + '</button>' +
              '</div>' +
              '<b class="money" style="width:64px;text-align:end">' + U.n(c.price * c.qty) + '</b></div>';
          }).join('') + '</div>' : W.empty('السلة فاضية', 'دوس على أي صنف يتزوّد.', 'shop')) +
            (cart.length ? '<div class="hr"></div>' +
              '<div class="row-b" style="font-size:19px"><b>الإجمالي</b><b class="money" style="font-size:22px">' +
              U.n(tot) + ' ' + CZ.CUR + '</b></div>' +
              '<div class="f mt">' +
              '<div class="fld"><label>العضو (اختياري)</label>' +
              '<select class="inp" id="pos-member"><option value="">زبون عادي</option>' +
              S.scope(S.all('members'), b).sort(U.by('name')).map(function (m) {
                return '<option value="' + m.id + '"' + (cartMember === m.id ? ' selected' : '') + '>' +
                  U.esc(m.name) + ' — ' + U.esc(m.code) + '</option>';
              }).join('') + '</select></div>' +
              W.fld({ label: 'طريقة الدفع', name: 'method', type: 'select',
                opts: Object.keys(S.METHODS).map(function (k) { return [k, S.METHODS[k]]; }) }) +
              '<button class="btn btn-lime btn-lg btn-blk" id="pos-pay">' + U.ico('check') + 'تحصيل ' + U.n(tot) + ' ' + CZ.CUR + '</button>' +
              '</div>' : ''),
          foot: 'البيع بيتسجّل في الخزنة تلقائي تحت بند «بوفيه ومكملات».'
        }) +
        '</div>';
    },

    /* ---------- المخزون ---------- */
    stock: function (b, prods) {
      return W.toolbar({
        search: false,
        act: '<button class="btn btn-ghost btn-sm" id="sh-export">' + U.ico('export') + 'تصدير</button>' +
          '<button class="btn btn-ghost btn-sm" id="sh-restock">' + U.ico('box') + 'قائمة طلبيات</button>' +
          '<button class="btn btn-lime btn-sm" id="sh-new">' + U.ico('plus') + 'صنف جديد</button>'
      }) +
        W.card({
          flush: true,
          body: W.table([
            { k: 'name', t: 'الصنف', sort: false, render: function (x) {
              return '<b>' + U.esc(x.name) + '</b><div class="xs fnt">' + U.esc(x.cat) +
                (x.sku ? ' · ' + x.sku : '') + '</div>';
            }},
            { t: 'التكلفة', sort: false, cls: 'num end', render: function (x) { return U.n(x.cost); } },
            { t: 'سعر البيع', sort: false, cls: 'num end', render: function (x) { return '<b class="money">' + U.n(x.price) + '</b>'; } },
            { t: 'الربح', sort: false, cls: 'num end', render: function (x) {
              var pr = x.price - x.cost;
              return '<span class="' + (pr > 0 ? 'pos' : 'neg') + ' money">' + U.n(pr) + '</span>' +
                '<div class="xs fnt">' + U.pct(pr, x.price) + '%</div>';
            }},
            { t: 'المخزون', sort: false, cls: 'mid', render: function (x) {
              if (x.stock >= 900) return '<span class="badge">خدمة</span>';
              var cls = x.stock <= 0 ? 'danger' : x.stock <= x.minStock ? 'warn' : 'ok';
              return '<span class="badge ' + cls + '">' + U.n(x.stock) + '</span>' +
                '<div class="xs fnt">حد الطلب ' + (x.minStock || 0) + '</div>';
            }},
            { t: 'قيمة المخزون', sort: false, cls: 'num end', render: function (x) {
              return x.stock < 900 ? U.n(x.stock * x.cost) : '—';
            }},
            { t: 'الفرع', sort: false, render: function (x) { return W.branchTag(x.branchId); } },
            { t: '', sort: false, cls: 'end', render: function (x) {
              return '<div class="rowact">' +
                '<button class="btn btn-sm btn-ok" data-stockin="' + x.id + '">' + U.ico('plus') + 'توريد</button>' +
                '<button class="btn btn-sm btn-soft btn-ico" data-pedit2="' + x.id + '">' + U.ico('edit') + '</button>' +
                '<button class="btn btn-sm btn-danger btn-ico" data-pdel2="' + x.id + '">' + U.ico('trash') + '</button></div>';
            }}
          ], prods.sort(U.by('cat')), { emptyT: 'مفيش أصناف', emptyIco: 'shop' })
        });
    },

    /* ---------- سجل المبيعات ---------- */
    sales: function (b) {
      var sales = S.scope(S.all('sales'), b).sort(U.by('at', 'desc')).slice(0, 200);
      return W.card({
        flush: true,
        title: 'آخر 200 عملية بيع',
        body: W.table([
          { t: 'التاريخ', sort: false, render: function (x) {
            return U.fDate(x.at, 'short') + ' <span class="xs fnt num">' + U.fTime(x.at) + '</span>';
          }},
          { t: 'الصنف', sort: false, render: function (x) { return '<b class="sm">' + U.esc(x.name) + '</b>'; } },
          { t: 'الكمية', sort: false, cls: 'num mid', render: function (x) { return x.qty; } },
          { t: 'العضو', sort: false, render: function (x) {
            if (!x.memberId) return '<span class="fnt">زبون عادي</span>';
            var m = S.member(x.memberId);
            return m ? '<button class="btn btn-sm btn-soft" data-mem="' + m.id + '">' + U.esc(m.name) + '</button>' : '—';
          }},
          { t: 'الطريقة', sort: false, render: function (x) { return '<span class="badge">' + (S.METHODS[x.method] || '') + '</span>'; } },
          { t: 'الفرع', sort: false, render: function (x) { return W.branchTag(x.branchId); } },
          { t: 'الإجمالي', sort: false, cls: 'num end', render: function (x) { return U.money(x.total); } },
          { t: 'الربح', sort: false, cls: 'num end', render: function (x) {
            return '<span class="money pos">' + U.n(x.total - (x.cost || 0)) + '</span>';
          }}
        ], sales, { emptyT: 'مفيش مبيعات', emptyIco: 'shop' })
      });
    },

    /* ---------- تحليل ---------- */
    an: function (b) {
      var sales = S.scope(S.where('sales', function (s) { return s.at >= U.addDays(U.today(), -90); }), b);
      var byProd = {}, byCat = {};
      sales.forEach(function (s) {
        byProd[s.name] = byProd[s.name] || { v: 0, q: 0, p: 0 };
        byProd[s.name].v += s.total; byProd[s.name].q += s.qty;
        byProd[s.name].p += s.total - (s.cost || 0);
        var pr = S.get('products', s.productId);
        var c = pr ? pr.cat : 'أخرى';
        byCat[c] = (byCat[c] || 0) + s.total;
      });
      var top = Object.keys(byProd).sort(function (a, c) { return byProd[c].v - byProd[a].v; }).slice(0, 10);
      var days = [];
      for (var i = 29; i >= 0; i--) {
        var d = U.addDays(U.today(), -i);
        days.push({ d: d, v: U.sum(sales.filter(function (s) { return s.at.slice(0, 10) === d; }), 'total') });
      }
      return '<div class="grid g-2">' +
        W.card({
          title: 'أكتر 10 أصناف بيعًا — آخر 90 يوم', ico: 'star', tone: 'gold',
          body: top.length ? CZ.c.rank(top.map(function (k) {
            return { t: k, v: byProd[k].v, sub: byProd[k].q + ' قطعة · ربح ' + U.m(byProd[k].p) };
          }), { money: true }) : W.empty('مفيش مبيعات', '', 'shop')
        }) +
        W.card({
          title: 'المبيعات حسب الفئة', ico: 'grid',
          body: Object.keys(byCat).length ? CZ.c.donut(Object.keys(byCat).map(function (k, i) {
            return { t: k, v: byCat[k], color: ['#6F9410', '#3A6EA5', '#E8B14C', '#6B5AA8', '#C0492B'][i % 5] };
          }), { center: U.n(U.sum(sales, 'total')), centerSub: '90 يوم' }) : W.empty('مفيش بيانات', '', 'grid')
        }) +
        '</div>' +
        '<div class="mt">' + W.card({
          title: 'مبيعات آخر 30 يوم', ico: 'chart',
          body: CZ.c.line([{ name: 'مبيعات', data: days.map(function (x) { return x.v; }), color: '#6F9410' }],
            { h: 200, labels: days.map(function (x) { return U.fDate(x.d, 'short'); }), legend: false })
        }) + '</div>';
    }
  };

  /* ---------- السلة ---------- */
  U.on('click', '[data-add]', function (e, el) {
    var p = S.get('products', el.getAttribute('data-add'));
    if (!p) return;
    var found = null;
    cart.forEach(function (c) { if (c.id === p.id) found = c; });
    if (p.stock < 900 && (found ? found.qty + 1 : 1) > p.stock) { U.toast('الكمية أكبر من المخزون المتاح', 'err'); return; }
    if (found) found.qty++;
    else cart.push({ id: p.id, name: p.name, price: p.price, cost: p.cost, qty: 1 });
    repaintSale();
  });
  U.on('click', '[data-qty]', function (e, el) {
    var p = el.getAttribute('data-qty').split('|');
    var i = +p[0], d = +p[1];
    if (!cart[i]) return;
    var product = S.get('products', cart[i].id);
    if (d > 0 && product && product.stock < 900 && cart[i].qty + d > product.stock) { U.toast('الكمية أكبر من المخزون المتاح', 'err'); return; }
    cart[i].qty += d;
    if (cart[i].qty <= 0) cart.splice(i, 1);
    repaintSale();
  });
  U.on('click', '#pos-clear', function () { cart = []; cartMember = null; repaintSale(); });
  U.on('click', '#pos-pay', function () {
    if (!cart.length) return;
    var b = saleModal ? saleBranch : CZ.state.branch;
    if (b === 'all' || !S.can('shop')) return;
    if (cart.some(function (c) { var p = S.get('products', c.id); return !p || p.branchId !== b || p.active === false || (p.stock < 900 && p.stock < c.qty); })) {
      U.toast('راجع الفرع والكمية المتاحة للأصناف', 'err'); return;
    }
    var root = saleModal ? saleModal.el : U.$('#page');
    var method = (U.$('[name=method]', root) || {}).value || 'cash';
    var memberId = (U.$('#pos-member', root) || {}).value || null;
    var tot = U.sum(cart, function (c) { return c.price * c.qty; });
    var cost = U.sum(cart, function (c) { return (c.cost || 0) * c.qty; });
    var at = U.isoT();
    cart.forEach(function (c) {
      S.add('sales', {
        productId: c.id, name: c.name, qty: c.qty, price: c.price,
        total: c.price * c.qty, cost: (c.cost || 0) * c.qty,
        memberId: memberId, branchId: b, at: at, method: method
      }, true);
      var p = S.get('products', c.id);
      if (p && p.stock < 900) p.stock = Math.max(0, p.stock - c.qty);
    });
    S.addMoney({
      kind: 'in', amount: tot, cat: 'shop', method: method,
      memberId: memberId, branchId: b, at: at,
      note: cart.map(function (c) { return c.name + '×' + c.qty; }).join('، ')
    });
    S.log('بيع بوفيه', 'sales', '', U.m(tot));
    S.save(true);
    var lines = cart.map(function (c) { return [c.name + ' ×' + c.qty, U.n(c.price * c.qty) + ' ' + CZ.CUR]; });
    var mem = memberId ? S.member(memberId) : null;
    U.toast('اتحصّل ' + U.m(tot));
    cart = []; cartMember = null;
    if (saleModal) saleModal.close();
    CZ.render();
    U.confirm({ title: 'تطبع إيصال؟', body: 'إيصال بوفيه بمقاس 80 مم.', ok: 'اطبع' }).then(function (y) {
      if (!y) return;
      U.print(W.receipt({
        no: at.slice(-5).replace(':', ''), at: at, member: mem, branchId: b,
        title: 'إيصال بوفيه', lines: lines, total: tot, paid: tot, method: method, by: CZ.state.user.name
      }));
    });
  });

  /* ---------- الأصناف ---------- */
  function prodForm(id) {
    var p = id ? S.get('products', id) : null;
    var x = p || { active: true, minStock: 5, stock: 0 };
    var mo = U.modal({
      title: p ? 'تعديل صنف' : 'صنف جديد',
      body: '<div class="f" id="prf">' +
        '<div class="f-row">' +
        W.fld({ label: 'اسم الصنف', name: 'name', val: x.name, req: true }) +
        W.fld({ label: 'الفئة', name: 'cat', val: x.cat, ph: 'مكملات / مشروبات / إكسسوارات' }) +
        '</div>' +
        '<div class="f-row c3">' +
        W.fld({ label: 'سعر الشراء', name: 'cost', type: 'number', val: x.cost, suffix: CZ.CUR }) +
        W.fld({ label: 'سعر البيع', name: 'price', type: 'number', val: x.price, suffix: CZ.CUR, req: true }) +
        W.fld({ label: 'الكود', name: 'sku', val: x.sku }) +
        '</div>' +
        '<div class="f-row c3">' +
        W.fld({ label: 'المخزون الحالي', name: 'stock', type: 'number', val: x.stock }) +
        W.fld({ label: 'حد الطلب', name: 'minStock', type: 'number', val: x.minStock,
          hint: 'لما المخزون يوصله بينبّهك' }) +
        W.branchField(x.branchId) +
        '</div>' +
        W.check({ name: 'active', t: 'الصنف معروض للبيع', on: x.active !== false }) +
        '</div>',
      footer: '<div class="grow"></div><button class="btn btn-ghost" data-close>إلغاء</button>' +
        '<button class="btn btn-lime" id="prf-ok">' + U.ico('save') + 'احفظ</button>'
    });
    U.$('#prf-ok', mo.el).addEventListener('click', function () {
      var d = W.form(U.$('#prf', mo.el));
      if (!d.name) { U.toast('اكتب اسم الصنف', 'err'); return; }
      if (p) S.upd('products', p.id, d); else S.add('products', d);
      U.toast('اتحفظ'); mo.close(); CZ.render();
    });
  }
  U.on('click', '[data-pedit2]', function (e, el) { prodForm(el.getAttribute('data-pedit2')); });
  U.on('click', '[data-pdel2]', function (e, el) {
    U.confirm({ title: 'حذف الصنف؟', danger: true, body: 'المبيعات القديمة هتفضل زي ما هي.', ok: 'احذف' })
      .then(function (y) { if (y) { S.del('products', el.getAttribute('data-pdel2')); CZ.render(); } });
  });

  U.on('click', '[data-stockin]', function (e, el) {
    var p = S.get('products', el.getAttribute('data-stockin'));
    var mo = U.modal({
      title: 'توريد ' + p.name, width: 'sm',
      sub: 'المخزون الحالي: ' + p.stock,
      body: '<div class="f">' +
        W.fld({ label: 'الكمية الواردة', name: 'qty', type: 'number', val: 10, req: true }) +
        W.fld({ label: 'تكلفة الوحدة', name: 'cost', type: 'number', val: p.cost, suffix: CZ.CUR }) +
        W.check({ name: 'expense', t: 'سجّل التكلفة كمصروف في الخزنة', on: true }) +
        '</div>',
      footer: '<div class="grow"></div><button class="btn btn-ghost" data-close>إلغاء</button>' +
        '<button class="btn btn-lime" id="st-ok">' + U.ico('check') + 'ورّد</button>'
    });
    U.$('#st-ok', mo.el).addEventListener('click', function () {
      var d = W.form(mo.el);
      S.upd('products', p.id, { stock: (p.stock || 0) + (d.qty || 0), cost: d.cost });
      if (d.expense) {
        S.addMoney({
          kind: 'out', amount: (d.qty || 0) * (d.cost || 0), cat: 'stock', method: 'cash',
          branchId: p.branchId, note: 'توريد ' + p.name + ' ×' + d.qty
        });
      }
      U.toast('اتورّد ' + d.qty); mo.close(); CZ.render();
    });
  });

  function restockAll() {
    var low = S.scope(S.all('products'), CZ.state.branch)
      .filter(function (x) { return x.active !== false && x.stock <= (x.minStock || 0) && x.stock < 900; });
    if (!low.length) { U.toast('كل حاجة متوفرة'); return; }
    var txt = 'طلبية سيزر جيم — ' + U.fDate(U.today()) + '\n\n' +
      low.map(function (x, i) {
        return (i + 1) + '. ' + x.name + ' — المتاح ' + x.stock + ' (المطلوب على الأقل ' + ((x.minStock || 0) * 3) + ')';
      }).join('\n');
    U.modal({
      title: 'قائمة الطلبيات', sub: low.length + ' صنف محتاج توريد',
      body: '<textarea class="inp" rows="12" id="rs-t" style="font-family:Archivo,sans-serif">' + U.esc(txt) + '</textarea>',
      footer: '<div class="grow"></div>' +
        '<button class="btn btn-ghost" id="rs-copy">' + U.ico('copy') + 'انسخ</button>' +
        '<a class="btn btn-ok" href="' + U.wa('', txt) + '" target="_blank" rel="noopener">' + U.ico('msg') + 'ابعت واتساب</a>'
    });
    U.$('#rs-copy').addEventListener('click', function () {
      U.$('#rs-t').select(); document.execCommand('copy'); U.toast('اتنسخت');
    });
  }
})();
