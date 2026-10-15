/* ============================================================
   سيزر جيم — العملاء المحتملين + مركز الرسايل
   ------------------------------------------------------------
   الدرس اللي اتعلمناه من تحليل الحساب: المشكلة مش الوصول،
   المشكلة إن الليد بيجي ومحدّش بيرد عليه. الشاشة دي بتخلّي
   كل ليد ليه ميعاد متابعة، وكل رسالة ليها قالب جاهز.
   ============================================================ */
(function () {
  'use strict';
  var CZ = window.CZ, U = CZ.u, S = CZ.s, W = CZ.w;
  CZ.views = CZ.views || {};
  CZ.state = CZ.state || { user: null, branch: 'all', params: {} };

  var STAGES = [
    { k: 'new', t: 'جديد', c: 'info' },
    { k: 'contacted', t: 'اتكلمنا معاه', c: '' },
    { k: 'visited', t: 'جه شاف الجيم', c: 'lime' },
    { k: 'trial', t: 'جرّب تمرين', c: 'gold' },
    { k: 'won', t: 'اشترك', c: 'ok' },
    { k: 'lost', t: 'ضاع', c: 'danger' }
  ];
  var LF = { stage: 'open', q: '' };

  /* ================= العملاء المحتملين ================= */
  CZ.views.leads = {
    title: 'العملاء المحتملين',
    sub: 'كل واحد سأل ولسه ما اشتركش',
    perm: 'leads',
    render: function () {
      var b = CZ.state.branch;
      var all = S.scope(S.all('leads'), b);
      var counts = {};
      STAGES.forEach(function (s) { counts[s.k] = all.filter(function (l) { return l.stage === s.k; }).length; });
      var open = all.filter(function (l) { return ['won', 'lost'].indexOf(l.stage) < 0; });
      var due = open.filter(function (l) { return l.nextFollow && l.nextFollow <= U.today(); });
      var won = all.filter(function (l) { return l.stage === 'won'; });
      var rate = all.length ? U.pct(won.length, all.filter(function (l) { return ['won', 'lost'].indexOf(l.stage) > -1; }).length) : 0;

      var list = all;
      if (LF.stage === 'open') list = open;
      else if (LF.stage === 'due') list = due;
      else if (LF.stage !== 'all') list = all.filter(function (l) { return l.stage === LF.stage; });
      if (LF.q) list = list.filter(function (l) { return U.match(l.name, LF.q) || U.phone(l.phone).indexOf(LF.q) > -1; });
      list = list.sort(U.by('nextFollow'));

      var bySource = {};
      all.forEach(function (l) {
        bySource[l.source] = bySource[l.source] || { n: 0, won: 0 };
        bySource[l.source].n++;
        if (l.stage === 'won') bySource[l.source].won++;
      });

      return '<div class="grid g-4 mb">' +
        W.stat({ t: 'ليدز مفتوحة', v: U.n(open.length), ico: 'target', tone: 'info' }) +
        W.stat({ t: 'متابعة مستحقة', v: U.n(due.length), ico: 'bell', tone: due.length ? 'danger' : 'ok',
          d: due.length ? 'دول اللي هيضيعوا لو مكلمتهمش' : 'مفيش متابعات فايتة' }) +
        W.stat({ t: 'اشتركوا', v: U.n(won.length), ico: 'check', tone: 'ok' }) +
        W.stat({ t: 'نسبة التحويل', v: rate + '<span class="cur">%</span>', ico: 'trend', tone: 'lime', dark: true,
          d: 'من اللي اتحسم أمرهم' }) +
        '</div>' +

        (due.length ? W.alert('danger', due.length + ' عميل ميعاد متابعته النهاردة أو فات',
          'الليد اللي مش بيترد عليه في يومين بيروح لجيم تاني.',
          '<button class="btn btn-sm btn-ink" data-lstage="due">شوفهم</button>') + '<div class="mb"></div>' : '') +

        W.toolbar({
          ph: 'دوّر باسم أو تليفون', q: LF.q,
          act: '<button class="btn btn-ghost btn-sm" id="ld-export">' + U.ico('export') + 'تصدير</button>' +
            '<button class="btn btn-lime btn-sm" id="ld-new">' + U.ico('plus') + 'ليد جديد</button>'
        }) +

        W.chips([{ v: 'open', t: 'المفتوحة', n: open.length }, { v: 'due', t: 'متابعة مستحقة', n: due.length }]
          .concat(STAGES.map(function (s) { return { v: s.k, t: s.t, n: counts[s.k] }; }))
          .concat([{ v: 'all', t: 'الكل', n: all.length }]), LF.stage, 'data-lstage') +

        '<div class="mt">' + W.card({
          flush: true,
          body: W.table([
            { t: 'الاسم', sort: false, render: function (l) {
              return '<div class="who"><span class="ava sm ' + (l.gender === 'f' ? 'f' : 'm') + '">' +
                U.esc(U.initials(l.name)) + '</span><div class="who-t"><b>' + U.esc(l.name) + '</b>' +
                '<span>' + U.fPhone(l.phone) + '</span></div></div>';
            }},
            { t: 'المرحلة', sort: false, render: function (l) {
              var st = STAGES.filter(function (s) { return s.k === l.stage; })[0] || STAGES[0];
              return '<select class="inp" data-lset="' + l.id + '" style="height:30px;font-size:12.5px;width:auto;padding-inline-start:28px">' +
                STAGES.map(function (s) {
                  return '<option value="' + s.k + '"' + (s.k === l.stage ? ' selected' : '') + '>' + s.t + '</option>';
                }).join('') + '</select>';
            }},
            { t: 'جه منين', sort: false, render: function (l) { return '<span class="badge">' + U.esc(l.source || '—') + '</span>'; } },
            { t: 'مهتم بإيه', sort: false, render: function (l) { return '<span class="sm">' + U.esc(l.interest || '—') + '</span>'; } },
            { t: 'الفرع', sort: false, render: function (l) { return W.branchTag(l.branchId); } },
            { t: 'المتابعة الجاية', sort: false, render: function (l) {
              if (['won', 'lost'].indexOf(l.stage) > -1) return '<span class="fnt">—</span>';
              if (!l.nextFollow) return '<span class="badge warn">مفيش ميعاد</span>';
              var d = U.diffDays(l.nextFollow);
              return '<span class="' + (d < 0 ? 'neg b' : d === 0 ? 'b' : '') + '">' + U.fDate(l.nextFollow, 'short') +
                '</span><div class="xs fnt">' + U.ago(l.nextFollow) + '</div>';
            }},
            { t: 'من', sort: false, render: function (l) { return '<span class="sm fnt">' + U.ago(l.createdAt) + '</span>'; } },
            { t: '', sort: false, cls: 'end', render: function (l) {
              return '<div class="rowact">' +
                '<a class="btn btn-sm btn-ok btn-ico" href="' + U.wa(l.phone, waLead(l)) + '" target="_blank" rel="noopener">' + U.ico('msg') + '</a>' +
                '<a class="btn btn-sm btn-soft btn-ico" href="' + U.tel(l.phone) + '">' + U.ico('phone') + '</a>' +
                (l.stage !== 'won' ? '<button class="btn btn-sm btn-lime" data-lwin="' + l.id + '">حوّله عضو</button>' : '') +
                '<button class="btn btn-sm btn-soft btn-ico" data-ledit="' + l.id + '">' + U.ico('edit') + '</button></div>';
            }}
          ], list, {
            emptyT: 'مفيش عملاء محتملين هنا',
            emptyS: 'كل واحد بيسأل على الواتساب أو بيعدّي على الجيم — سجّله هنا وحطله ميعاد متابعة.',
            emptyIco: 'target'
          })
        }) + '</div>' +

        (all.length ? W.sectH('من فين بييجوا وأيهم بيشترك') + '<div class="grid g-2">' +
          W.card({
            title: 'عدد الليدز حسب المصدر', ico: 'chart',
            body: CZ.c.rank(Object.keys(bySource).map(function (k) {
              return {
                t: k, v: bySource[k].n,
                sub: bySource[k].won + ' اشتركوا (' + U.pct(bySource[k].won, bySource[k].n) + '%)'
              };
            }).sort(U.by('v', 'desc')), { unit: ' ليد' })
          }) +
          W.card({
            title: 'أسباب الضياع', ico: 'alert', tone: 'danger',
            sub: 'اللي بيتكرر هنا هو اللي محتاج يتغيّر في العرض',
            body: (function () {
              var r = {};
              all.filter(function (l) { return l.stage === 'lost' && l.lostReason; })
                .forEach(function (l) { r[l.lostReason] = (r[l.lostReason] || 0) + 1; });
              var arr = Object.keys(r).map(function (k) { return { t: k, v: r[k], color: '#C0492B' }; }).sort(U.by('v', 'desc'));
              return arr.length ? CZ.c.rank(arr, { unit: ' مرة' }) : W.empty('مفيش ليدز ضايعة مسجّل سببها', '', 'check');
            })()
          }) + '</div>' : '');
    },
    after: function () {
      var e;
      if ((e = U.$('#ld-new'))) e.addEventListener('click', function () { leadForm(); });
      if ((e = U.$('[data-q]'))) e.addEventListener('input', U.debounce(function (ev) {
        LF.q = ev.target.value; CZ.render(); U.$('[data-q]').focus();
      }, 250));
      if ((e = U.$('#ld-export'))) e.addEventListener('click', function () {
        var rows = [['الاسم', 'التليفون', 'المرحلة', 'المصدر', 'مهتم بإيه', 'الفرع', 'المتابعة الجاية', 'ملاحظة', 'سبب الضياع']];
        S.scope(S.all('leads'), CZ.state.branch).forEach(function (l) {
          rows.push([l.name, l.phone, (STAGES.filter(function (s) { return s.k === l.stage; })[0] || {}).t,
            l.source, l.interest, S.branchShort(l.branchId), l.nextFollow || '', l.note || '', l.lostReason || '']);
        });
        U.csv('عملاء-محتملين-' + U.today(), rows);
      });
    }
  };

  function waLead(l) {
    var b = S.branch(l.branchId) || {};
    return 'أهلاً ' + String(l.name).split(' ')[0] + ' 👊\nمعاك ' + S.db().settings.gymName + '.\n' +
      'سألت قبل كده عن ' + (l.interest || 'الاشتراك') + ' — تحب أبعتلك التفاصيل والأسعار؟\n' +
      (b.address ? 'العنوان: ' + b.address : '');
  }

  U.on('click', '[data-lstage]', function (e, el) {
    if (!U.$('#ld-new')) return;
    LF.stage = el.getAttribute('data-lstage'); CZ.render();
  });
  U.on('change', '[data-lset]', function (e, el) {
    var id = el.getAttribute('data-lset'), v = el.value;
    var patch = { stage: v };
    if (v === 'won' || v === 'lost') patch.nextFollow = null;
    else if (!S.get('leads', id).nextFollow) patch.nextFollow = U.addDays(U.today(), 2);
    S.upd('leads', id, patch);
    U.toast('اتحدّثت المرحلة');
    if (v === 'lost') {
      var mo = U.modal({
        title: 'ليه ضاع؟', width: 'sm',
        body: W.fld({ label: 'السبب', name: 'lostReason', type: 'select',
          opts: ['السعر عالي', 'المسافة بعيدة', 'اشترك في جيم تاني', 'مردش', 'المواعيد ما تناسبوش', 'مش مهتم دلوقتي', 'أخرى']
            .map(function (x) { return [x, x]; }) }),
        footer: '<div class="grow"></div><button class="btn btn-ink" id="lr-ok">سجّل</button>'
      });
      U.$('#lr-ok', mo.el).addEventListener('click', function () {
        S.upd('leads', id, { lostReason: W.form(mo.el).lostReason }); mo.close(); CZ.render();
      });
    } else CZ.render();
  });

  function leadForm(id) {
    var l = id ? S.get('leads', id) : null;
    var x = l || { stage: 'new', createdAt: U.today(), nextFollow: U.addDays(U.today(), 1) };
    var mo = U.modal({
      title: l ? 'تعديل ليد' : 'عميل محتمل جديد',
      body: '<div class="f" id="lf">' +
        '<div class="f-row">' +
        W.fld({ label: 'الاسم', name: 'name', val: x.name, req: true }) +
        W.fld({ label: 'التليفون', name: 'phone', type: 'tel', val: x.phone, req: true, ico: 'phone' }) +
        '</div>' +
        '<div class="f-row c3">' +
        W.fld({ label: 'النوع', name: 'gender', type: 'select', val: x.gender || 'm', opts: [['m', 'ذكر'], ['f', 'أنثى']] }) +
        W.fld({ label: 'جه منين', name: 'source', type: 'select', val: x.source,
          opts: ['إنستجرام', 'فيسبوك', 'واتساب', 'صديق', 'مشي جنب الجيم', 'إعلان ممول', 'توصية عضو', 'أخرى']
            .map(function (s) { return [s, s]; }) }) +
        W.fld({ label: 'مهتم بإيه', name: 'interest', type: 'select', val: x.interest,
          opts: ['باقة شهرية', 'باقة طويلة', 'برايفيت', 'أنشطة قتالية', 'قسم سيدات', 'تأهيل عسكري', 'تأهيل بدني', 'لسه مش عارف']
            .map(function (s) { return [s, s]; }) }) +
        '</div>' +
        '<div class="f-row c3">' +
        W.fld({ label: 'المرحلة', name: 'stage', type: 'select', val: x.stage,
          opts: STAGES.map(function (s) { return [s.k, s.t]; }) }) +
        W.fld({ label: 'المتابعة الجاية', name: 'nextFollow', type: 'date', val: x.nextFollow,
          hint: 'مهم — ده اللي بيمنع الليد إنه يضيع' }) +
        W.branchField(x.branchId) +
        '</div>' +
        W.fld({ label: 'ملاحظة', name: 'note', type: 'textarea', val: x.note, rows: 2,
          ph: 'قال إيه بالظبط؟ عنده اعتراض إيه؟' }) +
        '</div>',
      footer: (l ? '<button class="btn btn-danger btn-sm" id="lf-del">' + U.ico('trash') + '</button>' : '') +
        '<div class="grow"></div><button class="btn btn-ghost" data-close>إلغاء</button>' +
        '<button class="btn btn-lime" id="lf-ok">' + U.ico('save') + 'احفظ</button>'
    });
    U.$('#lf-ok', mo.el).addEventListener('click', function () {
      var d = W.form(U.$('#lf', mo.el));
      if (!d.name || !d.phone) { U.toast('الاسم والتليفون مطلوبين', 'err'); return; }
      d.phone = U.phone(d.phone);
      if (l) S.upd('leads', l.id, d); else S.add('leads', d);
      U.toast('اتحفظ'); mo.close(); CZ.render();
    });
    if (l) U.$('#lf-del', mo.el).addEventListener('click', function () {
      S.del('leads', l.id); mo.close(); CZ.render();
    });
  }
  U.on('click', '[data-ledit]', function (e, el) { leadForm(el.getAttribute('data-ledit')); });

  U.on('click', '[data-lwin]', function (e, el) {
    var l = S.get('leads', el.getAttribute('data-lwin'));
    S.upd('leads', l.id, { stage: 'won', nextFollow: null });
    var m = S.add('members', {
      code: S.nextCode(), name: l.name, phone: l.phone, gender: l.gender || 'm',
      branchId: l.branchId, joinedAt: U.today(), source: l.source, goal: '', status: 'expired',
      note: 'اتحوّل من عميل محتمل. ' + (l.note || ''), tags: []
    });
    U.toast('اتحوّل لعضو — كمّل الاشتراك');
    CZ.render();
    setTimeout(function () { CZ.renewModal(m.id); }, 200);
  });

  /* ================= مركز الرسايل ================= */
  var MT = 'expiring';

  CZ.views.messages = {
    title: 'مركز الرسايل',
    sub: 'قوايم جاهزة + قوالب واتساب',
    perm: 'messages',
    render: function (p) {
      if (p.list) { MT = p.list; delete p.list; }
      if (p.tpl) { MT = p.tpl.replace('tp_', ''); delete p.tpl; }
      var b = CZ.state.branch;
      var lists = buildLists(b);
      var cur = lists[MT] || lists.expiring;

      return '<div class="grid g-2-1">' +
        '<div>' +
        '<div class="tabs mb">' + Object.keys(lists).map(function (k) {
          return '<button data-mtab="' + k + '"' + (MT === k ? ' class="on"' : '') + '>' + lists[k].t +
            '<span class="cnt">' + lists[k].items.length + '</span></button>';
        }).join('') + '</div>' +

        W.card({
          title: cur.t, ico: cur.ico, tone: cur.tone, flush: true,
          sub: cur.s,
          act: cur.items.length ? '<button class="btn btn-sm btn-ghost" id="ms-copy">' + U.ico('copy') + 'انسخ الأرقام</button>' : '',
          body: cur.items.length ? '<div style="max-height:520px;overflow-y:auto">' + cur.items.map(function (m) {
            var tpl = S.get('templates', cur.tplId);
            var txt = tpl ? W.fillTpl(tpl.body, m) : '';
            return '<div class="list-i">' + W.ava(m, 'sm') +
              '<div class="li-t"><b>' + U.esc(m.name) + '</b><span>' + U.fPhone(m.phone) + ' · ' +
              U.esc(cur.meta(m)) + '</span></div>' +
              '<a class="btn btn-sm btn-ok" href="' + U.wa(m.phone, txt) + '" target="_blank" rel="noopener" ' +
              'data-sent="' + m.id + '">' + U.ico('msg') + 'ابعت</a>' +
              '<button class="btn btn-sm btn-soft btn-ico" data-mem="' + m.id + '">' + U.ico('eye') + '</button>' +
              '</div>';
          }).join('') + '</div>' : W.empty('القايمة فاضية', 'مفيش حد في الحالة دي دلوقتي.', 'check'),
          foot: 'كل ضغطة «ابعت» بتفتح واتساب بالرسالة مكتوبة — إنت بتراجع وتبعت.'
        }) +
        '</div>' +

        W.card({
          title: 'القالب المستخدم', ico: 'file',
          sub: (S.get('templates', cur.tplId) || {}).name || '',
          body: '<textarea class="inp" id="ms-tpl" rows="9">' +
            U.esc((S.get('templates', cur.tplId) || {}).body || '') + '</textarea>' +
            '<div class="row mt-s"><button class="btn btn-sm btn-lime" id="ms-savetpl">' + U.ico('save') + 'احفظ القالب</button></div>' +
            '<div class="hr"></div>' +
            '<div class="xs mut b mb">المتغيّرات اللي تقدر تستخدمها</div>' +
            '<div class="row" style="gap:5px">' +
            ['الاسم', 'الاسم_كامل', 'الكود', 'الباقة', 'تاريخ_الانتهاء', 'أيام_متبقية', 'الجلسات_المتبقية', 'المتبقي', 'الفرع', 'تليفون_الفرع']
              .map(function (v) { return '<button class="chip" data-var="{' + v + '}">{' + v + '}</button>'; }).join('') +
            '</div>' +
            '<div class="hr"></div>' +
            '<div class="xs mut b mb">كل القوالب</div>' +
            '<div style="display:grid;gap:6px">' + S.all('templates').map(function (t) {
              return '<button class="pick-i' + (t.id === cur.tplId ? ' on' : '') + '" data-tplpick="' + t.id + '">' +
                '<span class="pi-t"><b>' + U.esc(t.name) + '</b><span class="pi-sub">' +
                U.esc(String(t.body).slice(0, 46)) + '...</span></span></button>';
            }).join('') + '</div>' +
            '<button class="btn btn-ghost btn-sm btn-blk mt" id="ms-newtpl">' + U.ico('plus') + 'قالب جديد</button>'
        }) +
        '</div>';
    },
    after: function () {
      var e;
      if ((e = U.$('#ms-savetpl'))) e.addEventListener('click', function () {
        var lists = buildLists(CZ.state.branch);
        var id = (lists[MT] || lists.expiring).tplId;
        S.upd('templates', id, { body: U.$('#ms-tpl').value });
        U.toast('القالب اتحفظ');
      });
      if ((e = U.$('#ms-copy'))) e.addEventListener('click', function () {
        var lists = buildLists(CZ.state.branch);
        var nums = (lists[MT] || lists.expiring).items.map(function (m) { return U.phone(m.phone); }).join('\n');
        var ta = document.createElement('textarea');
        ta.value = nums; document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); ta.remove();
        U.toast('اتنسخ ' + (lists[MT].items.length) + ' رقم');
      });
      if ((e = U.$('#ms-newtpl'))) e.addEventListener('click', function () {
        var mo = U.modal({
          title: 'قالب رسالة جديد',
          body: '<div class="f">' + W.fld({ label: 'اسم القالب', name: 'name', req: true }) +
            W.fld({ label: 'النص', name: 'body', type: 'textarea', rows: 6, ph: 'أهلاً {الاسم}...' }) + '</div>',
          footer: '<div class="grow"></div><button class="btn btn-lime" id="nt-ok">احفظ</button>'
        });
        U.$('#nt-ok', mo.el).addEventListener('click', function () {
          S.add('templates', W.form(mo.el)); mo.close(); CZ.render();
        });
      });
      U.$$('[data-var]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var ta = U.$('#ms-tpl');
          var v = btn.getAttribute('data-var');
          var p = ta.selectionStart;
          ta.value = ta.value.slice(0, p) + v + ta.value.slice(ta.selectionEnd);
          ta.focus(); ta.selectionStart = ta.selectionEnd = p + v.length;
        });
      });
    }
  };

  U.on('click', '[data-mtab]', function (e, el) {
    if (!U.$('#ms-tpl')) return;
    MT = el.getAttribute('data-mtab'); CZ.render();
  });
  U.on('click', '[data-tplpick]', function (e, el) {
    var t = S.get('templates', el.getAttribute('data-tplpick'));
    U.$('#ms-tpl').value = t.body;
    U.toast('اتحمّل «' + t.name + '» — احفظه لو عدّلته');
  });

  function buildLists(b) {
    var absD = S.db().settings.absentWarnDays || 10;
    var members = S.scope(S.all('members'), b);
    return {
      expiring: {
        t: 'اشتراكهم بيخلص', ico: 'clock', tone: 'warn', tplId: 'tp_expire',
        s: 'أهم قايمة في النظام — التجديد أرخص بكتير من عميل جديد',
        items: members.filter(function (m) { return S.status(m).k === 'expiring'; }),
        meta: function (m) { var s = S.activeSub(m.id); return 'باقي ' + U.diffDays(s.endAt) + ' يوم'; }
      },
      expired: {
        t: 'اشتراكهم خلص', ico: 'alert', tone: 'danger', tplId: 'tp_expired',
        s: 'اللي خلص من أقل من 45 يوم — دول أسهل ناس ترجّعهم',
        items: members.filter(function (m) {
          var st = S.status(m); return st.k === 'expired' && st.days > -45;
        }),
        meta: function (m) { var s = S.lastSub(m.id); return 'خلص من ' + Math.abs(U.diffDays(s.endAt)) + ' يوم'; }
      },
      absent: {
        t: 'مشتركين وغايبين', ico: 'user', tone: 'warn', tplId: 'tp_absent',
        s: 'بيدفعوا ومش بيجوا — دول اللي مش هيجدّدوا الشهر الجاي',
        items: members.filter(function (m) {
          var k = S.status(m).k;
          if (k !== 'active' && k !== 'expiring') return false;
          var lv = S.lastVisit(m.id);
          return !lv || U.diffDays(lv.inAt) < -absD;
        }),
        meta: function (m) { var lv = S.lastVisit(m.id); return lv ? 'آخر مرة ' + U.ago(lv.inAt) : 'عمره ما جه'; }
      },
      debt: {
        t: 'عليهم متأخرات', ico: 'wallet', tone: 'danger', tplId: 'tp_debt',
        s: 'فلوس شغلك اللي اتعمل ومش متحصّلة',
        items: members.filter(function (m) { return S.debt(m.id) > 0; }),
        meta: function (m) { return 'عليه ' + U.m(S.debt(m.id)); }
      },
      welcome: {
        t: 'أعضاء جداد', ico: 'sparkle', tone: 'lime', tplId: 'tp_welcome',
        s: 'اللي اشتركوا آخر 7 أيام — رسالة ترحيب بتفرق',
        items: members.filter(function (m) { return U.diffDays(m.joinedAt) > -7; }),
        meta: function (m) { return 'اشترك ' + U.ago(m.joinedAt); }
      },
      bday: {
        t: 'عيد ميلادهم', ico: 'star', tone: 'gold', tplId: 'tp_bday',
        s: 'النهاردة والأسبوع الجاي',
        items: members.filter(function (m) {
          if (!m.birth) return false;
          var bd = U.parse(m.birth), n = new Date();
          var next = new Date(n.getFullYear(), bd.getMonth(), bd.getDate());
          var d = Math.round((next - new Date(n.getFullYear(), n.getMonth(), n.getDate())) / 86400000);
          return d >= 0 && d <= 7;
        }),
        meta: function (m) {
          var bd = U.parse(m.birth);
          return U.fDate(new Date(new Date().getFullYear(), bd.getMonth(), bd.getDate()), 'short');
        }
      },
      all: {
        t: 'كل النشطين', ico: 'users', tone: 'info', tplId: 'tp_offer',
        s: 'لإعلان عرض أو خبر عام',
        items: members.filter(function (m) {
          var k = S.status(m).k; return k === 'active' || k === 'expiring';
        }),
        meta: function (m) { var s = S.activeSub(m.id); return s ? s.planName : ''; }
      }
    };
  }
})();
