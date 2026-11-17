/* 电价管理：列表 + 模板配置页 + 时段配置弹窗 */
(function () {
  var U = window.PU;
  var ICON = U.ICON;

  /* ---------- 时段行定义 ---------- */
  var ROWS = [
    { key: 'spike', label: '尖峰', cls: 'r-spike' },
    { key: 'peak', label: '高峰', cls: 'r-peak' },
    { key: 'flat', label: '平段', cls: 'r-flat' },
    { key: 'valley', label: '低谷', cls: 'r-valley' },
    { key: 'deep', label: '深谷', cls: 'r-deep' },
    { key: 'dis', label: '放电', cls: 'r-dis' },
    { key: 'idle', label: '空闲', cls: 'r-idle' },
    { key: 'chg', label: '充电', cls: 'r-chg' }
  ];

  /* "18:00-20:00、09:00-12:00" → {18:1,...} */
  function parseRanges(str) {
    var set = {};
    if (!str) return set;
    str.split('、').forEach(function (part) {
      var m = part.match(/^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/);
      if (!m) return;
      var s = +m[1] + (+m[2]) / 60;
      var e = +m[3] + (+m[4]) / 60;
      for (var h = Math.floor(s); h < Math.ceil(e); h++) {
        if (h >= 0 && h < 24) set[h] = 1;
      }
    });
    return set;
  }

  /* {18:1,19:1} → "18:00-20:00" */
  function toRanges(set) {
    var hours = Object.keys(set).filter(function (h) { return set[h]; }).map(Number).sort(function (a, b) { return a - b; });
    if (!hours.length) return '';
    var out = [];
    var start = hours[0], prev = hours[0];
    for (var i = 1; i <= hours.length; i++) {
      var h = hours[i];
      if (h === prev + 1) { prev = h; continue; }
      out.push(pad(start) + ':00-' + pad(prev + 1) + ':00');
      start = h; prev = h;
    }
    return out.join('、');
  }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  /* ---------- 时段配置弹窗 ---------- */
  var SlotEditor = (function () {
    var st = null;

    function open(opts) {
      st = { data: JSON.parse(JSON.stringify(opts.data)), monthIndex: opts.monthIndex, onSave: opts.onSave };
      ROWS.forEach(function (r) { st[r.key + 'Set'] = parseRanges(st.data[r.key]); });

      var mask = document.createElement('div');
      mask.className = 'drawer-mask';
      mask.id = 'slotMask';

      var drawer = document.createElement('aside');
      drawer.className = 'drawer drawer-lg';
      drawer.id = 'slotDrawer';
      drawer.innerHTML =
        '<div class="drawer-head"><div class="drawer-title">' + st.data.m + ' 时段配置</div>' +
        '<span class="drawer-close" id="slotClose">' + ICON.close + '</span></div>' +
        '<div class="drawer-body" id="slotBody"></div>' +
        '<div class="drawer-foot">' +
        '<button class="btn" id="slotCancel">取消</button>' +
        '<button class="btn btn-primary" id="slotSave">保存</button>' +
        '</div>';

      document.body.appendChild(mask);
      document.body.appendChild(drawer);
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(function () {
        mask.classList.add('is-open');
        drawer.classList.add('is-open');
      });

      mask.addEventListener('click', close);
      drawer.querySelector('#slotClose').addEventListener('click', close);
      drawer.querySelector('#slotCancel').addEventListener('click', close);
      drawer.querySelector('#slotSave').addEventListener('click', save);

      render();
    }

    function render() {
      var body = document.getElementById('slotBody');
      if (!body) return;
      var html = '';
      html += '<div class="slot-toolbar">' +
        '<span class="slot-month">当前月份：<b>' + st.data.m + '</b></span>' +
        '<span class="slot-hours">理想充电时长' +
        U.unitInput({ id: 'slotHours', value: st.data.hours, unit: 'h', inputCls: 'i-short' }) +
        '</span></div>';

      html += '<div class="hour-grid">';
      html += '<div class="hg-corner"></div>';
      html += '<div class="hg-scale" style="grid-column: span 12">00:00 - 12:00</div>';
      html += '<div class="hg-scale" style="grid-column: span 12">12:00 - 24:00</div>';
      html += '<div class="hg-corner"></div>';
      for (var h = 0; h < 24; h++) html += '<div class="hg-hour">' + h + '</div>';

      ROWS.forEach(function (r) {
        html += '<div class="hg-label ' + r.cls + '" data-hrow="' + r.key + '">' + r.label + '</div>';
        for (var i = 0; i < 24; i++) {
          var on = st[r.key + 'Set'][i];
          html += '<div class="hg-cell' + (on ? ' is-on ' + r.cls : '') + '" data-r="' + r.key + '" data-h="' + i + '"></div>';
        }
      });
      html += '</div>';

      html += '<div class="slot-selected"><div class="ss-head">已选择时间段</div>';
      ROWS.forEach(function (r) {
        var txt = toRanges(st[r.key + 'Set']);
        if (!txt) return;
        html += '<div class="ss-row"><i class="ss-dot ' + r.cls + '"></i><span class="ss-name">' + r.label + '：</span><span class="ss-val">' + txt + '</span></div>';
      });
      html += '</div>';
      body.innerHTML = html;

      body.querySelectorAll('.hg-cell').forEach(function (el) {
        el.addEventListener('click', function () {
          var r = el.dataset.r, h = Number(el.dataset.h);
          if (st[r + 'Set'][h]) delete st[r + 'Set'][h];
          else st[r + 'Set'][h] = 1;
          render();
        });
      });
    }

    function save() {
      var hoursEl = document.getElementById('slotHours');
      st.data.hours = hoursEl ? hoursEl.value : st.data.hours;
      ROWS.forEach(function (r) { st.data[r.key] = toRanges(st[r.key + 'Set']); });
      var cb = st.onSave, row = st.data;
      close();
      if (cb) cb(row);
      window.App.toast('时段配置已保存');
    }

    function close() {
      var mask = document.getElementById('slotMask');
      var drawer = document.getElementById('slotDrawer');
      if (!drawer) return;
      mask.classList.remove('is-open');
      drawer.classList.remove('is-open');
      document.body.style.overflow = '';
      setTimeout(function () {
        if (mask && mask.parentElement) mask.remove();
        if (drawer && drawer.parentElement) drawer.remove();
      }, 220);
    }

    return { open: open };
  })();

  window.SlotEditor = SlotEditor;

  /* ---------- 电价管理列表 ---------- */
  var priceManage = {
    title: '电价管理',

    query: function (state) {
      var f = state.applied;
      return (window.PRICE_DATA || []).filter(function (r) {
        if (f.name && r.name.indexOf(f.name) === -1) return false;
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
        '<div class="field"><span class="field-label">电价模板名称：</span>' +
        '<input class="input input-name" id="fName" placeholder="请输入电价模板名称" value="' + U.esc(f.name) + '" /></div>' +
        '<div class="filter-actions">' +
        '<button class="btn btn-primary" id="btnSearch">' + ICON.search + '搜索</button>' +
        '<button class="btn btn-ghost" id="btnReset">' + ICON.reset + '重置</button>' +
        '</div></div>';

      html += '<div class="table-toolbar">' +
        '<button class="btn btn-primary" id="btnNew">' + ICON.plus + '新建</button>' +
        '</div>';

      html += '<div class="table-wrap"><table class="data">' +
        '<colgroup><col style="width:52%"><col style="width:26%"><col style="width:12%"><col style="width:10%"></colgroup>' +
        '<thead><tr><th>电价模板名称</th><th>备注</th><th>创建人</th><th>操作</th></tr></thead><tbody>';
      if (!slice.length) html += U.emptyRow(4, '暂无符合条件的电价模板');
      else slice.forEach(function (r) {
        html += '<tr data-id="' + r.id + '">' +
          '<td class="col-name">' + U.esc(r.name) + '</td>' +
          '<td class="col-remark">' + U.esc(r.remark) + '</td>' +
          '<td>' + U.esc(r.owner) + '</td>' +
          '<td><span class="ops">' +
          '<a class="link" data-act="view" data-id="' + r.id + '">查看</a>' +
          '<a class="link" data-act="edit" data-id="' + r.id + '">编辑</a>' +
          '<a class="link-danger" data-act="del" data-id="' + r.id + '">删除</a>' +
          '</span></td></tr>';
      });
      html += '</tbody></table></div>';
      html += U.pagerBar(page, totalPages, rows.length, size);
      return html;
    },

    mount: function (root, state) {
      var self = this;
      root.querySelector('#btnSearch').addEventListener('click', function () {
        state.draft.name = root.querySelector('#fName').value.trim();
        state.applied = { name: state.draft.name };
        state.page = 1;
        window.App.rerenderPage();
      });
      root.querySelector('#btnReset').addEventListener('click', function () {
        state.draft = { name: '' };
        state.applied = { name: '' };
        state.page = 1;
        window.App.rerenderPage();
      });
      root.querySelector('#fName').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') root.querySelector('#btnSearch').click();
      });
      root.querySelector('#btnNew').addEventListener('click', function () {
        window.App.open('price-edit');
      });
      root.querySelectorAll('[data-act]').forEach(function (el) {
        el.addEventListener('click', function () {
          var id = Number(el.dataset.id);
          var row = window.PRICE_DATA.filter(function (r) { return r.id === id; })[0];
          if (!row) return;
          if (el.dataset.act === 'edit' || el.dataset.act === 'view') {
            window.App.open('price-edit');
            window.App.toast('已载入「' + row.name + '」');
          } else {
            window.App.confirm({
              title: '删除确认', content: '确定删除电价模板 <b>' + U.esc(row.name) + '</b> 吗？',
              onOk: function () {
                window.PRICE_DATA = window.PRICE_DATA.filter(function (r) { return r.id !== id; });
                window.App.toast('已删除');
                window.App.rerenderPage();
              }
            });
          }
        });
      });
      U.bindPager(root, state, function () { window.App.rerenderPage(); }, self.query(state).length);
    }
  };

  /* ---------- 电价模板配置页 ---------- */
  var priceEdit = {
    title: '电价模板配置',

    render: function (state) {
      var tpl = state.tpl || (state.tpl = JSON.parse(JSON.stringify(window.PRICE_TPL)));
      var html = '<div class="pe-wrap">';

      html += '<div class="pe-back"><a class="pe-back-btn" id="btnBack">' + ICON.back + '返回</a></div>';

      html += '<section class="form-sec">';
      html += '<div class="f-grid">' +
        U.field('电价模板名称', U.unitInput({ id: 'peName', value: tpl.name }), { required: true }) +
        '</div>';
      html += '<div class="f-grid f-grid-1">' +
        U.field('备注描述', '<textarea class="input textarea" id="peRemark" rows="2" placeholder="请输入备注描述">' + U.esc(tpl.remark) + '</textarea>') +
        '</div>';
      html += '<div class="f-inline">' +
        '<label class="f-label"><i class="req">*</i>是否公开</label>' +
        '<label class="radio-item"><input type="radio" name="pePublic" value="是"' + (tpl.isPublic === '是' ? ' checked' : '') + ' />是</label>' +
        '<label class="radio-item"><input type="radio" name="pePublic" value="否"' + (tpl.isPublic === '否' ? ' checked' : '') + ' />否</label>' +
        '</div>';
      html += '</section>';

      /* 电价配置 */
      html += '<section class="form-sec">';
      html += '<div class="f-sub-head f-sub-head-lg"><i class="req">*</i>电价配置</div>';
      html += '<div class="tbl-scroll"><table class="tariff-table"><thead><tr>' +
        '<th class="tt-label">时段分类</th><th>尖峰时段</th><th>高峰时段</th><th>平段</th><th>低谷时段</th><th>深谷时段</th>' +
        '</tr></thead><tbody><tr><td class="tt-label">度电电价(元/kWh)</td>';
      tpl.tariffs.forEach(function (v, i) {
        html += '<td><input class="input tt-input" id="peTariff' + i + '" value="' + U.esc(v) + '" /></td>';
      });
      html += '</tr></tbody></table></div>';
      html += '</section>';

      /* 用电时段配置 */
      html += '<section class="form-sec">';
      html += '<div class="f-sub-head f-sub-head-lg"><i class="req">*</i>用电时段配置</div>';
      html += '<div class="tbl-scroll"><table class="slot-table"><thead><tr>' +
        '<th class="st-month">月份</th><th>尖峰时段</th><th>高峰时段</th><th class="st-flat">平段</th>' +
        '<th>低谷时段</th><th>深谷时段</th><th class="st-idle">空闲</th><th>充电</th><th>放电</th>' +
        '<th class="st-hours">理想充电时长(h)</th><th class="st-ops">操作</th></tr></thead><tbody>';
      tpl.months.forEach(function (r, i) {
        html += '<tr data-mi="' + i + '">' +
          '<td class="st-month">' + r.m + '</td>' +
          '<td>' + U.esc(r.spike) + '</td><td>' + U.esc(r.peak) + '</td>' +
          '<td class="st-flat">' + U.esc(r.flat) + '</td>' +
          '<td>' + U.esc(r.valley) + '</td><td>' + U.esc(r.deep) + '</td>' +
          '<td class="st-idle">' + U.esc(r.idle) + '</td>' +
          '<td>' + U.esc(r.chg) + '</td><td>' + U.esc(r.dis) + '</td>' +
          '<td class="st-hours">' + U.esc(r.hours) + '</td>' +
          '<td class="st-ops"><a class="link" data-slot="' + i + '">编辑</a><a class="link" data-slotcopy="' + i + '">复制</a></td>' +
          '</tr>';
      });
      html += '</tbody></table></div>';
      html += '</section>';

      html += '<div class="calc-actions">' +
        '<button class="btn" id="peCancel">取消</button>' +
        '<button class="btn btn-primary" id="peSave">保存</button>' +
        '</div>';
      html += '</div>';
      return html;
    },

    mount: function (root, state) {
      var self = this;
      root.querySelector('#btnBack').addEventListener('click', function () {
        window.App.open('price-manage');
      });
      root.querySelector('#peCancel').addEventListener('click', function () {
        window.App.open('price-manage');
      });
      root.querySelector('#peSave').addEventListener('click', function () {
        state.tpl.name = root.querySelector('#peName').value;
        state.tpl.remark = root.querySelector('#peRemark').value;
        var pub = root.querySelector('input[name="pePublic"]:checked');
        state.tpl.isPublic = pub ? pub.value : '否';
        window.App.toast('电价模板已保存');
      });
      root.querySelectorAll('[data-slot]').forEach(function (el) {
        el.addEventListener('click', function () {
          var i = Number(el.dataset.slot);
          SlotEditor.open({
            monthIndex: i,
            data: state.tpl.months[i],
            onSave: function (row) {
              state.tpl.months[i] = row;
              window.App.rerenderPage();
            }
          });
        });
      });
      root.querySelectorAll('[data-slotcopy]').forEach(function (el) {
        el.addEventListener('click', function () {
          window.App.toast('已复制该月配置至下月');
        });
      });
    }
  };

  window.PageDefs = window.PageDefs || {};
  window.PageDefs['price-manage'] = priceManage;
  window.PageDefs['price-edit'] = priceEdit;
})();
