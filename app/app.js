/* ============================================================
   سيزر جيم — نظام الإدارة | المحرّك: الدخول، القائمة، التوجيه
   ============================================================ */
(function () {
  'use strict';
  var CZ = window.CZ, U = CZ.u, S = CZ.s, W = CZ.w;

  CZ.views = CZ.views || {};
  CZ.state = CZ.state || { user: null, branch: 'all', params: {} };

  var SKEY = 'cezar.session.v1';

  /* ---------- القائمة ---------- */
  var NAV = [
    { g: 'التشغيل اليومي', items: [
      { k: 'dash', r: '', t: 'لوحة القيادة', i: 'home' },
      { k: 'reception', r: 'reception', t: 'مكتب الريسبشن', i: 'scan' },
      { k: 'checkin', r: 'checkin', t: 'الدخول والحضور', i: 'scan' },
      { k: 'members', r: 'members', t: 'الأعضاء', i: 'users' },
      { k: 'classes', r: 'classes', t: 'الحصص والجدول', i: 'calendar' },
      { k: 'tasks', r: 'tasks', t: 'المهام', i: 'check' }
    ]},
    { g: 'الفلوس', items: [
      { k: 'finance', r: 'finance', t: 'الخزنة والمالية', i: 'wallet' },
      { k: 'plans', r: 'plans', t: 'الباقات والأسعار', i: 'tag' },
      { k: 'shop', r: 'shop', t: 'البوفيه والمكملات', i: 'shop' }
    ]},
    { g: 'الناس', items: [
      { k: 'staff', r: 'staff', t: 'الكباتن والموظفين', i: 'whistle' },
      { k: 'pt', r: 'pt', t: 'التدريب الخاص', i: 'dumbbell' },
      { k: 'leads', r: 'leads', t: 'العملاء المحتملين', i: 'target' },
      { k: 'messages', r: 'messages', t: 'مركز الرسايل', i: 'msg' }
    ]},
    { g: 'الجيم', items: [
      { k: 'equip', r: 'equipment', t: 'الأجهزة والصيانة', i: 'wrench' },
      { k: 'lockers', r: 'lockers', t: 'اللوكرات', i: 'door' },
      { k: 'reports', r: 'reports', t: 'التقارير', i: 'chart' },
      { k: 'branches', r: 'branches', t: 'الفروع', i: 'branch' },
      { k: 'settings', r: 'settings', t: 'الإعدادات', i: 'cog' }
    ]}
  ];

  /* ---------- بدء التشغيل ---------- */
  function boot() {
    S.load();
    S.reconcile();
    CZ.CUR = S.db().settings.currency || 'ج';
    var sess = null;
    try { sess = JSON.parse(sessionStorage.getItem(SKEY) || 'null'); } catch (e) { }
    if (sess && sess.userId) {
      var u = S.get('users', sess.userId);
      if (u && u.active !== false) {
        CZ.state.user = u;
        CZ.state.branch = sess.branch || (u.branchId || 'all');
        return shell();
      }
    }
    login();
  }

  /* ---------- شاشة الدخول ---------- */
  function login() {
    var users = S.all('users').filter(function (u) { return u.active !== false; });
    var pin = '', picked = null;

    document.body.innerHTML =
      '<div class="login">' +
      '<div class="login-art">' +
      '<div><div class="row" style="gap:12px"><span class="nav-emblem" style="width:44px;height:44px;font-size:20px">CZ</span>' +
      '<div><b style="font-size:19px;display:block">' + U.esc(S.db().settings.gymName) + '</b>' +
      '<span class="lat lbl" style="color:#7E7F77">SYSTEM · نظام الإدارة</span></div></div></div>' +
      '<div style="position:relative;z-index:1;max-width:440px">' +
      '<h1 style="font-size:clamp(30px,4vw,46px);line-height:1.12">نظام واحد<br>يدير <span style="color:#BEF23C">الفرعين</span>.</h1>' +
      '<p style="color:#9A9B91;font-size:15.5px;margin-top:14px;line-height:1.75">' +
      'الأعضاء، الاشتراكات، الحضور، الخزنة، الكباتن، الأجهزة، والتقارير — كلها في مكان واحد، ' +
      'وكل رقم فيها تقدر تفتحه وتشوف جاي منين.</p>' +
      '<div class="row mt-l" style="gap:26px">' +
      ['أعضاء', 'اشتراكات', 'حضور', 'خزنة', 'تقارير'].map(function (t) {
        return '<div><div class="lat lbl" style="color:#63645D;font-size:10px">' + t + '</div></div>';
      }).join('') + '</div></div>' +
      '<div class="xs" style="color:#63645D">البيانات محفوظة على الجهاز ده — مش على سيرفر خارجي</div>' +
      '</div>' +
      '<div class="login-form"><div class="login-box">' +
      '<div id="lg-step"></div></div></div></div>' +
      '<div class="toasts"></div>';

    step1();

    function step1() {
      U.html('#lg-step',
        '<div class="eyebrow lat" style="margin-bottom:14px">STEP 1 / 2</div>' +
        '<h2 style="font-size:24px">مين بيشتغل دلوقتي؟</h2>' +
        '<p class="mut sm mt-s" style="margin-bottom:16px">اختار اسمك عشان كل حركة تتسجّل باسم صاحبها.</p>' +
        '<div class="userpick">' + users.map(function (u) {
          return '<button class="pick-i" data-u="' + u.id + '">' +
            '<span class="ava m">' + U.esc(U.initials(u.name)) + '</span>' +
            '<span class="pi-t"><b>' + U.esc(u.name) + '</b><span class="pi-sub">' +
            U.esc(S.ROLES[u.role].t) + (u.branchId ? ' · ' + S.branchShort(u.branchId) : ' · كل الفروع') +
            '</span></span>' + U.ico('left') + '</button>';
        }).join('') + '</div>' +
        '<div class="alert info mt-l">' + U.ico('info') +
        '<div><b>أول مرة تفتح النظام؟</b>الأكواد المبدئية: صاحب الجيم <span class="num">1234</span> · ' +
        'مدير الرئيسي <span class="num">1111</span> · مدير الثاني <span class="num">2222</span> · ' +
        'ريسبشن <span class="num">1010</span> / <span class="num">2020</span>. غيّرهم من الإعدادات.</div></div>');
      U.$$('[data-u]').forEach(function (b) {
        b.addEventListener('click', function () {
          picked = S.get('users', b.getAttribute('data-u'));
          pin = ''; step2();
        });
      });
    }

    function step2() {
      U.html('#lg-step',
        '<button class="btn btn-sm btn-soft" id="lg-back">' + U.ico('right') + 'رجوع</button>' +
        '<div class="row mt-l" style="gap:11px">' +
        '<span class="ava lg m">' + U.esc(U.initials(picked.name)) + '</span>' +
        '<div><b style="font-size:19px;display:block">' + U.esc(picked.name) + '</b>' +
        '<span class="mut sm">' + U.esc(S.ROLES[picked.role].t) + '</span></div></div>' +
        '<p class="mut sm mt-l">اكتب الكود السري</p>' +
        '<div class="pindots" id="lg-dots">' + '<i></i><i></i><i></i><i></i>' + '</div>' +
        '<div class="pinpad">' +
        [1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (n) { return '<button data-n="' + n + '">' + n + '</button>'; }).join('') +
        '<button data-clr>' + U.ico('x') + '</button>' +
        '<button data-n="0">0</button>' +
        '<button data-del>' + U.ico('left') + '</button>' +
        '</div>');
      U.$('#lg-back').addEventListener('click', step1);
      U.$$('.pinpad button').forEach(function (b) {
        b.addEventListener('click', function () {
          if (b.hasAttribute('data-clr')) pin = '';
          else if (b.hasAttribute('data-del')) pin = pin.slice(0, -1);
          else if (pin.length < 4) pin += b.getAttribute('data-n');
          draw();
          if (pin.length === 4) setTimeout(check, 130);
        });
      });
      draw();
    }
    function draw() {
      var d = U.$('#lg-dots');
      if (!d) return;
      d.className = 'pindots';
      d.innerHTML = [0, 1, 2, 3].map(function (i) { return '<i class="' + (i < pin.length ? 'on' : '') + '"></i>'; }).join('');
    }
    function check() {
      if (String(picked.pin) === pin) {
        CZ.state.user = picked;
        CZ.state.branch = picked.branchId || 'all';
        sessionStorage.setItem(SKEY, JSON.stringify({ userId: picked.id, branch: CZ.state.branch }));
        S.log('دخل النظام', 'users', picked.id, picked.name);
        shell();
      } else {
        var d = U.$('#lg-dots'); d.classList.add('bad');
        if (navigator.vibrate) navigator.vibrate(120);
        U.toast('الكود غلط', 'err');
        setTimeout(function () { pin = ''; draw(); }, 420);
      }
    }

    document.addEventListener('keydown', function h(e) {
      if (!U.$('.login')) { document.removeEventListener('keydown', h); return; }
      if (!picked) return;
      if (/^[0-9]$/.test(e.key) && pin.length < 4) { pin += e.key; draw(); if (pin.length === 4) setTimeout(check, 130); }
      else if (e.key === 'Backspace') { pin = pin.slice(0, -1); draw(); }
    });
  }

  CZ.logout = function () {
    sessionStorage.removeItem(SKEY);
    CZ.state.user = null;
    location.hash = '';
    login();
  };

  /* ---------- الهيكل ---------- */
  function shell() {
    var minimized = localStorage.getItem('cezar.navmin') === '1';
    document.body.innerHTML =
      '<div class="app' + (minimized ? ' nav-min' : '') + '" id="app">' +
      '<aside class="nav">' +
      '<div class="nav-head">' +
      '<span class="nav-emblem">CZ</span>' +
      '<div class="nav-title"><b>' + U.esc(S.db().settings.gymName) + '</b><span class="lat">system</span></div>' +
      '</div>' +
      '<nav class="nav-scroll" id="navlist"></nav>' +
      '<div class="nav-foot">' +
      '<span class="nav-ava">' + U.esc(U.initials(CZ.state.user.name)) + '</span>' +
      '<div class="nav-foot-txt"><b>' + U.esc(CZ.state.user.name) + '</b><span>' +
      U.esc(S.ROLES[CZ.state.user.role].t) + '</span></div>' +
      '<button class="icon-btn" id="btn-logout" title="خروج">' + U.ico('logout') + '</button>' +
      '</div></aside>' +
      '<main class="main">' +
      '<header class="top">' +
      '<button class="icon-btn hide-lg" id="btn-nav" style="display:none">' + U.ico('menu') + '</button>' +
      '<div class="top-title"><h1 id="pg-title">لوحة القيادة</h1><span class="sub" id="pg-sub"></span></div>' +
      '<div class="top-spacer"></div>' +
      '<div class="top-right">' +
      '<span class="top-clock" id="clock"></span>' +
      '<button class="icon-btn" id="btn-search" title="بحث سريع (اضغط /)">' + U.ico('search') + '</button>' +
      '<button class="btn btn-lime btn-sm" id="btn-quick">' + U.ico('scan') + '<span class="hide-sm">تسجيل دخول</span></button>' +
      '<div class="branchsw" id="branchsw"></div>' +
      '</div></header>' +
      '<div id="page"></div></main></div>' +
      '<div class="toasts"></div><div id="printroot"></div>';

    /* زرار القائمة للموبايل */
    var nb = U.$('#btn-nav');
    function checkNav() {
      nb.style.display = window.innerWidth <= 900 ? 'grid' : 'none';
    }
    checkNav();
    window.addEventListener('resize', checkNav);
    nb.addEventListener('click', function () {
      var a = U.$('#app');
      a.classList.toggle('nav-open');
      if (a.classList.contains('nav-open')) {
        var sc = document.createElement('div');
        sc.className = 'nav-scrim';
        sc.addEventListener('click', function () { a.classList.remove('nav-open'); sc.remove(); });
        a.appendChild(sc);
      } else { var s = U.$('.nav-scrim'); if (s) s.remove(); }
    });

    U.$('#btn-logout').addEventListener('click', function () {
      U.confirm({ title: 'خروج من النظام؟', body: 'هترجع لشاشة اختيار المستخدم.', ok: 'اخرج' })
        .then(function (y) { if (y) CZ.logout(); });
    });
    U.$('#btn-quick').addEventListener('click', function () { CZ.quickCheckin(); });
    U.$('#btn-search').addEventListener('click', function () { CZ.spotlight(); });

    document.querySelector('.nav-head').addEventListener('dblclick', function () {
      var a = U.$('#app');
      a.classList.toggle('nav-min');
      localStorage.setItem('cezar.navmin', a.classList.contains('nav-min') ? '1' : '0');
    });

    clock();
    setInterval(clock, 20000);
    branchSwitcher();
    drawNav();
    window.addEventListener('hashchange', route);
    route();

    /* اختصارات */
    document.addEventListener('keydown', function (e) {
      if (e.target.matches('input,textarea,select')) return;
      if (e.key === '/') { e.preventDefault(); CZ.spotlight(); }
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); CZ.spotlight(); }
      if (e.key === 'd' && e.altKey) { e.preventDefault(); CZ.quickCheckin(); }
    });
  }

  function clock() {
    var n = new Date();
    var seg = S.segAt(CZ.state.branch === 'all' ? S.branches()[0].id : CZ.state.branch);
    var segT = seg === 'women' ? 'فترة السيدات' : seg === 'men' ? 'فترة الرجالة' : 'مقفول';
    var el = U.$('#clock');
    if (el) el.innerHTML = U.DAYS[n.getDay()] + ' · <b>' + U.fTime(n) + '</b> · ' +
      '<span style="color:' + (seg === 'women' ? 'var(--gold-deep)' : seg === 'men' ? 'var(--lime-deep)' : 'var(--faint)') + '">' + segT + '</span>';
  }

  /* ---------- مبدّل الفروع ---------- */
  function branchSwitcher() {
    var box = U.$('#branchsw');
    function paint() {
      var b = CZ.state.branch === 'all' ? null : S.branch(CZ.state.branch);
      box.innerHTML = '<button class="branchsw-btn" id="bsw-btn">' +
        '<i class="dot" style="background:' + (b ? b.color : 'var(--ink)') + '"></i>' +
        '<span>' + (b ? U.esc(b.short) : 'كل الفروع') + '</span>' + U.ico('chevD') + '</button>';
      U.$('#bsw-btn').addEventListener('click', function (e) {
        e.stopPropagation();
        if (U.$('.pop', box)) { U.$('.pop', box).remove(); return; }
        var canAll = !CZ.state.user.branchId;
        var pop = document.createElement('div');
        pop.className = 'pop';
        pop.innerHTML = '<div class="pop-t lat">branch</div>' +
          (canAll ? '<button class="pop-i' + (CZ.state.branch === 'all' ? ' on' : '') + '" data-b="all">' +
            '<i class="dot" style="background:var(--ink)"></i>كل الفروع<small class="num">' +
            S.all('members').length + '</small></button>' : '') +
          S.branches().filter(function (br) {
            return !CZ.state.user.branchId || CZ.state.user.branchId === br.id;
          }).map(function (br) {
            return '<button class="pop-i' + (CZ.state.branch === br.id ? ' on' : '') + '" data-b="' + br.id + '">' +
              '<i class="dot" style="background:' + br.color + '"></i>' + U.esc(br.name) +
              '<small class="num">' + S.where('members', function (m) { return m.branchId === br.id; }).length + '</small></button>';
          }).join('') +
          '<div class="pop-sep"></div>' +
          '<button class="pop-i" data-manage>' + U.ico('cog') + 'إدارة الفروع</button>';
        box.appendChild(pop);
        pop.addEventListener('click', function (ev) {
          var t = ev.target.closest('[data-b]');
          if (t) {
            CZ.state.branch = t.getAttribute('data-b');
            var s = JSON.parse(sessionStorage.getItem(SKEY) || '{}');
            s.branch = CZ.state.branch;
            sessionStorage.setItem(SKEY, JSON.stringify(s));
            pop.remove(); paint(); drawNav(); CZ.render();
            return;
          }
          if (ev.target.closest('[data-manage]')) { pop.remove(); location.hash = '#/branches'; }
        });
      });
    }
    paint();
    document.addEventListener('click', function () {
      var p = U.$('.pop', box); if (p) p.remove();
    });
  }

  /* ---------- القائمة الجانبية ---------- */
  function drawNav() {
    if (CZ.state.user.role === 'reception') {
      var routeName = location.hash.replace(/^#\/?/, '').split('?')[0];
      U.html('#navlist', '<div class="nav-group"><div class="nav-group-t">مكتب الريسبشن</div>' +
        '<a class="nav-a' + (!routeName || routeName === 'reception' ? ' on' : '') + '" href="#/">' + U.ico('home') + '<span>الرئيسية</span></a>' +
        '<a class="nav-a' + (routeName === 'reception-tools' ? ' on' : '') + '" href="#/reception-tools">' + U.ico('box') + '<span>أدوات أخرى</span></a></div>');
      return;
    }
    var alerts = S.alerts(CZ.state.branch);
    var counts = {};
    alerts.forEach(function (a) {
      var key = { expiring: 'members', expired: 'members', absent: 'members', debt: 'finance', stock: 'shop', maint: 'equip', leads: 'leads', tasks: 'tasks' }[a.k];
      if (key) counts[key] = (counts[key] || 0) + a.n;
    });
    var cur = (location.hash.replace(/^#\/?/, '').split('?')[0]) || '';
    U.html('#navlist', NAV.map(function (g) {
      var items = g.items.filter(function (it) { return S.can(it.k) || it.k === 'settings' || it.k === 'branches' || it.k === 'lockers'; });
      if (!items.length) return '';
      return '<div class="nav-group"><div class="nav-group-t">' + U.esc(g.g) + '</div>' +
        items.map(function (it) {
          var on = cur === it.r;
          return '<a class="nav-a' + (on ? ' on' : '') + '" href="#/' + it.r + '">' + U.ico(it.i) +
            '<span>' + U.esc(it.t) + '</span>' +
            (counts[it.k] ? '<span class="nav-badge num">' + U.n(counts[it.k]) + '</span>' : '') + '</a>';
        }).join('') + '</div>';
    }).join(''));
  }

  /* ---------- التوجيه ---------- */
  function parseHash() {
    var h = location.hash.replace(/^#\/?/, '');
    var parts = h.split('?');
    var name = parts[0] || '';
    var params = {};
    (parts[1] || '').split('&').forEach(function (kv) {
      if (!kv) return;
      var p = kv.split('=');
      params[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || '');
    });
    return { name: name, params: params };
  }

  function route() {
    var r = parseHash();
    if (!r.name && CZ.state.user.role === 'reception') r.name = 'reception';
    var v = CZ.views[r.name] || CZ.views[''];
    if (!v) { U.html('#page', '<div class="page">' + W.empty('الصفحة مش موجودة', '', 'search') + '</div>'); return; }
    if (v.perm && !S.can(v.perm)) {
      U.html('#page', '<div class="page">' + W.empty('مالكش صلاحية على القسم ده',
        'كلّم صاحب الجيم لو محتاج تدخل هنا.', 'lock') + '</div>');
      return;
    }
    CZ.view = { name: r.name, def: v };
    CZ.state.params = r.params;
    var a = U.$('#app'); if (a) { a.classList.remove('nav-open'); var s = U.$('.nav-scrim'); if (s) s.remove(); }
    drawNav();
    CZ.render();
    window.scrollTo(0, 0);
  }

  CZ.render = function () {
    if (!CZ.view) return;
    var v = CZ.view.def;
    U.$('#pg-title').textContent = typeof v.title === 'function' ? v.title() : v.title;
    U.$('#pg-sub').textContent = typeof v.sub === 'function' ? (v.sub() || '') : (v.sub || '');
    U.html('#page', '<div class="page">' + v.render(CZ.state.params) + '</div>');
    if (v.after) v.after(CZ.state.params);
    drawNav();
  };
  CZ.go = function (h) { location.hash = h.indexOf('#') === 0 ? h : '#/' + h; };
  CZ.reload = function () { S.save(true); CZ.render(); };

  /* ---------- البحث السريع ---------- */
  CZ.spotlight = function () {
    var m = U.modal({
      title: 'بحث سريع', sub: 'عضو، كود، تليفون، أو صفحة', width: 'sm',
      body: '<div class="search" style="max-width:none">' + U.ico('search') +
        '<input class="inp" id="sp-q" placeholder="اكتب اسم أو كود أو رقم..." autocomplete="off" autofocus></div>' +
        '<div id="sp-res" class="mt" style="display:grid;gap:6px;max-height:340px;overflow-y:auto"></div>',
      footer: null
    });
    var q = U.$('#sp-q', m.el), res = U.$('#sp-res', m.el);
    function draw() {
      var v = q.value.trim();
      if (!v) {
        res.innerHTML = '<div class="pop-t lat">صفحات</div>' + NAV.reduce(function (a, g) { return a.concat(g.items); }, [])
          .filter(function (it) { return S.can(it.k) || it.k === 'settings'; })
          .map(function (it) {
            return '<button class="pick-i" data-sp="#/' + it.r + '">' + U.ico(it.i) +
              '<span class="pi-t"><b>' + U.esc(it.t) + '</b></span></button>';
          }).join('');
        return;
      }
      var mem = S.all('members').filter(function (x) {
        return U.match(x.name, v) || String(x.code).indexOf(v) === 0 || U.phone(x.phone).indexOf(v) > -1;
      }).slice(0, 7);
      var pages = NAV.reduce(function (a, g) { return a.concat(g.items); }, [])
        .filter(function (it) { return U.match(it.t, v); }).slice(0, 4);
      res.innerHTML =
        (mem.length ? '<div class="pop-t lat">أعضاء</div>' + mem.map(function (x) {
          var st = S.status(x);
          return '<button class="pick-i" data-sp="#/members?id=' + x.id + '">' + W.ava(x, 'sm') +
            '<span class="pi-t"><b>' + U.esc(x.name) + '</b><span class="pi-sub">' + U.esc(x.code) + ' · ' +
            U.fPhone(x.phone) + '</span></span><span class="badge ' + st.cls + '">' + U.esc(st.t) + '</span></button>';
        }).join('') : '') +
        (pages.length ? '<div class="pop-t lat">صفحات</div>' + pages.map(function (it) {
          return '<button class="pick-i" data-sp="#/' + it.r + '">' + U.ico(it.i) +
            '<span class="pi-t"><b>' + U.esc(it.t) + '</b></span></button>';
        }).join('') : '') ||
        '<div class="empty" style="padding:28px">' + U.ico('search') + '<b>مفيش نتايج</b></div>';
    }
    draw();
    q.addEventListener('input', U.debounce(draw, 120));
    res.addEventListener('click', function (e) {
      var b = e.target.closest('[data-sp]');
      if (!b) return;
      m.close();
      location.hash = b.getAttribute('data-sp');
      CZ.render();
    });
    q.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { var f = res.querySelector('[data-sp]'); if (f) f.click(); }
    });
  };

  /* ---------- بداية ---------- */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
