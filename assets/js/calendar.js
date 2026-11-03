/* 轻量日期区间选择器（对齐设计稿的「开始日期 → 结束日期」交互） */
(function () {
  var WEEK = ['日', '一', '二', '三', '四', '五', '六'];
  var openInstance = null;

  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function fmt(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function sameDay(a, b) {
    return !!a && !!b && a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function DateRangePicker(trigger, opts) {
    this.trigger = trigger;
    this.opts = opts || {};
    this.start = null;
    this.end = null;
    this.view = new Date();
    this.view.setDate(1);
    this.picking = null;
    this.pop = null;
    this.bind();
  }

  DateRangePicker.prototype.bind = function () {
    var self = this;
    this.trigger.addEventListener('click', function (e) {
      if (e.target.closest('.range-clear')) {
        e.stopPropagation();
        self.clear();
        return;
      }
      self.toggle();
    });
    document.addEventListener('click', function (e) {
      if (!self.pop) return;
      if (self.trigger.contains(e.target) || self.pop.contains(e.target)) return;
      self.close();
    });
  };

  DateRangePicker.prototype.toggle = function () {
    if (this.pop) { this.close(); return; }
    if (openInstance) openInstance.close();
    openInstance = this;
    this.picking = null;
    if (this.start) { this.view = new Date(this.start.getFullYear(), this.start.getMonth(), 1); }
    this.renderPop();
    this.trigger.classList.add('is-open');
  };

  DateRangePicker.prototype.close = function () {
    if (this.pop) { this.pop.remove(); this.pop = null; }
    this.trigger.classList.remove('is-open');
    if (openInstance === this) openInstance = null;
  };

  DateRangePicker.prototype.clear = function () {
    this.start = this.end = null;
    this.renderLabel();
    this.emit();
    this.close();
  };

  DateRangePicker.prototype.renderLabel = function () {
    var txt = this.trigger.querySelector('.range-text');
    var clear = this.trigger.querySelector('.range-clear');
    if (this.start && this.end) {
      txt.innerHTML = '<span>' + fmt(this.start) + '</span><span class="range-sep">→</span><span>' + fmt(this.end) + '</span>';
      if (clear) clear.classList.add('has-value');
    } else {
      txt.innerHTML = '<span class="ph">开始日期</span><span class="range-sep">→</span><span class="ph">结束日期</span>';
      if (clear) clear.classList.remove('has-value');
    }
  };

  DateRangePicker.prototype.emit = function () {
    if (this.opts.onChange) {
      this.opts.onChange(this.start ? fmt(this.start) : '', this.end ? fmt(this.end) : '');
    }
  };

  DateRangePicker.prototype.pick = function (d) {
    if (!this.picking) {
      this.start = d;
      this.end = null;
      this.picking = 'end';
    } else {
      if (d < this.start) { this.end = this.start; this.start = d; }
      else { this.end = d; }
      this.picking = null;
      this.renderLabel();
      this.emit();
      this.close();
      return;
    }
    this.renderPop();
  };

  DateRangePicker.prototype.renderPop = function () {
    var self = this;
    if (!this.pop) {
      this.pop = document.createElement('div');
      this.pop.className = 'cal-pop';
      this.trigger.appendChild(this.pop);
    }
    var y = this.view.getFullYear(), m = this.view.getMonth();
    var first = new Date(y, m, 1);
    var startOffset = first.getDay();
    var daysInMonth = new Date(y, m + 1, 0).getDate();
    var prevDays = new Date(y, m, 0).getDate();

    var cells = [];
    for (var i = startOffset - 1; i >= 0; i--) {
      cells.push({ d: new Date(y, m - 1, prevDays - i), mute: true });
    }
    for (var d = 1; d <= daysInMonth; d++) {
      cells.push({ d: new Date(y, m, d), mute: false });
    }
    while (cells.length % 7 !== 0) {
      var next = cells.length - startOffset - daysInMonth + 1;
      cells.push({ d: new Date(y, m + 1, next), mute: true });
    }

    var html = '';
    html += '<div class="cal-head">' +
      '<span class="cal-nav" data-nav="-1">‹</span>' +
      '<span>' + y + ' 年 ' + (m + 1) + ' 月</span>' +
      '<span class="cal-nav" data-nav="1">›</span>' +
      '</div>';
    html += '<div class="cal-grid">';
    WEEK.forEach(function (w) { html += '<div class="cal-wd">' + w + '</div>'; });
    cells.forEach(function (c) {
      var cls = 'cal-day';
      if (c.mute) cls += ' is-mute';
      if (self.start && sameDay(c.d, self.start)) cls += ' is-start';
      if (self.end && sameDay(c.d, self.end)) cls += ' is-end';
      if (self.start && self.end && c.d > self.start && c.d < self.end) cls += ' is-in-range';
      html += '<div class="' + cls + '" data-date="' + fmt(c.d) + '">' + c.d.getDate() + '</div>';
    });
    html += '</div>';
    html += '<div class="cal-foot"><span>' +
      (this.start ? fmt(this.start) + (this.end ? ' ~ ' + fmt(this.end) : ' ~ ?') : '请选择开始日期') +
      '</span><span class="link" data-act="clear">清除</span></div>';

    this.pop.innerHTML = html;

    this.pop.querySelectorAll('[data-nav]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        self.view.setMonth(self.view.getMonth() + parseInt(el.dataset.nav, 10));
        self.renderPop();
      });
    });
    this.pop.querySelectorAll('.cal-day').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        self.pick(new Date(el.dataset.date + 'T00:00:00'));
      });
    });
    var clr = this.pop.querySelector('[data-act="clear"]');
    if (clr) clr.addEventListener('click', function (e) { e.stopPropagation(); self.clear(); });
  };

  window.DateRangePicker = DateRangePicker;
  window.resetDateRangePickers = function () {
    if (openInstance) openInstance.close();
  };
})();
