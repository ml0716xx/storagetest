/* 负荷数据清洗抽屉：上传 → 清洗（进度）→ 下载 Excel */
(function () {
  var ICON = {
    upload: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4"/><path d="M7.5 8.5L12 4l4.5 4.5"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>',
    file: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z"/><path d="M14 3v5h5"/></svg>',
    close: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6.5"/></svg>',
    download: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v12"/><path d="M7.5 11.5L12 16l4.5-4.5"/><path d="M4 19h16"/></svg>',
    spark: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5l1.7 4.3 4.3 1.7-4.3 1.7L12 15.5l-1.7-4.3L6 9.5l4.3-1.7L12 3.5z"/><path d="M18.5 15.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9.9-2.1z"/></svg>'
  };

  var PHASES = [
    { until: 16, text: '解析文件结构' },
    { until: 38, text: '校验时间刻度，定位缺失点' },
    { until: 60, text: '识别异常值：突变 / 越限 / 负值' },
    { until: 84, text: '插补缺失点并做平滑处理' },
    { until: 100, text: '生成清洗结果文件' }
  ];

  var st = null;
  var timer = null;
  var escHandler = null;

  /* ---------- 工具 ---------- */
  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function fmtSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  }

  function stamp() {
    var d = new Date();
    return '' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '_' + pad(d.getHours()) + pad(d.getMinutes());
  }

  function phaseText(p) {
    for (var i = 0; i < PHASES.length; i++) if (p < PHASES[i].until) return PHASES[i].text;
    return PHASES[PHASES.length - 1].text;
  }

  /* ---------- 模拟清洗结果 ---------- */
  // ratio = 综合倍率（CT变比 × PT变比）。表计读数是二次侧值，
  // 清洗后负荷 = 二次侧读数 × 综合倍率，即一次侧 kW。
  function buildRows(ratio) {
    var k = (isFinite(ratio) && ratio > 0) ? ratio : 1;
    var rows = [['时间', '原始读数(kW)', '清洗后负荷(kW)', '处理说明']];
    var points = 96;                 // 24h × 15min

    for (var i = 0; i < points; i++) {
      var h = Math.floor(i / 4);
      var m = (i % 4) * 15;
      var base = 620 + 210 * Math.sin((h - 8) / 24 * Math.PI * 2) + 130 * Math.exp(-Math.pow(h - 19, 2) / 6);
      var noise = (Math.sin(i * 1.7) + Math.cos(i * 0.9)) * 6;
      var real = Math.round((base + noise) * 10) / 10;   // 一次侧真值
      var raw = real;                                    // 表计读数（二次侧）
      var note = '正常';

      if (i % 37 === 11) { raw = null; note = '缺失插补'; }
      else if (i % 43 === 5) { raw = Math.round(real * 12.4 * 10) / 10; note = '异常修正（越限）'; }
      else if (i % 29 === 9) { raw = -Math.round(real * 0.06 * 10) / 10; note = '异常修正（负值）'; }

      // 读数折算到二次侧，异常值同样按读数口径给
      var reading = (raw === null || k === 1) ? raw : Math.round(raw / k * 100) / 100;

      rows.push([('2026-11-03 ' + pad(h) + ':' + pad(m)), reading === null ? '' : reading, real, note]);
    }
    return rows;
  }

  /* ---------- 渲染 ---------- */
  function bodyHtml() {
    var s = st;
    var html = '';

    // 上传区
    if (!s.file) {
      html += '<div class="up-zone" id="upZone">' +
        '<div class="up-ico">' + ICON.upload + '</div>' +
        '<div class="up-main">点击或拖拽文件到此处上传</div>' +
        '<div class="up-hint">支持 .xlsx / .xls / .csv，单个文件不超过 20MB</div>' +
        '</div>';
    } else if (s.phase !== 'done') {
      html += '<div class="file-card">' +
        '<span class="file-ico">' + ICON.file + '</span>' +
        '<div class="file-meta">' +
        '<div class="file-name" title="' + s.file.name + '">' + s.file.name + '</div>' +
        '<div class="file-size">' + fmtSize(s.file.size) + '　' + (s.phase === 'cleaning' ? '清洗中' : '已就绪') + '</div>' +
        '</div>' +
        (s.phase === 'idle' ? '<span class="file-del" id="fileDel" title="移除">' + ICON.close + '</span>' : '') +
        '</div>';
    }

    // 综合倍率（上传就绪阶段可改，作为清洗输入源）
    if (s.phase === 'idle' || s.phase === 'ready') {
      html += '<div class="param-row">' +
        '<span class="param-label">综合倍率：</span>' +
        '<input class="param-input" id="fRatio" inputmode="decimal" value="' + s.ratio + '" />' +
        '<span class="param-hint">默认 1</span>' +
        '</div>' +
        '<div class="param-note">源数据已含倍率（一次值 kW）时保持 1；二次侧读数填 CT变比 × PT变比。</div>';
    }

    // 进度
    if (s.phase === 'cleaning') {
      var ratioTip = (st.ratio && st.ratio !== '1') ? '，综合倍率 ×' + st.ratio : '';
      html += '<div class="block clean-progress">' +
        '<div class="cp-head"><span id="cpText">' + phaseText(s.progress) + '</span><span id="cpPct">' + Math.round(s.progress) + '%</span></div>' +
        '<div class="cp-bar"><i id="cpFill" style="width:' + Math.round(s.progress) + '%"></i></div>' +
        '<div class="cp-note">正在清洗「' + s.file.name + '」' + ratioTip + '，请稍候</div>' +
        '</div>';
    }

    // 结果
    if (s.phase === 'done' && s.result) {
      var r = s.result;
      html += '<div class="result-card">' +
        '<div class="rc-head"><span class="rc-ok">' + ICON.check + '</span>清洗完成</div>' +
        '<div class="rc-file">' + ICON.file + '<span title="' + r.fileName + '">' + r.fileName + '</span></div>' +
        '<div class="rc-meta">综合倍率 ×' + r.ratio + '　已折算至一次侧　96 个采样点</div>' +
        '</div>';
    }

    return html;
  }

  function footHtml() {
    var s = st;
    if (s.phase === 'done') {
      return '<button class="btn" id="btnAgain">重新清洗</button>' +
        '<button class="btn btn-primary" id="btnDownload">' + ICON.download + '下载清洗结果</button>';
    }
    var disabled = !s.file || s.phase === 'cleaning';
    var label = s.phase === 'cleaning'
      ? '<span class="spinner"></span>清洗中…'
      : ICON.spark + '开始数据清洗';
    return '<button class="btn btn-primary" id="btnStart"' + (disabled ? ' disabled' : '') + '>' + label + '</button>';
  }

  function render() {
    var body = document.getElementById('drawerBody');
    var foot = document.getElementById('drawerFoot');
    if (!body || !foot) return;
    body.innerHTML = bodyHtml();
    foot.innerHTML = footHtml();
    bind();
  }

  function bind() {
    var s = st;

    var zone = document.getElementById('upZone');
    if (zone) {
      zone.addEventListener('click', function () { pickFile(); });
      zone.addEventListener('dragover', function (e) { e.preventDefault(); zone.classList.add('is-drag'); });
      zone.addEventListener('dragleave', function () { zone.classList.remove('is-drag'); });
      zone.addEventListener('drop', function (e) {
        e.preventDefault();
        zone.classList.remove('is-drag');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) acceptFile(e.dataTransfer.files[0]);
      });
    }

    var del = document.getElementById('fileDel');
    if (del) {
      del.addEventListener('click', function () {
        st.file = null;
        st.phase = 'idle';
        render();
      });
    }

    var start = document.getElementById('btnStart');
    if (start) start.addEventListener('click', startClean);

    var ratioEl = document.getElementById('fRatio');
    if (ratioEl) {
      ratioEl.addEventListener('input', function () { st.ratio = ratioEl.value; });
      ratioEl.addEventListener('blur', function () {
        var v = (ratioEl.value || '').trim();
        if (!v || !isFinite(parseFloat(v)) || parseFloat(v) <= 0) {
          ratioEl.value = '1';
          st.ratio = '1';
        }
      });
    }

    var download = document.getElementById('btnDownload');
    if (download) download.addEventListener('click', downloadResult);

    var again = document.getElementById('btnAgain');
    if (again) {
      again.addEventListener('click', function () {
        st.file = null;
        st.phase = 'idle';
        st.progress = 0;
        st.result = null;
        render();
      });
    }
  }

  /* ---------- 文件 ---------- */
  function pickFile() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls,.csv';
    input.addEventListener('change', function () {
      if (input.files && input.files[0]) acceptFile(input.files[0]);
    });
    input.click();
  }

  function acceptFile(file) {
    var ext = (file.name.split('.').pop() || '').toLowerCase();
    if (['xlsx', 'xls', 'csv'].indexOf(ext) === -1) {
      window.App.toast('仅支持 .xlsx / .xls / .csv 文件');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      window.App.toast('文件不能超过 20MB');
      return;
    }
    st.file = { name: file.name, size: file.size };
    st.phase = 'ready';
    render();
  }

  /* ---------- 清洗流程 ---------- */
  function startClean() {
    if (!st.file || st.phase === 'cleaning') return;

    var ratio = parseFloat(st.ratio);
    if (!isFinite(ratio) || ratio <= 0) {
      window.App.toast('综合倍率必须填大于 0 的数字');
      return;
    }
    st.ratio = String(ratio);

    st.phase = 'cleaning';
    st.progress = 0;
    render();

    timer = setInterval(function () {
      st.progress = Math.min(100, st.progress + Math.random() * 3.2 + 1.1);
      var fill = document.getElementById('cpFill');
      var pct = document.getElementById('cpPct');
      var txt = document.getElementById('cpText');
      if (!fill) { clearInterval(timer); timer = null; return; }
      fill.style.width = st.progress.toFixed(1) + '%';
      pct.textContent = Math.round(st.progress) + '%';
      txt.textContent = phaseText(st.progress);
      if (st.progress >= 100) {
        clearInterval(timer);
        timer = null;
        finishClean();
      }
    }, 80);
  }

  function finishClean() {
    var ratio = parseFloat(st.ratio) || 1;
    var rows = buildRows(ratio);
    var base = st.file.name.replace(/\.(xlsx|xls|csv)$/i, '');
    st.result = {
      rows: rows,
      ratio: ratio,
      fileName: base + '_清洗结果_' + stamp() + '.xlsx'
    };
    st.phase = 'done';
    st.progress = 100;
    render();
    window.App.toast('清洗完成，可下载结果');
  }

  function downloadResult() {
    if (!st.result) return;
    try {
      var blob = window.XlsxLite.build({ sheetName: '负荷清洗结果', rows: st.result.rows });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = st.result.fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 3000);
      window.App.toast('已开始下载');
    } catch (e) {
      window.App.toast('生成文件失败：' + e.message);
    }
  }

  /* ---------- 打开 / 关闭 ---------- */
  function open() {
    if (document.getElementById('drawer')) return;
    st = { phase: 'idle', file: null, progress: 0, result: null, ratio: '1' };

    var mask = document.createElement('div');
    mask.className = 'drawer-mask';
    mask.id = 'drawerMask';

    var drawer = document.createElement('aside');
    drawer.className = 'drawer';
    drawer.id = 'drawer';
    drawer.innerHTML =
      '<div class="drawer-head">' +
      '<div>' +
      '<div class="drawer-title">负荷数据清洗</div>' +
      '<div class="drawer-sub">上传负荷曲线文件，按规则清洗后导出 Excel</div>' +
      '</div>' +
      '<span class="drawer-close" id="drawerClose">' + ICON.close + '</span>' +
      '</div>' +
      '<div class="drawer-body" id="drawerBody"></div>' +
      '<div class="drawer-foot" id="drawerFoot"></div>';

    document.body.appendChild(mask);
    document.body.appendChild(drawer);
    document.body.style.overflow = 'hidden';

    mask.addEventListener('click', close);
    drawer.querySelector('#drawerClose').addEventListener('click', close);
    escHandler = function (e) { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', escHandler);

    requestAnimationFrame(function () {
      mask.classList.add('is-open');
      drawer.classList.add('is-open');
    });

    render();
  }

  function close() {
    var mask = document.getElementById('drawerMask');
    var drawer = document.getElementById('drawer');
    if (!drawer) return;
    if (timer) { clearInterval(timer); timer = null; }
    if (escHandler) { document.removeEventListener('keydown', escHandler); escHandler = null; }
    mask.classList.remove('is-open');
    drawer.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(function () {
      if (mask && mask.parentElement) mask.remove();
      if (drawer && drawer.parentElement) drawer.remove();
    }, 220);
  }

  window.CleanDrawer = { open: open, close: close };
})();
