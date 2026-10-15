/* ============================================================
   سيزر جيم — التقارير
   ------------------------------------------------------------
   التقارير هنا مش «كام عضو عندنا». التقارير هنا بتجاوب على:
   بنكسب ولا بنخسر أعضاء؟ الناس بتيجي إمتى؟ الفرعين مين فيهم
   أحسن ولأي سبب؟ وأي باقة بتجيب فلوس فعلاً؟
   ============================================================ */
(function () {
  'use strict';
  var CZ = window.CZ, U = CZ.u, S = CZ.s, W = CZ.w;
  CZ.views = CZ.views || {};
  CZ.state = CZ.state || { user: null, branch: 'all', params: {} };

  var RT = 'growth';

  CZ.views.reports = {
    title: 'التقارير',
    sub: function () { return CZ.state.branch === 'all' ? 'كل الفروع' : S.branchName(CZ.state.branch); },
    perm: 'reports',
    render: function () {
      return '<div class="row-b mb">' +
        '<div class="tabs" style="border:0">' + [
          ['growth', 'النمو والانضمام'], ['retention', 'الاستمرار والفقدان'],
          ['traffic', 'الزحمة والمواعيد'], ['revenue', 'الفلوس'],
          ['branches', 'مقارنة الفروع'], ['members', 'تحليل الأعضاء']
        ].map(function (t) {
          return '<button data-rtab="' + t[0] + '"' + (RT === t[0] ? ' class="on"' : '') + '>' + t[1] + '</button>';
        }).join('') + '</div>' +
        '<button class="btn btn-ghost btn-sm" id="rp-print">' + U.ico('print') + 'اطبع التقرير</button>' +
        '</div>' + R[RT](CZ.state.branch);
    },
    after: function () {
      var e = U.$('#rp-print');
      if (e) e.addEventListener('click', printSummary);
    }
  };

  U.on('click', '[data-rtab]', function (e, el) {
    if (!U.$('#rp-print')) return;
    RT = el.getAttribute('data-rtab'); CZ.render();
  });

  var R = {
    /* ---------- النمو ---------- */
    growth: function (b) {
      var members = S.scope(S.all('members'), b);
      var months = [];
      for (var i = 11; i >= 0; i--) {
        var mo = U.addMonths(U.today(), -i).slice(0, 7);
        var joined = members.filter(function (m) { return m.joinedAt.slice(0, 7) === mo; }).length;
        var lost = S.scope(S.all('subs'), b).filter(function (s) {
          if (s.endAt.slice(0, 7) !== mo) return false;
          var next = S.where('subs', function (x) {
            return x.memberId === s.memberId && x.startAt > s.endAt;
          }).length;
          return next === 0 && U.diffDays(s.endAt) < -30;
        }).length;
        months.push({ mo: mo, joined: joined, lost: lost });
      }
      var totalNew = U.sum(months, 'joined'), totalLost = U.sum(months, 'lost');
      var bySource = {};
      members.forEach(function (m) { if (m.source) bySource[m.source] = (bySource[m.source] || 0) + 1; });
      var thisMo = months[months.length - 1], lastMo = months[months.length - 2] || { joined: 0 };

      return '<div class="grid g-4 mb">' +
        W.stat({ t: 'أعضاء جداد آخر 12 شهر', v: U.n(totalNew), ico: 'sparkle', tone: 'lime' }) +
        W.stat({ t: 'أعضاء اتفقدوا', v: U.n(totalLost), ico: 'down', tone: 'danger',
          d: 'ما جددوش بعد 30 يوم من الانتهاء' }) +
        W.stat({ t: 'صافي النمو', v: U.n(totalNew - totalLost), ico: 'trend',
          tone: totalNew - totalLost >= 0 ? 'ok' : 'danger', dark: true }) +
        W.stat({ t: 'الشهر ده', v: U.n(thisMo.joined), ico: 'users', tone: 'info',
          d: lastMo.joined ? (thisMo.joined >= lastMo.joined ? '+' : '') +
            (thisMo.joined - lastMo.joined) + ' عن الشهر اللي فات' : '',
          dir: thisMo.joined >= lastMo.joined ? 'up' : 'down' }) +
        '</div>' +

        W.card({
          title: 'الانضمام والفقدان شهر بشهر', ico: 'chart',
          sub: 'الخط الأخضر لازم يفضل فوق الأحمر',
          body: CZ.c.line([
            { name: 'انضموا', data: months.map(function (m) { return m.joined; }), color: '#6F9410' },
            { name: 'اتفقدوا', data: months.map(function (m) { return m.lost; }), color: '#C0492B', area: false }
          ], { h: 250, labels: months.map(function (m) { return U.MONTHS[+m.mo.slice(5) - 1].slice(0, 4); }) })
        }) +

        '<div class="grid g-2 mt">' +
        W.card({
          title: 'الأعضاء جايين منين', ico: 'target',
          sub: 'ده اللي بيقولك تحط فلوس التسويق فين',
          body: Object.keys(bySource).length ? CZ.c.rank(Object.keys(bySource).map(function (k) {
            return { t: k, v: bySource[k], sub: U.pct(bySource[k], members.length) + '% من الأعضاء' };
          }).sort(U.by('v', 'desc')), { unit: ' عضو' }) : W.empty('البيانات ناقصة', 'سجّل «عرف الجيم منين» وقت إضافة العضو.', 'target')
        }) +
        W.card({
          title: 'تكوين قاعدة الأعضاء', ico: 'grid',
          body: (function () {
            var g = { m: 0, f: 0 };
            members.forEach(function (m) { g[m.gender === 'f' ? 'f' : 'm']++; });
            return CZ.c.donut([
              { t: 'رجالة', v: g.m, color: '#6F9410' },
              { t: 'سيدات', v: g.f, color: '#E8B14C' }
            ], { center: U.n(members.length), centerSub: 'عضو' }) +
              '<div class="hr"></div>' +
              (function () {
                var ages = { 'أقل من 20': 0, '20–29': 0, '30–39': 0, '40+': 0, 'غير مسجّل': 0 };
                members.forEach(function (m) {
                  if (!m.birth) { ages['غير مسجّل']++; return; }
                  var a = Math.floor(-U.diffDays(m.birth) / 365);
                  if (a < 20) ages['أقل من 20']++;
                  else if (a < 30) ages['20–29']++;
                  else if (a < 40) ages['30–39']++;
                  else ages['40+']++;
                });
                return CZ.c.rank(Object.keys(ages).map(function (k) { return { t: k, v: ages[k] }; }),
                  { unit: ' عضو', rank: false });
              })();
          })()
        }) +
        '</div>';
    },

    /* ---------- الاستمرار ---------- */
    retention: function (b) {
      var members = S.scope(S.all('members'), b);
      var withSubs = members.filter(function (m) { return S.memberSubs(m.id).length > 0; });
      var renewed = members.filter(function (m) { return S.memberSubs(m.id).length > 1; });
      var loyal = members.filter(function (m) { return S.memberSubs(m.id).length >= 4; });
      var avgSubs = withSubs.length ? (U.sum(withSubs, function (m) { return S.memberSubs(m.id).length; }) / withSubs.length) : 0;
      var ltv = withSubs.length ? U.sum(withSubs, function (m) {
        return U.sum(S.where('money', function (x) { return x.memberId === m.id && x.kind === 'in'; }), 'amount');
      }) / withSubs.length : 0;
      var churn = withSubs.length ? U.pct(withSubs.length - renewed.length, withSubs.length) : 0;

      /* عمر العضوية */
      var buckets = { 'أقل من شهر': 0, '1–3 شهور': 0, '3–6 شهور': 0, '6–12 شهر': 0, 'أكتر من سنة': 0 };
      members.forEach(function (m) {
        var d = Math.abs(U.diffDays(m.joinedAt));
        if (d < 30) buckets['أقل من شهر']++;
        else if (d < 90) buckets['1–3 شهور']++;
        else if (d < 180) buckets['3–6 شهور']++;
        else if (d < 365) buckets['6–12 شهر']++;
        else buckets['أكتر من سنة']++;
      });

      /* الانتظام */
      var since = U.addDays(U.today(), -30);
      var active = members.filter(function (m) {
        var k = S.status(m).k; return k === 'active' || k === 'expiring';
      });
      var reg = { 'منتظم (8+ مرة)': 0, 'متوسط (4–7)': 0, 'ضعيف (1–3)': 0, 'ما جاش خالص': 0 };
      active.forEach(function (m) {
        var n = S.where('attend', function (a) { return a.memberId === m.id && a.inAt >= since; }).length;
        if (n >= 8) reg['منتظم (8+ مرة)']++;
        else if (n >= 4) reg['متوسط (4–7)']++;
        else if (n >= 1) reg['ضعيف (1–3)']++;
        else reg['ما جاش خالص']++;
      });

      return '<div class="grid g-4 mb">' +
        W.stat({ t: 'نسبة التجديد', v: U.pct(renewed.length, withSubs.length) + '<span class="cur">%</span>',
          ico: 'refresh', tone: 'lime', dark: true, d: U.n(renewed.length) + ' جدّدوا مرة على الأقل' }) +
        W.stat({ t: 'نسبة الفقدان', v: churn + '<span class="cur">%</span>', ico: 'down',
          tone: churn > 50 ? 'danger' : churn > 30 ? 'warn' : 'ok', d: 'اشتركوا مرة واحدة وبس' }) +
        W.stat({ t: 'متوسط عدد الاشتراكات للعضو', v: avgSubs.toFixed(1), ico: 'layers', tone: 'info' }) +
        W.stat({ t: 'متوسط ما يدفعه العضو في عمره', v: U.n(Math.round(ltv)), cur: CZ.CUR, ico: 'wallet', tone: 'gold',
          d: 'أهم رقم في الجيم' }) +
        '</div>' +

        '<div class="grid g-2">' +
        W.card({
          title: 'قد إيه بيفضلوا معاك', ico: 'clock',
          body: CZ.c.rank(Object.keys(buckets).map(function (k, i) {
            return { t: k, v: buckets[k], color: ['#C0492B', '#E8B14C', '#3A6EA5', '#6F9410', '#17181C'][i] };
          }), { unit: ' عضو', rank: false })
        }) +
        W.card({
          title: 'انتظام النشطين — آخر 30 يوم', ico: 'activity',
          sub: 'اللي ما بيجيش هو اللي مش هيجدّد',
          body: CZ.c.donut(Object.keys(reg).map(function (k, i) {
            return { t: k, v: reg[k], color: ['#6F9410', '#3A6EA5', '#E8B14C', '#C0492B'][i] };
          }), { center: U.n(active.length), centerSub: 'نشط' })
        }) +
        '</div>' +

        '<div class="mt">' + W.card({
          title: 'أوفى 15 عضو', ico: 'star', tone: 'gold',
          sub: 'دول اللي تدلّعهم وتخلّيهم يجيبولك ناس',
          flush: true,
          body: W.table([
            { t: 'العضو', sort: false, render: function (m) { return W.who(m, U.fPhone(m.phone)); } },
            { t: 'مشترك من', sort: false, render: function (m) {
              return U.fDate(m.joinedAt, 'short') + ' <span class="xs fnt">(' + U.ago(m.joinedAt) + ')</span>';
            }},
            { t: 'اشتراكات', sort: false, cls: 'num mid', render: function (m) { return S.memberSubs(m.id).length; } },
            { t: 'زيارات', sort: false, cls: 'num mid', render: function (m) { return S.visitCount(m.id); } },
            { t: 'إجمالي دفع', sort: false, cls: 'num end', render: function (m) {
              return U.money(U.sum(S.where('money', function (x) {
                return x.memberId === m.id && x.kind === 'in';
              }), 'amount'));
            }},
            { t: 'الحالة', sort: false, render: function (m) { return W.statusBadge(m); } }
          ], members.slice().sort(function (a, c) {
            var av = U.sum(S.where('money', function (x) { return x.memberId === a.id && x.kind === 'in'; }), 'amount');
            var cv = U.sum(S.where('money', function (x) { return x.memberId === c.id && x.kind === 'in'; }), 'amount');
            return cv - av;
          }).slice(0, 15), { emptyT: 'مفيش بيانات' })
        }) + '</div>';
    },

    /* ---------- الزحمة ---------- */
    traffic: function (b) {
      var heat = S.heat(b, 60);
      var series = S.visitSeries(60, b);
      var byDow = [0, 0, 0, 0, 0, 0, 0];
      heat.forEach(function (row, d) { byDow[d] = U.sum(row); });
      var byHour = {};
      for (var h = 6; h <= 23; h++) {
        byHour[h] = U.sum(heat.map(function (r) { return r[h] || 0; }));
      }
      var peakH = Object.keys(byHour).sort(function (a, c) { return byHour[c] - byHour[a]; })[0];
      var quiet = Object.keys(byHour).filter(function (h) { return byHour[h] > 0; })
        .sort(function (a, c) { return byHour[a] - byHour[c]; })[0];
      var cap = b === 'all' ? U.sum(S.branches(), 'capacity') : (S.branch(b) || {}).capacity || 50;

      return '<div class="grid g-4 mb">' +
        W.stat({ t: 'متوسط الحضور اليومي', v: U.n(Math.round(U.sum(series, 'v') / series.length)), ico: 'users', tone: 'info' }) +
        W.stat({ t: 'أعلى يوم', v: U.DAYS[byDow.indexOf(Math.max.apply(null, byDow))], ico: 'fire', tone: 'lime' }) +
        W.stat({ t: 'ساعة الذروة', v: U.fMin(peakH * 60), ico: 'clock', tone: 'danger',
          d: 'أعلى ضغط على الأجهزة' }) +
        W.stat({ t: 'أهدى ساعة', v: quiet ? U.fMin(quiet * 60) : '—', ico: 'snow', tone: 'ok',
          d: 'اعرض عليها خصم لتوزيع الزحمة' }) +
        '</div>' +

        W.card({
          title: 'خريطة الزحمة — آخر 60 يوم', ico: 'grid',
          sub: 'كل ما اللون يغمق كل ما الزحمة تزيد',
          body: '<div class="tw">' + CZ.c.heat(heat) + '</div>',
          foot: 'استخدمها في تحديد ورديات الكباتن، وفي عروض «تعالى الصبح بسعر أقل».'
        }) +

        '<div class="grid g-2 mt">' +
        W.card({
          title: 'الحضور حسب اليوم', ico: 'calendar',
          body: CZ.c.bars(U.DAYS.map(function (d, i) {
            return { t: U.DAYS_S[i], v: byDow[i], color: i === byDow.indexOf(Math.max.apply(null, byDow)) ? '#17181C' : '#6F9410' };
          }), { h: 210, unit: ' زيارة' })
        }) +
        W.card({
          title: 'الحضور حسب الساعة', ico: 'clock',
          body: CZ.c.bars(Object.keys(byHour).map(function (h) {
            return { t: (h > 12 ? h - 12 : h) + (h >= 12 ? 'م' : 'ص'), v: byHour[h] };
          }), { h: 210, values: false, unit: ' زيارة' })
        }) +
        '</div>' +

        '<div class="mt">' + W.card({
          title: 'الحضور اليومي — آخر 60 يوم', ico: 'activity',
          body: CZ.c.line([{ name: 'زيارات', data: series.map(function (x) { return x.v; }), color: '#6F9410' }],
            { h: 220, labels: series.map(function (x) { return U.fDate(x.d, 'short'); }), legend: false }),
          foot: 'أعلى امتلاء وصلته: ' + Math.max.apply(null, series.map(function (x) { return x.v; })) +
            ' زيارة في اليوم — السعة المسجّلة ' + cap + ' في نفس اللحظة.'
        }) + '</div>';
    },

    /* ---------- الفلوس ---------- */
    revenue: function (b) {
      var months = [];
      for (var i = 11; i >= 0; i--) {
        var start = U.addMonths(U.today().slice(0, 8) + '01', -i);
        var end = U.addDays(U.addMonths(start, 1), -1);
        months.push({
          mo: start.slice(0, 7),
          in: U.sum(S.income(start, end, b), 'amount'),
          out: U.sum(S.expense(start, end, b), 'amount')
        });
      }
      var subs = S.scope(S.all('subs'), b);
      var byPlan = {};
      subs.forEach(function (s) {
        byPlan[s.planName] = byPlan[s.planName] || { n: 0, v: 0 };
        byPlan[s.planName].n++; byPlan[s.planName].v += s.paid || 0;
      });
      var year = U.today().slice(0, 5) + '01-01';
      var yIn = U.sum(S.income(year, U.today(), b), 'amount');
      var yOut = U.sum(S.expense(year, U.today(), b), 'amount');
      var byCat = {};
      S.income(year, U.today(), b).forEach(function (x) { byCat[x.cat] = (byCat[x.cat] || 0) + x.amount; });
      var best = months.slice().sort(function (a, c) { return c.in - a.in; })[0];

      return '<div class="grid g-4 mb">' +
        W.stat({ t: 'إيراد السنة', v: U.n(yIn), cur: CZ.CUR, ico: 'wallet', tone: 'ok' }) +
        W.stat({ t: 'مصروف السنة', v: U.n(yOut), cur: CZ.CUR, ico: 'down', tone: 'danger' }) +
        W.stat({ t: 'صافي السنة', v: U.n(yIn - yOut), cur: CZ.CUR, ico: 'trend', tone: 'lime', dark: true,
          d: 'هامش ' + U.pct(yIn - yOut, yIn) + '%' }) +
        W.stat({ t: 'أحسن شهر', v: best ? U.MONTHS[+best.mo.slice(5) - 1] : '—', ico: 'star', tone: 'gold',
          d: best ? U.m(best.in) : '' }) +
        '</div>' +

        W.card({
          title: 'الإيراد والمصروف والصافي — 12 شهر', ico: 'chart',
          body: CZ.c.line([
            { name: 'إيراد', data: months.map(function (m) { return m.in; }), color: '#6F9410' },
            { name: 'مصروف', data: months.map(function (m) { return m.out; }), color: '#C0492B', area: false },
            { name: 'صافي', data: months.map(function (m) { return Math.max(0, m.in - m.out); }), color: '#17181C', area: false, dash: true }
          ], { h: 260, labels: months.map(function (m) { return U.MONTHS[+m.mo.slice(5) - 1].slice(0, 4); }) })
        }) +

        '<div class="grid g-2 mt">' +
        W.card({
          title: 'الباقات اللي بتجيب فلوس فعلاً', ico: 'tag',
          sub: 'المحصّل مش المعلن',
          body: CZ.c.rank(Object.keys(byPlan).map(function (k) {
            return { t: k, v: byPlan[k].v, sub: byPlan[k].n + ' اشتراك · متوسط ' + U.m(Math.round(byPlan[k].v / byPlan[k].n)) };
          }).sort(U.by('v', 'desc')).slice(0, 10), { money: true })
        }) +
        W.card({
          title: 'مصادر الإيراد', ico: 'grid',
          body: CZ.c.donut(Object.keys(byCat).map(function (k, i) {
            return {
              t: S.CATS_IN[k] || k, v: byCat[k],
              color: ['#6F9410', '#17181C', '#E8B14C', '#3A6EA5', '#6B5AA8', '#C0492B', '#9A9B91', '#255E3A'][i % 8]
            };
          }).sort(U.by('v', 'desc')), { center: U.n(yIn), centerSub: 'السنة' })
        }) +
        '</div>';
    },

    /* ---------- الفروع ---------- */
    branches: function () {
      var branches = S.branches();
      if (branches.length < 2) return W.empty('فيه فرع واحد بس', 'ضيف الفرع التاني من صفحة الفروع.', 'branch');
      var year = U.today().slice(0, 5) + '01-01';
      var rows = branches.map(function (b) {
        var st = S.stats(b.id);
        var members = S.where('members', function (m) { return m.branchId === b.id; });
        var att30 = S.where('attend', function (a) {
          return a.branchId === b.id && a.inAt >= U.addDays(U.today(), -30);
        }).length;
        var yIn = U.sum(S.income(year, U.today(), b.id), 'amount');
        var yOut = U.sum(S.expense(year, U.today(), b.id), 'amount');
        var active = members.filter(function (m) {
          var k = S.status(m).k; return k === 'active' || k === 'expiring';
        }).length;
        return {
          b: b, st: st, members: members.length, active: active, att30: att30,
          yIn: yIn, yOut: yOut, net: yIn - yOut,
          perMember: active ? Math.round(yIn / active) : 0,
          visitsPer: active ? (att30 / active).toFixed(1) : 0,
          fill: U.pct(active, b.capacity * 4)
        };
      });

      function cmp(t, key, fmt, hint) {
        var max = Math.max.apply(null, rows.map(function (r) { return +r[key] || 0; }));
        return '<div style="margin-bottom:16px">' +
          '<div class="row-b" style="margin-bottom:6px"><b class="sm">' + t + '</b>' +
          (hint ? '<span class="xs fnt">' + hint + '</span>' : '') + '</div>' +
          rows.map(function (r) {
            return '<div class="row" style="gap:9px;flex-wrap:nowrap;margin-bottom:5px">' +
              '<span class="xs" style="width:72px;flex:none;color:' + r.b.color + ';font-weight:800">' + U.esc(r.b.short) + '</span>' +
              '<div class="bar" style="flex:1"><i style="width:' + ((+r[key] || 0) / (max || 1) * 100) + '%;background:' + r.b.color + '"></i></div>' +
              '<b class="num sm" style="width:92px;text-align:end;flex:none">' + fmt(r[key]) + '</b></div>';
          }).join('') + '</div>';
      }

      return '<div class="grid g-2 mb">' + rows.map(function (r) {
        return W.card({
          title: r.b.name, ico: 'branch',
          act: '<span class="badge" style="background:' + r.b.color + '18;color:' + r.b.color + '">' +
            (r.b.isMain ? 'الرئيسي' : 'فرع') + '</span>',
          body: '<div class="grid g-2" style="gap:11px">' +
            kv('أعضاء نشطين', U.n(r.active) + ' من ' + U.n(r.members)) +
            kv('حضور آخر 30 يوم', U.n(r.att30)) +
            kv('زيارات لكل عضو', r.visitsPer + ' في الشهر') +
            kv('إيراد السنة', U.n(r.yIn) + ' ' + CZ.CUR) +
            kv('مصروف السنة', U.n(r.yOut) + ' ' + CZ.CUR) +
            kv('صافي السنة', U.n(r.net) + ' ' + CZ.CUR, r.net >= 0 ? 'pos' : 'neg') +
            kv('دخل العضو الواحد', U.n(r.perMember) + ' ' + CZ.CUR) +
            kv('السعة المسجّلة', U.n(r.b.capacity)) +
            '</div>',
          foot: U.esc(r.b.address || 'العنوان لسه مش مكتوب')
        });
      }).join('') + '</div>' +

        W.card({
          title: 'الفروع جنب بعض', ico: 'bar',
          sub: 'مقارنة مباشرة على نفس المقاييس',
          body: cmp('أعضاء نشطين', 'active', function (v) { return U.n(v) + ' عضو'; }) +
            cmp('حضور آخر 30 يوم', 'att30', function (v) { return U.n(v) + ' زيارة'; }) +
            cmp('زيارات العضو في الشهر', 'visitsPer', function (v) { return v + ' مرة'; },
              'الرقم ده بيقيس جودة التجربة مش حجم الفرع') +
            cmp('إيراد السنة', 'yIn', function (v) { return U.n(v) + ' ' + CZ.CUR; }) +
            cmp('صافي السنة', 'net', function (v) { return U.n(v) + ' ' + CZ.CUR; }) +
            cmp('دخل العضو الواحد', 'perMember', function (v) { return U.n(v) + ' ' + CZ.CUR; },
              'أهم مقياس للمقارنة العادلة بين فرع كبير وفرع صغير')
        }) +

        '<div class="mt">' + W.alert('info', 'إزاي تقرا المقارنة',
          'الفرع الأكبر طبيعي يجيب فلوس أكتر. الأرقام اللي بتقول مين شغّال أحسن فعلاً هي ' +
          '«زيارات العضو في الشهر» و«دخل العضو الواحد» — دول مستقلين عن الحجم.') + '</div>';
    },

    /* ---------- تحليل الأعضاء ---------- */
    members: function (b) {
      var members = S.scope(S.all('members'), b);
      var jobs = {}, goals = {}, areas = {};
      members.forEach(function (m) {
        if (m.job) jobs[m.job] = (jobs[m.job] || 0) + 1;
        if (m.goal) goals[m.goal] = (goals[m.goal] || 0) + 1;
        if (m.address) areas[m.address] = (areas[m.address] || 0) + 1;
      });
      var statuses = { active: 0, expiring: 0, expired: 0, frozen: 0, nosub: 0, blocked: 0, nosessions: 0 };
      members.forEach(function (m) { var k = S.status(m).k; statuses[k] = (statuses[k] || 0) + 1; });
      var withMedical = members.filter(function (m) { return m.medical; });

      return '<div class="grid g-2 mb">' +
        W.card({
          title: 'حالة الأعضاء', ico: 'users',
          body: CZ.c.donut([
            { t: 'ساري', v: statuses.active, color: '#6F9410' },
            { t: 'قرب يخلص', v: statuses.expiring, color: '#E8B14C' },
            { t: 'الجلسات خلصت', v: statuses.nosessions || 0, color: '#9C6F16' },
            { t: 'منتهي', v: statuses.expired, color: '#C0492B' },
            { t: 'مجمّد', v: statuses.frozen, color: '#3A6EA5' },
            { t: 'موقوف', v: statuses.blocked || 0, color: '#17181C' }
          ].filter(function (x) { return x.v; }), { center: U.n(members.length), centerSub: 'عضو' })
        }) +
        W.card({
          title: 'الهدف من التمرين', ico: 'target',
          sub: 'استخدمها في اللي بتكتبه على السوشيال',
          body: Object.keys(goals).length ? CZ.c.rank(Object.keys(goals).map(function (k) {
            return { t: k, v: goals[k] };
          }).sort(U.by('v', 'desc')), { unit: ' عضو' }) : W.empty('البيانات ناقصة', '', 'target')
        }) +
        '</div>' +

        '<div class="grid g-2">' +
        W.card({
          title: 'وظايف الأعضاء', ico: 'user',
          body: Object.keys(jobs).length ? CZ.c.rank(Object.keys(jobs).map(function (k) {
            return { t: k, v: jobs[k] };
          }).sort(U.by('v', 'desc')).slice(0, 10), { unit: ' عضو' }) : W.empty('البيانات ناقصة', '', 'user')
        }) +
        W.card({
          title: 'بيجوا من أنهي مناطق', ico: 'map',
          sub: 'المناطق اللي مفيهاش حد = فرصة إعلان',
          body: Object.keys(areas).length ? CZ.c.rank(Object.keys(areas).map(function (k) {
            return { t: k, v: areas[k] };
          }).sort(U.by('v', 'desc')).slice(0, 10), { unit: ' عضو' }) : W.empty('البيانات ناقصة', '', 'map')
        }) +
        '</div>' +

        (withMedical.length ? '<div class="mt">' + W.card({
          title: 'أعضاء عندهم ملاحظات طبية', ico: 'heart', tone: 'danger',
          sub: 'الكباتن لازم يكونوا عارفين',
          flush: true,
          body: W.table([
            { t: 'العضو', sort: false, render: function (m) { return W.who(m, U.fPhone(m.phone)); } },
            { t: 'الملاحظة', sort: false, render: function (m) { return '<span class="sm">' + U.esc(m.medical) + '</span>'; } },
            { t: 'للطوارئ', sort: false, render: function (m) {
              return m.emergencyPhone ? U.esc(m.emergencyName || '') + ' ' + U.fPhone(m.emergencyPhone)
                : '<span class="badge warn">مفيش رقم طوارئ</span>';
            }},
            { t: 'الفرع', sort: false, render: function (m) { return W.branchTag(m.branchId); } }
          ], withMedical, { emptyT: '' })
        }) + '</div>' : '');
    }
  };

  function kv(t, v, cls) {
    return '<div><div class="xs mut">' + U.esc(t) + '</div><b class="num ' + (cls || '') +
      '" style="font-size:16px">' + v + '</b></div>';
  }

  function printSummary() {
    var b = CZ.state.branch;
    var st = S.stats(b);
    var year = U.today().slice(0, 5) + '01-01';
    var yIn = U.sum(S.income(year, U.today(), b), 'amount');
    var yOut = U.sum(S.expense(year, U.today(), b), 'amount');
    var members = S.scope(S.all('members'), b);
    var withSubs = members.filter(function (m) { return S.memberSubs(m.id).length > 0; });
    var renewed = members.filter(function (m) { return S.memberSubs(m.id).length > 1; });

    U.print('<div class="a4">' +
      '<div class="a4-h"><div><div class="logo">CEZAR</div><h1>تقرير الأداء</h1></div>' +
      '<div class="meta">' + (b === 'all' ? 'كل الفروع' : U.esc(S.branchName(b))) + '<br>' +
      U.fDate(U.today()) + '<br>' + U.esc(CZ.state.user.name) + '</div></div>' +

      '<div class="a4-grid">' +
      '<div class="a4-stat"><div class="t">أعضاء نشطين</div><div class="v">' + U.n(st.active) + '</div></div>' +
      '<div class="a4-stat"><div class="t">إجمالي الأعضاء</div><div class="v">' + U.n(st.members) + '</div></div>' +
      '<div class="a4-stat"><div class="t">إيراد السنة</div><div class="v">' + U.n(yIn) + '</div></div>' +
      '<div class="a4-stat"><div class="t">صافي السنة</div><div class="v">' + U.n(yIn - yOut) + '</div></div>' +
      '</div>' +

      '<h2>ملخّص</h2><table><tbody>' +
      [['أعضاء نشطين', U.n(st.active)],
      ['منهم سيدات', U.n(st.women)],
      ['أعضاء جداد الشهر ده', U.n(st.newThisMonth)],
      ['اشتراكات مجمّدة', U.n(st.frozen)],
      ['اشتراكات منتهية', U.n(st.expired)],
      ['نسبة التجديد', U.pct(renewed.length, withSubs.length) + '%'],
      ['متأخرات غير محصّلة', U.n(st.debt) + ' ' + CZ.CUR],
      ['تحصيل الشهر', U.n(st.monthIn) + ' ' + CZ.CUR],
      ['مصروف الشهر', U.n(st.monthOut) + ' ' + CZ.CUR],
      ['صافي الشهر', U.n(st.monthIn - st.monthOut) + ' ' + CZ.CUR],
      ['إيراد السنة', U.n(yIn) + ' ' + CZ.CUR],
      ['مصروف السنة', U.n(yOut) + ' ' + CZ.CUR],
      ['هامش الربح', U.pct(yIn - yOut, yIn) + '%']]
        .map(function (r) { return '<tr><td>' + r[0] + '</td><td class="n">' + r[1] + '</td></tr>'; }).join('') +
      '</tbody></table>' +

      (S.branches().length > 1 && b === 'all' ? '<h2>الفروع</h2><table><thead><tr>' +
        '<th>الفرع</th><th class="n">نشطين</th><th class="n">حضور 30 يوم</th><th class="n">إيراد السنة</th>' +
        '<th class="n">صافي السنة</th></tr></thead><tbody>' +
        S.branches().map(function (br) {
          var bIn = U.sum(S.income(year, U.today(), br.id), 'amount');
          var bOut = U.sum(S.expense(year, U.today(), br.id), 'amount');
          var bst = S.stats(br.id);
          return '<tr><td>' + U.esc(br.name) + '</td><td class="n">' + U.n(bst.active) + '</td>' +
            '<td class="n">' + U.n(S.where('attend', function (a) {
              return a.branchId === br.id && a.inAt >= U.addDays(U.today(), -30);
            }).length) + '</td>' +
            '<td class="n">' + U.n(bIn) + '</td><td class="n">' + U.n(bIn - bOut) + '</td></tr>';
        }).join('') + '</tbody></table>' : '') +

      '<div class="a4-f"><span>' + U.esc(S.db().settings.gymName) + '</span>' +
      '<span>تقرير مطبوع من النظام · ' + U.isoT().replace('T', ' ') + '</span></div></div>');
  }
})();
