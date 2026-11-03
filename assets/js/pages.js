/* 页面渲染 —— 目前完成「负荷测算数据」，其余为待补充占位页 */
(function () {
  var ICON = {
    search: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg>',
    reset: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M20 11a8 8 0 1 0-2.5 6.4"/><path d="M20 4v7h-7"/></svg>',
    plus: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    cal: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    clean: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5l1.7 4.3 4.3 1.7-4.3 1.7L12 15.5l-1.7-4.3L6 9.5l4.3-1.7L12 3.5z"/><path d="M18.5 15.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9.9-2.1z"/></svg>',
    close: '<svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>'
  };

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* ---------------- 负荷测算数据 ---------------- */
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
        '<input class="input input-name" id="fName" placeholder="请输入负荷数据名称" value="' + esc(f.name) + '" /></div>' +
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
        html += '<tr><td colspan="5"><div class="empty">暂无符合条件的负荷数据</div></td></tr>';
      } else {
        slice.forEach(function (r) {
          html += '<tr data-id="' + r.id + '">' +
            '<td class="col-name" title="' + esc(r.name) + '">' + esc(r.name) + '</td>' +
            '<td class="col-time">' + r.create + '</td>' +
            '<td class="col-time">' + r.update + '</td>' +
            '<td>' + esc(r.owner) + '</td>' +
            '<td><span class="ops">' +
            '<a class="link" data-act="edit" data-id="' + r.id + '">编辑</a>' +
            '<a class="link-danger" data-act="del" data-id="' + r.id + '">删除</a>' +
            '</span></td>' +
            '</tr>';
        });
      }
      html += '</tbody></table></div>';

      html += '<div class="pager">' +
        '<span class="pager-total">共 <b>' + rows.length + '</b> 条记录　第 ' + page + '/' + totalPages + '页</span>' +
        '<div class="pager-right">' + this.pagerHtml(page, totalPages) +
        '<select class="pg-size" id="pgSize">' +
        [10, 20, 50].map(function (n) {
          return '<option value="' + n + '"' + (n === size ? ' selected' : '') + '>' + n + ' 条/页</option>';
        }).join('') +
        '</select>' +
        '<span class="pg-jump">跳至<input id="pgJump" value="' + page + '" />页</span>' +
        '</div></div>';

      return html;
    },

    pagerHtml: function (page, total) {
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
    },

    mount: function (root, state) {
      var self = this;

      // 日期区间
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
        state.picker.renderLabel();
      } else {
        state.picker.renderLabel();
      }

      // 搜索 / 重置
      root.querySelector('#btnSearch').addEventListener('click', function () {
        var nameEl = root.querySelector('#fName');
        state.draft.name = nameEl.value.trim();
        state.applied = {
          name: state.draft.name,
          start: state.draft.start,
          end: state.draft.end
        };
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

      // 新建
      root.querySelector('#btnNew').addEventListener('click', function () {
        window.App.toast('新建负荷数据页待补充截图后实现');
      });

      // 负荷数据清洗
      root.querySelector('#btnClean').addEventListener('click', function () {
        window.CleanDrawer.open();
      });

      // 行操作
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
              content: '确定删除负荷数据 <b>' + esc(row.name) + '</b> 吗？删除后不可恢复。',
              onOk: function () {
                window.LOAD_DATA = window.LOAD_DATA.filter(function (r) { return r.id !== id; });
                window.App.toast('已删除');
                window.App.rerenderPage();
              }
            });
          }
        });
      });

      // 分页
      root.querySelectorAll('[data-pg]').forEach(function (el) {
        el.addEventListener('click', function () {
          var v = el.dataset.pg;
          if (v === 'prev') state.page = Math.max(1, state.page - 1);
          else if (v === 'next') state.page = state.page + 1;
          else state.page = Number(v);
          window.App.rerenderPage();
        });
      });

      var sizeEl = root.querySelector('#pgSize');
      sizeEl.addEventListener('change', function () {
        state.size = Number(sizeEl.value);
        state.page = 1;
        window.App.rerenderPage();
      });

      var jumpEl = root.querySelector('#pgJump');
      jumpEl.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        var n = parseInt(jumpEl.value, 10);
        if (!n || n < 1) n = 1;
        var max = Math.max(1, Math.ceil(self.query(state).length / state.size));
        if (n > max) n = max;
        state.page = n;
        window.App.rerenderPage();
      });
    },

    unmount: function (state) {
      if (state.picker) { state.picker.close(); state.picker = null; }
    }
  };

  /* ---------------- 占位页 ---------------- */
  function placeholder(label) {
    return {
      title: label,
      render: function () {
        return '<div class="placeholder">' +
          '<div class="ph-title">' + esc(label) + '</div>' +
          '<div class="ph-desc">该页面尚未开始，等截图上传后按设计稿实现</div>' +
          '</div>';
      },
      mount: function () {},
      unmount: function () {}
    };
  }

  window.Pages = {
    'load-data': loadData,
    'storage-calc': placeholder('储能测算'),
    'enterprise': placeholder('企业管理'),
    'pv-data': placeholder('光伏测算数据'),
    'common-param': placeholder('公共参数')
  };
  window.PlaceholderPage = placeholder;
})();
