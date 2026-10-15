/* ============================================================
   سيزر جيم — نظام الإدارة | المكوّنات المشتركة
   ============================================================ */
(function () {
  'use strict';
  var CZ = window.CZ, U = CZ.u, S = CZ.s;
  var W = (CZ.w = {});

  /* ---------- كروت ---------- */
  W.stat = function (o) {
    return '<div class="stat' + (o.dark ? ' dark' : '') + '"' + (o.go ? ' data-go="' + o.go + '" style="cursor:pointer"' : '') + '>' +
      '<div class="stat-top">' +
      (o.ico ? '<span class="stat-ico ' + (o.tone || '') + '">' + U.ico(o.ico) + '</span>' : '') +
      '<span class="stat-t">' + U.esc(o.t) + '</span></div>' +
      '<div class="stat-v">' + o.v + (o.cur ? '<span class="cur">' + o.cur + '</span>' : '') + '</div>' +
      (o.d ? '<div class="stat-d ' + (o.dir || '') + '">' + (o.dir ? U.ico(o.dir === 'up' ? 'up' : 'down') : '') +
        '<span>' + o.d + '</span></div>' : '') +
      (o.spark ? CZ.c.spark(o.spark, { color: o.sparkColor }) : '') +
      '</div>';
  };

  W.card = function (o) {
    return '<section class="card' + (o.cls ? ' ' + o.cls : '') + '">' +
      (o.title || o.act ? '<div class="card-h">' +
        (o.ico ? '<span class="stat-ico ' + (o.tone || '') + '">' + U.ico(o.ico) + '</span>' : '') +
        '<div><h3>' + U.esc(o.title || '') + '</h3>' + (o.sub ? '<div class="sub">' + U.esc(o.sub) + '</div>' : '') + '</div>' +
        (o.act ? '<div class="act">' + o.act + '</div>' : '') + '</div>' : '') +
      '<div class="card-b' + (o.flush ? ' flush' : '') + '">' + (o.body || '') + '</div>' +
      (o.foot ? '<div class="card-f">' + o.foot + '</div>' : '') +
      '</section>';
  };

  W.empty = function (title, text, ico, act) {
    return '<div class="empty">' + U.ico(ico || 'box') +
      '<b>' + U.esc(title) + '</b>' + (text ? '<p>' + U.esc(text) + '</p>' : '') +
      (act ? '<div class="mt-s">' + act + '</div>' : '') + '</div>';
  };

  W.alert = function (kind, title, text, act) {
    var ico = { warn: 'alert', danger: 'alert', ok: 'check', info: 'info', lime: 'sparkle' }[kind] || 'info';
    return '<div class="alert ' + kind + '">' + U.ico(ico) +
      '<div style="flex:1;min-width:0"><b>' + U.esc(title) + '</b>' + (text ? U.esc(text) : '') + '</div>' +
      (act ? '<div class="act">' + act + '</div>' : '') + '</div>';
  };

  W.sectH = function (title, act) {
    return '<div class="sect-h"><h2>' + U.esc(title) + '</h2><span class="line"></span>' +
      (act ? '<div class="act">' + act + '</div>' : '') + '</div>';
  };

  /* ---------- العضو ---------- */
  W.ava = function (m, size) {
    var cls = 'ava' + (size ? ' ' + size : '') + ' ' + (m && m.gender === 'f' ? 'f' : 'm');
    if (m && m.photo) return '<span class="' + cls + '"><img src="' + m.photo + '" alt=""></span>';
    return '<span class="' + cls + '">' + U.esc(U.initials(m ? m.name : '؟')) + '</span>';
  };

  W.who = function (m, extra) {
    if (!m) return '<span class="fnt">—</span>';
    return '<div class="who">' + W.ava(m) +
      '<div class="who-t"><b>' + U.esc(m.name) + '</b><span>' + U.esc(extra || m.code) + '</span></div></div>';
  };

  W.statusBadge = function (m) {
    var st = S.status(m);
    return '<span class="badge ' + st.cls + '"><i class="dot"></i>' + U.esc(st.t) + '</span>';
  };

  W.branchTag = function (id) {
    var b = S.branch(id);
    if (!b) return '';
    return '<span class="badge" style="background:' + b.color + '18;color:' + b.color + '">' +
      '<i class="dot" style="background:' + b.color + '"></i>' + U.esc(b.short) + '</span>';
  };

  /* ---------- الجداول ---------- */
  /* cols: [{k, t, cls, w, sort, render(row)}] */
  W.table = function (cols, rows, opts) {
    opts = opts || {};
    if (!rows.length) return W.empty(opts.emptyT || 'مفيش نتايج', opts.emptyS || '', opts.emptyIco || 'search');
    var head = '<thead><tr>' + cols.map(function (c) {
      var sorted = opts.sort && opts.sort.k === c.k;
      return '<th class="' + (c.cls || '') + (c.sort !== false && c.k ? ' sortable' : '') + (sorted ? ' sorted' : '') + '"' +
        (c.k ? ' data-sort="' + c.k + '"' : '') + (c.w ? ' style="width:' + c.w + '"' : '') + '>' +
        U.esc(c.t) + (c.sort !== false && c.k ? '<span class="arr">' + (sorted ? (opts.sort.d === 'desc' ? '▼' : '▲') : '↕') + '</span>' : '') +
        '</th>';
    }).join('') + '</tr></thead>';
    var body = '<tbody>' + rows.map(function (r, i) {
      return '<tr' + (opts.rowId ? ' data-row="' + opts.rowId(r) + '"' : '') +
        (opts.click ? ' class="clickable"' : '') + '>' +
        cols.map(function (c) {
          return '<td class="' + (c.cls || '') + '">' + (c.render ? c.render(r, i) : U.esc(r[c.k])) + '</td>';
        }).join('') + '</tr>';
    }).join('') + '</tbody>';
    var foot = opts.foot ? '<tfoot><tr>' + opts.foot.map(function (f) {
      return '<td class="' + (f.cls || '') + '"' + (f.span ? ' colspan="' + f.span + '"' : '') + '>' + (f.v || '') + '</td>';
    }).join('') + '</tr></tfoot>' : '';
    return '<div class="tw"><table class="t">' + head + body + foot + '</table></div>';
  };

  /* ---------- فورمات ---------- */
  W.fld = function (o) {
    var id = o.id || o.name;
    var inp;
    var cls = 'inp' + (o.cls ? ' ' + o.cls : '');
    var attrs = ' id="' + id + '" name="' + o.name + '"' + (o.req ? ' required' : '') +
      (o.dis ? ' disabled' : '') + (o.ph ? ' placeholder="' + U.esc(o.ph) + '"' : '') +
      (o.attr || '');
    if (o.type === 'select') {
      inp = '<select class="' + cls + '"' + attrs + '>' +
        (o.opts || []).map(function (op) {
          var v = op.v !== undefined ? op.v : op[0], t = op.t !== undefined ? op.t : op[1];
          return '<option value="' + U.esc(v) + '"' + (String(o.val) === String(v) ? ' selected' : '') + '>' + U.esc(t) + '</option>';
        }).join('') + '</select>';
    } else if (o.type === 'textarea') {
      inp = '<textarea class="' + cls + '"' + attrs + ' rows="' + (o.rows || 3) + '">' + U.esc(o.val || '') + '</textarea>';
    } else {
      inp = '<input type="' + (o.type || 'text') + '" class="' + cls + (o.suffix ? ' has-suffix' : '') + '"' + attrs +
        ' value="' + U.esc(o.val === undefined || o.val === null ? '' : o.val) + '"' +
        (o.min !== undefined ? ' min="' + o.min + '"' : '') + (o.max !== undefined ? ' max="' + o.max + '"' : '') +
        (o.step ? ' step="' + o.step + '"' : '') + '>';
      if (o.ico || o.suffix) {
        inp = '<div class="inp-w">' + (o.ico ? U.ico(o.ico) : '') + inp +
          (o.suffix ? '<span class="suffix">' + U.esc(o.suffix) + '</span>' : '') + '</div>';
      }
    }
    return '<div class="fld"' + (o.span ? ' style="grid-column:span ' + o.span + '"' : '') + '>' +
      (o.label ? '<label for="' + id + '">' + U.esc(o.label) + (o.req ? '<span class="req">*</span>' : '') + '</label>' : '') +
      inp + (o.hint ? '<span class="hint">' + o.hint + '</span>' : '') + '</div>';
  };

  W.check = function (o) {
    return '<label class="check"><input type="' + (o.type || 'checkbox') + '" name="' + o.name + '"' +
      (o.val !== undefined ? ' value="' + U.esc(o.val) + '"' : '') + (o.on ? ' checked' : '') + '>' +
      '<span class="ct">' + U.esc(o.t) + (o.sub ? '<small>' + U.esc(o.sub) + '</small>' : '') + '</span></label>';
  };

  W.form = function (el) {
    var o = {};
    U.$$('input,select,textarea', el).forEach(function (f) {
      if (!f.name) return;
      if (f.type === 'checkbox') {
        if (o[f.name] === undefined) o[f.name] = f.value && f.value !== 'on' ? [] : false;
        if (Array.isArray(o[f.name])) { if (f.checked) o[f.name].push(f.value); }
        else o[f.name] = f.checked;
      } else if (f.type === 'radio') {
        if (f.checked) o[f.name] = f.value;
      } else if (f.type === 'number') {
        o[f.name] = f.value === '' ? null : Number(f.value);
      } else {
        o[f.name] = f.value.trim();
      }
    });
    return o;
  };

  /* ---------- منتقي الفرع في الفورمات ---------- */
  W.branchField = function (val, name) {
    var bs = S.branches();
    if (CZ.state.user && CZ.state.user.branchId) bs = bs.filter(function (b) { return b.id === CZ.state.user.branchId; });
    if (bs.length < 2) return '<input type="hidden" name="' + (name || 'branchId') + '" value="' + bs[0].id + '">';
    return W.fld({
      label: 'الفرع', name: name || 'branchId', type: 'select', req: true,
      val: val || (CZ.state.branch !== 'all' ? CZ.state.branch : bs[0].id),
      opts: bs.map(function (b) { return [b.id, b.name]; })
    });
  };

  /* ---------- منتقي عضو (بحث حي) ---------- */
  W.memberPicker = function (opts) {
    opts = opts || {};
    var id = U.uid('mp');
    return '<div class="fld" data-mp="' + id + '">' +
      '<label>' + U.esc(opts.label || 'العضو') + '<span class="req">*</span></label>' +
      '<div class="search" style="max-width:none">' + U.ico('search') +
      '<input class="inp" placeholder="دوّر بالاسم أو الكود أو التليفون" autocomplete="off" data-mp-q>' +
      '</div><input type="hidden" name="' + (opts.name || 'memberId') + '" data-mp-v value="' + (opts.val || '') + '">' +
      '<div data-mp-res style="display:grid;gap:5px;max-height:210px;overflow-y:auto"></div>' +
      '<div data-mp-sel></div></div>';
  };

  U.on('input', '[data-mp-q]', function (e, el) {
    var box = el.closest('[data-mp]');
    var q = el.value.trim();
    var res = U.$('[data-mp-res]', box);
    if (q.length < 1) { res.innerHTML = ''; return; }
    var list = S.all('members').filter(function (m) {
      return U.match(m.name, q) || String(m.code).indexOf(q) === 0 || U.phone(m.phone).indexOf(q) > -1;
    }).slice(0, 8);
    res.innerHTML = list.length ? list.map(function (m) {
      var st = S.status(m);
      return '<button type="button" class="pick-i" data-mp-pick="' + m.id + '">' + W.ava(m, 'sm') +
        '<span class="pi-t"><b>' + U.esc(m.name) + '</b><span class="pi-sub">' + U.esc(m.code) + ' · ' +
        U.fPhone(m.phone) + ' · ' + S.branchShort(m.branchId) + '</span></span>' +
        '<span class="badge ' + st.cls + '">' + U.esc(st.t) + '</span></button>';
    }).join('') : '<div class="xs fnt" style="padding:6px">مفيش عضو بالبحث ده</div>';
  });
  U.on('click', '[data-mp-pick]', function (e, el) {
    var box = el.closest('[data-mp]');
    var m = S.member(el.getAttribute('data-mp-pick'));
    U.$('[data-mp-v]', box).value = m.id;
    U.$('[data-mp-res]', box).innerHTML = '';
    U.$('[data-mp-q]', box).value = '';
    U.$('[data-mp-sel]', box).innerHTML = '<div class="pick-i on" style="cursor:default">' + W.ava(m, 'sm') +
      '<span class="pi-t"><b>' + U.esc(m.name) + '</b><span class="pi-sub">' + U.esc(m.code) + ' · ' + U.fPhone(m.phone) + '</span></span>' +
      '<button type="button" class="icon-btn" data-mp-clear>' + U.ico('x') + '</button></div>';
    U.$('[data-mp-v]', box).dispatchEvent(new Event('change', { bubbles: true }));
  });
  U.on('click', '[data-mp-clear]', function (e, el) {
    var box = el.closest('[data-mp]');
    U.$('[data-mp-v]', box).value = '';
    U.$('[data-mp-sel]', box).innerHTML = '';
    U.$('[data-mp-v]', box).dispatchEvent(new Event('change', { bubbles: true }));
  });

  /* ---------- شريط أدوات القوائم ---------- */
  W.toolbar = function (o) {
    return '<div class="row-b mb">' +
      '<div class="row" style="flex:1">' +
      (o.search !== false ? '<div class="search">' + U.ico('search') +
        '<input class="inp" placeholder="' + U.esc(o.ph || 'دوّر...') + '" data-q value="' + U.esc(o.q || '') + '"></div>' : '') +
      (o.filters || '') + '</div>' +
      '<div class="row">' + (o.act || '') + '</div></div>';
  };

  W.chips = function (items, active, attr) {
    return '<div class="row" style="gap:6px">' + items.map(function (i) {
      return '<button class="chip' + (String(active) === String(i.v) ? ' on' : '') + '" ' + (attr || 'data-f') + '="' + U.esc(i.v) + '">' +
        U.esc(i.t) + (i.n !== undefined ? '<span class="num xs" style="opacity:.65">' + U.n(i.n) + '</span>' : '') + '</button>';
    }).join('') + '</div>';
  };

  /* ---------- واتساب ---------- */
  W.fillTpl = function (body, m) {
    var sub = S.activeSub(m.id) || S.lastSub(m.id);
    var b = S.branch(m.branchId) || {};
    var map = {
      'الاسم': String(m.name || '').split(' ')[0],
      'الاسم_كامل': m.name,
      'الكود': m.code,
      'الباقة': sub ? sub.planName : '—',
      'تاريخ_الانتهاء': sub ? U.fDate(sub.endAt) : '—',
      'أيام_متبقية': sub ? Math.abs(U.diffDays(sub.endAt)) : 0,
      'الجلسات_المتبقية': sub ? S.sessionsLeft(sub) : 0,
      'المتبقي': U.m(S.debt(m.id)),
      'الفرع': (b.name || '') + (b.address ? ' — ' + b.address : ''),
      'تليفون_الفرع': U.fPhone(b.phone || ''),
      'الجيم': S.db().settings.gymName
    };
    return String(body).replace(/\{([^}]+)\}/g, function (all, k) {
      return map[k.trim()] !== undefined ? map[k.trim()] : all;
    });
  };
  W.waBtn = function (m, tplId, label) {
    var tpl = tplId ? S.get('templates', tplId) : null;
    var txt = tpl ? W.fillTpl(tpl.body, m) : '';
    return '<a class="btn btn-sm btn-ok" href="' + U.wa(m.phone, txt) + '" target="_blank" rel="noopener">' +
      U.ico('msg') + (label || 'واتساب') + '</a>';
  };

  /* ---------- إيصال ---------- */
  W.receipt = function (o) {
    var st = S.db().settings;
    var b = S.branch(o.branchId) || {};
    return '<div class="rc">' +
      '<div class="rc-h"><div class="logo">CEZAR</div><div class="ar">' + U.esc(st.gymName) + '</div>' +
      '<div class="meta">' + U.esc(b.name || '') + '<br>' + U.esc(b.address || '') +
      (b.phone ? '<br>' + U.fPhone(b.phone) : '') + '</div></div>' +
      '<div class="rc-t">' + U.esc(o.title || 'إيصال استلام') + '</div>' +
      '<div class="rc-kv"><b>رقم الإيصال</b><span class="v">' + U.esc(o.no || '—') + '</span></div>' +
      '<div class="rc-kv"><b>التاريخ</b><span class="v">' + U.fDate(o.at) + ' ' + U.fTime(o.at) + '</span></div>' +
      (o.member ? '<div class="rc-kv"><b>العضو</b><span>' + U.esc(o.member.name) + '</span></div>' +
        '<div class="rc-kv"><b>الكود</b><span class="v">' + U.esc(o.member.code) + '</span></div>' : '') +
      '<div class="rc-sep"></div>' +
      (o.lines || []).map(function (l) {
        return '<div class="rc-kv"><b>' + U.esc(l[0]) + '</b><span class="v">' + U.esc(l[1]) + '</span></div>';
      }).join('') +
      '<div class="rc-sep"></div>' +
      '<div class="rc-tot"><span>الإجمالي</span><span class="v">' + U.n(o.total) + ' ' + CZ.CUR + '</span></div>' +
      (o.paid !== undefined ? '<div class="rc-kv"><b>المدفوع</b><span class="v">' + U.n(o.paid) + ' ' + CZ.CUR + '</span></div>' : '') +
      (o.rest ? '<div class="rc-kv"><b>المتبقي</b><span class="v">' + U.n(o.rest) + ' ' + CZ.CUR + '</span></div>' : '') +
      '<div class="rc-kv"><b>طريقة الدفع</b><span>' + U.esc(S.METHODS[o.method] || '—') + '</span></div>' +
      (o.by ? '<div class="rc-kv"><b>الموظف</b><span>' + U.esc(o.by) + '</span></div>' : '') +
      (o.member ? U.barcode(o.member.code, '9mm').replace('barcode', 'rc-bc') +
        '<div class="rc-code">' + U.esc(o.member.code) + '</div>' : '') +
      '<div class="rc-f">' + U.esc(st.receiptFooter) + '</div></div>';
  };

  /* ---------- كارت عضوية ---------- */
  W.memberCard = function (m) {
    var st = S.db().settings, sub = S.activeSub(m.id);
    var b = S.branch(m.branchId) || {};
    return '<div class="pcard"><div>' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start">' +
      '<div><div style="font-family:Archivo,sans-serif;font-weight:800;letter-spacing:3px;font-size:13px;color:#BEF23C">CEZAR</div>' +
      '<div class="sm" style="font-size:8.5px;color:#9A9B91">' + U.esc(b.short || '') + '</div></div>' +
      '<div class="code">' + U.esc(m.code) + '</div></div>' +
      '<div class="nm" style="margin-top:7px">' + U.esc(m.name) + '</div>' +
      '<div class="sm">' + U.esc(sub ? sub.planName : 'من غير اشتراك') +
      (sub ? ' · لحد ' + U.fDate(sub.endAt) : '') + '</div>' +
      '</div>' + U.barcode(m.code).replace('class="barcode"', 'class="bc"') + '</div>';
  };

  /* ---------- شريط الفترات ---------- */
  W.segbar = function (branchId, dow, showNow) {
    var segs = S.segments(branchId, dow);
    if (!segs.length) return '<div class="segbar"><i class="closed" style="width:100%"></i></div>';
    var start = 0, end = 1440;
    var parts = [], cur = start;
    segs.forEach(function (s) {
      if (s.from > cur) parts.push(['closed', s.from - cur]);
      parts.push([s.g, Math.min(s.to, end) - Math.max(s.from, cur)]);
      cur = Math.min(s.to, end);
    });
    if (cur < end) parts.push(['closed', end - cur]);
    var tot = U.sum(parts, function (p) { return p[1]; }) || 1440;
    var html = '<div class="segbar-x"><div class="segbar">' + parts.map(function (p) {
      return '<i class="' + p[0] + '" style="width:' + (p[1] / tot * 100).toFixed(2) + '%" title="' +
        (p[0] === 'men' ? 'رجالة' : p[0] === 'women' ? 'سيدات' : 'مقفول') + '"></i>';
    }).join('') + '</div>';
    if (showNow) {
      var n = new Date(), mins = n.getHours() * 60 + n.getMinutes();
      html += '<span class="segbar-now" style="inset-inline-start:' + (mins / 1440 * 100).toFixed(2) + '%"></span>';
    }
    return html + '</div>';
  };

  /* ---------- تنقّل بالضغط ---------- */
  U.on('click', '[data-go]', function (e, el) {
    if (e.target.closest('a,button:not([data-go])')) return;
    location.hash = el.getAttribute('data-go');
  });

  /* ---------- ترتيب الجداول ---------- */
  W.sortState = {};
  U.on('click', 'th[data-sort]', function (e, el) {
    var k = el.getAttribute('data-sort');
    var v = CZ.view && CZ.view.name;
    var s = W.sortState[v] = W.sortState[v] || {};
    if (s.k === k) s.d = s.d === 'desc' ? 'asc' : 'desc';
    else { s.k = k; s.d = 'asc'; }
    if (CZ.render) CZ.render();
  });
  W.sorted = function (rows, key) {
    var s = W.sortState[CZ.view && CZ.view.name];
    if (!s || !s.k) return rows;
    var f = key && key[s.k] ? key[s.k] : s.k;
    return rows.slice().sort(U.by(f, s.d));
  };
  W.sortOpts = function () { return W.sortState[CZ.view && CZ.view.name] || {}; };
})();
