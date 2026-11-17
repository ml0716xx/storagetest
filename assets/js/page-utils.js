/* 页面公共工具：图标、转义、分页、表单控件、月份表、导出 */
(function () {
  var ICON = {
    search: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg>',
    reset: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M20 11a8 8 0 1 0-2.5 6.4"/><path d="M20 4v7h-7"/></svg>',
    plus: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    cal: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    clean: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5l1.7 4.3 4.3 1.7-4.3 1.7L12 15.5l-1.7-4.3L6 9.5l4.3-1.7L12 3.5z"/><path d="M18.5 15.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9.9-2.1z"/></svg>',
    close: '<svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    export: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4"/><path d="M7.5 8.5L12 4l4.5 4.5"/><path d="M4 19h16"/></svg>',
    back: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    upload: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4"/><path d="M7.5 8.5L12 4l4.5 4.5"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>',
    file: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z"/><path d="M14 3v5h5"/></svg>',
    uploadSm: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4"/><path d="M7.5 8.5L12 4l4.5 4.5"/><path d="M4 19h16"/></svg>',
    download: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v12"/><path d="M7.5 11.5L12 16l4.5-4.5"/><path d="M4 19h16"/></svg>'
  };

  function esc(s) {
    return String(s === undefined || s === null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* 分页条 */
  function pagerHtml(page, total) {
    var html = '<button class="pg-btn" data-pg="prev"' + (page === 1 ? ' disabled' : '') + '>‹</button>';
    var nums = [];
    for (var i = 1; i <= total; i++) {
      if (total <= 7 || i === 1 || i === total || Math.abs(i - page) <= 1) nums.push(i);
      else if (nums[nums.length - 1] !== '...') nums.push('...');
    }
    nums.forEach(function (n) {
      if (n === '...') html += '<span class="pg-ellipsis">…</span>';
      else html += '<button class="pg-btn' + (n === page ? ' is-active' : '') + '" data-pg="' + n + '">' + n + '</button>';
    });
    html += '<button class="pg-btn" data-pg="next"' + (page === total ? ' disabled' : '') + '>›</button>';
    return html;
  }

  /* 分页整条（含记录数、条/页、跳至） */
  function pagerBar(page, totalPages, totalCount, size) {
    return '<div class="pager">' +
      '<span class="pager-total">共 <b>' + totalCount + '</b> 条记录　第 ' + page + '/' + totalPages + '页</span>' +
      '<div class="pager-right">' + pagerHtml(page, totalPages) +
      '<select class="pg-size" id="pgSize">' +
      [10, 20, 50].map(function (n) {
        return '<option value="' + n + '"' + (n === size ? ' selected' : '') + '>' + n + ' 条/页</option>';
      }).join('') +
      '</select>' +
      '<span class="pg-jump">跳至<input id="pgJump" value="' + page + '" />页</span>' +
      '</div></div>';
  }

  /* 带单位后缀的输入框 */
  function unitInput(opts) {
    var o = opts || {};
    return '<span class="ui-wrap' + (o.cls ? ' ' + o.cls : '') + '">' +
      '<input class="input' + (o.inputCls ? ' ' + o.inputCls : '') + '"' +
      (o.id ? ' id="' + o.id + '"' : '') +
      (o.type ? ' type="' + o.type + '"' : '') +
      (o.value !== undefined && o.value !== null ? ' value="' + esc(o.value) + '"' : '') +
      ' placeholder="' + esc(o.placeholder || '') + '"' +
      (o.readonly ? ' readonly' : '') + ' />' +
      (o.unit ? '<i class="ui-unit">' + esc(o.unit) + '</i>' : '') +
      '</span>';
  }

  /* 下拉框 */
  function selectBox(opts) {
    var o = opts || {};
    var html = '<span class="ui-wrap' + (o.cls ? ' ' + o.cls : '') + '"><select class="input ui-select"' +
      (o.id ? ' id="' + o.id + '"' : '') + '>';
    html += '<option value="">' + esc(o.placeholder || '请选择') + '</option>';
    (o.options || []).forEach(function (op) {
      var v = typeof op === 'string' ? op : op.value;
      var t = typeof op === 'string' ? op : op.label;
      html += '<option value="' + esc(v) + '"' + (o.value && o.value === v ? ' selected' : '') + '>' + esc(t) + '</option>';
    });
    html += '</select></span>';
    return html;
  }

  /* 表单行：标签 + 控件 + 单位 */
  function field(label, ctrl, opts) {
    var o = opts || {};
    return '<div class="f-item' + (o.cls ? ' ' + o.cls : '') + (o.wide ? ' f-wide' : '') + '">' +
      '<label class="f-label">' + (o.required ? '<i class="req">*</i>' : '') + esc(label) +
      (o.tip ? '<span class="f-tip">' + esc(o.tip) + '</span>' : '') + '</label>' +
      '<div class="f-ctrl">' + ctrl + '</div>' +
      '</div>';
  }

  /* 月份表：一行 12 个月的输入框 */
  function monthRow(label, values, opts) {
    var o = opts || {};
    var html = '<table class="month-table"><thead><tr><th class="mt-corner">' + esc(o.corner || '月份') + '</th>';
    for (var m = 1; m <= 12; m++) html += '<th>' + m + '月</th>';
    html += '</tr></thead><tbody><tr><td class="mt-label">' + esc(label) + '</td>';
    (values || []).forEach(function (v, i) {
      html += '<td><input class="input mt-input" value="' + esc(v) + '" data-mi="' + i + '" /></td>';
    });
    html += '</tr></tbody></table>';
    return html;
  }

  /* 导出 xlsx */
  function exportXlsx(sheetName, rows, filename) {
    try {
      var blob = window.XlsxLite.build({ sheetName: sheetName, headerStyle: true, rows: rows });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = filename || (sheetName + '.xlsx');
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        URL.revokeObjectURL(url);
        a.remove();
      }, 400);
    } catch (e) {
      window.App.toast('导出失败：' + e.message);
    }
  }

  /* 分页事件绑定（列表页通用） */
  function bindPager(root, state, rerender, totalCount) {
    root.querySelectorAll('[data-pg]').forEach(function (el) {
      el.addEventListener('click', function () {
        var v = el.dataset.pg;
        var total = Math.max(1, Math.ceil(totalCount / state.size));
        if (v === 'prev') state.page = Math.max(1, state.page - 1);
        else if (v === 'next') state.page = Math.min(total, state.page + 1);
        else state.page = Number(v);
        rerender();
      });
    });
    var sizeEl = root.querySelector('#pgSize');
    if (sizeEl) sizeEl.addEventListener('change', function () {
      state.size = Number(sizeEl.value);
      state.page = 1;
      rerender();
    });
    var jumpEl = root.querySelector('#pgJump');
    if (jumpEl) jumpEl.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      var n = parseInt(jumpEl.value, 10);
      if (!n || n < 1) n = 1;
      var max = Math.max(1, Math.ceil(totalCount / state.size));
      if (n > max) n = max;
      state.page = n;
      rerender();
    });
  }

  /* 无数据行 */
  function emptyRow(cols, text) {
    return '<tr><td colspan="' + cols + '"><div class="empty">' + esc(text || '暂无数据') + '</div></td></tr>';
  }

  window.PU = {
    ICON: ICON,
    esc: esc,
    pagerHtml: pagerHtml,
    pagerBar: pagerBar,
    unitInput: unitInput,
    selectBox: selectBox,
    field: field,
    monthRow: monthRow,
    exportXlsx: exportXlsx,
    bindPager: bindPager,
    emptyRow: emptyRow
  };
})();
