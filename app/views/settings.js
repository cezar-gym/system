/* ============================================================
   سيزر جيم — الفروع + الإعدادات
   ============================================================ */
(function () {
  'use strict';
  var CZ = window.CZ, U = CZ.u, S = CZ.s, W = CZ.w;
  CZ.views = CZ.views || {};
  CZ.state = CZ.state || { user: null, branch: 'all', params: {} };

  /* ================= الفروع ================= */
  CZ.views.branches = {
    title: 'الفروع',
    sub: 'الفرعين بيتداروا من النظام ده',
    render: function () {
      var branches = S.all('branches');
      return '<div class="row-b mb"><div></div>' +
        '<button class="btn btn-lime btn-sm" id="br-new">' + U.ico('plus') + 'فرع جديد</button></div>' +

        '<div class="grid g-2">' + branches.map(function (b) {
          var st = S.stats(b.id);
          var staff = S.where('staff', function (s) { return s.branchId === b.id && s.active !== false; });
          return W.card({
            title: b.name, ico: 'branch',
            sub: b.isMain ? 'الفرع الرئيسي' : 'فرع',
            act: '<span class="badge" style="background:' + b.color + '18;color:' + b.color + '">' +
              '<i class="dot" style="background:' + b.color + '"></i>' + U.esc(b.short) + '</span>',
            body: (b.needsSetup ? W.alert('warn', 'الفرع ده لسه محتاج ظبط',
              'العنوان والتليفون والمواعيد لسه فاضية — الأرقام هتفضل ناقصة لحد ما تتملى.') + '<div class="mb"></div>' : '') +
              '<dl class="kv mb">' +
              '<dt>العنوان</dt><dd>' + U.esc(b.address || '—') + '</dd>' +
              '<dt>التليفون</dt><dd>' + (b.phone ? U.fPhone(b.phone) : '—') +
              (b.landline ? ' · ' + U.esc(b.landline) : '') + '</dd>' +
              '<dt>السعة</dt><dd class="num">' + U.n(b.capacity) + ' في نفس الوقت</dd>' +
              (b.area ? '<dt>المساحة</dt><dd class="num">' + U.n(b.area) + ' م²</dd>' : '') +
              '<dt>افتتح</dt><dd>' + (b.opened ? U.fDate(b.opened) : '—') + '</dd>' +
              '</dl>' +
              '<div class="grid g-3" style="gap:10px">' +
              kv('أعضاء', U.n(st.members)) + kv('نشطين', U.n(st.active)) + kv('فريق', U.n(staff.length)) +
              kv('حضور النهاردة', U.n(st.todayVisits)) + kv('تحصيل الشهر', U.n(st.monthIn)) +
              kv('صافي الشهر', U.n(st.monthIn - st.monthOut), st.monthIn - st.monthOut >= 0 ? 'pos' : 'neg') +
              '</div>' +
              '<div class="hr"></div>' +
              '<div class="xs mut b mb">مواعيد الأسبوع</div>' +
              U.DAYS.map(function (d, i) {
                var segs = (b.schedule || {})[String(i)] || [];
                return '<div class="row" style="gap:9px;flex-wrap:nowrap;margin-bottom:4px">' +
                  '<span class="xs mut" style="width:48px;flex:none">' + U.DAYS_S[i] + '</span>' +
                  '<div style="flex:1">' + W.segbar(b.id, i, i === new Date().getDay()) + '</div>' +
                  '<span class="xs fnt nowrap" style="width:130px;text-align:end">' +
                  (segs.length ? U.fMin(segs[0].from) + ' – ' + U.fMin(segs[segs.length - 1].to) : 'مقفول') + '</span></div>';
              }).join(''),
            foot: '<div class="row" style="gap:6px">' +
              '<button class="btn btn-sm btn-ghost" data-bredit="' + b.id + '">' + U.ico('edit') + 'بيانات الفرع</button>' +
              '<button class="btn btn-sm btn-ghost" data-brhours="' + b.id + '">' + U.ico('clock') + 'المواعيد</button>' +
              (b.maps ? '<a class="btn btn-sm btn-ghost" href="' + b.maps + '" target="_blank" rel="noopener">' +
                U.ico('map') + 'الخريطة</a>' : '') + '</div>'
          });
        }).join('') + '</div>' +

        (branches.length > 1 ? '<div class="mt">' + W.alert('lime', 'إزاي الفرعين بيشتغلوا سوا',
          'كل عضو وكل اشتراك وكل جنيه مربوط بفرع. لما تختار «كل الفروع» من فوق بتشوف المجموع، ' +
          'ولما تختار فرع بتشوفه لوحده. العضو يقدر يزور الفرع التاني والنظام هينبّهك إنها زيارة لفرع تاني.') + '</div>' : '');
    },
    after: function () {
      var e = U.$('#br-new');
      if (e) e.addEventListener('click', function () { branchForm(); });
    }
  };

  function kv(t, v, cls) {
    return '<div><div class="xs mut">' + U.esc(t) + '</div><b class="num ' + (cls || '') + '" style="font-size:16px">' + v + '</b></div>';
  }

  function branchForm(id) {
    var b = id ? S.branch(id) : null;
    var x = b || { color: '#6B5AA8', capacity: 50, active: true, schedule: {}, opened: U.today() };
    var mo = U.modal({
      title: b ? 'بيانات ' + b.name : 'فرع جديد', width: 'lg',
      body: '<div class="f" id="brf">' +
        '<div class="f-row c3">' +
        W.fld({ label: 'اسم الفرع', name: 'name', val: x.name, req: true, span: 2, ph: 'سيزر — اسم المنطقة' }) +
        W.fld({ label: 'اسم مختصر', name: 'short', val: x.short, req: true, ph: 'الرئيسي' }) +
        '</div>' +
        W.fld({ label: 'العنوان', name: 'address', val: x.address, ph: 'العنوان بالتفصيل زي ما هيتكتب على جوجل' }) +
        '<div class="f-row c3">' +
        W.fld({ label: 'الموبايل / واتساب', name: 'phone', type: 'tel', val: x.phone, ico: 'phone' }) +
        W.fld({ label: 'الأرضي', name: 'landline', val: x.landline }) +
        W.fld({ label: 'لينك الخريطة', name: 'maps', val: x.maps, ph: 'https://maps.app.goo.gl/...' }) +
        '</div>' +
        '<div class="f-row c4">' +
        W.fld({ label: 'السعة', name: 'capacity', type: 'number', val: x.capacity,
          hint: 'كام واحد يقدروا يتمرنوا مع بعض' }) +
        W.fld({ label: 'المساحة', name: 'area', type: 'number', val: x.area, suffix: 'م²' }) +
        W.fld({ label: 'تاريخ الافتتاح', name: 'opened', type: 'date', val: x.opened }) +
        W.fld({ label: 'لون الفرع', name: 'color', type: 'color', val: x.color || '#6B5AA8',
          hint: 'بيميّز الفرع في كل الشاشات' }) +
        '</div>' +
        W.check({ name: 'active', t: 'الفرع شغّال', on: x.active !== false }) +
        '</div>',
      footer: (b && !b.isMain ? '<button class="btn btn-danger btn-sm" id="brf-del">' + U.ico('trash') + 'حذف</button>' : '') +
        '<div class="grow"></div><button class="btn btn-ghost" data-close>إلغاء</button>' +
        '<button class="btn btn-lime" id="brf-ok">' + U.ico('save') + 'احفظ</button>'
    });
    U.$('#brf-ok', mo.el).addEventListener('click', function () {
      var d = W.form(U.$('#brf', mo.el));
      if (!d.name || !d.short) { U.toast('الاسم والاسم المختصر مطلوبين', 'err'); return; }
      d.whatsapp = U.phone(d.phone).replace(/^0/, '20');
      if (b) { d.needsSetup = false; S.upd('branches', b.id, d); }
      else {
        d.schedule = {};
        for (var i = 0; i < 7; i++) d.schedule[String(i)] = [{ g: 'men', from: 480, to: 1380 }];
        S.add('branches', d);
      }
      U.toast('اتحفظ'); mo.close(); CZ.render();
    });
    if (b && !b.isMain) U.$('#brf-del', mo.el).addEventListener('click', function () {
      var n = S.where('members', function (m) { return m.branchId === b.id; }).length;
      U.confirm({
        title: 'حذف ' + b.name + '؟', danger: true,
        body: n ? 'فيه ' + n + ' عضو مربوطين بالفرع ده. الأحسن تشيل علامة «الفرع شغّال» بدل الحذف.'
          : 'مفيش أعضاء مربوطين بيه.',
        ok: 'احذف'
      }).then(function (y) { if (y) { S.del('branches', b.id); mo.close(); CZ.render(); } });
    });
  }
  U.on('click', '[data-bredit]', function (e, el) { branchForm(el.getAttribute('data-bredit')); });

  /* ---------- تعديل المواعيد ---------- */
  U.on('click', '[data-brhours]', function (e, el) {
    var b = S.branch(el.getAttribute('data-brhours'));
    var sched = JSON.parse(JSON.stringify(b.schedule || {}));
    function tt(m) { return String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
    var mo = U.modal({
      title: 'مواعيد ' + b.name, width: 'lg',
      sub: 'الفترات دي اللي شاشة الدخول بتتحقق منها',
      body: '<div id="hrs"></div>' +
        '<div class="mt">' + W.alert('info', 'الفترات اللي بتعدّي نص الليل',
          'لو الجيم فاتح لحد الفجر، اكتب النهاية 07:00 وعلّم «بيكمّل لبكرة».') + '</div>',
      footer: '<div class="grow"></div><button class="btn btn-ghost" data-close>إلغاء</button>' +
        '<button class="btn btn-lime" id="hr-ok">' + U.ico('save') + 'احفظ المواعيد</button>'
    });

    function paint() {
      U.html(U.$('#hrs', mo.el), U.DAYS.map(function (d, i) {
        var segs = sched[String(i)] || [];
        return '<div class="card mb"><div class="card-b" style="padding:12px 14px">' +
          '<div class="row-b mb"><b>' + d + '</b>' +
          '<button class="btn btn-sm btn-soft" data-addseg="' + i + '">' + U.ico('plus') + 'فترة</button></div>' +
          (segs.length ? segs.map(function (s, j) {
            return '<div class="row" style="gap:7px;flex-wrap:nowrap;margin-bottom:6px">' +
              '<select class="inp" data-seg="' + i + '|' + j + '|g" style="width:auto;height:34px">' +
              '<option value="men"' + (s.g === 'men' ? ' selected' : '') + '>رجالة</option>' +
              '<option value="women"' + (s.g === 'women' ? ' selected' : '') + '>سيدات</option></select>' +
              '<input type="time" class="inp" data-seg="' + i + '|' + j + '|f" value="' + tt(s.from) + '" style="width:118px;height:34px">' +
              '<span class="xs mut">لحد</span>' +
              '<input type="time" class="inp" data-seg="' + i + '|' + j + '|t" value="' + tt(s.to) + '" style="width:118px;height:34px">' +
              '<label class="check xs" style="white-space:nowrap"><input type="checkbox" data-seg="' + i + '|' + j +
              '|n"' + (s.to > 1440 ? ' checked' : '') + '><span class="ct">بيكمّل لبكرة</span></label>' +
              '<button class="btn btn-sm btn-danger btn-ico" data-delseg="' + i + '|' + j + '">' + U.ico('x') + '</button>' +
              '</div>';
          }).join('') : '<div class="xs fnt">مقفول</div>') +
          '</div></div>';
      }).join(''));
    }
    paint();

    mo.el.addEventListener('click', function (ev) {
      var a = ev.target.closest('[data-addseg]');
      if (a) {
        var i = a.getAttribute('data-addseg');
        sched[i] = sched[i] || [];
        sched[i].push({ g: 'men', from: 480, to: 1200 });
        paint(); return;
      }
      var d2 = ev.target.closest('[data-delseg]');
      if (d2) {
        var p = d2.getAttribute('data-delseg').split('|');
        sched[p[0]].splice(+p[1], 1);
        paint();
      }
    });
    mo.el.addEventListener('change', function (ev) {
      var el2 = ev.target.closest('[data-seg]');
      if (!el2) return;
      var p = el2.getAttribute('data-seg').split('|');
      var s = sched[p[0]][+p[1]];
      if (p[2] === 'g') s.g = el2.value;
      if (p[2] === 'f') s.from = (+el2.value.split(':')[0]) * 60 + (+el2.value.split(':')[1]);
      if (p[2] === 't') {
        var v = (+el2.value.split(':')[0]) * 60 + (+el2.value.split(':')[1]);
        s.to = s.to > 1440 ? v + 1440 : v;
      }
      if (p[2] === 'n') {
        s.to = el2.checked ? (s.to % 1440) + 1440 : s.to % 1440;
      }
    });
    U.$('#hr-ok', mo.el).addEventListener('click', function () {
      S.upd('branches', b.id, { schedule: sched });
      U.toast('المواعيد اتحفظت'); mo.close(); CZ.render();
    });
  });

  /* ================= الإعدادات ================= */
  var GT = 'general';

  CZ.views.settings = {
    title: 'الإعدادات',
    sub: 'النظام والمستخدمين والنسخ الاحتياطي',
    render: function () {
      var isOwner = CZ.state.user.role === 'owner';
      var tabs = [['general', 'إعدادات عامة'], ['users', 'المستخدمين'], ['data', 'النسخ والبيانات'], ['log', 'سجل النشاط'], ['help', 'دليل الاستخدام']];
      return '<div class="tabs mb">' + tabs.map(function (t) {
        return '<button data-gtab="' + t[0] + '"' + (GT === t[0] ? ' class="on"' : '') + '>' + t[1] + '</button>';
      }).join('') + '</div>' + G[GT](isOwner);
    },
    after: function () {
      var e;
      if ((e = U.$('#set-save'))) e.addEventListener('click', function () {
        var d = W.form(U.$('#setf'));
        Object.assign(S.db().settings, d);
        CZ.CUR = d.currency || 'ج';
        S.save(true);
        U.toast('الإعدادات اتحفظت');
        CZ.render();
      });
      if ((e = U.$('#bk-export'))) e.addEventListener('click', function () {
        U.download('نسخة-سيزر-' + U.isoT().replace(/[:T]/g, '-') + '.json', S.export(), 'application/json');
        U.toast('النسخة اتحمّلت — احفظها في مكان آمن');
      });
      if ((e = U.$('#bk-import'))) e.addEventListener('click', function () { U.$('#bk-file').click(); });
      if ((e = U.$('#bk-file'))) e.addEventListener('change', function (ev) {
        var f = ev.target.files[0];
        if (!f) return;
        var rd = new FileReader();
        rd.onload = function () {
          U.confirm({
            title: 'استرجاع نسخة؟', danger: true,
            body: 'كل البيانات الحالية هتتمسح وتتبدل باللي في الملف. متأكد؟', ok: 'استرجع'
          }).then(function (y) {
            if (!y) return;
            try {
              S.import(rd.result);
              U.toast('النسخة اترجّعت');
              setTimeout(function () { location.reload(); }, 700);
            } catch (er) { U.toast('الملف مش صالح: ' + er.message, 'err'); }
          });
        };
        rd.readAsText(f);
      });
      if ((e = U.$('#bk-demo'))) e.addEventListener('click', function () {
        U.confirm({
          title: 'ابدأ نضيف؟', danger: true,
          body: 'هيتمسح كل الأعضاء والاشتراكات والحضور والفلوس التجريبية، ' +
            'ويفضل الفروع والباقات والمستخدمين وقوالب الرسايل. الخطوة دي بتتعمل مرة واحدة أول ما تبدأ شغل حقيقي.',
          ok: 'امسح البيانات التجريبية'
        }).then(function (y) {
          if (!y) return;
          S.wipe();
          U.toast('النظام بقى نضيف — ابدأ سجّل أعضاءك');
          setTimeout(function () { location.reload(); }, 700);
        });
      });
      if ((e = U.$('#bk-reset'))) e.addEventListener('click', function () {
        U.confirm({
          title: 'رجّع البيانات التجريبية؟', danger: true,
          body: 'هيتمسح كل حاجة ويرجع النظام لأول يوم بالبيانات التجريبية.', ok: 'ارجع للأول'
        }).then(function (y) {
          if (!y) return;
          S.reset();
          setTimeout(function () { location.reload(); }, 400);
        });
      });
      if ((e = U.$('#us-new'))) e.addEventListener('click', function () { userForm(); });
      if ((e = U.$('#bk-csv'))) e.addEventListener('click', exportAll);
      if ((e = U.$('#bk-arch'))) e.addEventListener('click', function () {
        var cut = U.addMonths(U.today(), -12);
        var n = S.where('attend', function (a) { return a.inAt < cut; }).length;
        if (!n) { U.toast('مفيش حضور أقدم من سنة'); return; }
        U.confirm({
          title: 'أرشفة ' + U.n(n) + ' سجل حضور؟',
          body: 'كل حضور قبل ' + U.fDate(cut) + ' هيتصدّر ملف Excel وبعدين يتشال من النظام. ' +
            'الاشتراكات والفلوس والأعضاء مش هيتمسّوا.',
          ok: 'أرشف'
        }).then(function (y) {
          if (!y) return;
          var old = S.where('attend', function (a) { return a.inAt < cut; });
          var rows = [['التاريخ', 'الوقت', 'العضو', 'الكود', 'الفرع', 'النوع', 'الفترة', 'الخروج']];
          old.forEach(function (a) {
            var m = a.memberId ? S.member(a.memberId) : null;
            rows.push([a.inAt.slice(0, 10), U.fTime(a.inAt), m ? m.name : (a.guestName || 'زائر'),
              m ? m.code : '', S.branchShort(a.branchId), a.type, a.seg || '', a.outAt ? U.fTime(a.outAt) : '']);
          });
          U.csv('أرشيف-حضور-قبل-' + cut, rows);
          S.archiveAttendance(cut);
          U.toast('اتأرشف ' + U.n(n) + ' سجل');
          CZ.render();
        });
      });
    }
  };

  U.on('click', '[data-gtab]', function (e, el) {
    if (!U.$('.tabs [data-gtab]')) return;
    GT = el.getAttribute('data-gtab'); CZ.render();
  });

  var G = {
    general: function (isOwner) {
      var s = S.db().settings;
      return '<div class="grid g-2">' +
        W.card({
          title: 'بيانات الجيم', ico: 'building',
          body: '<div class="f" id="setf">' +
            '<div class="f-row">' +
            W.fld({ label: 'اسم الجيم', name: 'gymName', val: s.gymName, dis: !isOwner }) +
            W.fld({ label: 'الاسم اللاتيني', name: 'gymLatin', val: s.gymLatin, dis: !isOwner }) +
            '</div>' +
            W.fld({ label: 'التاجلاين', name: 'tagline', val: s.tagline, dis: !isOwner }) +
            '<div class="f-row c3">' +
            W.fld({ label: 'العملة', name: 'currency', val: s.currency, dis: !isOwner }) +
            W.fld({ label: 'تنبيه قرب الانتهاء', name: 'expiryWarnDays', type: 'number', val: s.expiryWarnDays,
              suffix: 'يوم', dis: !isOwner, hint: 'قبل انتهاء الاشتراك بكام يوم يبان في التنبيهات' }) +
            W.fld({ label: 'تنبيه الغياب', name: 'absentWarnDays', type: 'number', val: s.absentWarnDays,
              suffix: 'يوم', dis: !isOwner, hint: 'العضو اللي ما جاش أكتر من كده يعتبر غايب' }) +
            '</div>' +
            '<div class="f-row">' +
            W.fld({ label: 'أقصى أيام تجميد', name: 'maxFreezeDays', type: 'number', val: s.maxFreezeDays,
              suffix: 'يوم', dis: !isOwner }) +
            W.fld({ label: 'سماح بعد انتهاء الاشتراك', name: 'sessionGraceDays', type: 'number', val: s.sessionGraceDays,
              suffix: 'يوم', dis: !isOwner }) +
            '</div>' +
            W.fld({ label: 'الجملة اللي تحت الإيصال', name: 'receiptFooter', type: 'textarea', rows: 2,
              val: s.receiptFooter, dis: !isOwner }) +
            (isOwner ? '<button class="btn btn-lime" id="set-save">' + U.ico('save') + 'احفظ الإعدادات</button>'
              : W.alert('info', 'للعرض فقط', 'صاحب الجيم بس هو اللي يقدر يغيّر الإعدادات دي.')) +
            '</div>'
        }) +
        W.card({
          title: 'معلومات النظام', ico: 'info',
          body: '<dl class="kv">' +
            '<dt>حجم البيانات</dt><dd class="num">' + (S.size() / 1024).toFixed(0) + ' كيلوبايت</dd>' +
            '<dt>عدد الأعضاء</dt><dd class="num">' + U.n(S.all('members').length) + '</dd>' +
            '<dt>عدد الاشتراكات</dt><dd class="num">' + U.n(S.all('subs').length) + '</dd>' +
            '<dt>سجلات الحضور</dt><dd class="num">' + U.n(S.all('attend').length) + '</dd>' +
            '<dt>حركات الخزنة</dt><dd class="num">' + U.n(S.all('money').length) + '</dd>' +
            '<dt>آخر حفظ</dt><dd>' + U.esc(S.db().meta.updated || '—') + '</dd>' +
            '<dt>الفروع</dt><dd class="num">' + S.branches().length + '</dd>' +
            '</dl>' +
            '<div class="hr"></div>' +
            W.alert('warn', 'مهم تفهمه',
              'البيانات كلها متخزّنة في المتصفح على الجهاز ده. لو مسحت بيانات المتصفح أو غيّرت الجهاز، ' +
              'البيانات هتروح. عشان كده: نزّل نسخة احتياطية كل أسبوع من تاب «النسخ والبيانات».')
        }) +
        '</div>';
    },

    users: function (isOwner) {
      var users = S.all('users');
      return (isOwner ? '' : W.alert('warn', 'مالكش صلاحية', 'صاحب الجيم بس هو اللي يقدر يضيف أو يعدّل مستخدمين.') + '<div class="mb"></div>') +
        '<div class="row-b mb"><div></div>' +
        (isOwner ? '<button class="btn btn-lime btn-sm" id="us-new">' + U.ico('plus') + 'مستخدم جديد</button>' : '') +
        '</div>' +
        W.card({
          flush: true,
          body: W.table([
            { t: 'الاسم', sort: false, render: function (u) {
              return '<div class="who"><span class="ava m">' + U.esc(U.initials(u.name)) + '</span>' +
                '<div class="who-t"><b>' + U.esc(u.name) + '</b><span>' +
                (u.id === CZ.state.user.id ? 'إنت' : '') + '</span></div></div>';
            }},
            { t: 'الصلاحية', sort: false, render: function (u) {
              return '<span class="badge ' + (u.role === 'owner' ? 'ink' : u.role === 'manager' ? 'lime' : '') + '">' +
                S.ROLES[u.role].t + '</span>';
            }},
            { t: 'الفرع', sort: false, render: function (u) {
              return u.branchId ? W.branchTag(u.branchId) : '<span class="badge">كل الفروع</span>';
            }},
            { t: 'الكود', sort: false, cls: 'num', render: function (u) {
              return isOwner ? '<span class="num">' + U.esc(u.pin) + '</span>' : '••••';
            }},
            { t: 'الحالة', sort: false, render: function (u) {
              return u.active !== false ? '<span class="badge ok">شغّال</span>' : '<span class="badge danger">موقوف</span>';
            }},
            { t: '', sort: false, cls: 'end', render: function (u) {
              return isOwner ? '<div class="rowact"><button class="btn btn-sm btn-soft btn-ico" data-uedit="' + u.id + '">' +
                U.ico('edit') + '</button></div>' : '';
            }}
          ], users, { emptyT: 'مفيش مستخدمين' })
        }) +
        '<div class="mt">' + W.card({
          title: 'مين يشوف إيه', ico: 'shield',
          body: '<div class="tw"><table class="t"><thead><tr><th>القسم</th>' +
            Object.keys(S.ROLES).map(function (r) { return '<th class="mid">' + S.ROLES[r].t + '</th>'; }).join('') +
            '</tr></thead><tbody>' +
            [['dash', 'لوحة القيادة'], ['checkin', 'الدخول والحضور'], ['members', 'الأعضاء'],
            ['plans', 'الباقات والأسعار'], ['finance', 'الخزنة والمالية'], ['shop', 'البوفيه'],
            ['staff', 'الكباتن والموظفين'], ['pt', 'التدريب الخاص'], ['classes', 'الحصص'],
            ['leads', 'العملاء المحتملين'], ['messages', 'الرسايل'], ['equip', 'الأجهزة'],
            ['reports', 'التقارير'], ['tasks', 'المهام']]
              .map(function (row) {
                return '<tr><td><b class="sm">' + row[1] + '</b></td>' +
                  Object.keys(S.ROLES).map(function (r) {
                    var can = S.ROLES[r].can === '*' || S.ROLES[r].can.indexOf(row[0]) > -1;
                    return '<td class="mid">' + (can ? '<span style="color:var(--ok)">' + U.ico('check') + '</span>'
                      : '<span class="fnt">—</span>') + '</td>';
                  }).join('') + '</tr>';
              }).join('') + '</tbody></table></div>',
          foot: 'الريسبشن مش بيشوف الخزنة ولا الأسعار ولا التقارير — ده مقصود.'
        }) + '</div>';
    },

    data: function () {
      return '<div class="grid g-2">' +
        W.card({
          title: 'النسخ الاحتياطي', ico: 'save', tone: 'ok',
          body: W.alert('warn', 'اعمل نسخة كل أسبوع',
            'ملف واحد فيه كل حاجة: الأعضاء، الاشتراكات، الحضور، الخزنة، الأجهزة. ' +
            'احفظه على الموبايل أو جوجل درايف.') +
            '<div class="row mt" style="gap:8px">' +
            '<button class="btn btn-lime" id="bk-export">' + U.ico('down') + 'نزّل نسخة احتياطية</button>' +
            '<button class="btn btn-ghost" id="bk-import">' + U.ico('up') + 'استرجع نسخة</button>' +
            '<input type="file" id="bk-file" accept=".json" hidden>' +
            '</div>' +
            '<div class="hr"></div>' +
            '<button class="btn btn-ghost btn-sm" id="bk-csv">' + U.ico('export') + 'صدّر كل الجداول Excel/CSV</button>' +
            (function () {
              var pct = Math.round(S.size() / S.LIMIT * 100);
              return '<div class="hr"></div>' +
                '<div class="row-b mb"><span class="xs mut b">المساحة المستخدمة</span>' +
                '<b class="num sm">' + pct + '% من المتاح</b></div>' +
                '<div class="bar ' + (pct > 80 ? 'danger' : pct > 60 ? 'warn' : '') + '">' +
                '<i style="width:' + Math.min(100, pct) + '%"></i></div>' +
                (pct > 60 ? '<div class="mt-s">' + W.alert('warn', 'المساحة بتقرب تخلص',
                  'سجلات الحضور القديمة هي اللي بتاخد المساحة. أرشفها: هتتصدّر Excel وتتشال من النظام.') + '</div>' : '') +
                '<button class="btn btn-ghost btn-sm mt" id="bk-arch">' + U.ico('box') +
                'أرشفة الحضور الأقدم من سنة</button>';
            })(),
          foot: 'حجم البيانات الحالي: ' + (S.size() / 1024).toFixed(0) + ' كيلوبايت'
        }) +
        W.card({
          title: 'بداية الشغل الحقيقي', ico: 'zap', tone: 'danger',
          body: '<p class="sm" style="line-height:1.7">النظام دلوقتي شغّال ببيانات تجريبية عشان تشوفه حي. ' +
            'أول ما تجهّز وتقرر تبدأ شغل حقيقي، امسح البيانات التجريبية — هتفضل الفروع والباقات ' +
            'والمستخدمين وقوالب الرسايل زي ما هي.</p>' +
            '<div class="row mt" style="gap:8px">' +
            '<button class="btn btn-ink" id="bk-demo">' + U.ico('trash') + 'ابدأ نضيف (امسح التجريبي)</button>' +
            '<button class="btn btn-ghost btn-sm" id="bk-reset">' + U.ico('refresh') + 'رجّع التجريبي</button>' +
            '</div>' +
            '<div class="hr"></div>' +
            W.alert('danger', 'قبل ما تمسح', 'نزّل نسخة احتياطية الأول — المسح مالوش رجعة.')
        }) +
        '</div>';
    },

    log: function () {
      var logs = S.all('log').slice(0, 200);
      return W.card({
        flush: true,
        title: 'سجل النشاط',
        sub: 'آخر 200 حركة — مين عمل إيه وإمتى',
        body: W.table([
          { t: 'الوقت', sort: false, w: '160px', render: function (l) {
            return '<span class="sm">' + U.fDate(l.at, 'short') + '</span> <span class="xs fnt num">' + U.fTime(l.at) + '</span>';
          }},
          { t: 'المستخدم', sort: false, render: function (l) { return '<b class="sm">' + U.esc(l.userName || 'النظام') + '</b>'; } },
          { t: 'الحركة', sort: false, render: function (l) { return '<span class="badge">' + U.esc(l.action) + '</span>'; } },
          { t: 'التفاصيل', sort: false, render: function (l) { return '<span class="sm mut">' + U.esc(l.detail || '—') + '</span>'; } },
          { t: 'الفرع', sort: false, render: function (l) {
            return l.branchId && l.branchId !== 'all' ? W.branchTag(l.branchId) : '<span class="fnt">—</span>';
          }}
        ], logs, { emptyT: 'مفيش حركات مسجّلة' })
      });
    },

    help: function () {
      return '<div class="grid g-2">' +
        W.card({
          title: 'أول ما تبدأ — 6 خطوات', ico: 'zap', tone: 'lime',
          body: '<ol style="display:grid;gap:11px;counter-reset:s;font-size:14px;line-height:1.65">' +
            [
              ['ظبّط الفرع التاني', 'الفروع ← بيانات الفرع: العنوان والتليفون والسعة والمواعيد.'],
              ['راجع الأسعار', 'الباقات والأسعار: الأسعار الحالية من بروشور سيزر — عدّلها لو اتغيّرت، وحدّد سعر مختلف لكل فرع لو محتاج.'],
              ['غيّر الأكواد السرية', 'الإعدادات ← المستخدمين: الأكواد المبدئية معروفة، غيّرها.'],
              ['امسح البيانات التجريبية', 'الإعدادات ← النسخ والبيانات ← «ابدأ نضيف».'],
              ['سجّل أعضاءك', 'الأعضاء ← عضو جديد. كل عضو بياخد كود، والكود ده هو اللي بيتكتب في شاشة الدخول.'],
              ['اطبع كروت العضوية', 'الأعضاء ← «كروت» — كارت لكل عضو فيه كوده.']
            ].map(function (x) {
              return '<li style="display:flex;gap:10px"><span class="num" style="flex:none;width:24px;height:24px;' +
                'border-radius:50%;background:var(--lime);color:var(--ink);display:grid;place-items:center;font-size:12px">' +
                '</span><span><b>' + x[0] + '</b><br><span class="mut sm">' + x[1] + '</span></span></li>';
            }).join('') + '</ol>'
        }) +
        W.card({
          title: 'الروتين اليومي', ico: 'clock',
          body: '<div style="display:grid;gap:12px;font-size:14px;line-height:1.6">' +
            [
              ['أول اليوم', 'افتح لوحة القيادة وشوف التنبيهات — مين اشتراكه بيخلص ومين غايب ومين عليه فلوس.'],
              ['طول اليوم', 'شاشة «الدخول والحضور» مفتوحة على الريسبشن. اكتب كود العضو واضغط Enter.'],
              ['أي بيع', 'البوفيه ← بيع سريع. الفلوس بتروح الخزنة لوحدها.'],
              ['آخر اليوم', 'الخزنة ← تقفيل اليوم: اعدّ الكاش، اكتب الرقم، اقفل واطبع.'],
              ['كل أسبوع', 'مركز الرسايل: ابعت لقايمة «اشتراكهم بيخلص» و«مشتركين وغايبين».'],
              ['كل شهر', 'التقارير ← اطبع التقرير، وصرف المرتبات من صفحة الموظفين.']
            ].map(function (x) {
              return '<div style="border-inline-start:2.5px solid var(--lime);padding-inline-start:11px">' +
                '<b>' + x[0] + '</b><div class="mut sm">' + x[1] + '</div></div>';
            }).join('') + '</div>'
        }) +
        W.card({
          title: 'اختصارات لوحة المفاتيح', ico: 'key',
          body: '<dl class="kv">' +
            '<dt><span class="badge">/</span></dt><dd>بحث سريع في أي حاجة</dd>' +
            '<dt><span class="badge">Ctrl + K</span></dt><dd>نفس البحث السريع</dd>' +
            '<dt><span class="badge">Alt + D</span></dt><dd>افتح تسجيل دخول عضو</dd>' +
            '<dt><span class="badge">Esc</span></dt><dd>اقفل أي نافذة</dd>' +
            '<dt><span class="badge">Enter</span></dt><dd>في شاشة الدخول: يسجّل على طول</dd>' +
            '</dl><div class="hr"></div>' +
            '<div class="xs mut">دبل-كليك على لوجو سيزر فوق يصغّر القايمة الجانبية.</div>'
        }) +
        W.card({
          title: 'أسئلة بتتسأل', ico: 'info',
          body: '<div style="display:grid;gap:13px;font-size:14px">' +
            [
              ['البيانات محفوظة فين؟', 'في المتصفح على الجهاز ده. مفيش سيرفر ومفيش اشتراك شهري ومحدّش بيشوف بياناتك.'],
              ['أشتغل على أكتر من جهاز إزاي؟', 'صدّر نسخة من جهاز واسترجعها في التاني. أو اشتغل على جهاز واحد ثابت في الريسبشن (الأضمن).'],
              ['لو الجلسات خلصت والاشتراك لسه ساري؟', 'النظام هيمنع الدخول ويقولك «الجلسات خلصت» — وقتها يجدّد أو يدفع تمرين منفصل.'],
              ['التجميد بيشتغل إزاي؟', 'بتحدد عدد الأيام، والنظام بيزوّدها على تاريخ الانتهاء. لو رجع بدري، فك التجميد والأيام اللي ما اتستخدمتش بترجع.'],
              ['العضو يقدر يتمرن في الفرع التاني؟', 'أيوه. النظام هيسجّل الزيارة على الفرع اللي دخل فيه وينبّهك إنها زيارة لفرع تاني.']
            ].map(function (x) {
              return '<div><b>' + x[0] + '</b><div class="mut sm" style="line-height:1.6">' + x[1] + '</div></div>';
            }).join('') + '</div>'
        }) +
        '</div>';
    }
  };

  function userForm(id) {
    var u = id ? S.get('users', id) : null;
    var x = u || { role: 'reception', active: true, pin: String(Math.floor(1000 + Math.random() * 9000)) };
    var mo = U.modal({
      title: u ? 'تعديل مستخدم' : 'مستخدم جديد', width: 'sm',
      body: '<div class="f" id="uf">' +
        W.fld({ label: 'الاسم', name: 'name', val: x.name, req: true }) +
        W.fld({ label: 'الصلاحية', name: 'role', type: 'select', val: x.role,
          opts: Object.keys(S.ROLES).map(function (k) { return [k, S.ROLES[k].t]; }) }) +
        W.fld({ label: 'الفرع', name: 'branchId', type: 'select', val: x.branchId,
          opts: [['', 'كل الفروع']].concat(S.branches().map(function (b) { return [b.id, b.name]; })),
          hint: 'لو اخترت فرع، المستخدم مش هيشوف غيره' }) +
        W.fld({ label: 'الكود السري', name: 'pin', val: x.pin, cls: 'mono',
          attr: ' maxlength="4" pattern="[0-9]{4}"', hint: '4 أرقام' }) +
        W.check({ name: 'active', t: 'المستخدم يقدر يدخل', on: x.active !== false }) +
        '</div>',
      footer: (u && u.role !== 'owner' ? '<button class="btn btn-danger btn-sm" id="uf-del">' + U.ico('trash') + '</button>' : '') +
        '<div class="grow"></div><button class="btn btn-ghost" data-close>إلغاء</button>' +
        '<button class="btn btn-lime" id="uf-ok">' + U.ico('save') + 'احفظ</button>'
    });
    U.$('#uf-ok', mo.el).addEventListener('click', function () {
      var d = W.form(U.$('#uf', mo.el));
      if (!d.name) { U.toast('اكتب الاسم', 'err'); return; }
      if (!/^\d{4}$/.test(d.pin)) { U.toast('الكود لازم يكون 4 أرقام', 'err'); return; }
      d.branchId = d.branchId || null;
      if (u) S.upd('users', u.id, d); else S.add('users', d);
      U.toast('اتحفظ'); mo.close(); CZ.render();
    });
    if (u && u.role !== 'owner') U.$('#uf-del', mo.el).addEventListener('click', function () {
      S.del('users', u.id); mo.close(); CZ.render();
    });
  }
  U.on('click', '[data-uedit]', function (e, el) { userForm(el.getAttribute('data-uedit')); });

  function exportAll() {
    var db = S.db();
    var sets = [
      ['أعضاء', 'members', ['code', 'name', 'phone', 'gender', 'branchId', 'joinedAt', 'job', 'goal', 'source', 'status', 'medical']],
      ['اشتراكات', 'subs', ['memberId', 'planName', 'branchId', 'startAt', 'endAt', 'sessionsTotal', 'sessionsUsed', 'price', 'paid', 'status']],
      ['حضور', 'attend', ['memberId', 'branchId', 'inAt', 'outAt', 'type', 'seg']],
      ['خزنة', 'money', ['at', 'kind', 'amount', 'cat', 'method', 'memberId', 'branchId', 'note']],
      ['موظفين', 'staff', ['name', 'role', 'branchId', 'phone', 'salary', 'commission', 'specialty']],
      ['أجهزة', 'equip', ['name', 'cat', 'branchId', 'status', 'purchasedAt', 'cost', 'lastService']],
      ['بضاعة', 'products', ['name', 'cat', 'cost', 'price', 'stock', 'branchId']],
      ['عملاء-محتملين', 'leads', ['name', 'phone', 'stage', 'source', 'branchId', 'nextFollow', 'note']]
    ];
    sets.forEach(function (s, i) {
      setTimeout(function () {
        var rows = [s[2]];
        (db[s[1]] || []).forEach(function (r) {
          rows.push(s[2].map(function (k) {
            if (k === 'branchId') return S.branchShort(r[k]);
            if (k === 'memberId') return S.memberName(r[k]);
            return r[k] === undefined || r[k] === null ? '' : r[k];
          }));
        });
        U.csv('سيزر-' + s[0] + '-' + U.today(), rows);
      }, i * 400);
    });
    U.toast('جاري تصدير ' + sets.length + ' ملف');
  }
})();
