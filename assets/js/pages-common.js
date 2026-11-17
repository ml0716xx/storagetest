/* 成本信息 + 储能模板管理 */
(function () {
  var U = window.PU;
  var ICON = U.ICON;

  /* ================= 成本信息 ================= */
  var costInfo = {
    title: '成本信息',

    query: function (state) {
      var f = state.applied;
      return (window.COST_DATA || []).filter(function (r) {
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
        '<div class="field"><span class="field-label">成本信息名称：</span>' +
        '<input class="input input-name" id="fName" placeholder="请输入" value="' + U.esc(f.name) + '" /></div>' +
        '<div class="filter-actions">' +
        '<button class="btn btn-primary" id="btnSearch">' + ICON.search + '搜索</button>' +
        '<button class="btn btn-ghost" id="btnReset">' + ICON.reset + '重置</button>' +
        '</div></div>';
      html += '<div class="table-toolbar"><button class="btn btn-primary" id="btnNew">' + ICON.plus + '新建</button></div>';

      html += '<div class="table-wrap"><table class="data">' +
        '<colgroup><col style="width:44%"><col style="width:32%"><col style="width:14%"><col style="width:10%"></colgroup>' +
        '<thead><tr><th>成本信息名称</th><th>备注</th><th>创建人</th><th>操作</th></tr></thead><tbody>';
      if (!slice.length) html += U.emptyRow(4, '暂无符合条件的成本信息');
      else slice.forEach(function (r) {
        html += '<tr data-id="' + r.id + '">' +
          '<td class="col-name">' + U.esc(r.name) + '</td>' +
          '<td class="col-remark">' + U.esc(r.remark) + '</td>' +
          '<td>' + U.esc(r.owner) + '</td>' +
          '<td><span class="ops"><a class="link" data-act="view" data-id="' + r.id + '">查看</a>' +
          '<a class="link" data-act="edit" data-id="' + r.id + '">编辑</a>' +
          '<a class="link-danger" data-act="del" data-id="' + r.id + '">删除</a></span></td></tr>';
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
        state.draft = { name: '' }; state.applied = { name: '' }; state.page = 1;
        window.App.rerenderPage();
      });
      root.querySelector('#fName').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') root.querySelector('#btnSearch').click();
      });
      root.querySelector('#btnNew').addEventListener('click', function () {
        openCostDrawer(null, function () { window.App.rerenderPage(); });
      });
      root.querySelectorAll('[data-act]').forEach(function (el) {
        el.addEventListener('click', function () {
          var id = Number(el.dataset.id);
          var row = window.COST_DATA.filter(function (r) { return r.id === id; })[0];
          if (!row) return;
          if (el.dataset.act === 'del') {
            window.App.confirm({
              title: '删除确认', content: '确定删除成本信息 <b>' + U.esc(row.name) + '</b> 吗？',
              onOk: function () {
                window.COST_DATA = window.COST_DATA.filter(function (r) { return r.id !== id; });
                window.App.toast('已删除');
                window.App.rerenderPage();
              }
            });
          } else {
            openCostDrawer(row, function () { window.App.rerenderPage(); });
          }
        });
      });
      U.bindPager(root, state, function () { window.App.rerenderPage(); }, self.query(state).length);
    }
  };

  function openCostDrawer(row, onDone) {
    var isEdit = !!row;
    var d = row || { name: '', epc: '0.85', om: '0', ins: '0', yearly: '0', once: '0', isPublic: '否', remark: '' };

    var body = '<div class="dr-grid dr-grid-2">' +
      U.field('成本信息名称', U.unitInput({ id: 'cName', value: d.name, placeholder: '请输入成本信息名称' }), { required: true }) +
      '<div class="f-item"></div>' +
      U.field('EPC成本', U.unitInput({ id: 'cEpc', value: d.epc, placeholder: '0', unit: '元/Wh' }), { required: true }) +
      U.field('运维费用', U.unitInput({ id: 'cOm', value: d.om, placeholder: '0', unit: '元/Wh/年' }), { required: true }) +
      U.field('保险费用', U.unitInput({ id: 'cIns', value: d.ins, placeholder: '0', unit: '元/台/年' }), { required: true }) +
      U.field('每年补充成本', U.unitInput({ id: 'cYearly', value: d.yearly, placeholder: '0', unit: '元' }), { required: true }) +
      U.field('一次性补充成本', U.unitInput({ id: 'cOnce', value: d.once, placeholder: '0', unit: '元' }), { required: true }) +
      '<div class="f-item"><label class="f-label"><i class="req">*</i>是否公开</label><div class="f-ctrl">' +
      '<div class="f-inline-plain">' +
      '<label class="radio-item"><input type="radio" name="cPublic" value="是"' + (d.isPublic === '是' ? ' checked' : '') + '/>是</label>' +
      '<label class="radio-item"><input type="radio" name="cPublic" value="否"' + (d.isPublic === '否' ? ' checked' : '') + '/>否</label>' +
      '</div></div></div>' +
      '<div class="f-item f-wide"><label class="f-label">备注信息</label><div class="f-ctrl">' +
      '<textarea class="input textarea" id="cRemark" rows="3" placeholder="请输入备注信息">' + U.esc(d.remark) + '</textarea></div></div>' +
      '</div>';

    window.FormDrawer.open({
      title: '成本信息编辑',
      width: 680,
      bodyHtml: body,
      onSubmit: function (el) {
        var name = el.querySelector('#cName').value.trim();
        if (!name) { window.App.toast('请填写成本信息名称'); return; }
        var pub = el.querySelector('input[name="cPublic"]:checked');
        var payload = {
          name: name,
          epc: el.querySelector('#cEpc').value,
          om: el.querySelector('#cOm').value,
          ins: el.querySelector('#cIns').value,
          yearly: el.querySelector('#cYearly').value,
          once: el.querySelector('#cOnce').value,
          isPublic: pub ? pub.value : '否',
          remark: el.querySelector('#cRemark').value
        };
        if (isEdit) Object.keys(payload).forEach(function (k) { row[k] = payload[k]; });
        else {
          var id = Math.max.apply(null, window.COST_DATA.map(function (r) { return r.id; })) + 1;
          payload.id = id;
          payload.owner = '薛易立';
          window.COST_DATA.unshift(payload);
        }
        window.FormDrawer.close();
        window.App.toast('已保存');
        if (onDone) onDone();
      }
    });
  }

  /* ================= 储能模板管理 ================= */
  var storageTpl = {
    title: '储能模板管理',

    query: function (state) {
      var f = state.applied;
      return (window.STORAGE_DATA || []).filter(function (r) {
        if (f.name && r.name.indexOf(f.name) === -1) return false;
        if (f.brand && r.brand.indexOf(f.brand) === -1) return false;
        if (f.model && r.model.indexOf(f.model) === -1) return false;
        if (f.powerMin && +r.power < +f.powerMin) return false;
        if (f.powerMax && +r.power > +f.powerMax) return false;
        if (f.capMin && +r.cap < +f.capMin) return false;
        if (f.capMax && +r.cap > +f.capMax) return false;
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
        '<div class="field"><span class="field-label">储能名称：</span>' +
        '<input class="input input-sm" id="fName" placeholder="请输入储能名称" value="' + U.esc(f.name) + '" /></div>' +
        '<div class="field"><span class="field-label">储能品牌：</span>' +
        '<input class="input input-sm" id="fBrand" placeholder="请输入储能品牌" value="' + U.esc(f.brand) + '" /></div>' +
        '<div class="field"><span class="field-label">储能型号：</span>' +
        '<input class="input input-sm" id="fModel" placeholder="请输入储能型号" value="' + U.esc(f.model) + '" /></div>' +
        '<div class="field"><span class="field-label">储能额定功率：</span>' +
        '<input class="input input-xs" id="fPowerMin" placeholder="最小" value="' + U.esc(f.powerMin) + '" />' +
        '<span class="range-sep">~</span>' +
        '<input class="input input-xs" id="fPowerMax" placeholder="最大" value="' + U.esc(f.powerMax) + '" /></div>' +
        '<div class="field"><span class="field-label">储能容量：</span>' +
        '<input class="input input-xs" id="fCapMin" placeholder="最小" value="' + U.esc(f.capMin) + '" />' +
        '<span class="range-sep">~</span>' +
        '<input class="input input-xs" id="fCapMax" placeholder="最大" value="' + U.esc(f.capMax) + '" /></div>' +
        '<div class="filter-actions">' +
        '<button class="btn btn-primary" id="btnSearch">' + ICON.search + '搜索</button>' +
        '<button class="btn btn-ghost" id="btnReset">' + ICON.reset + '重置</button>' +
        '</div></div>';
      html += '<div class="table-toolbar"><button class="btn btn-primary" id="btnNew">' + ICON.plus + '新建</button></div>';

      html += '<div class="table-wrap"><table class="data">' +
        '<colgroup><col style="width:15%"><col style="width:13%"><col style="width:18%"><col style="width:12%"><col style="width:12%"><col style="width:15%"><col style="width:8%"><col style="width:10%"></colgroup>' +
        '<thead><tr><th>储能名称</th><th>储能品牌</th><th>储能型号</th><th>储能额定功率(kW)</th><th>储能容量(kWh)</th><th>更新时间</th><th>创建人</th><th>操作</th></tr></thead><tbody>';
      if (!slice.length) html += U.emptyRow(8, '暂无符合条件的储能模板');
      else slice.forEach(function (r) {
        html += '<tr data-id="' + r.id + '">' +
          '<td class="col-name">' + U.esc(r.name) + '</td>' +
          '<td>' + U.esc(r.brand) + '</td>' +
          '<td>' + U.esc(r.model) + '</td>' +
          '<td>' + U.esc(r.power) + '</td>' +
          '<td>' + U.esc(r.cap) + '</td>' +
          '<td class="col-time">' + U.esc(r.update) + '</td>' +
          '<td>' + U.esc(r.owner) + '</td>' +
          '<td><span class="ops">' +
          '<a class="link" data-sact="view" data-id="' + r.id + '">查看</a>' +
          '<a class="link" data-sact="edit" data-id="' + r.id + '">编辑</a>' +
          '<a class="link-danger" data-sact="del" data-id="' + r.id + '">删除</a>' +
          '</span></td>' +
          '</tr>';
      });
      html += '</tbody></table></div>';
      html += U.pagerBar(page, totalPages, rows.length, size);
      return html;
    },

    mount: function (root, state) {
      var self = this;
      var ids = ['fName', 'fBrand', 'fModel', 'fPowerMin', 'fPowerMax', 'fCapMin', 'fCapMax'];
      function read() {
        var o = {};
        ids.forEach(function (id) {
          var el = root.querySelector('#' + id);
          o[id.slice(1).replace(/^./, function (c) { return c.toLowerCase(); })] = el ? el.value.trim() : '';
        });
        return o;
      }
      root.querySelector('#btnSearch').addEventListener('click', function () {
        state.draft = read();
        state.applied = JSON.parse(JSON.stringify(state.draft));
        state.page = 1;
        window.App.rerenderPage();
      });
      root.querySelector('#btnReset').addEventListener('click', function () {
        state.draft = { name: '', brand: '', model: '', powerMin: '', powerMax: '', capMin: '', capMax: '' };
        state.applied = JSON.parse(JSON.stringify(state.draft));
        state.page = 1;
        window.App.rerenderPage();
      });
      ids.forEach(function (id) {
        var el = root.querySelector('#' + id);
        if (el) el.addEventListener('keydown', function (e) { if (e.key === 'Enter') root.querySelector('#btnSearch').click(); });
      });
      root.querySelector('#btnNew').addEventListener('click', function () {
        openStorageDrawer(null, function () { window.App.rerenderPage(); });
      });
      root.querySelectorAll('[data-sact]').forEach(function (el) {
        el.addEventListener('click', function (e) {
          e.stopPropagation();
          var id = Number(el.dataset.id);
          var row = window.STORAGE_DATA.filter(function (r) { return r.id === id; })[0];
          if (!row) return;
          if (el.dataset.sact === 'del') {
            window.App.confirm({
              title: '删除确认', content: '确定删除储能模板 <b>' + U.esc(row.name) + '</b> 吗？',
              onOk: function () {
                window.STORAGE_DATA = window.STORAGE_DATA.filter(function (r) { return r.id !== id; });
                window.App.toast('已删除');
                window.App.rerenderPage();
              }
            });
          } else {
            openStorageDrawer(row, function () { window.App.rerenderPage(); });
          }
        });
      });
      root.querySelectorAll('tbody tr[data-id]').forEach(function (tr) {
        tr.addEventListener('click', function () {
          var id = Number(tr.dataset.id);
          var row = window.STORAGE_DATA.filter(function (r) { return r.id === id; })[0];
          if (row) openStorageDrawer(row, function () { window.App.rerenderPage(); });
        });
      });
      U.bindPager(root, state, function () { window.App.rerenderPage(); }, self.query(state).length);
    }
  };

  function openStorageDrawer(row, onDone) {
    var isEdit = !!row;
    var d = row || {
      name: '', brand: '', model: '', cap: '', power: '', ratio: '0.5', dod: '90',
      chgEff: '93', disEff: '93', decayMode: 'fixed', decayFixed: '2.5', isPublic: '是',
      decay: ['2.5', '2.5', '2.5', '2.5', '2.5', '2.5', '2.5', '2.5', '2.5', '2.5']
    };

    function decayTable(mode, vals) {
      var html = '<table class="decay-table"><thead><tr><th class="dt-corner">年份</th>';
      for (var i = 1; i <= 5; i++) html += '<th>第' + i + '年</th>';
      html += '</tr></thead><tbody><tr><td class="dt-corner">衰减率</td>';
      for (var j = 0; j < 5; j++) html += '<td>' + cell(mode, vals[j]) + '</td>';
      html += '</tr></tbody><thead><tr><th class="dt-corner">年份</th>';
      for (var k = 6; k <= 10; k++) html += '<th>第' + k + '年</th>';
      html += '</tr></thead><tbody><tr><td class="dt-corner">衰减率</td>';
      for (var m = 5; m < 10; m++) html += '<td>' + cell(mode, vals[m]) + '</td>';
      html += '</tr></tbody></table>';
      return html;
    }

    function cell(mode, val) {
      if (mode === 'custom') {
        return '<span class="ui-wrap"><input class="input dt-input" placeholder="请输入" /><i class="ui-unit">%</i></span>';
      }
      return '<span class="dt-val">' + U.esc(val) + '%</span>';
    }

    var body = '<div class="dr-grid dr-grid-2">' +
      U.field('储能名称', U.unitInput({ id: 'sName', value: d.name, placeholder: '请输入储能名称' }), { required: true }) +
      U.field('储能品牌', U.unitInput({ id: 'sBrand', value: d.brand, placeholder: '请输入储能品牌' }), { required: true }) +
      U.field('储能型号', U.unitInput({ id: 'sModel', value: d.model, placeholder: '请输入储能型号' }), { required: true }) +
      U.field('储能容量', U.unitInput({ id: 'sCap', value: d.cap, placeholder: '请输入', unit: 'kWh' }), { required: true }) +
      U.field('额定功率', U.unitInput({ id: 'sPower', value: d.power, placeholder: '请输入', unit: 'kW' }), { required: true }) +
      U.field('充放倍率', U.unitInput({ id: 'sRatio', value: d.ratio, placeholder: '请输入', unit: 'P' }), { required: true }) +
      U.field('DOD深度', U.unitInput({ id: 'sDod', value: d.dod, placeholder: '请输入', unit: '%' }), { required: true }) +
      U.field('充电效率', U.unitInput({ id: 'sChgEff', value: d.chgEff, placeholder: '请输入', unit: '%' }), { required: true }) +
      U.field('放电效率', U.unitInput({ id: 'sDisEff', value: d.disEff, placeholder: '请输入', unit: '%' }), { required: true }) +
      '<div class="f-item"><label class="f-label"><i class="req">*</i>年衰减率</label><div class="f-ctrl f-inline-plain">' +
      '<label class="radio-item"><input type="radio" name="sDecay" value="custom"' + (d.decayMode === 'custom' ? ' checked' : '') + '/>自定义</label>' +
      '<label class="radio-item"><input type="radio" name="sDecay" value="fixed"' + (d.decayMode === 'fixed' ? ' checked' : '') + '/>固定</label>' +
      U.unitInput({ id: 'sDecayFixed', value: d.decayFixed, unit: '%', inputCls: 'i-short' }) +
      '</div></div>' +
      '<div class="f-item"><label class="f-label"><i class="req">*</i>是否公开</label><div class="f-ctrl f-inline-plain">' +
      '<label class="radio-item"><input type="radio" name="sPublic" value="是"' + (d.isPublic === '是' ? ' checked' : '') + '/>是</label>' +
      '<label class="radio-item"><input type="radio" name="sPublic" value="否"' + (d.isPublic === '否' ? ' checked' : '') + '/>否</label>' +
      '</div></div>' +
      '<div class="f-item f-wide"><div id="sDecayWrap">' + decayTable(d.decayMode, d.decay) + '</div></div>' +
      '</div>';

    window.FormDrawer.open({
      title: '储能模板编辑',
      width: 760,
      bodyHtml: body,
      okText: '保存',
      onMount: function (el) {
        el.querySelectorAll('input[name="sDecay"]').forEach(function (r) {
          r.addEventListener('change', function () {
            el.querySelector('#sDecayWrap').innerHTML = decayTable(r.value, d.decay);
            var fx = el.querySelector('#sDecayFixed');
            if (fx) fx.disabled = (r.value === 'custom');
          });
        });
        el.querySelectorAll('input[name="sPublic"]').forEach(function (r) {
          r.addEventListener('change', function () {
            el.querySelectorAll('input[name="sPublic"]').forEach(function (x) { x.checked = (x.value === r.value); });
          });
        });
      },
      onSubmit: function (el) {
        var name = el.querySelector('#sName').value.trim();
        if (!name) { window.App.toast('请填写储能名称'); return; }
        var mode = (el.querySelector('input[name="sDecay"]:checked') || {}).value || 'fixed';
        var pub = (el.querySelector('input[name="sPublic"]:checked') || {}).value || '否';
        var payload = {
          name: name,
          brand: el.querySelector('#sBrand').value,
          model: el.querySelector('#sModel').value,
          cap: el.querySelector('#sCap').value,
          power: el.querySelector('#sPower').value,
          ratio: el.querySelector('#sRatio').value,
          dod: el.querySelector('#sDod').value,
          chgEff: el.querySelector('#sChgEff').value,
          disEff: el.querySelector('#sDisEff').value,
          decayMode: mode,
          decayFixed: el.querySelector('#sDecayFixed').value,
          isPublic: pub
        };
        if (mode === 'custom') {
          var vals = [];
          el.querySelectorAll('#sDecayWrap .dt-input').forEach(function (i) { vals.push(i.value || ''); });
          payload.decay = vals;
        } else {
          payload.decay = ['2.5','2.5','2.5','2.5','2.5','2.5','2.5','2.5','2.5','2.5'].map(function () { return payload.decayFixed; });
        }
        if (isEdit) Object.keys(payload).forEach(function (k) { row[k] = payload[k]; });
        else {
          payload.id = Math.max.apply(null, window.STORAGE_DATA.map(function (r) { return r.id; })) + 1;
          payload.update = nowStr();
          payload.owner = '薛易立';
          window.STORAGE_DATA.unshift(payload);
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
  window.PageDefs['cost-info'] = costInfo;
  window.PageDefs['storage-template'] = storageTpl;
})();
