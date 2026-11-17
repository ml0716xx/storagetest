/* 储能测算 —— 新建测算页 */
(function () {
  var U = window.PU;
  var MONTH_KEYS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  var ZERO12 = ['0','0','0','0','0','0','0','0','0','0','0','0'];

  var ANCHORS = [
    { id: 'sec-ent', label: '企业信息' },
    { id: 'sec-goal', label: '测算目标' },
    { id: 'sec-price', label: '电价信息' },
    { id: 'sec-pv', label: '光伏信息' },
    { id: 'sec-load', label: '负荷信息' },
    { id: 'sec-storage', label: '储能信息' },
    { id: 'sec-cost', label: '其他成本' }
  ];

  function secHead(text) {
    return '<div class="f-sec-head"><span class="f-sec-bar"></span>' + text + '</div>';
  }

  function slotTable(rows) {
    var html = '<div class="tbl-scroll"><table class="slot-table"><thead><tr>' +
      '<th class="st-month">月份</th><th>尖峰时段</th><th>高峰时段</th><th class="st-flat">平段</th>' +
      '<th>低谷时段</th><th>深谷时段</th><th class="st-idle">空闲</th><th>充电</th><th>放电</th>' +
      '<th class="st-hours">理想充电时长(h)</th><th class="st-ops">操作</th></tr></thead><tbody>';
    rows.forEach(function (r, i) {
      html += '<tr data-mi="' + i + '">' +
        '<td class="st-month">' + r.m + '</td>' +
        '<td>' + U.esc(r.spike) + '</td>' +
        '<td>' + U.esc(r.peak) + '</td>' +
        '<td class="st-flat">' + U.esc(r.flat) + '</td>' +
        '<td>' + U.esc(r.valley) + '</td>' +
        '<td>' + U.esc(r.deep) + '</td>' +
        '<td class="st-idle">' + U.esc(r.idle) + '</td>' +
        '<td>' + U.esc(r.chg) + '</td>' +
        '<td>' + U.esc(r.dis) + '</td>' +
        '<td class="st-hours">' + U.esc(r.hours) + '</td>' +
        '<td class="st-ops"><a class="link" data-slot="' + i + '">编辑</a>' +
        '<a class="link" data-slotcopy="' + i + '">复制</a></td>' +
        '</tr>';
    });
    html += '</tbody></table></div>';
    return html;
  }

  var page = {
    title: '储能测算',

    render: function (state) {
      var f = state.form || (state.form = {});

      var html = '<div class="calc-wrap">';

      /* 左侧主体 */
      html += '<div class="calc-main">';

      /* 企业信息 */
      html += '<section class="form-sec" id="sec-ent">';
      html += secHead('企业信息');
      html += '<div class="f-grid">' +
        U.field('企业名称', U.selectBox({ id: 'fEntName', placeholder: '请选择企业', options: window.OPTIONS.enterprise, value: f.entName }), { required: true }) +
        U.field('企业地址', U.selectBox({ id: 'fEntAddr', placeholder: '请选择企业地址', options: ['重庆市/重庆郊县/巫溪县', '江苏省常州市新北区', '山西省运城市闻喜县'] }), { required: true }) +
        U.field('电压等级', U.selectBox({ id: 'fVolt', placeholder: '请选择电压等级', options: window.OPTIONS.volt }), { required: true }) +
        U.field('用电类别', U.selectBox({ id: 'fUseType', placeholder: '请选择用电类别', options: window.OPTIONS.useType }), { required: true }) +
        U.field('计费类型', U.selectBox({ id: 'fFeeType', placeholder: '请选择计费类型', options: window.OPTIONS.feeType, value: '按容计费' }), { required: true }) +
        U.field('变压器容量', U.unitInput({ id: 'fTrans', placeholder: '请输入变压器容量', unit: 'kVA' }), { required: true }) +
        U.field('最大负载率', U.unitInput({ id: 'fLoadRate', placeholder: '请输入最大负载率', unit: '%' }), { required: true }) +
        '</div>';
      html += '</section>';

      /* 测算目标 */
      html += '<section class="form-sec" id="sec-goal">';
      html += secHead('测算目标');
      html += '<div class="f-grid">' +
        U.field('起配台数建议', U.unitInput({ id: 'fStartUnits', placeholder: '请输入起配台数建议', unit: '台' }), { required: true }) +
        U.field('储能最长回本年限', U.unitInput({ id: 'fMaxPayback', placeholder: '请输入储能最长回本年限', unit: '年' }), { required: true }) +
        '</div>';
      html += '</section>';

      /* 电价信息 */
      html += '<section class="form-sec" id="sec-price">';
      html += secHead('电价信息');
      html += '<div class="f-grid">' +
        U.field('电价模板', U.selectBox({ id: 'fPriceTpl', placeholder: '请选择电价模板', options: window.OPTIONS.price }), { required: true }) +
        '</div>';

      html += '<div class="f-sub">' +
        '<div class="f-sub-head"><i class="req">*</i>电价配置</div>' +
        '<div class="tbl-scroll"><table class="tariff-table"><thead><tr>' +
        '<th class="tt-label">时段分类</th><th>尖峰时段</th><th>高峰时段</th><th>平段</th><th>低谷时段</th><th>深谷时段</th>' +
        '</tr></thead><tbody><tr><td class="tt-label">度电电价(元/kWh)</td>' +
        ['尖','高','平','低','深'].map(function (k, i) {
          return '<td><input class="input tt-input" id="fTariff' + i + '" placeholder="0.0000" /></td>';
        }).join('') +
        '</tr></tbody></table></div>' +
        '</div>';

      html += '<div class="f-sub">' +
        '<div class="f-sub-head"><i class="req">*</i>用电时段配置</div>' +
        slotTable(window.PRICE_TPL.months) +
        '</div>';
      html += '</section>';

      /* 光伏信息 */
      html += '<section class="form-sec" id="sec-pv">';
      html += secHead('光伏信息');
      html += '<div class="f-grid">' +
        U.field('光伏装机容量', U.unitInput({ id: 'fPvCap', placeholder: '请输入光伏装机容量', unit: 'kWp' }), { required: true }) +
        U.field('光伏上网电价', U.unitInput({ id: 'fPvPrice', placeholder: '请输入光伏上网电价', unit: '元/kWh' }), { required: true }) +
        U.field('光伏数据', U.selectBox({ id: 'fPvData', placeholder: '请选择光伏数据', options: window.OPTIONS.pv }), { required: true }) +
        '</div>';
      html += '<div class="f-sub">' +
        '<div class="f-sub-head">光伏发电量</div>' +
        U.monthRow('光伏(kWh)', ZERO12) +
        '</div>';
      html += '</section>';

      /* 负荷信息 */
      html += '<section class="form-sec" id="sec-load">';
      html += secHead('负荷信息');
      html += '<div class="f-grid">' +
        U.field('负荷数据', U.selectBox({ id: 'fLoadData', placeholder: '请选择负荷数据', options: window.OPTIONS.load }), { required: true }) +
        U.field('CT倍率', U.unitInput({ id: 'fCt', placeholder: '请输入CT倍率', unit: '倍' })) +
        U.field('PT倍率', U.unitInput({ id: 'fPt', placeholder: '请输入PT倍率', unit: '倍' })) +
        '</div>';
      html += '<div class="f-sub">' +
        '<div class="f-sub-head">负荷数据</div>' +
        U.monthRow('负荷数据(kWh)', ZERO12) +
        '</div>';
      html += '</section>';

      /* 储能信息 */
      html += '<section class="form-sec" id="sec-storage">';
      html += secHead('储能信息');
      html += '<div class="f-grid">' +
        U.field('选择储能产品', U.selectBox({ id: 'fStorage', placeholder: '请选择储能产品', options: window.OPTIONS.storage }), { required: true }) +
        U.field('储能品牌', U.unitInput({ id: 'fBrand', placeholder: '请输入储能品牌' }), { required: true }) +
        U.field('储能型号', U.unitInput({ id: 'fModel', placeholder: '请输入储能型号' }), { required: true }) +
        U.field('储能容量', U.unitInput({ id: 'fCap', placeholder: '请输入储能容量', unit: 'kWh' }), { required: true }) +
        U.field('额定功率', U.unitInput({ id: 'fPower', placeholder: '请输入额定功率', unit: 'kW' }), { required: true }) +
        U.field('充放倍率', U.unitInput({ id: 'fRatio', placeholder: '请输入充放倍率', unit: 'P' }), { required: true }) +
        U.field('DOD深度', U.unitInput({ id: 'fDod', placeholder: '请输入DOD深度', unit: '%' }), { required: true }) +
        U.field('充电效率', U.unitInput({ id: 'fChgEff', placeholder: '请输入充电效率', unit: '%' }), { required: true }) +
        U.field('放电效率', U.unitInput({ id: 'fDisEff', placeholder: '请输入放电效率', unit: '%' }), { required: true }) +
        '</div>';

      html += '<div class="f-inline">' +
        '<label class="f-label"><i class="req">*</i>年衰减率</label>' +
        '<label class="radio-item"><input type="radio" name="decayMode" value="custom" id="decayCustom" />自定义</label>' +
        '<label class="radio-item"><input type="radio" name="decayMode" value="fixed" id="decayFixed" checked />固定</label>' +
        U.unitInput({ id: 'fDecayFixed', placeholder: '2.5', unit: '%', value: '2.5', inputCls: 'i-short' }) +
        '</div>';

      html += '<div class="decay-wrap" id="decayWrap">' + decayTable('fixed') + '</div>';
      html += '</section>';

      /* 其他成本 */
      html += '<section class="form-sec" id="sec-cost">';
      html += secHead('其他成本');
      html += '<div class="f-grid">' +
        U.field('选择成本模板', U.selectBox({ id: 'fCostTpl', placeholder: '请选择成本模板', options: window.OPTIONS.cost }), { required: true }) +
        U.field('EPC成本', U.unitInput({ id: 'fEpc', placeholder: '0', unit: '元/Wh', value: '0.85' }), { required: true }) +
        U.field('运维费用', U.unitInput({ id: 'fOm', placeholder: '0', unit: '元/Wh/年', value: '0' }), { required: true }) +
        U.field('保险费用', U.unitInput({ id: 'fIns', placeholder: '0', unit: '元/台/年', value: '0' }), { required: true }) +
        U.field('每年补充成本', U.unitInput({ id: 'fYearly', placeholder: '0', unit: '元', value: '0' }), { required: true }) +
        U.field('一次性补充成本', U.unitInput({ id: 'fOnce', placeholder: '0', unit: '元', value: '0' }), { required: true }) +
        '</div>';
      html += '</section>';

      html += '<div class="calc-actions"><button class="btn btn-primary btn-lg" id="btnStartCalc">开始测算</button></div>';
      html += '</div>';

      /* 右侧锚点 */
      html += '<aside class="anchor-nav" id="anchorNav">';
      ANCHORS.forEach(function (a, i) {
        html += '<a class="anchor-item' + (i === 0 ? ' is-active' : '') + '" data-anchor="' + a.id + '">' + a.label + '</a>';
      });
      html += '</aside>';

      html += '</div>';
      return html;
    },

    mount: function (root, state) {
      var self = this;

      /* 锚点跳转 */
      root.querySelectorAll('[data-anchor]').forEach(function (el) {
        el.addEventListener('click', function () {
          var target = root.querySelector('#' + el.dataset.anchor);
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          root.querySelectorAll('.anchor-item').forEach(function (x) { x.classList.remove('is-active'); });
          el.classList.add('is-active');
        });
      });

      /* 滚动联动 */
      var content = document.getElementById('content');
      state.scrollHandler = function () {
        var top = content.getBoundingClientRect().top;
        var current = null;
        ANCHORS.forEach(function (a) {
          var el = root.querySelector('#' + a.id);
          if (!el) return;
          if (el.getBoundingClientRect().top - top <= 60) current = a.id;
        });
        if (!current) current = ANCHORS[0].id;
        root.querySelectorAll('.anchor-item').forEach(function (x) {
          x.classList.toggle('is-active', x.dataset.anchor === current);
        });
      };
      content.addEventListener('scroll', state.scrollHandler);

      /* 时段编辑 */
      root.querySelectorAll('[data-slot]').forEach(function (el) {
        el.addEventListener('click', function () {
          var i = Number(el.dataset.slot);
          window.SlotEditor.open({
            monthIndex: i,
            data: window.PRICE_TPL.months[i],
            onSave: function (row) {
              window.PRICE_TPL.months[i] = row;
              window.App.rerenderPage();
            }
          });
        });
      });
      root.querySelectorAll('[data-slotcopy]').forEach(function (el) {
        el.addEventListener('click', function () {
          window.App.toast('已复制 1月 的时段配置');
        });
      });

      /* 衰减率模式 */
      root.querySelectorAll('input[name="decayMode"]').forEach(function (el) {
        el.addEventListener('change', function () {
          var wrap = root.querySelector('#decayWrap');
          wrap.innerHTML = decayTable(el.value);
          var fixedInput = root.querySelector('#fDecayFixed');
          if (fixedInput) fixedInput.disabled = (el.value === 'custom');
        });
      });

      /* 储能产品选择带出参数 */
      var storageSel = root.querySelector('#fStorage');
      if (storageSel) storageSel.addEventListener('change', function () {
        if (!storageSel.value) return;
        var s = window.STORAGE_DATA[storageSel.selectedIndex - 1] || window.STORAGE_DATA[0];
        var map = { fBrand: s.brand, fModel: s.model, fCap: s.cap, fPower: s.power, fRatio: s.ratio, fDod: s.dod, fChgEff: s.chgEff, fDisEff: s.disEff };
        Object.keys(map).forEach(function (id) {
          var el = root.querySelector('#' + id);
          if (el) el.value = map[id];
        });
        var wrap = root.querySelector('#decayWrap');
        if (wrap) {
          wrap.innerHTML = decayTable(s.decayMode, s.decay);
          var f = root.querySelector('#fDecayFixed');
          if (f) { f.value = s.decayFixed; f.disabled = (s.decayMode === 'custom'); }
          var radio = root.querySelector('input[name="decayMode"][value="' + s.decayMode + '"]');
          if (radio) radio.checked = true;
        }
      });

      /* 开始测算 */
      root.querySelector('#btnStartCalc').addEventListener('click', function () {
        window.App.toast('测算任务已提交，正在计算…');
        setTimeout(function () {
          window.App.open('calc-report');
        }, 700);
      });
    },

    unmount: function (state) {
      var content = document.getElementById('content');
      if (state.scrollHandler) content.removeEventListener('scroll', state.scrollHandler);
    }
  };

  function decayTable(mode, values) {
    var v = values || ['2.5','2.5','2.5','2.5','2.5','2.5','2.5','2.5','2.5','2.5'];
    var html = '<table class="decay-table"><thead><tr><th class="dt-corner">年份</th>';
    for (var i = 1; i <= 5; i++) html += '<th>第' + i + '年</th>';
    html += '</tr></thead><tbody><tr><td class="dt-corner">衰减率</td>';
    for (var j = 0; j < 5; j++) html += '<td>' + cell(mode, v[j]) + '</td>';
    html += '</tr></tbody><thead><tr><th class="dt-corner">年份</th>';
    for (var k = 6; k <= 10; k++) html += '<th>第' + k + '年</th>';
    html += '</tr></thead><tbody><tr><td class="dt-corner">衰减率</td>';
    for (var m = 5; m < 10; m++) html += '<td>' + cell(mode, v[m]) + '</td>';
    html += '</tr></tbody></table>';
    return html;
  }

  function cell(mode, val) {
    if (mode === 'custom') {
      return '<span class="ui-wrap"><input class="input dt-input" placeholder="请输入" /><i class="ui-unit">%</i></span>';
    }
    return '<span class="dt-val">' + U.esc(val) + '%</span>';
  }

  window.PageDefs = window.PageDefs || {};
  window.PageDefs['storage-calc-page'] = page;
  window.CalcDecayTable = decayTable;
})();
