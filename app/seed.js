/* ============================================================
   سيزر جيم — نظام الإدارة | البيانات الافتتاحية
   ------------------------------------------------------------
   جزئين:
   • seedBase  = الأساس الحقيقي (فرعين، أسعار سيزر الحقيقية،
                 المواعيد الحقيقية، الباقات، قوالب الرسايل).
   • seed      = الأساس + بيانات تشغيل تجريبية (أعضاء، حضور،
                 فلوس...) عشان صاحب الجيم يشوف النظام حي من أول
                 ثانية. تتمسح كلها من الإعدادات ← «ابدأ نضيف».
   ============================================================ */
(function () {
  'use strict';
  var CZ = window.CZ, U = CZ.u;

  /* مواعيد الفرع الرئيسي — من جدول سيزر الحقيقي (بالدقايق من نص الليل).
     القيمة أكبر من 1440 معناها الفترة بتكمّل لليوم اللي بعده (لحد الفجر). */
  var SCHED_MAIN = {
    0: [{ g: 'men', from: 420, to: 600 }, { g: 'women', from: 600, to: 900 }, { g: 'men', from: 900, to: 1860 }],
    1: [{ g: 'men', from: 420, to: 1020 }, { g: 'women', from: 1020, to: 1320 }, { g: 'men', from: 1320, to: 1860 }],
    2: [{ g: 'men', from: 420, to: 600 }, { g: 'women', from: 600, to: 900 }, { g: 'men', from: 900, to: 1860 }],
    3: [{ g: 'men', from: 420, to: 1020 }, { g: 'women', from: 1020, to: 1320 }, { g: 'men', from: 1320, to: 1860 }],
    4: [{ g: 'men', from: 420, to: 600 }, { g: 'women', from: 600, to: 900 }, { g: 'men', from: 900, to: 1860 }],
    5: [{ g: 'women', from: 720, to: 900 }, { g: 'men', from: 900, to: 1320 }],
    6: [{ g: 'men', from: 420, to: 1020 }, { g: 'women', from: 1020, to: 1320 }, { g: 'men', from: 1320, to: 1860 }]
  };
  /* الفرع التاني — مواعيد أبسط لحد ما الجيم يظبّطها من الإعدادات */
  var SCHED_2 = {
    0: [{ g: 'men', from: 480, to: 960 }, { g: 'women', from: 960, to: 1200 }, { g: 'men', from: 1200, to: 1440 }],
    1: [{ g: 'men', from: 480, to: 960 }, { g: 'women', from: 960, to: 1200 }, { g: 'men', from: 1200, to: 1440 }],
    2: [{ g: 'men', from: 480, to: 960 }, { g: 'women', from: 960, to: 1200 }, { g: 'men', from: 1200, to: 1440 }],
    3: [{ g: 'men', from: 480, to: 960 }, { g: 'women', from: 960, to: 1200 }, { g: 'men', from: 1200, to: 1440 }],
    4: [{ g: 'men', from: 480, to: 960 }, { g: 'women', from: 960, to: 1200 }, { g: 'men', from: 1200, to: 1440 }],
    5: [{ g: 'women', from: 720, to: 900 }, { g: 'men', from: 900, to: 1320 }],
    6: [{ g: 'men', from: 480, to: 960 }, { g: 'women', from: 960, to: 1200 }, { g: 'men', from: 1200, to: 1440 }]
  };

  var B1 = 'br_main', B2 = 'br_two';

  /* ============ الأساس ============ */
  CZ.seedBase = function (db) {
    db.branches = [
      {
        id: B1, name: 'سيزر — بني سويف الجديدة', short: 'الرئيسي', code: 'MN',
        address: 'بني سويف الجديدة — شرق النيل، الحي الأول (بجوار مطعم كافيار)',
        phone: '01000000000', landline: '082-0000000', whatsapp: '201000000000',
        maps: 'https://maps.google.com/',
        capacity: 70, area: 600, color: '#6F9410', opened: '2021-03-01',
        schedule: SCHED_MAIN, active: true, isMain: true,
        features: ['كمال أجسام', 'كارديو', 'ساونا', 'فنون قتالية', 'قسم سيدات', 'تأهيل عسكري']
      },
      {
        id: B2, name: 'سيزر — الفرع الثاني', short: 'الثاني', code: 'TW',
        address: 'اكتب عنوان الفرع الثاني من الإعدادات ← الفروع',
        phone: '', landline: '', whatsapp: '', maps: '',
        capacity: 50, area: 400, color: '#3A6EA5', opened: '2025-09-01',
        schedule: SCHED_2, active: true, isMain: false,
        needsSetup: true,
        features: ['كمال أجسام', 'كارديو', 'قسم سيدات']
      }
    ];

    db.users = [
      { id: 'us_owner', name: 'صاحب الجيم', role: 'owner', pin: '1234', branchId: null, active: true },
      { id: 'us_mgr1', name: 'مدير الرئيسي', role: 'manager', pin: '1111', branchId: B1, active: true },
      { id: 'us_mgr2', name: 'مدير الفرع الثاني', role: 'manager', pin: '2222', branchId: B2, active: true },
      { id: 'us_rec1', name: 'ريسبشن الرئيسي', role: 'reception', pin: '1010', branchId: B1, active: true },
      { id: 'us_rec2', name: 'ريسبشن الثاني', role: 'reception', pin: '2020', branchId: B2, active: true }
    ];

    /* الأسعار الحقيقية من بروشور سيزر */
    db.plans = [
      { id: 'pl_power', name: 'باور', type: 'monthly', sessions: 8, months: 1, price: 600, note: 'يومين في الأسبوع', order: 1, active: true },
      { id: 'pl_bronze', name: 'برونز', type: 'monthly', sessions: 12, months: 1, price: 650, note: '3 أيام في الأسبوع', order: 2, active: true },
      { id: 'pl_silver', name: 'سيلفر', type: 'monthly', sessions: 16, months: 1, price: 700, note: '4 أيام في الأسبوع', order: 3, active: true },
      { id: 'pl_plat', name: 'بلاتينيوم', type: 'monthly', sessions: 20, months: 1, price: 750, note: '5 أيام في الأسبوع', order: 4, popular: true, active: true },
      { id: 'pl_gold', name: 'جولد', type: 'monthly', sessions: 24, months: 1, price: 850, note: '6 أيام في الأسبوع', order: 5, popular: true, active: true },

      { id: 'pl_bronze3', name: 'برونز — ربع سنوي', type: 'yearly', sessions: 36, months: 3, price: 1800, perks: '3 دعوات + 3 ساونا', order: 6, active: true },
      { id: 'pl_bronze6', name: 'برونز — نصف سنوي', type: 'yearly', sessions: 72, months: 6, price: 3600, perks: '6 دعوات + 6 ساونا', order: 7, active: true },
      { id: 'pl_bronze12', name: 'برونز — سنوي', type: 'yearly', sessions: 144, months: 12, price: 7200, perks: '12 دعوة + 12 ساونا', order: 8, active: true },
      { id: 'pl_gold3', name: 'جولد — ربع سنوي', type: 'yearly', sessions: 72, months: 3, price: 2450, perks: '3 دعوات + 3 ساونا', order: 9, active: true },
      { id: 'pl_gold6', name: 'جولد — نصف سنوي', type: 'yearly', sessions: 144, months: 6, price: 4700, perks: '6 دعوات + 6 ساونا', order: 10, popular: true, active: true },
      { id: 'pl_gold12', name: 'جولد — سنوي', type: 'yearly', sessions: 288, months: 12, price: 9600, perks: '12 دعوة + 12 ساونا', order: 11, active: true },

      { id: 'pl_selfdef', name: 'أنشطة الدفاع عن النفس', type: 'activity', sessions: 8, months: 1, price: 350, note: 'ملاكمة / كيك بوكس / كاراتيه / كونغ فو', order: 12, active: true },
      { id: 'pl_allact', name: 'جميع الأنشطة', type: 'activity', sessions: 12, months: 1, price: 450, note: '12 جلسة في كل الأنشطة', order: 13, active: true },
      { id: 'pl_military', name: 'التأهيل العسكري', type: 'activity', sessions: 12, months: 1, price: 1500, note: 'سباحة + إستاد + جيم', order: 14, active: true },
      { id: 'pl_physio', name: 'التأهيل البدني والحركي', type: 'activity', sessions: 12, months: 1, price: 1500, note: '12 جلسة', order: 15, active: true },

      { id: 'pl_private', name: 'تدريب برايفيت', type: 'pt', sessions: 12, months: 1, price: 1500, note: '12 جلسة + ساونا', order: 16, active: true },
      { id: 'pl_privateg', name: 'برايفيت جروب', type: 'pt', sessions: 12, months: 1, price: 1300, note: '12 جلسة + ساونا — من 3 لـ 5 أفراد', order: 17, active: true },

      { id: 'pl_single', name: 'تمرين منفصل', type: 'single', sessions: 1, months: 1, price: 150, note: 'جلسة واحدة من غير اشتراك', order: 18, active: true },
      { id: 'pl_sauna', name: 'جلسة ساونا', type: 'single', sessions: 1, months: 1, price: 100, note: 'ساونا حرارية', order: 19, active: true }
    ];

    db.templates = [
      { id: 'tp_expire', name: 'تنبيه قرب انتهاء الاشتراك', event: 'expiring', body: 'أهلاً {الاسم} 👊\nاشتراكك في سيزر جيم بيخلص يوم {تاريخ_الانتهاء} — فاضل {أيام_متبقية} أيام.\nجدّد قبل ما يخلص وكمّل على نفس النظام من غير ما تبدأ من الأول.\n{الفرع}' },
      { id: 'tp_expired', name: 'اشتراك خلص', event: 'expired', body: 'أهلاً {الاسم}،\nاشتراكك خلص من {أيام_متبقية} يوم والحديد مستنيك.\nقولنا وهنجهّزلك التجديد وانت جاي.\n{الفرع}' },
      { id: 'tp_absent', name: 'متابعة غياب', event: 'absent', body: '{الاسم}، بقالك فترة ما جتش.\nاشتراكك لسه شغّال لحد {تاريخ_الانتهاء} — متضيّعش الأيام.\nلو فيه حاجة واقفة معاك قولنا وهنساعدك تظبّط جدولك.' },
      { id: 'tp_welcome', name: 'ترحيب بعضو جديد', event: 'welcome', body: 'أهلاً بيك في سيزر جيم يا {الاسم} 👊\nكودك: {الكود}\nباقتك: {الباقة} — سارية لحد {تاريخ_الانتهاء}\nمواعيد الفرع والعنوان: {الفرع}\nأي حاجة تحتاجها كلّمنا على الرقم ده.' },
      { id: 'tp_bday', name: 'عيد ميلاد', event: 'bday', body: 'كل سنة وانت طيب يا {الاسم} 🎉\nمن سيزر جيم — هديتك عندنا جلسة ساونا مجانية الأسبوع ده.' },
      { id: 'tp_debt', name: 'تذكير بمتأخرات', event: 'debt', body: 'أهلاً {الاسم}،\nفاضل من قيمة الاشتراك {المتبقي}.\nتقدر تسدّدها في الجيم أو تحويل — وقولنا لو محتاج تقسّطها.' },
      { id: 'tp_offer', name: 'عرض', event: 'offer', body: '{الاسم} 👊\nعرض سيزر الشهر ده: خصم 25% على كل الباقات الشهرية لحد آخر الشهر.\nلو هتجدّد، ده أنسب وقت.' }
    ];

    db.tasks = [];
    db.settings = Object.assign({}, CZ.s.defaults);
    return db;
  };

  /* ============ بيانات التشغيل التجريبية ============ */

  var M_NAMES = ['أحمد', 'محمد', 'محمود', 'مصطفى', 'كريم', 'يوسف', 'عمر', 'إسلام', 'عبدالرحمن', 'خالد',
    'حسن', 'حسين', 'طارق', 'شريف', 'وليد', 'هيثم', 'باسم', 'سيد', 'رامي', 'عماد',
    'زياد', 'أنس', 'مروان', 'صلاح', 'ياسر', 'أيمن', 'مينا', 'بيشوي', 'جورج', 'عادل',
    'فارس', 'نادر', 'سامح', 'تامر', 'هشام', 'إبراهيم', 'علي', 'عمرو', 'بلال', 'أدهم'];
  var F_NAMES = ['سارة', 'مريم', 'نورهان', 'إسراء', 'ندى', 'هبة', 'دينا', 'ريهام', 'شيماء', 'أميرة',
    'رنا', 'ملك', 'هند', 'نهى', 'آية', 'أسماء', 'فاطمة', 'رقية', 'جنة', 'سلمى',
    'مي', 'ياسمين', 'دنيا', 'مادونا', 'كرستين', 'إنجي', 'رحمة', 'بسنت'];
  var LAST = ['شريف', 'عبدالله', 'السيد', 'محمود', 'فتحي', 'عبدالعزيز', 'رمضان', 'حمدي', 'صابر', 'إسماعيل',
    'عبدالحميد', 'زكي', 'شعبان', 'الشناوي', 'عبدالتواب', 'مرسي', 'خليل', 'رزق', 'سليم', 'أنور',
    'بدوي', 'الديب', 'قنديل', 'الجندي', 'صادق', 'نصر', 'لطفي', 'عيسى', 'يونس', 'عطية'];
  var JOBS = ['طالب', 'مدرس', 'محاسب', 'مهندس', 'صيدلي', 'موظف', 'سواق', 'تاجر', 'طبيب', 'عامل',
    'ضابط', 'محامي', 'مبرمج', 'ممرض', 'صاحب محل', 'فريلانسر', 'طالب كلية عسكرية'];
  var GOALS = ['تنشيف', 'تضخيم', 'لياقة عامة', 'إنقاص وزن', 'تأهيل بعد إصابة', 'تجهيز للكلية العسكرية', 'قوة وتحمّل'];
  var SOURCES = ['إنستجرام', 'فيسبوك', 'صديق', 'مشي جنب الجيم', 'واتساب', 'إعلان ممول', 'توصية عضو'];
  var MEDICAL = ['', '', '', '', '', 'ضغط مرتفع — ممنوع أحمال قصوى', 'إصابة قديمة في الركبة اليمين',
    'ديسك أسفل الظهر — ممنوع ديدليفت', 'ربو خفيف', 'سكر من النوع الثاني', 'إصابة في الكتف الشمال'];

  CZ.seed = function (db) {
    CZ.seedBase(db);
    var r = U.rng(20260820);
    var today = U.today();

    /* ---- الكباتن والموظفين ---- */
    var staffDefs = [
      ['كابتن عبدالله ياسر', 'coach', B1, 'كمال أجسام وكروس فيت', 4500, 12],
      ['كابتن هادي إبراهيم', 'coach', B1, 'ملاكمة وكيك بوكس', 4000, 12],
      ['كابتن إسراء عادل', 'coach', B1, 'قسم السيدات ولياقة', 4000, 15],
      ['كابتن محمود صابر', 'coach', B1, 'تأهيل بدني وحركي', 4200, 12],
      ['كابتن كريم فتحي', 'coach', B1, 'تأهيل عسكري وسباحة', 3800, 10],
      ['أ. مصطفى حمدي', 'reception', B1, 'ريسبشن ومتابعة اشتراكات', 3200, 0],
      ['أ. ندى شعبان', 'reception', B1, 'ريسبشن فترة السيدات', 3000, 0],
      ['عم سيد', 'cleaner', B1, 'نضافة وصيانة يومية', 2200, 0],
      ['كابتن أنس رزق', 'coach', B2, 'كمال أجسام', 4000, 12],
      ['كابتن مي خليل', 'coach', B2, 'قسم السيدات', 3800, 15],
      ['كابتن بلال نصر', 'coach', B2, 'لياقة وفنون قتالية', 3600, 10],
      ['أ. زياد لطفي', 'reception', B2, 'ريسبشن', 3000, 0],
      ['عم رمضان', 'cleaner', B2, 'نضافة', 2000, 0]
    ];
    staffDefs.forEach(function (s, i) {
      db.staff.push({
        id: 'st_' + i, name: s[0], role: s[1], branchId: s[2], specialty: s[3],
        salary: s[4], commission: s[5], phone: '01' + r.pick([0, 1, 2, 5]) + String(r.int(10000000, 99999999)),
        joinedAt: U.addDays(today, -r.int(90, 1400)), active: true,
        gender: /إسراء|ندى|مي/.test(s[0]) ? 'f' : 'm',
        shift: r.pick(['صباحي 7ص–3م', 'مسائي 3م–11م', 'كامل']),
        note: ''
      });
    });
    var coaches = db.staff.filter(function (s) { return s.role === 'coach'; });

    /* ---- الأعضاء ---- */
    var monthlyPlans = db.plans.filter(function (p) { return p.type === 'monthly'; });
    var longPlans = db.plans.filter(function (p) { return p.type === 'yearly'; });
    var actPlans = db.plans.filter(function (p) { return p.type === 'activity'; });
    var code = 1000;
    var usedPhones = {};

    function makeMembers(branchId, n, openedAt) {
      for (var i = 0; i < n; i++) {
        var isF = r.chance(0.26);
        var first = isF ? r.pick(F_NAMES) : r.pick(M_NAMES);
        var name = first + ' ' + r.pick(LAST) + ' ' + r.pick(LAST);
        var ph;
        do { ph = '01' + r.pick([0, 1, 2, 5]) + String(r.int(10000000, 99999999)); } while (usedPhones[ph]);
        usedPhones[ph] = 1;
        code++;
        var joined = U.addDays(today, -r.int(3, Math.min(900, Math.abs(U.diffDays(openedAt)))));
        var age = isF ? r.int(17, 42) : r.int(15, 52);
        var m = {
          id: 'mb_' + code, code: String(code), name: name,
          phone: ph, phone2: r.chance(0.12) ? '01' + r.pick([0, 1, 2]) + String(r.int(10000000, 99999999)) : '',
          gender: isF ? 'f' : 'm',
          birth: U.iso(new Date(new Date().getFullYear() - age, r.int(0, 11), r.int(1, 28))),
          branchId: branchId, joinedAt: joined,
          job: r.pick(JOBS), goal: r.pick(GOALS), source: r.pick(SOURCES),
          address: r.chance(0.5) ? r.pick(['شرق النيل', 'الحي الأول', 'الحي الثاني', 'بني سويف البلد', 'ناصر', 'بياض العرب', 'الفشن']) : '',
          nationalId: r.chance(0.35) ? String(r.int(28000000000000, 30999999999999)) : '',
          emergencyName: r.chance(0.45) ? r.pick(['الوالد', 'الوالدة', 'الأخ', 'الزوجة', 'الزوج']) : '',
          emergencyPhone: r.chance(0.45) ? '01' + r.pick([0, 1, 2]) + String(r.int(10000000, 99999999)) : '',
          medical: r.pick(MEDICAL),
          lockerNo: r.chance(0.3) ? String(r.int(1, 60)) : '',
          note: '', status: 'active', tags: []
        };
        if (r.chance(0.07)) m.tags.push('محارب الشهر');
        if (m.job === 'طالب') m.tags.push('طالب');
        db.members.push(m);
      }
    }
    makeMembers(B1, 158, '2021-03-01');
    makeMembers(B2, 84, '2025-09-01');

    /* ---- الاشتراكات (تاريخ 12 شهر) ---- */
    db.members.forEach(function (m) {
      var cur = m.joinedAt;
      var loyalty = r.weighted([[0.9, 25], [0.7, 30], [0.45, 25], [0.2, 20]]); /* احتمال التجديد */
      /* 62% من الأعضاء اشتراكهم لسه ساري النهاردة — نسبة جيم شغّال */
      var stillIn = r.chance(0.62);
      var guard = 0;
      var lastSub = null;
      while (U.diffDays(cur) < 1 && guard++ < 24) {
        var long = r.chance(0.14);
        var plan = long ? r.pick(longPlans) : r.chance(0.1) ? r.pick(actPlans) : r.weighted([
          [monthlyPlans[0], 12], [monthlyPlans[1], 20], [monthlyPlans[2], 22],
          [monthlyPlans[3], 26], [monthlyPlans[4], 20]
        ]);
        var months = plan.months || 1;
        var listP = plan.price;
        var disc = r.weighted([[0, 55], [10, 12], [20, 15], [25, 15], [30, 3]]);
        var price = U.round5(listP * (1 - disc / 100));
        var paid = r.chance(0.9) ? price : U.round5(price * r.pick([0.5, 0.6, 0.7]));
        var end = U.addMonths(cur, months);
        var sub = {
          id: U.uid('sb'), memberId: m.id, planId: plan.id, planName: plan.name,
          branchId: m.branchId, startAt: cur, endAt: end, months: months,
          sessionsTotal: plan.sessions, sessionsUsed: 0,
          price: price, listPrice: listP, discount: disc,
          discountNote: disc ? (disc === 30 ? 'عرض الصحاب' : 'عرض الشهر') : '',
          paid: paid, method: r.weighted([['cash', 78], ['vodafone', 12], ['instapay', 8], ['visa', 2]]),
          coachId: r.chance(0.2) ? r.pick(coaches.filter(function (c) { return c.branchId === m.branchId; }) || coaches).id : null,
          status: 'expired', note: '', createdAt: cur + 'T' + String(r.int(9, 21)).padStart(2, '0') + ':' + String(r.int(0, 59)).padStart(2, '0')
        };
        db.subs.push(sub);
        lastSub = sub;
        if (sub.paid > 0) db.money.push({
          id: U.uid('mn'), kind: 'in', amount: sub.paid, cat: guard === 1 ? 'sub' : 'renew',
          method: sub.method, memberId: m.id, subId: sub.id, branchId: m.branchId,
          at: sub.createdAt, note: sub.planName
        });
        cur = end;
        /* اللي مش مفروض يفضل معانا بيقف عند نقطة في الماضي */
        if (!stillIn && !r.chance(loyalty)) break;
        /* فجوة قبل التجديد */
        if (r.chance(0.3)) cur = U.addDays(cur, r.int(1, 25));
      }
      /* حالة آخر اشتراك */
      if (lastSub) {
        if (U.diffDays(lastSub.endAt) >= 0) {
          lastSub.status = 'active';
          if (r.chance(0.035)) {
            lastSub.status = 'frozen';
            lastSub.freezeFrom = U.addDays(today, -r.int(1, 8));
            lastSub.freezeTo = U.addDays(today, r.int(2, 12));
            lastSub.freezeDays = 14;
            lastSub.freezes = [{ from: lastSub.freezeFrom, to: lastSub.freezeTo, days: 14, reason: r.pick(['سفر', 'مرض', 'شغل', 'امتحانات']) }];
          }
        }
      }
      if (r.chance(0.02)) { m.status = 'blocked'; m.blockReason = r.pick(['سلوك غير لائق مع عضو', 'متأخرات من 3 شهور', 'كسر جهاز ورفض الإصلاح']); }
    });

    /* ---- الحضور (آخر 70 يوم) ---- */
    var HIST = 70;
    var activeSubsByMember = {};
    db.subs.forEach(function (s) {
      (activeSubsByMember[s.memberId] = activeSubsByMember[s.memberId] || []).push(s);
    });

    for (var d = HIST; d >= 0; d--) {
      var date = U.addDays(today, -d);
      var dow = U.dow(date);
      var isFri = dow === 5;
      db.members.forEach(function (m) {
        if (m.status === 'blocked') return;
        var subs = activeSubsByMember[m.id] || [];
        var sub = null;
        for (var i = 0; i < subs.length; i++) {
          if (subs[i].startAt <= date && subs[i].endAt >= date) { sub = subs[i]; break; }
        }
        if (!sub) return;
        if (sub.freezeFrom && date >= sub.freezeFrom && date <= sub.freezeTo) return;
        /* معدّل التردّد من حجم الباقة */
        var perWeek = (sub.sessionsTotal || 12) / 4;
        var p = U.clamp(perWeek / 7, 0.05, 0.85) * (isFri ? 0.45 : 1) * (m.gender === 'f' ? 0.8 : 1);
        if (!r.chance(p)) return;
        /* الساعة حسب الفترة المتاحة للنوع */
        var segs = (m.branchId === B1 ? SCHED_MAIN : SCHED_2)[String(dow)] || [];
        var ok = segs.filter(function (s2) { return s2.g === (m.gender === 'f' ? 'women' : 'men'); });
        if (!ok.length) return;
        var seg = r.pick(ok);
        var span = Math.min(seg.to, 1440) - seg.from;
        if (span <= 30) return;
        /* الزحمة بالليل */
        var t;
        if (m.gender === 'm' && seg.from < 1020 && Math.min(seg.to, 1440) > 1020 && r.chance(0.62)) {
          t = r.int(1020, Math.min(Math.min(seg.to, 1440) - 30, 1320));
        } else {
          t = seg.from + Math.floor(r() * (span - 30));
        }
        var inAt = date + 'T' + String(Math.floor(t / 60) % 24).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
        var stay = r.int(45, 105);
        var outT = t + stay;
        var rec = {
          id: U.uid('at'), memberId: m.id, branchId: m.branchId, subId: sub.id,
          inAt: inAt,
          outAt: date + 'T' + String(Math.floor(outT / 60) % 24).padStart(2, '0') + ':' + String(outT % 60).padStart(2, '0'),
          type: 'session', seg: seg.g, note: ''
        };
        /* اللي لسه جوّه دلوقتي */
        if (d === 0) {
          var nowM = new Date().getHours() * 60 + new Date().getMinutes();
          if (t > nowM) return;
          if (outT > nowM) rec.outAt = null;
        }
        db.attend.push(rec);
        sub.sessionsUsed = (sub.sessionsUsed || 0) + 1;
        m.lastVisit = rec.inAt;
      });
    }

    /* ---- المصروفات (12 شهر) ---- */
    var exp = [
      ['rent', 'إيجار المقر', [18000, 9000]],
      ['salary', 'مرتبات الشهر', [26000, 14000]],
      ['power', 'فاتورة كهربا', [4200, 2600]],
      ['power', 'فاتورة مياه', [420, 300]],
      ['internet', 'نت وتليفون', [500, 400]],
      ['supplies', 'مستلزمات نضافة ومناديل', [900, 600]],
      ['maint', 'صيانة دورية للأجهزة', [1500, 900]]
    ];
    for (var mo = 12; mo >= 0; mo--) {
      var mDate = U.addMonths(today.slice(0, 8) + '05', -mo);
      if (mDate > today) continue;
      [B1, B2].forEach(function (b, bi) {
        var bOpen = b === B2 ? '2025-09-01' : '2021-03-01';
        if (mDate < bOpen) return;
        exp.forEach(function (e) {
          var amt = Math.round(e[2][bi] * (0.92 + r() * 0.2));
          db.money.push({
            id: U.uid('mn'), kind: 'out', amount: amt, cat: e[0],
            method: 'cash', branchId: b, at: U.addDays(mDate, r.int(0, 4)) + 'T11:00', note: e[1]
          });
        });
        if (r.chance(0.35)) db.money.push({
          id: U.uid('mn'), kind: 'out', amount: r.int(1200, 9000), cat: 'equip',
          method: r.pick(['cash', 'bank']), branchId: b, at: U.addDays(mDate, r.int(5, 22)) + 'T13:00',
          note: r.pick(['شراء دمبلز إضافية', 'إصلاح تريدميل', 'أوزان بليت جديدة', 'مرايات', 'مروحة صناعية'])
        });
        if (r.chance(0.5)) db.money.push({
          id: U.uid('mn'), kind: 'out', amount: r.int(500, 3500), cat: 'marketing',
          method: 'vodafone', branchId: b, at: U.addDays(mDate, r.int(2, 20)) + 'T15:00',
          note: r.pick(['إعلان ممول فيسبوك', 'إعلان إنستجرام', 'طباعة بنرات', 'تصوير محتوى'])
        });
      });
    }

    /* ---- البوفيه والمكملات ---- */
    var prodDefs = [
      ['واي بروتين 2 كيلو', 'مكملات', 1750, 2400, 6, 2],
      ['واي بروتين سكوب', 'مكملات', 28, 50, 90, 20],
      ['كرياتين 300 جم', 'مكملات', 480, 700, 8, 3],
      ['بروتين بار', 'مكملات', 32, 55, 40, 12],
      ['أمينو BCAA', 'مكملات', 420, 650, 5, 2],
      ['مياه 600 مل', 'مشروبات', 4, 10, 120, 30],
      ['مشروب طاقة', 'مشروبات', 18, 30, 36, 12],
      ['عصير طبيعي', 'مشروبات', 12, 25, 24, 8],
      ['قفاز تمرين', 'إكسسوارات', 90, 160, 14, 4],
      ['حزام رفع أثقال', 'إكسسوارات', 240, 400, 7, 2],
      ['شيكر سيزر', 'إكسسوارات', 55, 110, 22, 6],
      ['رباط معصم', 'إكسسوارات', 45, 90, 18, 5],
      ['تيشيرت سيزر', 'ملابس', 130, 250, 16, 5],
      ['جلسة ساونا', 'خدمات', 0, 100, 999, 0]
    ];
    [B1, B2].forEach(function (b) {
      prodDefs.forEach(function (p, i) {
        db.products.push({
          id: 'pr_' + b + '_' + i, name: p[0], cat: p[1], cost: p[2], price: p[3],
          stock: b === B2 ? Math.round(p[4] * 0.55) : p[4], minStock: p[5],
          branchId: b, active: true, sku: 'CZ' + String(100 + i)
        });
      });
    });
    /* مبيعات آخر 45 يوم */
    for (var sd = 45; sd >= 0; sd--) {
      var sdate = U.addDays(today, -sd);
      [B1, B2].forEach(function (b) {
        var cnt = r.int(b === B1 ? 3 : 1, b === B1 ? 12 : 6);
        for (var k = 0; k < cnt; k++) {
          var prods = db.products.filter(function (p) { return p.branchId === b; });
          var pp = r.weighted(prods.map(function (p) {
            return [p, p.cat === 'مشروبات' ? 30 : p.cat === 'مكملات' ? 14 : 5];
          }));
          var qty = pp.cat === 'مشروبات' ? r.int(1, 3) : 1;
          var mem = r.chance(0.55) ? r.pick(db.members.filter(function (m) { return m.branchId === b; })) : null;
          var tot = pp.price * qty;
          var at = sdate + 'T' + String(r.int(10, 22)).padStart(2, '0') + ':' + String(r.int(0, 59)).padStart(2, '0');
          db.sales.push({
            id: U.uid('sl'), productId: pp.id, name: pp.name, qty: qty, price: pp.price,
            total: tot, cost: pp.cost * qty, memberId: mem ? mem.id : null,
            branchId: b, at: at, method: r.weighted([['cash', 88], ['vodafone', 8], ['instapay', 4]])
          });
          db.money.push({
            id: U.uid('mn'), kind: 'in', amount: tot, cat: pp.cat === 'خدمات' ? 'sauna' : 'shop',
            method: 'cash', memberId: mem ? mem.id : null, branchId: b, at: at, note: pp.name + ' ×' + qty
          });
          if (pp.stock < 900) pp.stock = Math.max(0, pp.stock - qty);
        }
      });
    }

    /* ---- الأجهزة والصيانة ---- */
    var equipDefs = [
      ['تريدميل تكنوجيم', 'كارديو', 4, 42000], ['أوربيتراك', 'كارديو', 2, 28000],
      ['دراجة ثابتة', 'كارديو', 2, 18000], ['سميث ماشين', 'أوزان', 1, 55000],
      ['سكوات راك', 'أوزان', 2, 32000], ['بنش أوليمبي', 'أوزان', 3, 12000],
      ['بنش قابل للتعديل', 'أوزان', 4, 8500], ['جهاز صدر (تشيست برس)', 'أجهزة', 1, 38000],
      ['بيك ديك', 'أجهزة', 1, 34000], ['كابل كروس أوفر', 'أجهزة', 1, 46000],
      ['لات بول داون', 'أجهزة', 1, 33000], ['جهاز رجل (ليج برس)', 'أجهزة', 1, 52000],
      ['ليج إكستنشن', 'أجهزة', 1, 29000], ['ليج كيرل', 'أجهزة', 1, 29000],
      ['طقم دمبلز 5–40 كجم', 'أوزان حرة', 2, 65000], ['شجرة أوزان', 'أوزان حرة', 3, 4500],
      ['ساونا حرارية', 'مرافق', 1, 85000], ['كيس ملاكمة', 'فنون قتالية', 4, 3500],
      ['تكييف 3 حصان', 'مرافق', 4, 22000], ['نظام صوت', 'مرافق', 1, 9000]
    ];
    [B1, B2].forEach(function (b, bi) {
      equipDefs.forEach(function (e, i) {
        var qty = bi === 1 ? Math.max(1, Math.round(e[2] * 0.6)) : e[2];
        for (var q = 0; q < qty; q++) {
          var bought = U.addDays(today, -r.int(60, bi ? 330 : 1500));
          var last = U.addDays(today, -r.int(5, 140));
          var st = r.weighted([['ok', 88], ['maintenance', 8], ['broken', 4]]);
          db.equip.push({
            id: U.uid('eq'), name: e[0] + (qty > 1 ? ' #' + (q + 1) : ''), cat: e[1],
            branchId: b, serial: 'CZ-' + String(r.int(10000, 99999)),
            purchasedAt: bought, cost: e[3], status: st,
            lastService: last, serviceEvery: e[1] === 'كارديو' ? 90 : 180,
            note: st === 'broken' ? r.pick(['السير بيقف فجأة', 'الكابل مقطوع', 'صوت عالي من الموتور', 'الوسادة مقطوعة']) : ''
          });
        }
      });
    });
    db.equip.forEach(function (e) {
      var times = r.int(0, 3);
      for (var i = 0; i < times; i++) {
        db.maint.push({
          id: U.uid('mt'), equipId: e.id, at: U.addDays(today, -r.int(10, 400)),
          type: r.pick(['دورية', 'إصلاح عطل', 'تغيير قطعة']),
          cost: r.int(150, 2500), by: r.pick(['فني الجيم', 'شركة الصيانة', 'الوكيل']),
          note: r.pick(['تشحيم وضبط', 'تغيير سير', 'تغيير كابل', 'شد مسامير', 'تنظيف داخلي'])
        });
      }
    });

    /* ---- الحصص ---- */
    var classDefs = [
      ['كروس فيت', 0, 1140, 1200, 18, 'men'], ['كروس فيت', 2, 1140, 1200, 18, 'men'],
      ['كروس فيت', 4, 1140, 1200, 18, 'men'],
      ['ملاكمة', 1, 1200, 1260, 14, 'men'], ['ملاكمة', 3, 1200, 1260, 14, 'men'],
      ['كيك بوكس', 6, 1140, 1200, 14, 'men'],
      ['كاراتيه للأطفال', 6, 1020, 1080, 20, 'men'],
      ['كونغ فو', 2, 1260, 1320, 12, 'men'],
      ['لياقة سيدات', 0, 660, 720, 16, 'women'], ['لياقة سيدات', 2, 660, 720, 16, 'women'],
      ['لياقة سيدات', 4, 660, 720, 16, 'women'],
      ['زومبا سيدات', 1, 1080, 1140, 20, 'women'], ['زومبا سيدات', 3, 1080, 1140, 20, 'women'],
      ['تأهيل عسكري', 6, 480, 600, 12, 'men'], ['تأهيل عسكري', 1, 480, 600, 12, 'men'],
      ['فنكشنال', 3, 1320, 1380, 15, 'men']
    ];
    classDefs.forEach(function (c, i) {
      var cs = coaches.filter(function (x) {
        return x.branchId === B1 && (c[5] === 'women' ? x.gender === 'f' : true);
      });
      db.classes.push({
        id: 'cl_' + i, name: c[0], day: c[1], from: c[2], to: c[3], capacity: c[4],
        gender: c[5], branchId: B1, coachId: (r.pick(cs) || coaches[0]).id,
        room: r.pick(['الصالة الكبيرة', 'قاعة الأنشطة', 'الدور العلوي']), active: true
      });
    });
    [['لياقة عامة', 0, 1140, 1200, 14, 'men'], ['لياقة سيدات', 1, 1020, 1080, 12, 'women'],
    ['فنكشنال', 3, 1140, 1200, 12, 'men'], ['لياقة سيدات', 4, 1020, 1080, 12, 'women']]
      .forEach(function (c, i) {
        var cs2 = coaches.filter(function (x) { return x.branchId === B2 && (c[5] === 'women' ? x.gender === 'f' : true); });
        db.classes.push({
          id: 'cl2_' + i, name: c[0], day: c[1], from: c[2], to: c[3], capacity: c[4],
          gender: c[5], branchId: B2, coachId: (r.pick(cs2) || coaches[0]).id,
          room: 'الصالة', active: true
        });
      });
    /* حجوزات الأسبوع الجاي */
    db.classes.forEach(function (c) {
      for (var w = 0; w < 2; w++) {
        var delta = (c.day - U.dow(today) + 7) % 7 + w * 7;
        var date = U.addDays(today, delta);
        var pool = db.members.filter(function (m) {
          return m.branchId === c.branchId && (c.gender === 'women' ? m.gender === 'f' : m.gender === 'm') &&
            CZ.s.status(m).k !== 'expired';
        });
        var n = r.int(Math.floor(c.capacity * 0.3), c.capacity);
        r.shuffle(pool).slice(0, n).forEach(function (m) {
          db.bookings.push({
            id: U.uid('bk'), classId: c.id, memberId: m.id, date: date,
            status: 'booked', branchId: c.branchId, createdAt: U.isoT()
          });
        });
      }
    });

    /* ---- التدريب الخاص ---- */
    var ptPlan = db.plans.filter(function (p) { return p.type === 'pt'; });
    r.shuffle(db.members).slice(0, 26).forEach(function (m) {
      var p = r.pick(ptPlan);
      var start = U.addDays(today, -r.int(3, 70));
      var total = p.sessions, used = r.int(0, total);
      var cs = coaches.filter(function (c) { return c.branchId === m.branchId; });
      var coach = r.pick(cs.length ? cs : coaches);
      db.pt.push({
        id: U.uid('pt'), memberId: m.id, coachId: coach.id, branchId: m.branchId,
        planId: p.id, planName: p.name, sessionsTotal: total, sessionsUsed: used,
        price: p.price, paid: r.chance(0.85) ? p.price : Math.round(p.price / 2),
        startAt: start, endAt: U.addMonths(start, 2),
        status: used >= total ? 'done' : 'active', goal: r.pick(GOALS), note: ''
      });
      var pkg = db.pt[db.pt.length - 1];
      for (var i = 0; i < used; i++) {
        db.ptlog.push({
          id: U.uid('pl'), pkgId: pkg.id, memberId: m.id, coachId: coach.id,
          at: U.addDays(start, Math.round(i * (U.diffDays(today, start) / Math.max(1, used)))) + 'T18:00',
          focus: r.pick(['صدر وترايسبس', 'ظهر وبايسبس', 'رجل', 'كتف', 'فُل بودي', 'كارديو وحرق', 'بطن وكور']),
          note: '', rating: r.int(3, 5)
        });
      }
      if (pkg.paid > 0) db.money.push({
        id: U.uid('mn'), kind: 'in', amount: pkg.paid, cat: 'pt', method: 'cash',
        memberId: m.id, branchId: m.branchId, at: start + 'T17:00', note: p.name + ' — ' + coach.name
      });
    });

    /* ---- القياسات ---- */
    r.shuffle(db.members).slice(0, 70).forEach(function (m) {
      var n = r.int(1, 4);
      var w = m.gender === 'f' ? r.int(55, 95) : r.int(62, 118);
      var fat = m.gender === 'f' ? r.int(24, 40) : r.int(12, 34);
      for (var i = 0; i < n; i++) {
        db.measures.push({
          id: U.uid('ms'), memberId: m.id,
          at: U.addDays(today, -(n - i) * r.int(20, 35)),
          weight: w, height: m.gender === 'f' ? r.int(150, 172) : r.int(163, 190),
          fat: fat, muscle: Math.round(w * (0.72 - fat / 200) * 10) / 10,
          chest: r.int(85, 120), waist: r.int(68, 112), arm: r.int(26, 44), thigh: r.int(45, 68),
          note: '', by: r.pick(coaches).id
        });
        w -= r.int(0, 3); fat -= r.int(0, 2);
      }
    });

    /* ---- العملاء المحتملين ---- */
    var stages = [['new', 22], ['contacted', 20], ['visited', 14], ['trial', 8], ['won', 18], ['lost', 18]];
    for (var L = 0; L < 46; L++) {
      var isFL = r.chance(0.3);
      var st2 = r.weighted(stages);
      var created = U.addDays(today, -r.int(0, 55));
      db.leads.push({
        id: U.uid('ld'),
        name: (isFL ? r.pick(F_NAMES) : r.pick(M_NAMES)) + ' ' + r.pick(LAST),
        phone: '01' + r.pick([0, 1, 2, 5]) + String(r.int(10000000, 99999999)),
        gender: isFL ? 'f' : 'm',
        source: r.weighted([['إنستجرام', 30], ['فيسبوك', 26], ['واتساب', 14], ['صديق', 12], ['مشي جنب الجيم', 10], ['إعلان ممول', 8]]),
        branchId: r.chance(0.68) ? B1 : B2,
        stage: st2, createdAt: created,
        nextFollow: ['won', 'lost'].indexOf(st2) > -1 ? null : U.addDays(created, r.int(1, 9)),
        interest: r.pick(['باقة شهرية', 'برايفيت', 'أنشطة قتالية', 'قسم سيدات', 'تأهيل عسكري', 'لسه مش عارف']),
        note: r.pick(['سأل عن الأسعار', 'عايز يجي يشوف الجيم الأول', 'بيقارن بينا وبين جيم تاني', 'مستني مرتبه', 'عايز فترة سيدات', '']),
        lostReason: st2 === 'lost' ? r.pick(['السعر عالي', 'المسافة بعيدة', 'اشترك في جيم تاني', 'مردش', 'المواعيد ما تناسبوش']) : ''
      });
    }

    /* ---- مهام ---- */
    [['اتصل بالأعضاء اللي اشتراكهم خلص الأسبوع ده', B1, -1],
    ['اطلب واي بروتين — قرب يخلص', B1, 0],
    ['صيانة التريدميل رقم 2', B1, 2],
    ['ظبّط بيانات الفرع التاني في الإعدادات', B2, 0],
    ['صوّر الكباتن فيديو للسوشيال', B1, 4],
    ['راجع مرتبات الشهر قبل الصرف', null, 3]].forEach(function (t) {
      db.tasks.push({
        id: U.uid('tk'), title: t[0], branchId: t[1], due: U.addDays(today, t[2]),
        done: false, priority: t[2] < 1 ? 'high' : 'normal', assignee: null, createdAt: U.isoT()
      });
    });

    /* ---- اللوكرات ---- */
    [[B1, 60], [B2, 40]].forEach(function (b) {
      for (var i = 1; i <= b[1]; i++) {
        var owner = db.members.filter(function (m) { return m.branchId === b[0] && m.lockerNo === String(i); })[0];
        db.lockers.push({
          id: 'lk_' + b[0] + '_' + i, no: String(i), branchId: b[0],
          memberId: owner ? owner.id : null,
          status: owner ? 'taken' : (r.chance(0.05) ? 'broken' : 'free'),
          since: owner ? U.addDays(U.today(), -r.int(5, 200)) : null
        });
      }
    });

    /* ---- سجل نشاط افتتاحي ---- */
    db.log = [{
      id: U.uid('lg'), at: U.isoT(), userName: 'النظام', action: 'تجهيز',
      entity: 'system', detail: 'النظام اتجهّز ببيانات تجريبية — امسحها من الإعدادات لما تبدأ شغل حقيقي'
    }];

    return db;
  };
})();
