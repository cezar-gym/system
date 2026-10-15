/* ============================================================
   سيزر جيم — نظام الإدارة | رسوم SVG من غير أي مكتبة خارجية
   كل الرسوم بترجع HTML جاهز — مفيش canvas ومفيش تحميل خارجي.
   ============================================================ */
(function () {
  'use strict';
  var CZ = window.CZ, U = CZ.u;
  var C = (CZ.c = {});

  var INK = '#17181C', LIME = '#6F9410', LIME_L = '#BEF23C', HAIR = '#E2DFD6', FAINT = '#9A9B91';

  function path(pts) {
    return pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
  }
  /* منحنى ناعم (Catmull-Rom → Bezier) */
  function smooth(pts) {
    if (pts.length < 3) return path(pts);
    var d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += 'C' + c1x.toFixed(1) + ' ' + c1y.toFixed(1) + ',' + c2x.toFixed(1) + ' ' + c2y.toFixed(1) +
        ',' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
    }
    return d;
  }

  /* ---------- سبارك لاين صغير ---------- */
  C.spark = function (vals, opts) {
    opts = opts || {};
    var w = opts.w || 120, h = opts.h || 26;
    if (!vals.length) return '';
    var max = Math.max.apply(null, vals) || 1, min = opts.zero === false ? Math.min.apply(null, vals) : 0;
    var rng = (max - min) || 1;
    var pts = vals.map(function (v, i) {
      return [i / Math.max(1, vals.length - 1) * w, h - ((v - min) / rng) * (h - 2) - 1];
    });
    var id = 'sp' + Math.random().toString(36).slice(2, 7);
    return '<svg class="stat-spark" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none">' +
      '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + (opts.color || LIME_L) + '" stop-opacity=".55"/>' +
      '<stop offset="1" stop-color="' + (opts.color || LIME_L) + '" stop-opacity="0"/></linearGradient></defs>' +
      '<path d="' + smooth(pts) + ' L' + w + ' ' + h + ' L0 ' + h + ' Z" fill="url(#' + id + ')"/>' +
      '<path d="' + smooth(pts) + '" fill="none" stroke="' + (opts.color || LIME) + '" stroke-width="1.6" ' +
      'stroke-linecap="round" stroke-linejoin="round"/></svg>';
  };

  /* ---------- رسم خطي / مساحي ---------- */
  C.line = function (series, opts) {
    opts = opts || {};
    var w = 800, h = opts.h || 230;
    var pl = 46, pr = 12, pt = 14, pb = 26;
    var iw = w - pl - pr, ih = h - pt - pb;
    var all = [];
    series.forEach(function (s) { all = all.concat(s.data); });
    var max = Math.max.apply(null, all.concat([1]));
    max = niceMax(max);
    var n = series[0].data.length;
    var svg = '<svg viewBox="0 0 ' + w + ' ' + h + '" style="width:100%;height:' + h + 'px;overflow:visible" ' +
      'preserveAspectRatio="none" role="img">';

    /* شبكة */
    for (var g = 0; g <= 4; g++) {
      var y = pt + ih - (g / 4) * ih;
      svg += '<line x1="' + pl + '" y1="' + y.toFixed(1) + '" x2="' + (w - pr) + '" y2="' + y.toFixed(1) +
        '" stroke="' + HAIR + '" stroke-width="1" ' + (g ? 'stroke-dasharray="3 4"' : '') + '/>';
      svg += '<text x="' + (w - pr + 6) + '" y="' + (y + 3.5).toFixed(1) + '" font-size="10.5" fill="' + FAINT +
        '" font-family="Archivo,sans-serif" text-anchor="start">' + U.n(Math.round(max * g / 4)) + '</text>';
    }

    series.forEach(function (s, si) {
      var color = s.color || (si === 0 ? LIME : INK);
      var pts = s.data.map(function (v, i) {
        return [pl + (n === 1 ? iw / 2 : i / (n - 1) * iw), pt + ih - (v / max) * ih];
      });
      var id = 'ln' + si + Math.random().toString(36).slice(2, 6);
      if (s.area !== false) {
        svg += '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="' + color + '" stop-opacity=".26"/>' +
          '<stop offset="1" stop-color="' + color + '" stop-opacity="0"/></linearGradient></defs>' +
          '<path d="' + smooth(pts) + ' L' + (pl + iw) + ' ' + (pt + ih) + ' L' + pl + ' ' + (pt + ih) + ' Z" fill="url(#' + id + ')"/>';
      }
      svg += '<path d="' + smooth(pts) + '" fill="none" stroke="' + color + '" stroke-width="2.2" ' +
        'stroke-linecap="round" stroke-linejoin="round"' + (s.dash ? ' stroke-dasharray="5 4"' : '') + '/>';
      /* نقطة آخر قيمة */
      var last = pts[pts.length - 1];
      if (last && s.dot !== false) {
        svg += '<circle cx="' + last[0].toFixed(1) + '" cy="' + last[1].toFixed(1) + '" r="4" fill="#fff" stroke="' + color + '" stroke-width="2.4"/>';
      }
      /* مناطق تفاعلية */
      if (si === 0 && opts.labels) {
        pts.forEach(function (p, i) {
          svg += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="9" fill="transparent" ' +
            'class="ch-hit" data-t="' + U.esc(opts.labels[i] + ' — ' +
              series.map(function (ss) { return (ss.name || '') + ' ' + U.n(ss.data[i]); }).join(' · ')) + '"></circle>';
        });
      }
    });

    /* محور س */
    if (opts.labels) {
      var step = Math.max(1, Math.ceil(n / 8));
      for (var i2 = 0; i2 < n; i2 += step) {
        var x = pl + (n === 1 ? iw / 2 : i2 / (n - 1) * iw);
        svg += '<text x="' + x.toFixed(1) + '" y="' + (h - 6) + '" font-size="10.5" fill="' + FAINT +
          '" font-family="Archivo,sans-serif" text-anchor="middle">' + U.esc(opts.labels[i2]) + '</text>';
      }
    }
    svg += '</svg>';
    return wrap(svg, series, opts);
  };

  function wrap(svg, series, opts) {
    var leg = '';
    if (series && series.length > 1 && opts.legend !== false) {
      leg = '<div class="row" style="gap:14px;margin-top:8px;justify-content:center">' +
        series.map(function (s, i) {
          return '<span class="row" style="gap:6px"><i style="width:11px;height:3px;border-radius:2px;background:' +
            (s.color || (i === 0 ? LIME : INK)) + '"></i><span class="xs mut">' + U.esc(s.name || '') + '</span></span>';
        }).join('') + '</div>';
    }
    return '<div class="ch">' + svg + leg + '</div>';
  }

  function niceMax(v) {
    if (v <= 5) return 5;
    var mag = Math.pow(10, Math.floor(Math.log10(v)));
    var n = v / mag;
    var s = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
    return s * mag;
  }

  /* ---------- أعمدة ---------- */
  C.bars = function (data, opts) {
    opts = opts || {};
    var w = 800, h = opts.h || 220;
    var pl = 46, pr = 12, pt = 14, pb = 30;
    var iw = w - pl - pr, ih = h - pt - pb;
    var max = niceMax(Math.max.apply(null, data.map(function (d) { return d.v; }).concat([1])));
    var n = data.length;
    var bw = Math.min(46, (iw / n) * 0.62);
    var svg = '<svg viewBox="0 0 ' + w + ' ' + h + '" style="width:100%;height:' + h + 'px;overflow:visible">';
    for (var g = 0; g <= 4; g++) {
      var y = pt + ih - (g / 4) * ih;
      svg += '<line x1="' + pl + '" y1="' + y.toFixed(1) + '" x2="' + (w - pr) + '" y2="' + y.toFixed(1) +
        '" stroke="' + HAIR + '" stroke-width="1"' + (g ? ' stroke-dasharray="3 4"' : '') + '/>' +
        '<text x="' + (w - pr + 6) + '" y="' + (y + 3.5).toFixed(1) + '" font-size="10.5" fill="' + FAINT +
        '" font-family="Archivo,sans-serif">' + U.n(Math.round(max * g / 4)) + '</text>';
    }
    data.forEach(function (d, i) {
      var cx = pl + (i + 0.5) * (iw / n);
      var bh = (d.v / max) * ih;
      var color = d.color || LIME;
      svg += '<rect x="' + (cx - bw / 2).toFixed(1) + '" y="' + (pt + ih - bh).toFixed(1) + '" width="' + bw.toFixed(1) +
        '" height="' + Math.max(0, bh).toFixed(1) + '" rx="4" fill="' + color + '" class="ch-hit" data-t="' +
        U.esc(d.t + ' — ' + U.n(d.v) + (opts.unit || '')) + '"/>';
      if (opts.values !== false && bh > 16) {
        svg += '<text x="' + cx.toFixed(1) + '" y="' + (pt + ih - bh - 5).toFixed(1) + '" font-size="10.5" fill="' + INK +
          '" font-family="Archivo,sans-serif" font-weight="700" text-anchor="middle">' + U.n(d.v) + '</text>';
      }
      svg += '<text x="' + cx.toFixed(1) + '" y="' + (h - 8) + '" font-size="10.5" fill="' + FAINT +
        '" font-family="Tajawal,sans-serif" text-anchor="middle">' + U.esc(d.t) + '</text>';
    });
    svg += '</svg>';
    return '<div class="ch">' + svg + '</div>';
  };

  /* ---------- دونات ---------- */
  C.donut = function (data, opts) {
    opts = opts || {};
    var size = opts.size || 168, r = size / 2 - 12, cx = size / 2, cy = size / 2;
    var tot = U.sum(data, 'v') || 1;
    var a = -Math.PI / 2, sw = opts.thick || 22;
    var svg = '<svg viewBox="0 0 ' + size + ' ' + size + '" style="width:' + size + 'px;height:' + size + 'px;flex:none">';
    svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + HAIR + '" stroke-width="' + sw + '"/>';
    data.forEach(function (d) {
      if (!d.v) return;
      var frac = d.v / tot;
      var a2 = a + frac * Math.PI * 2;
      var large = frac > 0.5 ? 1 : 0;
      var x1 = cx + r * Math.cos(a), y1 = cy + r * Math.sin(a);
      var x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
      svg += '<path d="M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' A' + r + ' ' + r + ' 0 ' + large + ' 1 ' +
        x2.toFixed(1) + ' ' + y2.toFixed(1) + '" fill="none" stroke="' + d.color + '" stroke-width="' + sw +
        '" stroke-linecap="butt" class="ch-hit" data-t="' + U.esc(d.t + ' — ' + U.n(d.v) + ' (' + Math.round(frac * 100) + '%)') + '"/>';
      a = a2;
    });
    if (opts.center) {
      svg += '<text x="' + cx + '" y="' + (cy - 2) + '" text-anchor="middle" font-size="24" font-weight="800" ' +
        'font-family="Archivo,sans-serif" fill="' + INK + '">' + U.esc(opts.center) + '</text>';
      if (opts.centerSub) svg += '<text x="' + cx + '" y="' + (cy + 15) + '" text-anchor="middle" font-size="11" ' +
        'font-family="Tajawal,sans-serif" fill="' + FAINT + '">' + U.esc(opts.centerSub) + '</text>';
    }
    svg += '</svg>';
    var leg = '<div style="display:grid;gap:7px;flex:1;min-width:0">' + data.map(function (d) {
      return '<div class="row" style="gap:8px;flex-wrap:nowrap">' +
        '<i style="width:10px;height:10px;border-radius:3px;background:' + d.color + ';flex:none"></i>' +
        '<span style="flex:1;font-size:13px;font-weight:600;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + U.esc(d.t) + '</span>' +
        '<b class="num" style="font-size:13px">' + U.n(d.v) + '</b>' +
        '<span class="xs fnt num" style="width:34px;text-align:end">' + Math.round(d.v / tot * 100) + '%</span></div>';
    }).join('') + '</div>';
    return '<div class="row" style="gap:18px;flex-wrap:nowrap;align-items:center">' + svg + leg + '</div>';
  };

  /* ---------- قائمة أعمدة أفقية ---------- */
  C.rank = function (data, opts) {
    opts = opts || {};
    var max = Math.max.apply(null, data.map(function (d) { return d.v; }).concat([1]));
    return '<div style="display:grid;gap:10px">' + data.map(function (d, i) {
      return '<div>' +
        '<div class="row" style="gap:8px;justify-content:space-between;margin-bottom:4px;flex-wrap:nowrap">' +
        '<span style="font-size:13.5px;font-weight:700;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' +
        (opts.rank !== false ? '<span class="num fnt" style="font-size:11px;margin-inline-end:6px">' + (i + 1) + '</span>' : '') +
        U.esc(d.t) + '</span>' +
        '<b class="num nowrap" style="font-size:13.5px">' + (opts.money ? U.m(d.v) : U.n(d.v) + (opts.unit || '')) + '</b></div>' +
        '<div class="bar"><i style="width:' + (d.v / max * 100).toFixed(1) + '%;background:' + (d.color || LIME) + '"></i></div>' +
        (d.sub ? '<div class="xs fnt" style="margin-top:3px">' + U.esc(d.sub) + '</div>' : '') +
        '</div>';
    }).join('') + '</div>';
  };

  /* ---------- خريطة الزحمة ---------- */
  C.heat = function (grid, opts) {
    opts = opts || {};
    var from = opts.from === undefined ? 6 : opts.from, to = opts.to === undefined ? 23 : opts.to;
    var max = 1;
    grid.forEach(function (row) { row.forEach(function (v, h) { if (h >= from && h <= to && v > max) max = v; }); });
    var cols = to - from + 1;
    var out = '<div class="heat" style="--cols:' + cols + '">';
    out += '<div class="heat-row"><span></span>';
    for (var h = from; h <= to; h++) {
      out += '<span class="heat-lbl">' + (h % 3 === 0 ? (h > 12 ? h - 12 : h) + (h >= 12 ? 'م' : 'ص') : '') + '</span>';
    }
    out += '</div>';
    for (var d = 0; d < 7; d++) {
      out += '<div class="heat-row"><span class="heat-day">' + U.DAYS_S[d] + '</span>';
      for (var hh = from; hh <= to; hh++) {
        var v = grid[d][hh] || 0;
        var a = v / max;
        var bg = v === 0 ? 'var(--panel)' : 'rgba(111,148,16,' + (0.14 + a * 0.86).toFixed(2) + ')';
        out += '<span class="heat-c ch-hit" style="background:' + bg + '" data-t="' +
          U.esc(U.DAYS[d] + ' ' + U.fMin(hh * 60) + ' — ' + v + ' زيارة') + '"></span>';
      }
      out += '</div>';
    }
    out += '</div>';
    return out;
  };

  /* ---------- تلميح موحّد للرسوم ---------- */
  var tip = null;
  document.addEventListener('mouseover', function (e) {
    var t = e.target.closest ? e.target.closest('.ch-hit') : null;
    if (!t) return;
    if (!tip) {
      tip = document.createElement('div');
      tip.style.cssText = 'position:fixed;z-index:300;background:#17181C;color:#F3F1EB;padding:6px 10px;' +
        'border-radius:8px;font-size:12.5px;font-weight:600;pointer-events:none;white-space:nowrap;' +
        'box-shadow:0 8px 24px rgba(0,0,0,.25);font-family:Tajawal,sans-serif';
      document.body.appendChild(tip);
    }
    tip.textContent = t.getAttribute('data-t');
    tip.style.display = 'block';
  });
  document.addEventListener('mousemove', function (e) {
    if (!tip || tip.style.display === 'none') return;
    var x = e.clientX + 12, y = e.clientY - 32;
    if (x + tip.offsetWidth > window.innerWidth - 8) x = e.clientX - tip.offsetWidth - 12;
    tip.style.left = Math.max(6, x) + 'px'; tip.style.top = Math.max(6, y) + 'px';
  });
  document.addEventListener('mouseout', function (e) {
    var t = e.target.closest ? e.target.closest('.ch-hit') : null;
    if (t && tip) tip.style.display = 'none';
  });
})();
