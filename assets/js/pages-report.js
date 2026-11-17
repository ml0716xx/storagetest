/* 储能项目测算报告 */
(function () {
  var U = window.PU;
  var ICON = U.ICON;

  var CFG_KEYS = ['3', '4', '5'];
  var CFG_LABEL = { '3': '3台储能', '4': '4台储能', '5': '5台储能' };

  /* ---------- 简易 SVG 图表 ---------- */
  function chart(opts) {
    var W = 920, H = 250;
    var padL = 52, padR = opts.rightMax ? 56 : 24, padT = 16, padB = 34;
    var iw = W - padL - padR, ih = H - padT - padB;
    var cats = opts.cats || [];
    var bars = opts.bars || [];
    var lines = opts.lines || [];

    function maxOf(arr) {
      var v = Math.max.apply(null, arr.concat([1]));
      return isFinite(v) ? v : 1;
    }
    function allVals(list) {
      var out = [];
      list.forEach(function (s) { out = out.concat(s.values); });
      return out;
    }
    var leftSeries = bars.filter(function (b) { return !b.right; }).concat(lines.filter(function (l) { return !l.right; }));
    var rightSeries = bars.filter(function (b) { return b.right; }).concat(lines.filter(function (l) { return l.right; }));
    var leftMax = opts.leftMax || niceMax(maxOf(allVals(leftSeries)));
    var rightMax = opts.rightMax || (rightSeries.length ? niceMax(maxOf(allVals(rightSeries))) : 0);

    function yL(v) { return padT + ih - (v / leftMax) * ih; }
    function yR(v) { return padT + ih - (v / rightMax) * ih; }

    var band = iw / Math.max(cats.length, 1);
    var barW = Math.min(26, band * 0.42);

    var svg = '<svg class="chart-svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet">';

    /* 网格 */
    var ticks = 4;
    for (var i = 0; i <= ticks; i++) {
      var v = leftMax / ticks * i;
      var y = yL(v);
      svg += '<line x1="' + padL + '" y1="' + y + '" x2="' + (W - padR) + '" y2="' + y + '" stroke="#eef1f6" stroke-width="1"/>';
      svg += '<text x="' + (padL - 10) + '" y="' + (y + 4) + '" text-anchor="end" font-size="11" fill="#9099a6">' + fmt(v) + '</text>';
    }

    /* 右轴刻度 */
    if (rightMax) {
      for (var j = 0; j <= ticks; j++) {
        var rv = rightMax / ticks * j;
        var ry = yR(rv);
        svg += '<text x="' + (W - padR + 10) + '" y="' + (ry + 4) + '" font-size="11" fill="#9099a6">' + fmt(rv) + '</text>';
      }
    }

    /* 柱 */
    bars.forEach(function (b, bi) {
      var n = bars.length;
      var groupW = barW * n + 6 * (n - 1);
      b.values.forEach(function (val, ci) {
        var cx = padL + band * (ci + 0.5);
        var x = cx - groupW / 2 + bi * (barW + 6);
        var y = b.right ? yR(val) : yL(val);
        var h = Math.max(2, padT + ih - y);
        svg += '<rect x="' + x + '" y="' + y + '" width="' + barW + '" height="' + h + '" rx="2" fill="' + b.color + '"/>';
      });
    });

    /* 折线 */
    lines.forEach(function (l) {
      var pts = l.values.map(function (val, ci) {
        var cx = padL + band * (ci + 0.5);
        var cy = l.right ? yR(val) : yL(val);
        return cx + ',' + cy;
      }).join(' ');
      svg += '<polyline points="' + pts + '" fill="none" stroke="' + l.color + '" stroke-width="2"/>';
      l.values.forEach(function (val, ci) {
        var cx = padL + band * (ci + 0.5);
        var cy = l.right ? yR(val) : yL(val);
        svg += '<circle cx="' + cx + '" cy="' + cy + '" r="3.4" fill="#fff" stroke="' + l.color + '" stroke-width="2"/>';
      });
    });

    /* x 轴标签 */
    cats.forEach(function (c, ci) {
      svg += '<text x="' + (padL + band * (ci + 0.5)) + '" y="' + (H - 10) + '" text-anchor="middle" font-size="12" fill="#5f6672">' + c + '</text>';
    });

    svg += '</svg>';
    return svg;
  }

  function niceMax(v) {
    if (v <= 0) return 1;
    var p = Math.pow(10, Math.floor(Math.log(v) / Math.LN10));
    var n = v / p;
    var m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
    return m * p;
  }

  function fmt(v) {
    if (v >= 1000) return Math.round(v / 100) / 10 + 'k';
    if (Math.abs(v - Math.round(v)) < 0.01) return String(Math.round(v));
    return String(Math.round(v * 10) / 10);
  }

  function legend(items) {
    return '<div class="lg-row">' + items.map(function (it) {
      return '<span class="lg-item"><i class="lg-mark ' + it.type + '" style="background:' + (it.type === 'bar' ? it.color : 'transparent') +
        ';border-color:' + it.color + '"></i>' + it.name + '</span>';
    }).join('') + '</div>';
  }

  /* ---------- 页面 ---------- */
  var report = {
    title: '储能项目测算报告',

    render: function (state) {
      var R = window.REPORT;
      var cfg = state.cfg || '3';
      var mode = state.mode || 'total';
      var ov = R.overview;

      var html = '<div class="report-wrap">';

      /* 标题 */
      html += '<header class="rp-head">' +
        '<h1 class="rp-title">储能项目测算报告</h1>' +
        '<p class="rp-sub">该项目位于 ' + U.esc(R.location) + '，对应的测算分析结果如下</p>' +
        '</header>';

      /* 图1 */
      html += '<section class="rp-card">' +
        legend([
          { type: 'line', color: '#4a77ea', name: '回本年限' },
          { type: 'bar', color: '#4a77ea', name: '10年净收益' }
        ]) +
        '<div class="chart-holder">' + chart({
          cats: ['3台', '4台', '5台'],
          bars: [{ name: '10年净收益', color: '#4a77ea', values: ov.map(function (o) { return +o.profit10; }), right: true }],
          lines: [{ name: '回本年限', color: '#2f9e63', values: ov.map(function (o) { return +o.payback; }) }],
          leftMax: 10,
          rightMax: 20
        }) + '</div>' +
        '<div class="chart-note">回本年限：' + ov[0].payback + '　单位：万元 / 年</div>' +
        '</section>';

      /* 光伏测算数据 */
      html += '<section class="rp-card">';
      html += '<div class="rp-card-head"><h2 class="rp-h2">光伏测算数据</h2>' +
        '<button class="btn" id="btnExpPv">' + ICON.export + '导出</button></div>';
      html += '<div class="kpi-grid">';
      [['光伏装机容量', R.pv.capacity, 'kWp'],
       ['光伏年总发电量', R.pv.genTotal, '万kWh'],
       ['光伏自用比例(未配储)', R.pv.selfRatio, '%'],
       ['负荷侧储能年充电量(未配储)', R.pv.chargeNeed, '万kWh'],
       ['上网电量', R.pv.onGrid, '万kWh']].forEach(function (k) {
        html += '<div class="kpi"><div class="kpi-label">' + k[0] + '</div>' +
          '<div class="kpi-value">' + k[1] + '<span class="kpi-unit">' + k[2] + '</span></div></div>';
      });
      html += '</div>';

      html += '<div class="kpi-grid kpi-grid-2">';
      R.pv.tof.forEach(function (t) {
        html += '<div class="kpi kpi-sm">' +
          '<div class="kpi-label">' + t.label + '</div>' +
          '<div class="kpi-pair"><span class="kp-val">' + t.gen + '</span><span class="kp-tag">上网 kWh</span></div>' +
          '<div class="kpi-pair"><span class="kp-val">' + t.self + '</span><span class="kp-tag">自用 kWh</span></div>' +
          '</div>';
      });
      html += '</div>';
      html += '</section>';

      /* 储能测算数据分析 */
      html += '<section class="rp-card">';
      html += '<div class="rp-card-head"><div><h2 class="rp-h2">储能测算数据分析</h2>' +
        '<p class="rp-sub2">储能充电与光伏消纳分析</p></div></div>';

      html += legend([
        { type: 'bar', color: '#4a77ea', name: '回本年限' },
        { type: 'line', color: '#2f9e63', name: '充电达成百分比' },
        { type: 'line', color: '#6cb6f5', name: '光伏消纳提升' }
      ]);
      html += '<div class="chart-holder">' + chart({
        cats: ['3台', '4台', '5台'],
        bars: [{ name: '回本年限', color: '#4a77ea', values: ov.map(function (o) { return +o.payback; }) }],
        lines: [
          { name: '充电达成百分比', color: '#2f9e63', values: ov.map(function (o) { return +o.reachPct; }), right: true },
          { name: '光伏消纳提升', color: '#6cb6f5', values: ov.map(function (o) { return +o.pvGain * 100; }), right: true }
        ],
        rightMax: 60
      }) + '</div>';
      html += '<div class="chart-axis-note"><span>左轴：年</span><span>右轴：%</span></div>';
      html += '</section>';

      /* 图3 储能收益&成本 */
      html += '<section class="rp-card">';
      html += '<div class="rp-card-head"><h2 class="rp-h2">储能收益&amp;成本</h2></div>';
      html += legend([
        { type: 'bar', color: '#2f9e63', name: '储能柜EPC总成本' },
        { type: 'bar', color: '#4a9bf0', name: '10年电价总收益' },
        { type: 'bar', color: '#2b4fae', name: '10年净利润' }
      ]);
      html += '<div class="chart-holder">' + chart({
        cats: ['3台', '4台', '5台'],
        bars: [
          { name: '储能柜EPC总成本', color: '#2f9e63', values: ov.map(function (o) { return +o.epcCost; }) },
          { name: '10年电价总收益', color: '#4a9bf0', values: ov.map(function (o) { return +o.income10; }) },
          { name: '10年净利润', color: '#2b4fae', values: ov.map(function (o) { return +o.profit10; }) }
        ]
      }) + '</div>';
      html += '</section>';

      /* 图4 储能首年收益&成本 */
      html += '<section class="rp-card">';
      html += '<div class="rp-card-head"><h2 class="rp-h2">储能首年收益&amp;成本</h2></div>';
      html += legend([
        { type: 'bar', color: '#2f9e63', name: '首年削峰放电收益' },
        { type: 'bar', color: '#4a9bf0', name: '首年储能充电成本' },
        { type: 'bar', color: '#2b4fae', name: '首年电价差收益' }
      ]);
      html += '<div class="chart-holder">' + chart({
        cats: ['3台', '4台', '5台'],
        bars: [
          { name: '首年削峰放电收益', color: '#2f9e63', values: ov.map(function (o) { return +o.dis1; }) },
          { name: '首年储能充电成本', color: '#4a9bf0', values: ov.map(function (o) { return +o.chg1; }) },
          { name: '首年电价差收益', color: '#2b4fae', values: ov.map(function (o) { return +o.diff1; }) }
        ]
      }) + '</div>';
      html += '</section>';

      /* 10年总览 */
      html += '<section class="rp-card">';
      html += '<div class="rp-card-head"><h2 class="rp-h2">储能10年测算总览数据</h2>' +
        '<button class="btn" id="btnExpOv">' + ICON.export + '导出</button></div>';
      html += '<div class="tbl-scroll"><table class="data rp-table"><thead><tr>' +
        '<th>储能配置量</th><th>回本时间（年）</th><th>首年充电达成百分比（%）</th><th>首年充电达成天数（天）</th>' +
        '<th>首年配置储能后<br/>储消纳率提升（%）</th><th>10年电价总收益（万元）</th><th>10年净利润（万元）</th>' +
        '<th>储能柜EPC总成本（万元）</th><th>首年电价差收益<br/>（年度充放电量）（万元）</th>' +
        '<th>首年储能放电收入（万元）</th><th>首年储能充电成本（万元）</th></tr></thead><tbody>';
      ov.forEach(function (o) {
        html += '<tr><td class="col-name">' + o.cfg + '</td><td>' + o.payback + '</td><td>' + o.reachPct + '</td><td>' + o.reachDays + '</td>' +
          '<td>' + o.pvGain + '</td><td>' + o.income10 + '</td><td>' + o.profit10 + '</td><td>' + o.epcCost + '</td>' +
          '<td>' + o.diff1 + '</td><td>' + o.dis1 + '</td><td>' + o.chg1 + '</td></tr>';
      });
      html += '</tbody></table></div>';
      html += '</section>';

      /* 10年明细 */
      var detail = window.REPORT_DETAIL[cfg].years;
      var showRows = mode === 'first' ? detail.slice(0, 1) : detail;
      html += '<section class="rp-card">';
      html += '<div class="rp-card-head"><h2 class="rp-h2">储能10年测算明细数据</h2>' +
        '<div class="rp-head-actions">' +
        '<span class="seg" id="segMode">' +
        '<button class="seg-btn' + (mode === 'total' ? ' is-active' : '') + '" data-mode="total">总计</button>' +
        '<button class="seg-btn' + (mode === 'first' ? ' is-active' : '') + '" data-mode="first">首年</button>' +
        '</span>' +
        '<button class="btn" id="btnExpDetail">' + ICON.export + '导出</button>' +
        '</div></div>';

      html += '<div class="seg seg-cfg" id="segCfg">';
      CFG_KEYS.forEach(function (k) {
        html += '<button class="seg-btn' + (k === cfg ? ' is-active' : '') + '" data-cfg="' + k + '">' + CFG_LABEL[k] + '</button>';
      });
      html += '</div>';

      html += '<div class="tbl-scroll"><table class="data rp-table rp-detail"><thead><tr>' +
        '<th>年份</th><th>年度充放电收益（万元）</th>' +
        '<th>尖峰电网充电量（kWh）</th><th>尖峰放电量（kWh）</th>' +
        '<th>高峰电网充电量（kWh）</th><th>高峰放电量（kWh）</th>' +
        '<th>平段电网充电量（kWh）</th><th>平段放电量（kWh）</th>' +
        '<th>低谷电网充电量（kWh）</th><th>低谷放电量（kWh）</th>' +
        '<th>深谷电网充电量（kWh）</th><th>深谷放电量（kWh）</th>' +
        '<th>配置储能后储消纳光伏电量（kWh）</th></tr></thead><tbody>';
      showRows.forEach(function (r) {
        html += '<tr>' + r.map(function (v, i) {
          return '<td' + (i === 0 ? ' class="col-name"' : '') + '>' + v + '</td>';
        }).join('') + '</tr>';
      });
      html += '</tbody></table></div>';
      html += '</section>';

      html += '</div>';
      return html;
    },

    mount: function (root, state) {
      var self = this;

      root.querySelectorAll('#segCfg [data-cfg]').forEach(function (el) {
        el.addEventListener('click', function () {
          state.cfg = el.dataset.cfg;
          window.App.rerenderPage();
        });
      });
      root.querySelectorAll('#segMode [data-mode]').forEach(function (el) {
        el.addEventListener('click', function () {
          state.mode = el.dataset.mode;
          window.App.rerenderPage();
        });
      });

      var expPv = root.querySelector('#btnExpPv');
      if (expPv) expPv.addEventListener('click', function () {
        var R = window.REPORT;
        var rows = [['指标', '数值', '单位'],
          ['光伏装机容量', R.pv.capacity, 'kWp'],
          ['光伏年总发电量', R.pv.genTotal, '万kWh'],
          ['光伏自用比例(未配储)', R.pv.selfRatio, '%'],
          ['负荷侧储能年充电量(未配储)', R.pv.chargeNeed, '万kWh'],
          ['上网电量', R.pv.onGrid, '万kWh']];
        R.pv.tof.forEach(function (t) { rows.push([t.label + ' 上网电量(kWh)', t.gen, '']); });
        R.pv.tof.forEach(function (t) { rows.push([t.label + ' 自用电量(kWh)', t.self, '']); });
        U.exportXlsx('光伏测算数据', rows, '光伏测算数据.xlsx');
        window.App.toast('导出成功');
      });

      var expOv = root.querySelector('#btnExpOv');
      if (expOv) expOv.addEventListener('click', function () {
        var rows = [['储能配置量', '回本时间（年）', '首年充电达成百分比（%）', '首年充电达成天数（天）',
          '首年配置储能后储消纳率提升（%）', '10年电价总收益（万元）', '10年净利润（万元）',
          '储能柜EPC总成本（万元）', '首年电价差收益（万元）', '首年储能放电收入（万元）', '首年储能充电成本（万元）']];
        window.REPORT.overview.forEach(function (o) {
          rows.push([o.cfg, o.payback, o.reachPct, o.reachDays, o.pvGain, o.income10, o.profit10, o.epcCost, o.diff1, o.dis1, o.chg1]);
        });
        U.exportXlsx('10年测算总览', rows, '储能10年测算总览数据.xlsx');
        window.App.toast('导出成功');
      });

      var expDetail = root.querySelector('#btnExpDetail');
      if (expDetail) expDetail.addEventListener('click', function () {
        var cfg = state.cfg || '3';
        var detail = window.REPORT_DETAIL[cfg].years;
        var show = state.mode === 'first' ? detail.slice(0, 1) : detail;
        var rows = [['年份', '年度充放电收益（万元）', '尖峰电网充电量（kWh）', '尖峰放电量（kWh）',
          '高峰电网充电量（kWh）', '高峰放电量（kWh）', '平段电网充电量（kWh）', '平段放电量（kWh）',
          '低谷电网充电量（kWh）', '低谷放电量（kWh）', '深谷电网充电量（kWh）', '深谷放电量（kWh）',
          '配置储能后储消纳光伏电量（kWh）']];
        show.forEach(function (r) { rows.push(r.slice()); });
        U.exportXlsx('10年明细_' + cfg + '台', rows, '储能10年测算明细_' + cfg + '台.xlsx');
        window.App.toast('导出成功');
      });
    }
  };

  window.PageDefs = window.PageDefs || {};
  window.PageDefs['calc-report'] = report;
})();
