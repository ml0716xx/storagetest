/* 负荷测算数据 */
(function () {
  var U = window.PU;
  var ICON = U.ICON;

  var loadData = {
    title: '负荷测算数据',

    query: function (state) {
      var f = state.applied;
      return (window.LOAD_DATA || []).filter(function (r) {
        if (f.name && r.name.indexOf(f.name) === -1) return false;
        var day = r.create.slice(0, 10);
        if (f.start && day < f.start) return false;
        if (f.end && day > f.end) return false;
        return true;
      });
    },

    render: function (state) {
      var rows = this.query(state);
      var size = state.size;
      var totalPages = Math.max(1, Math.ceil(rows.length / size));
      if (state.page > totalPages) state.page = totalPages;
      var page = state.page;
      var slice = rows.slice((page - 1) * size, page * size);
      var f = state.draft;

      var html = '';
      html += '<div class="filter-bar">' +
        '<div class="field"><span class="field-label">负荷数据名称：</span>' +
        '<input class="input input-name" id="fName" placeholder="请输入负荷数据名称" value="' + U.esc(f.name) + '" /></div>' +
        '<div class="field"><span class="field-label">创建时间：</span>' +
        '<div class="range" id="fRange">' +
        '<span class="range-text"></span>' +
        '<span class="range-clear">' + ICON.close + '</span>' +
        '<span class="range-icon">' + ICON.cal + '</span>' +
        '</div></div>' +
        '<div class="filter-actions">' +
        '<button class="btn btn-primary" id="btnSearch">' + ICON.search + '搜索</button>' +
        '<button class="btn btn-ghost" id="btnReset">' + ICON.reset + '重置</button>' +
        '</div>' +
        '</div>';

      html += '<div class="table-toolbar">' +
        '<button class="btn" id="btnClean">' + ICON.clean + '负荷数据清洗</button>' +
        '<button class="btn btn-primary" id="btnNew">' + ICON.plus + '新建</button>' +
        '</div>';

      html += '<div class="table-wrap"><table class="data">' +
        '<colgroup><col style="width:30%"><col style="width:24%"><col style="width:24%"><col style="width:12%"><col style="width:10%"></colgroup>' +
        '<thead><tr>' +
        '<th>负荷数据名称</th><th>创建时间</th><th>更新时间</th><th>创建人</th><th>操作</th>' +
        '</tr></thead><tbody>';

      if (!slice.length) {
        html += U.emptyRow(5, '暂无符合条件的负荷数据');
      } else {
        slice.forEach(function (r) {
          html += '<tr data-id="' + r.id + '">' +
            '<td class="col-name" title="' + U.esc(r.name) + '">' + U.esc(r.name) + '</td>' +
            '<td class="col-time">' + r.create + '</td>' +
            '<td class="col-time">' + r.update + '</td>' +
            '<td>' + U.esc(r.owner) + '</td>' +
            '<td><span class="ops">' +
            '<a class="link" data-act="edit" data-id="' + r.id + '">编辑</a>' +
            '<a class="link-danger" data-act="del" data-id="' + r.id + '">删除</a>' +
            '</span></td>' +
            '</tr>';
        });
      }
      html += '</tbody></table></div>';

      html += U.pagerBar(page, totalPages, rows.length, size);
      return html;
    },

    mount: function (root, state) {
      var self = this;

      var rangeEl = root.querySelector('#fRange');
      state.picker = new window.DateRangePicker(rangeEl, {
        onChange: function (s, e) {
          state.draft.start = s;
          state.draft.end = e;
        }
      });
      if (state.draft.start && state.draft.end) {
        state.picker.start = new Date(state.draft.start + 'T00:00:00');
        state.picker.end = new Date(state.draft.end + 'T00:00:00');
      }
      state.picker.renderLabel();

      root.querySelector('#btnSearch').addEventListener('click', function () {
        var nameEl = root.querySelector('#fName');
        state.draft.name = nameEl.value.trim();
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

      var nameEl = root.querySelector('#fName');
      nameEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') root.querySelector('#btnSearch').click();
      });

      root.querySelector('#btnNew').addEventListener('click', function () {
        window.App.toast('新建负荷数据页待补充截图后实现');
      });

      root.querySelector('#btnClean').addEventListener('click', function () {
        window.CleanDrawer.open();
      });

      root.querySelectorAll('[data-act]').forEach(function (el) {
        el.addEventListener('click', function () {
          var id = Number(el.dataset.id);
          var row = (window.LOAD_DATA || []).filter(function (r) { return r.id === id; })[0];
          if (!row) return;
          if (el.dataset.act === 'edit') {
            window.App.toast('编辑「' + row.name + '」页待补充截图后实现');
          } else {
            window.App.confirm({
              title: '删除确认',
              content: '确定删除负荷数据 <b>' + U.esc(row.name) + '</b> 吗？删除后不可恢复。',
              onOk: function () {
                window.LOAD_DATA = window.LOAD_DATA.filter(function (r) { return r.id !== id; });
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

  window.PageDefs = window.PageDefs || {};
  window.PageDefs['load-data'] = loadData;
})();
