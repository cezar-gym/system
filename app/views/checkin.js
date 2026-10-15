/* ============================================================
   سيزر جيم — الدخول والحضور
   دي الشاشة اللي الريسبشن هيقعد عليها طول اليوم.
   القاعدة: أي مشكلة في العضو لازم تبان قبل ما يدخل، مش بعدين.
   ============================================================ */
(function () {
  'use strict';
  var CZ = window.CZ, U = CZ.u, S = CZ.s, W = CZ.w;
  CZ.views = CZ.views || {};
  CZ.state = CZ.state || { user: null, branch: 'all', params: {} };

  /* ---------- المودال السريع (من أي مكان في النظام) ---------- */
  CZ.quickCheckin = function (prefill) {
    var m = U.modal({
      title: 'تسجيل دخول عضو',
      sub: 'اكتب الكود أو التليفون أو الاسم',
      width: 'lg',
      body:
        '<div class="scan"><input id="qc-in" placeholder="كود العضو / تليفون / اسم" autocomplete="off" ' +
        'value="' + U.esc(prefill || '') + '">' +
        '<button class="btn btn-lime btn-lg" id="qc-go">' + U.ico('check') + 'دخول</button></div>' +
        '<div id="qc-res" class="mt"></div>',
      footer: '<div class="grow xs fnt">اضغط Enter للتسجيل · Alt+D يفتح الشاشة دي من أي مكان</div>' +
        '<button class="btn btn-ghost" data-close>إغلاق</button>'
    });
    var inp = U.$('#qc-in', m.el), res = U.$('#qc-res', m.el);
    setTimeout(function () { inp.focus(); inp.select(); }, 80);

    function find(q) {
      q = q.trim();
      if (!q) return [];
      var exact = S.all('members').filter(function (x) { return String(x.code) === q; });
      if (exact.length) return exact;
      return S.all('members').filter(function (x) {
        return U.phone(x.phone) === U.phone(q) || U.match(x.name, q) || String(x.code).indexOf(q) === 0;
      }).slice(0, 6);
    }

    function show() {
      var list = find(inp.value);
      if (!list.length) {
        res.innerHTML = inp.value.trim()
          ? W.empty('مفيش عضو بالبيانات دي', 'ممكن يكون زائر أو تمرين منفصل.', 'search',
            '<button class="btn btn-ghost btn-sm" id="qc-guest">' + U.ico('plus') + 'سجّل زيارة / تمرين منفصل</button>' +
            ' <button class="btn btn-lime btn-sm" id="qc-new">' + U.ico('plus') + 'عضو جديد</button>')
          : '';
        var g = U.$('#qc-guest', res); if (g) g.addEventListener('click', function () { m.close(); guestModal(); });
        var nb = U.$('#qc-new', res); if (nb) nb.addEventListener('click', function () { m.close(); CZ.memberForm(); });
        return;
      }
      if (list.length > 1) {
        res.innerHTML = '<div class="pop-t lat">اختار العضو</div><div class="pick">' + list.map(function (x) {
          var st = S.status(x);
          return '<button class="pick-i" data-pick="' + x.id + '">' + W.ava(x, 'sm') +
            '<span class="pi-t"><b>' + U.esc(x.name) + '</b><span class="pi-sub">' + U.esc(x.code) + ' · ' +
            U.fPhone(x.phone) + ' · ' + S.branchShort(x.branchId) + '</span></span>' +
            '<span class="badge ' + st.cls + '">' + U.esc(st.t) + '</span></button>';
        }).join('') + '</div>';
        U.$$('[data-pick]', res).forEach(function (b) {
          b.addEventListener('click', function () { inp.value = S.member(b.getAttribute('data-pick')).code; show(); });
        });
        return;
      }
      res.innerHTML = verdict(list[0]);
      bind(list[0]);
    }

    function verdict(mem) {
      var branch = CZ.state.branch !== 'all' ? CZ.state.branch : mem.branchId;
      var e = S.checkEligible(mem, branch);
      var sub = e.sub || S.activeSub(mem.id) || S.lastSub(mem.id);
      var left = sub ? S.sessionsLeft(sub) : 0;
      var days = sub ? U.diffDays(sub.endAt) : 0;
      var last = S.lastVisit(mem.id);

      var head = '<div class="card"><div class="card-b">' +
        '<div class="row" style="gap:14px;flex-wrap:nowrap;align-items:flex-start">' +
        W.ava(mem, 'lg') +
        '<div style="flex:1;min-width:0">' +
        '<div class="row" style="gap:8px"><b style="font-size:19px">' + U.esc(mem.name) + '</b>' +
        W.statusBadge(mem) + W.branchTag(mem.branchId) + '</div>' +
        '<div class="mut sm mt-s">' + U.esc(mem.code) + ' · ' + U.fPhone(mem.phone) +
        (mem.job ? ' · ' + U.esc(mem.job) : '') + '</div>' +
        (mem.medical ? '<div class="alert danger mt-s" style="padding:8px 11px;font-size:12.5px">' +
          U.ico('heart') + '<div><b>ملاحظة طبية</b>' + U.esc(mem.medical) + '</div></div>' : '') +
        '</div>' +
        '<div class="end">' +
        (sub ? '<div class="num" style="font-size:30px;font-weight:900;line-height:1;color:' +
          (left <= 2 ? 'var(--danger)' : 'var(--ink)') + '">' + (left === Infinity ? '∞' : U.n(left)) + '</div>' +
          '<div class="xs mut">جلسة فاضلة</div>' : '') +
        '</div></div>' +

        (sub ? '<div class="grid g-3 mt">' +
          kv('الباقة', sub.planName) +
          kv('لحد', U.fDate(sub.endAt) + (days >= 0 ? ' (' + days + ' يوم)' : ' — خلص')) +
          kv('آخر مرة جه', last ? U.ago(last.inAt) : 'عمره ما جه') +
          '</div>' : '') +
        '</div></div>';

      if (!e.ok) {
        return head + '<div class="mt">' +
          W.alert('danger', 'مينفعش يدخل', e.reason,
            (e.renew ? '<button class="btn btn-sm btn-lime" id="qc-renew">' + U.ico('refresh') + 'جدّد دلوقتي</button>' : '') +
            (e.frozen ? '<button class="btn btn-sm btn-ink" id="qc-unfreeze">' + U.ico('play') + 'فك التجميد</button>' : '') +
            (e.dup ? '<button class="btn btn-sm btn-ghost" id="qc-out">' + U.ico('logout') + 'سجّل خروجه</button>' : '')) +
          (e.renew ? '<div class="mt">' + W.alert('info', 'بديل سريع',
            'لو مش هيجدّد دلوقتي، تقدر تحاسبه تمرين منفصل بـ ' + U.m(150) + '.',
            '<button class="btn btn-sm btn-ghost" id="qc-single">تمرين منفصل</button>') + '</div>' : '') +
          '</div>';
      }

      return head +
        (e.warns.length ? '<div class="mt" style="display:grid;gap:8px">' + e.warns.map(function (w) {
          return W.alert('warn', 'انتبه', w);
        }).join('') + '</div>' : '') +
        '<div class="mt row" style="gap:8px">' +
        '<button class="btn btn-lime btn-lg" id="qc-do" style="flex:1">' + U.ico('check') +
        'سجّل الدخول — ' + U.esc(mem.name.split(' ')[0]) + '</button>' +
        '<button class="btn btn-ghost btn-lg" id="qc-profile">' + U.ico('user') + 'الملف</button>' +
        '</div>';
    }

    function kv(t, v) {
      return '<div><div class="xs mut">' + U.esc(t) + '</div><b style="font-size:14.5px">' + U.esc(v) + '</b></div>';
    }

    function bind(mem) {
      var branch = CZ.state.branch !== 'all' ? CZ.state.branch : mem.branchId;
      var b;
      if ((b = U.$('#qc-do', res))) b.addEventListener('click', function () {
        S.checkIn(mem.id, branch);
        U.toast('اتسجّل دخول ' + mem.name.split(' ')[0] + ' 👊');
        m.close(); if (CZ.render) CZ.render();
      });
      if ((b = U.$('#qc-profile', res))) b.addEventListener('click', function () { m.close(); CZ.memberDrawer(mem.id); });
      if ((b = U.$('#qc-renew', res))) b.addEventListener('click', function () { m.close(); CZ.renewModal(mem.id); });
      if ((b = U.$('#qc-single', res))) b.addEventListener('click', function () { m.close(); guestModal(mem); });
      if ((b = U.$('#qc-unfreeze', res))) b.addEventListener('click', function () {
        S.unfreeze(S.activeSub(mem.id).id); U.toast('التجميد اتفك'); show();
      });
      if ((b = U.$('#qc-out', res))) b.addEventListener('click', function () {
        var a = S.find('attend', function (x) { return x.memberId === mem.id && !x.outAt; });
        if (a) S.checkOut(a.id);
        U.toast('اتسجّل خروج'); show();
      });
    }

    inp.addEventListener('input', U.debounce(show, 160));
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var go = U.$('#qc-do', res);
        if (go) go.click(); else show();
      }
    });
    U.$('#qc-go', m.el).addEventListener('click', function () {
      var go = U.$('#qc-do', res); if (go) go.click(); else show();
    });
    if (prefill) show();
  };

  /* ---------- زيارة / تمرين منفصل ---------- */
  function guestModal(mem) {
    var singles = S.all('plans').filter(function (p) { return p.type === 'single'; });
    var branch = CZ.state.branch !== 'all' ? CZ.state.branch : S.branches()[0].id;
    var m = U.modal({
      title: 'زيارة أو تمرين منفصل',
      sub: 'من غير اشتراك — بيتسجّل في الحضور والخزنة',
      body: '<div class="f">' +
        (mem ? '<div class="pick-i on" style="cursor:default">' + W.ava(mem, 'sm') +
          '<span class="pi-t"><b>' + U.esc(mem.name) + '</b><span class="pi-sub">' + U.esc(mem.code) + '</span></span></div>' +
          '<input type="hidden" name="memberId" value="' + mem.id + '">'
          : W.fld({ label: 'الاسم', name: 'name', ph: 'اسم الزائر', req: true })) +
        (mem ? '' : W.fld({ label: 'التليفون', name: 'phone', type: 'tel', ico: 'phone', ph: '01xxxxxxxxx' })) +
        '<div class="f-row">' +
        W.fld({
          label: 'النوع', name: 'planId', type: 'select',
          opts: singles.map(function (p) { return [p.id, p.name + ' — ' + U.m(p.price)]; })
            .concat([['guest', 'دعوة مجانية (من مزايا الاشتراك)']])
        }) +
        W.fld({ label: 'المبلغ', name: 'amount', type: 'number', val: singles[0] ? singles[0].price : 150, suffix: CZ.CUR }) +
        '</div>' +
        '<div class="f-row">' +
        W.fld({
          label: 'طريقة الدفع', name: 'method', type: 'select',
          opts: Object.keys(S.METHODS).map(function (k) { return [k, S.METHODS[k]]; })
        }) +
        W.branchField(branch) + '</div>' +
        W.fld({ label: 'ملاحظة', name: 'note', ph: 'مين دعاه، أو أي تفصيلة' }) +
        '</div>',
      footer: '<div class="grow"></div><button class="btn btn-ghost" data-close>إلغاء</button>' +
        '<button class="btn btn-lime" id="g-save">' + U.ico('check') + 'سجّل</button>'
    });
    U.$('[name=planId]', m.el).addEventListener('change', function (e) {
      var p = S.plan(e.target.value);
      U.$('[name=amount]', m.el).value = p ? p.price : 0;
    });
    U.$('#g-save', m.el).addEventListener('click', function () {
      var d = W.form(m.el);
      if (!mem && !d.name) { U.toast('اكتب اسم الزائر', 'err'); return; }
      var rec = {
        id: U.uid('at'), memberId: d.memberId || null, guestName: d.name || (mem ? mem.name : ''),
        guestPhone: d.phone || '', branchId: d.branchId, subId: null,
        inAt: U.isoT(), outAt: null, type: d.planId === 'guest' ? 'guest' : 'single',
        seg: S.segAt(d.branchId), note: d.note || '',
        by: CZ.state.user.id
      };
      S.db().attend.push(rec);
      if (d.amount > 0) {
        S.addMoney({
          kind: 'in', amount: d.amount, cat: d.planId === 'pl_sauna' ? 'sauna' : d.planId === 'guest' ? 'guest' : 'single',
          method: d.method, memberId: d.memberId || null, branchId: d.branchId,
          note: (d.name || (mem ? mem.name : '')) + ' — ' + (S.planName(d.planId) || 'زيارة')
        });
      }
      S.log('سجّل زيارة', 'attend', rec.id, rec.guestName);
      S.save(true);
      U.toast('اتسجّلت الزيارة');
      m.close();
      if (CZ.render) CZ.render();
    });
  }
  CZ.guestModal = guestModal;

  /* ---------- الصفحة ---------- */
  CZ.views.checkin = {
    title: 'الدخول والحضور',
    sub: function () {
      var b = CZ.state.branch === 'all' ? 'كل الفروع' : S.branchName(CZ.state.branch);
      return b + ' · ' + U.fDay(U.today());
    },
    perm: 'checkin',
    render: function (p) {
      var branch = CZ.state.branch;
      var inGym = S.inGym(branch).sort(U.by('inAt', 'desc'));
      var today = U.today();
      var todayAll = S.scope(S.where('attend', function (a) { return a.inAt.slice(0, 10) === today; }), branch)
        .sort(U.by('inAt', 'desc'));
      var bId = branch === 'all' ? S.branches()[0].id : branch;
      var cap = branch === 'all'
        ? U.sum(S.branches(), 'capacity')
        : (S.branch(branch) || {}).capacity || 50;
      var seg = S.segAt(bId);
      var hours = S.heat(branch, 30);
      var nowH = new Date().getHours();
      var todayDow = new Date().getDay();

      return '' +
        /* شريط التسجيل */
        '<div class="scan" style="margin-bottom:16px">' +
        '<div style="flex:none;color:var(--lime)">' + U.ico('scan') + '</div>' +
        '<input id="ci-in" placeholder="اكتب كود العضو أو تليفونه واضغط Enter" autocomplete="off" autofocus>' +
        '<button class="btn btn-lime btn-lg" id="ci-go">' + U.ico('check') + 'دخول</button>' +
        '<button class="btn btn-ghost-light btn-lg" id="ci-guest" style="border:1.5px solid rgba(243,241,235,.3);color:var(--paper)">' +
        U.ico('plus') + '<span class="hide-sm">زيارة</span></button>' +
        '</div>' +
        '<div id="ci-res"></div>' +

        '<div class="grid g-4 mt">' +
        W.stat({ t: 'في الجيم دلوقتي', v: U.n(inGym.length), ico: 'fire', tone: 'lime', dark: true, d: 'السعة ' + cap }) +
        W.stat({ t: 'حضور النهاردة', v: U.n(todayAll.length), ico: 'users', tone: 'ok' }) +
        W.stat({
          t: 'الفترة الحالية', v: seg === 'women' ? 'سيدات' : seg === 'men' ? 'رجالة' : 'مقفول',
          ico: 'clock', tone: seg === 'women' ? 'gold' : 'lime'
        }) +
        W.stat({
          t: 'نسبة الامتلاء', v: U.pct(inGym.length, cap) + '<span class="cur">%</span>',
          ico: 'activity', tone: U.pct(inGym.length, cap) > 85 ? 'danger' : 'info'
        }) +
        '</div>' +

        '<div class="grid g-3-2 mt">' +
        /* في الجيم دلوقتي */
        W.card({
          title: 'اللي في الجيم دلوقتي', ico: 'fire', tone: 'lime',
          sub: inGym.length + ' عضو',
          act: inGym.length ? '<button class="btn btn-sm btn-ghost" id="ci-outall">' + U.ico('logout') + 'خروج الكل</button>' : '',
          flush: true,
          body: inGym.length ? inGym.map(function (a) {
            var mem = a.memberId ? S.member(a.memberId) : null;
            var mins = Math.round((new Date() - U.parse(a.inAt)) / 60000);
            return '<div class="ingym-i">' +
              (mem ? W.ava(mem) : '<span class="ava">' + U.ico('user') + '</span>') +
              '<div class="li-t"><b>' + U.esc(mem ? mem.name : (a.guestName || 'زائر')) + '</b>' +
              '<span>' + (mem ? U.esc(mem.code) + ' · ' : '') + 'دخل ' + U.fTime(a.inAt) +
              (CZ.state.branch === 'all' ? ' · ' + S.branchShort(a.branchId) : '') + '</span></div>' +
              '<span class="dur">' + U.dur(mins) + '</span>' +
              (a.type !== 'session' ? '<span class="badge">' + (a.type === 'guest' ? 'دعوة' : 'منفصل') + '</span>' : '') +
              '<button class="btn btn-sm btn-soft" data-out="' + a.id + '">' + U.ico('logout') + 'خروج</button>' +
              '</div>';
          }).join('') : W.empty('الجيم فاضي دلوقتي', 'أول ما حد يدخل هيبان هنا.', 'door'),
          foot: 'الحضور بيتقفل تلقائي آخر اليوم لو حد نسي يسجّل خروج.'
        }) +

        /* زحمة اليوم */
        W.card({
          title: 'زحمة اليوم ده — متوسط آخر 30 يوم', ico: 'chart',
          body: (function () {
            var row = hours[todayDow];
            var max = Math.max.apply(null, row.concat([1]));
            return '<div class="cap">' + row.map(function (v, h) {
              if (h < 6 || h > 23) return '';
              var pctv = Math.max(4, Math.round(v / max * 100));
              return '<i class="' + (h === nowH ? 'now' : v / max > 0.55 ? 'on' : '') + '" style="height:' + pctv +
                '%;animation-delay:' + (h * 18) + 'ms" title="' + U.fMin(h * 60) + ' — ' + Math.round(v / 30 * 7) + ' في المتوسط"></i>';
            }).join('') + '</div>' +
              '<div class="row-b xs fnt mt-s"><span>6 ص</span><span>2 م</span><span>11 م</span></div>' +
              '<div class="hr"></div>' +
              '<div class="xs mut b" style="margin-bottom:6px">فترات النهاردة</div>' +
              W.segbar(bId, todayDow, true) +
              '<div class="row mt-s" style="gap:14px">' +
              '<span class="row xs" style="gap:5px"><i style="width:10px;height:10px;border-radius:3px;background:var(--lime-deep)"></i>رجالة</span>' +
              '<span class="row xs" style="gap:5px"><i style="width:10px;height:10px;border-radius:3px;background:var(--gold)"></i>سيدات</span>' +
              '<span class="row xs" style="gap:5px"><i style="width:10px;height:10px;border-radius:3px;background:var(--hair-2)"></i>مقفول</span>' +
              '</div>';
          })()
        }) +
        '</div>' +

        /* سجل النهاردة */
        W.sectH('سجل النهاردة', '<button class="btn btn-sm btn-ghost" id="ci-export">' + U.ico('export') + 'تصدير</button>') +
        W.card({
          flush: true,
          body: W.table([
            { k: 'inAt', t: 'الوقت', w: '90px', render: function (a) { return '<span class="num">' + U.fTime(a.inAt) + '</span>'; } },
            { k: 'name', t: 'العضو', render: function (a) {
              var mem = a.memberId ? S.member(a.memberId) : null;
              return mem ? W.who(mem) : '<div class="who"><span class="ava">' + U.ico('user') +
                '</span><div class="who-t"><b>' + U.esc(a.guestName || 'زائر') + '</b><span>زيارة</span></div></div>';
            }},
            { k: 'type', t: 'النوع', render: function (a) {
              return '<span class="badge ' + (a.type === 'session' ? 'lime' : a.type === 'guest' ? 'info' : '') + '">' +
                (a.type === 'session' ? 'جلسة اشتراك' : a.type === 'guest' ? 'دعوة' : 'تمرين منفصل') + '</span>';
            }},
            { k: 'seg', t: 'الفترة', render: function (a) {
              return a.seg === 'women' ? '<span class="badge gold">سيدات</span>' :
                a.seg === 'men' ? '<span class="badge">رجالة</span>' : '<span class="fnt">—</span>';
            }},
            { k: 'branchId', t: 'الفرع', render: function (a) { return W.branchTag(a.branchId); } },
            { k: 'outAt', t: 'الخروج', cls: 'num', render: function (a) {
              return a.outAt ? U.fTime(a.outAt) + (a.autoOut ? ' <span class="xs fnt">(تلقائي)</span>' : '')
                : '<span class="badge ok live"><i class="dot"></i>لسه جوّه</span>';
            }},
            { k: 'dur', t: 'المدة', cls: 'num', render: function (a) {
              var end = a.outAt ? U.parse(a.outAt) : new Date();
              return U.dur((end - U.parse(a.inAt)) / 60000);
            }},
            { t: '', sort: false, cls: 'end', render: function (a) {
              return '<div class="rowact"><button class="btn btn-sm btn-danger" data-undo="' + a.id +
                '" title="إلغاء التسجيل">' + U.ico('trash') + '</button></div>';
            }}
          ], todayAll, { emptyT: 'مفيش حضور مسجّل النهاردة', emptyIco: 'scan' })
        });
    },
    after: function () {
      var inp = U.$('#ci-in'), res = U.$('#ci-res');
      function go() {
        var v = inp.value.trim();
        if (!v) return;
        var list = S.all('members').filter(function (x) {
          return String(x.code) === v || U.phone(x.phone) === U.phone(v);
        });
        if (list.length === 1) {
          var mem = list[0];
          var branch = CZ.state.branch !== 'all' ? CZ.state.branch : mem.branchId;
          var e = S.checkEligible(mem, branch);
          if (e.ok && !e.warns.length) {
            S.checkIn(mem.id, branch);
            U.toast('أهلاً ' + mem.name.split(' ')[0] + ' — اتسجّل دخول 👊');
            inp.value = '';
            CZ.render();
            setTimeout(function () { var i = U.$('#ci-in'); if (i) i.focus(); }, 60);
            return;
          }
        }
        CZ.quickCheckin(v);
        inp.value = '';
      }
      if (inp) {
        inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
        U.$('#ci-go').addEventListener('click', go);
        U.$('#ci-guest').addEventListener('click', function () { guestModal(); });
      }
      var ex = U.$('#ci-export');
      if (ex) ex.addEventListener('click', function () {
        var today = U.today();
        var rows = [['الوقت', 'العضو', 'الكود', 'النوع', 'الفترة', 'الفرع', 'الخروج']];
        S.scope(S.where('attend', function (a) { return a.inAt.slice(0, 10) === today; }), CZ.state.branch)
          .forEach(function (a) {
            var mem = a.memberId ? S.member(a.memberId) : null;
            rows.push([U.fTime(a.inAt), mem ? mem.name : (a.guestName || 'زائر'), mem ? mem.code : '',
              a.type, a.seg || '', S.branchShort(a.branchId), a.outAt ? U.fTime(a.outAt) : 'لسه جوّه']);
          });
        U.csv('حضور-' + today, rows);
      });
    }
  };

  /* أحداث عامة للصفحة */
  U.on('click', '[data-out]', function (e, el) {
    S.checkOut(el.getAttribute('data-out'));
    U.toast('اتسجّل خروج');
    CZ.render();
  });
  U.on('click', '#ci-outall', function () {
    U.confirm({ title: 'خروج الكل؟', body: 'هيتسجّل خروج لكل اللي في الجيم دلوقتي.', ok: 'اعمل' })
      .then(function (y) {
        if (!y) return;
        S.inGym(CZ.state.branch).forEach(function (a) { S.checkOut(a.id); });
        U.toast('اتسجّل خروج للكل'); CZ.render();
      });
  });
  U.on('click', '[data-undo]', function (e, el) {
    U.confirm({
      title: 'إلغاء التسجيل؟', danger: true,
      body: 'هيتشال من سجل الحضور والجلسة هترجع لرصيد العضو. استخدمها لو سجّلت بالغلط.', ok: 'ألغِ'
    }).then(function (y) {
      if (!y) return;
      S.undoCheckIn(el.getAttribute('data-undo'));
      U.toast('اتلغى التسجيل'); CZ.render();
    });
  });
})();
