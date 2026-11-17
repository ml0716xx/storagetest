/* 光伏测算数据：列表 + 光伏数据编辑抽屉 */
(function () {
  var U = window.PU;
  var ICON = U.ICON;

  var page = {
    title: '光伏测算数据',

    query: function (state) {
      var f = state.applied;
      return (window.PV_DATA || []).filter(function (r) {
        if (f.name && r.name.indexOf(f.name) === -1) return false;
        var day = r.create.slice(0, 10);
        if (f.start && day < f.start) return false;
        if (f.end && day > f.end) return false;
        return true;
      });
    },

    render: function (state) {
      var rows = this.query(state);
      var size = state.size || 10;
      var totalPages = Math.max(1, Math.ceil(rows.length / size));
      if (state.page > totalPages) state.page = totalPages;
      var page = state.page;
      var slice = rows.slice((page - 1) * size, page * size);
      var f = state.draft;

      var html = '';
      html += '<div class="filter-bar">' +
        '<div class="field"><span class="field-label">光伏数据名称：</span>' +
        '<input class="input input-name" id="fName" placeholder="请输入光伏数据名称" value="' + U.esc(f.name) + '" /></div>' +
        '<div class="field"><span class="field-label">创建时间：</span>' +
        '<div class="range" id="fRange"><span class="range-text"></span>' +
        '<span class="range-clear">' + ICON.close + '</span>' +
        '<span class="range-icon">' + ICON.cal + '</span></div></div>' +
        '<div class="filter-actions">' +
        '<button class="btn btn-primary" id="btnSearch">' + ICON.search + '搜索</button>' +
        '<button class="btn btn-ghost" id="btnReset">' + ICON.reset + '重置</button>' +
        '</div></div>';

      html += '<div class="table-toolbar">' +
        '<button class="btn btn-primary" id="btnNew">' + ICON.plus + '新建</button></div>';

      html += '<div class="table-wrap"><table class="data">' +
        '<colgroup><col style="width:40%"><col style="width:20%"><col style="width:20%"><col style="width:10%"><col style="width:10%"></colgroup>' +
        '<thead><tr><th>光伏数据名称</th><th>创建时间</th><th>更新时间</th><th>创建人</th><th>操作</th></tr></thead><tbody>';
      if (!slice.length) html += U.emptyRow(5, '暂无符合条件的光伏数据');
      else slice.forEach(function (r) {
        html += '<tr data-id="' + r.id + '">' +
          '<td class="col-name" title="' + U.esc(r.name) + '">' + U.esc(r.name) + '</td>' +
          '<td class="col-time">' + r.create + '</td>' +
          '<td class="col-time">' + r.update + '</td>' +
          '<td>' + U.esc(r.owner) + '</td>' +
          '<td><span class="ops"><a class="link" data-act="edit" data-id="' + r.id + '">编辑</a>' +
          '<a class="link-danger" data-act="del" data-id="' + r.id + '">删除</a></span></td></tr>';
      });
      html += '</tbody></table></div>';
      html += U.pagerBar(page, totalPages, rows.length, size);
      return html;
    },

    mount: function (root, state) {
      var self = this;

      var rangeEl = root.querySelector('#fRange');
      state.picker = new window.DateRangePicker(rangeEl, {
        onChange: function (s, e) { state.draft.start = s; state.draft.end = e; }
      });
      if (state.draft.start && state.draft.end) {
        state.picker.start = new Date(state.draft.start + 'T00:00:00');
        state.picker.end = new Date(state.draft.end + 'T00:00:00');
      }
      state.picker.renderLabel();

      root.querySelector('#btnSearch').addEventListener('click', function () {
        state.draft.name = root.querySelector('#fName').value.trim();
        state.applied = { name: state.draft.name, start: state.draft.start, end: state.draft.end };
        state.page = 1;
        window.App.rerenderPage();
      });
      root.querySelector('#btnReset').addEventListener('click', function () {
        state.draft = { name: '', start: '', end: '' };
        state.applied = { name: '', start: '', end: '' };
        state.page = 1;
        window.App.rerenderPage();
      });
      root.querySelector('#fName').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') root.querySelector('#btnSearch').click();
      });
      root.querySelector('#btnNew').addEventListener('click', function () {
        openPvDrawer(null, function () { window.App.rerenderPage(); });
      });
      root.querySelectorAll('[data-act]').forEach(function (el) {
        el.addEventListener('click', function () {
          var id = Number(el.dataset.id);
          var row = window.PV_DATA.filter(function (r) { return r.id === id; })[0];
          if (!row) return;
          if (el.dataset.act === 'edit') {
            openPvDrawer(row, function () { window.App.rerenderPage(); });
          } else {
            window.App.confirm({
              title: '删除确认', content: '确定删除光伏数据 <b>' + U.esc(row.name) + '</b> 吗？',
              onOk: function () {
                window.PV_DATA = window.PV_DATA.filter(function (r) { return r.id !== id; });
                window.App.toast('已删除');
                window.App.rerenderPage();
              }
            });
          }
        });
      });
      U.bindPager(root, state, function () { window.App.rerenderPage(); }, self.query(state).length);
    },

    unmount: function (state) {
      if (state.picker) { state.picker.close(); state.picker = null; }
    }
  };

  /* ---------- 光伏数据编辑抽屉 ---------- */
  function openPvDrawer(row, onDone) {
    var isEdit = !!row;
    var d = row || { name: '' };
    var months = isEdit ? window.PV_MONTH_SAMPLE.slice() : ['0','0','0','0','0','0','0','0','0','0','0','0'];

    function monthTable(from, to, values) {
      var html = '<table class="month-table mt-compact"><thead><tr><th class="mt-corner">月份</th>';
      for (var m = from; m <= to; m++) html += '<th>' + m + '月</th>';
      html += '</tr></thead><tbody><tr><td class="mt-label">光伏数据(kWh)</td>';
      for (var i = from - 1; i < to; i++) {
        html += '<td><input class="input mt-input" value="' + U.esc(values[i]) + '" data-mi="' + i + '" /></td>';
      }
      html += '</tr></tbody></table>';
      return html;
    }

    var body = '';
    body += '<div class="dr-sec">处理数据源</div>';
    body += '<div class="dr-row">' +
      U.field('光伏数据名称', U.unitInput({ id: 'pvName', value: d.name, placeholder: '请输入光伏数据名称', cls: 'w-320' }), { required: true }) +
      '</div>';
    body += '<div class="dr-row dr-upload">' +
      '<span class="dr-upload-label">光伏数据：</span>' +
      '<button class="btn btn-sm" id="pvUpload">上传</button>' +
      '<a class="link dr-link" id="pvTpl">下载模板</a>' +
      '<span class="dr-spacer"></span>' +
      '<button class="btn btn-primary" id="pvSaveTop">保存</button>' +
      '</div>';

    body += '<div class="dr-sec">处理结果预览</div>';
    body += '<div class="dr-hint" id="pvResultHint">当前版本数据共计处理 8760 条，其中 0 条为空</div>';
    body += '<div class="dr-row"><a class="link dr-link" id="pvDownload">下载处理结果</a></div>';

    body += '<div class="dr-sec">月份汇总</div>';
    body += monthTable(1, 6, months);
    body += '<div style="height:8px"></div>';
    body += monthTable(7, 12, months);

    window.FormDrawer.open({
      title: '光伏数据编辑',
      width: 720,
      bodyHtml: body,
      onMount: function (el) {
        el.querySelector('#pvTpl').addEventListener('click', function () {
          var rows = [['月份', '光伏数据(kWh)']];
          for (var m = 1; m <= 12; m++) rows.push([m + '月', '']);
          U.exportXlsx('光伏数据模板', rows, '光伏数据模板.xlsx');
          window.App.toast('模板已下载');
        });
        el.querySelector('#pvDownload').addEventListener('click', function () {
          var rows = [['月份', '光伏数据(kWh)']];
          el.querySelectorAll('.mt-input').forEach(function (inp, i) {
            rows.push([(i + 1) + '月', inp.value]);
          });
          U.exportXlsx('光伏数据处理结果', rows, '光伏数据处理结果.xlsx');
          window.App.toast('处理结果已下载');
        });
        el.querySelector('#pvUpload').addEventListener('click', function () {
          var input = document.createElement('input');
          input.type = 'file';
          input.accept = '.xlsx,.xls,.csv';
          input.onchange = function () {
            var f = input.files && input.files[0];
            if (!f) return;
            el.querySelector('#pvResultHint').textContent = '当前版本数据共计处理 8760 条，其中 0 条为空';
            var inputs = el.querySelectorAll('.mt-input');
            window.PV_MONTH_SAMPLE.forEach(function (v, i) {
              if (inputs[i]) inputs[i].value = v;
            });
            window.App.toast('已解析「' + f.name + '」，共 8760 条');
          };
          input.click();
        });
        el.querySelector('#pvSaveTop').addEventListener('click', function () {
          el.querySelector('#formDrawerOk').click();
        });
      },
      onSubmit: function (el) {
        var name = el.querySelector('#pvName').value.trim();
        if (!name) { window.App.toast('请填写光伏数据名称'); return; }
        var vals = [];
        el.querySelectorAll('.mt-input').forEach(function (inp) { vals.push(inp.value); });
        window.PV_MONTH_SAMPLE = vals;
        if (isEdit) {
          row.name = name;
          row.update = nowStr();
        } else {
          var id = Math.max.apply(null, window.PV_DATA.map(function (r) { return r.id; })) + 1;
          var now = nowStr();
          window.PV_DATA.unshift({ id: id, name: name, create: now, update: now, owner: '薛易立' });
        }
        window.FormDrawer.close();
        window.App.toast('已保存');
        if (onDone) onDone();
      }
    });
  }

  function nowStr() {
    var d = new Date();
    function p(n) { return n < 10 ? '0' + n : '' + n; }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' +
      p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  }

  window.PageDefs = window.PageDefs || {};
  window.PageDefs['pv-data'] = page;
})();
