/* 企业管理：列表 + 企业编辑抽屉 */
(function () {
  var U = window.PU;
  var ICON = U.ICON;

  var ADDR_OPTIONS = ['重庆市/重庆市/巫山县', '江苏省/常州市/新北区', '山西省/运城市/闻喜县',
    '山东省/聊城市/高唐县', '河北省/邢台市/任丘市', '河南省/安阳市/林州市', '江西省/抚州市/东乡区',
    '天津市/滨海新区/宝坻', '四川省/泸州市/泸县', '河北省/廊坊市/香河县'];

  var page = {
    title: '企业管理',

    query: function (state) {
      var f = state.applied;
      return (window.ENTERPRISE_DATA || []).filter(function (r) {
        if (f.name && r.name.indexOf(f.name) === -1) return false;
        if (f.source && r.source !== f.source) return false;
        if (f.addr && r.addr.indexOf(f.addr) === -1) return false;
        if (f.volt && r.volt !== f.volt) return false;
        if (f.useType && r.useType !== f.useType) return false;
        if (f.feeType && r.feeType !== f.feeType) return false;
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
      if (f.source === undefined) f.source = '';

      var html = '';
      html += '<div class="filter-bar">' +
        '<div class="field"><span class="field-label">企业名称：</span>' +
        '<input class="input input-sm" id="fName" placeholder="请输入" value="' + U.esc(f.name) + '" /></div>' +
        '<div class="field"><span class="field-label">企业来源：</span>' +
        U.selectBox({ id: 'fSource', placeholder: '请选择', options: window.OPTIONS.source, value: f.source }) + '</div>' +
        '<div class="field"><span class="field-label">企业地址：</span>' +
        U.selectBox({ id: 'fAddr', placeholder: '请选择', options: ADDR_OPTIONS, value: f.addr }) + '</div>' +
        '<div class="field"><span class="field-label">电压等级：</span>' +
        U.selectBox({ id: 'fVolt', placeholder: '请选择', options: window.OPTIONS.volt, value: f.volt }) + '</div>' +
        '<div class="field"><span class="field-label">用电类别：</span>' +
        U.selectBox({ id: 'fUseType', placeholder: '请选择', options: window.OPTIONS.useType, value: f.useType }) + '</div>' +
        '<div class="field"><span class="field-label">计费类型：</span>' +
        U.selectBox({ id: 'fFeeType', placeholder: '请选择', options: window.OPTIONS.feeType, value: f.feeType }) + '</div>' +
        '<div class="filter-actions">' +
        '<button class="btn btn-primary" id="btnSearch">' + ICON.search + '搜索</button>' +
        '<button class="btn btn-ghost" id="btnReset">' + ICON.reset + '重置</button>' +
        '</div></div>';

      html += '<div class="table-toolbar">' +
        '<button class="btn btn-primary" id="btnNew">' + ICON.plus + '新建</button>' +
        '<button class="btn" id="btnExport">' + ICON.export + '导出</button>' +
        '</div>';

      html += '<div class="table-wrap"><table class="data tbl-ent"><thead><tr>' +
        '<th style="width:12%">企业名称</th><th style="width:10%">项目</th><th style="width:11%">项目编号</th><th style="width:14%">企业地址</th><th style="width:7%">企业来源</th>' +
        '<th style="width:7%">建议配储台数</th><th style="width:8%">回本年限(年)</th><th style="width:9%">10年净利润(万元)</th>' +
        '<th style="width:9%">变压器容量(kVA)</th><th style="width:7%">电压等级</th><th style="width:6%">用电类别</th>' +
        '<th style="width:7%">计费类型</th><th style="width:11%">最近测算时间</th><th style="width:11%">创建时间</th>' +
        '<th style="width:6%">创建人</th><th style="width:16%">操作</th></tr></thead><tbody>';

      if (!slice.length) html += U.emptyRow(16, '暂无符合条件的企业');
      else slice.forEach(function (r) {
        var running = r.calcState === 'running';
        html += '<tr data-id="' + r.id + '">' +
          '<td class="col-name" title="' + U.esc(r.name) + '">' + U.esc(r.name) + '</td>' +
          '<td class="col-proj" title="' + U.esc(r.project || '') + '">' + U.esc(r.project || '--') + '</td>' +
          '<td class="col-code" title="' + U.esc(r.code || '') + '">' + U.esc(r.code || '--') + '</td>' +
          '<td title="' + U.esc(r.addr) + '">' + U.esc(r.addr) + '</td>' +
          '<td><span class="tag">' + U.esc(r.source) + '</span></td>' +
          '<td>' + U.esc(r.scale) + '</td>' +
          '<td>' + U.esc(r.payback) + '</td>' +
          '<td>' + U.esc(r.profit10) + '</td>' +
          '<td>' + r.transCap + '</td>' +
          '<td>' + U.esc(r.volt) + '</td>' +
          '<td>' + U.esc(r.useType) + '</td>' +
          '<td>' + U.esc(r.feeType) + '</td>' +
          '<td class="col-time">' + (running ? '<span class="txt-running">测算中</span>' : U.esc(r.lastCalc)) + '</td>' +
          '<td class="col-time">' + U.esc(r.create) + '</td>' +
          '<td>' + U.esc(r.owner) + '</td>' +
          '<td><span class="ops ops-wrap">' +
          (running
            ? '<span class="link is-disabled">最新测算记录</span><span class="link is-disabled">导出</span>'
            : '<a class="link" data-act="record" data-id="' + r.id + '">最新测算记录</a><a class="link" data-act="export" data-id="' + r.id + '">导出</a>') +
          '<a class="link" data-act="calc" data-id="' + r.id + '">开始测算</a>' +
          '<a class="link" data-act="edit" data-id="' + r.id + '">查看/编辑企业</a>' +
          '<a class="link-danger" data-act="del" data-id="' + r.id + '">删除企业</a>' +
          '</span></td></tr>';
      });
      html += '</tbody></table></div>';
      html += U.pagerBar(page, totalPages, rows.length, size);
      return html;
    },

    mount: function (root, state) {
      var self = this;

      function readFilters() {
        return {
          name: root.querySelector('#fName').value.trim(),
          source: root.querySelector('#fSource').value,
          addr: root.querySelector('#fAddr').value,
          volt: root.querySelector('#fVolt').value,
          useType: root.querySelector('#fUseType').value,
          feeType: root.querySelector('#fFeeType').value
        };
      }

      root.querySelector('#btnSearch').addEventListener('click', function () {
        state.draft = readFilters();
        state.applied = JSON.parse(JSON.stringify(state.draft));
        state.page = 1;
        window.App.rerenderPage();
      });
      root.querySelector('#btnReset').addEventListener('click', function () {
        state.draft = { name: '', source: '', addr: '', volt: '', useType: '', feeType: '' };
        state.applied = { name: '', source: '', addr: '', volt: '', useType: '', feeType: '' };
        state.page = 1;
        window.App.rerenderPage();
      });
      root.querySelectorAll('#fName, #fSource, #fAddr, #fVolt, #fUseType, #fFeeType').forEach(function (el) {
        el.addEventListener('keydown', function (e) { if (e.key === 'Enter') root.querySelector('#btnSearch').click(); });
      });

      root.querySelector('#btnNew').addEventListener('click', function () {
        openEditDrawer(null, function () { window.App.rerenderPage(); });
      });

      root.querySelector('#btnExport').addEventListener('click', function () {
        var rows = [['企业名称', '项目', '项目编号', '企业地址', '企业来源', '建议配储台数', '回本年限(年)', '10年净利润(万元)',
          '变压器容量(kVA)', '电压等级', '用电类别', '计费类型', '最近测算时间', '创建时间', '创建人']];
        self.query(state).forEach(function (r) {
          rows.push([r.name, r.project, r.code, r.addr, r.source, r.scale, r.payback, r.profit10, r.transCap, r.volt, r.useType, r.feeType, r.lastCalc, r.create, r.owner]);
        });
        U.exportXlsx('企业管理', rows, '企业管理.xlsx');
        window.App.toast('导出成功');
      });

      root.querySelectorAll('[data-act]').forEach(function (el) {
        el.addEventListener('click', function () {
          var id = Number(el.dataset.id);
          var row = window.ENTERPRISE_DATA.filter(function (r) { return r.id === id; })[0];
          if (!row) return;
          var act = el.dataset.act;

          if (act === 'record') { window.App.open('calc-report'); return; }
          if (act === 'calc') {
            window.App.open('storage-calc-page');
            window.App.toast('已带出「' + row.name + '」的企业信息');
            return;
          }
          if (act === 'export') {
            U.exportXlsx(row.name, [['字段', '值'], ['企业名称', row.name], ['企业地址', row.addr],
              ['变压器容量(kVA)', row.transCap], ['电压等级', row.volt], ['用电类别', row.useType],
              ['计费类型', row.feeType], ['回本年限(年)', row.payback], ['10年净利润(万元)', row.profit10]], row.name + '.xlsx');
            window.App.toast('导出成功');
            return;
          }
          if (act === 'edit') {
            openEditDrawer(row, function () { window.App.rerenderPage(); });
            return;
          }
          if (act === 'del') {
            window.App.confirm({
              title: '删除确认',
              content: '确定删除企业 <b>' + U.esc(row.name) + '</b> 吗？删除后不可恢复。',
              onOk: function () {
                window.ENTERPRISE_DATA = window.ENTERPRISE_DATA.filter(function (r) { return r.id !== id; });
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

  /* ---------- 企业编辑抽屉 ---------- */
  function openEditDrawer(row, onDone) {
    var isEdit = !!row;
    var d = row || { name: '', project: '', addr: '', volt: '', useType: '', feeType: '按容量计费', transCap: '', loadRate: '', isPublic: '否' };
    if (!d.isPublic) d.isPublic = '否';

    var body = '<div class="dr-grid">' +
      U.field('企业名称', U.unitInput({ id: 'eName', value: d.name, placeholder: '请输入企业名称' }), { required: true }) +
      U.field('项目信息', U.unitInput({ id: 'eProject', value: d.project || '', placeholder: '请输入项目信息' })) +
      U.field('项目编号', U.unitInput({ id: 'eCode', value: d.code || '', placeholder: '系统自动生成（仅智慧能管来源）', readonly: true }),  ) +
      U.field('企业地址', U.unitInput({ id: 'eAddr', value: d.addr, placeholder: '请选择省/市/区县' }), { required: true }) +
      U.field('电压等级', U.selectBox({ id: 'eVolt', placeholder: '请选择电压等级', options: window.OPTIONS.volt, value: d.volt }), { required: true }) +
      U.field('用电类别', U.selectBox({ id: 'eUseType', placeholder: '请选择用电类别', options: window.OPTIONS.useType, value: d.useType }), { required: true }) +
      U.field('计费类型', U.selectBox({ id: 'eFeeType', placeholder: '请选择计费类型', options: window.OPTIONS.feeType, value: d.feeType }), { required: true }) +
      U.field('变压器容量', U.unitInput({ id: 'eTrans', value: d.transCap, placeholder: '请输入', unit: 'kVA' }), { required: true }) +
      U.field('最大负载率', U.unitInput({ id: 'eLoadRate', value: d.loadRate || '100', placeholder: '请输入', unit: '%' }), { required: true }) +
      '<div class="f-item"><label class="f-label"><i class="req">*</i>是否公开</label>' +
      '<div class="f-ctrl"><div class="f-inline-plain">' +
      '<label class="radio-item"><input type="radio" name="ePublic" value="是"' + (d.isPublic === '是' ? ' checked' : '') + '/>是</label>' +
      '<label class="radio-item"><input type="radio" name="ePublic" value="否"' + (d.isPublic === '否' ? ' checked' : '') + '/>否</label>' +
      '</div></div></div>' +
      '</div>';

    window.FormDrawer.open({
      title: isEdit ? '企业编辑' : '企业新建',
      width: 620,
      bodyHtml: body,
      onMount: function (el) {
        var radios = el.querySelectorAll('input[name="ePublic"]');
        radios.forEach(function (r) {
          r.addEventListener('change', function () {
            radios.forEach(function (x) { x.checked = (x.value === r.value); });
          });
        });
      },
      onSubmit: function (el) {
        var name = el.querySelector('#eName').value.trim();
        if (!name) { window.App.toast('请填写企业名称'); return; }
        var payload = {
          name: name,
          project: el.querySelector('#eProject').value.trim(),
          addr: el.querySelector('#eAddr').value.trim(),
          volt: el.querySelector('#eVolt').value,
          useType: el.querySelector('#eUseType').value,
          feeType: el.querySelector('#eFeeType').value,
          transCap: Number(el.querySelector('#eTrans').value) || 0,
          loadRate: el.querySelector('#eLoadRate').value
        };
        if (isEdit) {
          Object.keys(payload).forEach(function (k) { row[k] = payload[k]; });
        } else {
          var id = Math.max.apply(null, window.ENTERPRISE_DATA.map(function (r) { return r.id; })) + 1;
          var now = nowStr();
          window.ENTERPRISE_DATA.unshift({
            id: id, name: payload.name, project: payload.project, code: '', addr: payload.addr, source: '手动创建', scale: '--', payback: '--', profit10: '--',
            transCap: payload.transCap, volt: payload.volt, useType: payload.useType, feeType: payload.feeType,
            lastCalc: now, create: now, owner: '薛易立', calcState: 'done'
          });
        }
        window.FormDrawer.close();
        window.App.toast(isEdit ? '已保存' : '已创建');
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
  window.PageDefs['enterprise'] = page;
})();
