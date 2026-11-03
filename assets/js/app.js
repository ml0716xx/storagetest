/* 应用外壳：左侧导航、标签页、路由、提示与确认框 */
(function () {
  var ICON = {
    layers: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M12 3l8 4.5-8 4.5-8-4.5L12 3z"/><path d="M4 12l8 4.5 8-4.5"/><path d="M4 16.5L12 21l8-4.5"/></svg>',
    file: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z"/><path d="M14 3v5h5"/></svg>',
    up: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg>'
  };

  var MENU = [
    {
      key: 'storage-calc', label: '储能测算', icon: 'layers', expanded: true,
      children: [
        { key: 'storage-calc-page', label: '储能测算' },
        { key: 'enterprise', label: '企业管理' },
        {
          key: 'calc-data', label: '测算数据管理', expanded: true,
          children: [
            { key: 'pv-data', label: '光伏测算数据' },
            { key: 'load-data', label: '负荷测算数据' }
          ]
        }
      ]
    },
    {
      key: 'common-params', label: '公共参数', icon: 'file', expanded: false,
      children: [
        { key: 'common-param', label: '参数配置' }
      ]
    }
  ];

  var LABELS = {};
  (function walk(nodes) {
    nodes.forEach(function (n) {
      LABELS[n.key] = n.label;
      if (n.children) walk(n.children);
    });
  })(MENU);

  function defaultPageState() {
    return { draft: { name: '', start: '', end: '' }, applied: { name: '', start: '', end: '' }, page: 1, size: 10 };
  }

  var App = {
    state: {
      activeKey: 'load-data',
      tabs: [
        { key: 'storage-calc-page', closable: false },
        { key: 'load-data', closable: true }
      ],
      pages: { 'load-data': defaultPageState() },
      current: null
    },

    init: function () {
      this.renderMenu();
      this.renderTabs();
      this.renderPage();
    },

    /* ---------- 导航 ---------- */
    renderMenu: function () {
      var self = this;
      var root = document.getElementById('menu');
      var active = this.state.activeKey;

      function containsKey(node, key) {
        if (node.key === key) return true;
        return (node.children || []).some(function (c) { return containsKey(c, key); });
      }

      function nodeHtml(node, level) {
        var hasChildren = node.children && node.children.length;
        var isLeafActive = node.key === active;
        // 一级菜单在子树含当前页时变蓝（与设计稿一致，二级保持常规色）
        var parentActive = level === 0 && hasChildren && containsKey(node, active);

        var cls = 'menu-node';
        if (hasChildren && node.expanded === false) cls += ' collapsed';

        var itemCls = 'menu-item';
        if (isLeafActive && !hasChildren) itemCls += ' is-active';
        if (parentActive) itemCls += ' is-parent-active';

        var html = '<div class="' + cls + '" data-key="' + node.key + '">';
        html += '<div class="' + itemCls + '" data-nav="' + node.key + '">';
        if (node.icon) html += '<span class="m-icon">' + ICON[node.icon] + '</span>';
        html += '<span class="m-label">' + node.label + '</span>';
        if (hasChildren) {
          html += '<span class="caret">' + ICON.up + '</span>';
        }
        html += '</div>';
        if (hasChildren) {
          html += '<div class="menu-children">';
          node.children.forEach(function (c) { html += nodeHtml(c, level + 1); });
          html += '</div>';
        }
        html += '</div>';
        return html;
      }

      root.innerHTML = MENU.map(function (n) { return nodeHtml(n, 0); }).join('');

      // 展开/收起 + 跳转
      root.querySelectorAll('.menu-item').forEach(function (el) {
        el.addEventListener('click', function () {
          var key = el.dataset.nav;
          var nodeEl = el.parentElement;
          var hasChildren = nodeEl.querySelector(':scope > .menu-children');
          var node = findNode(MENU, key);
          if (hasChildren && node) {
            var collapsedEl = el.parentElement;
            if (node.expanded === false) { node.expanded = true; collapsedEl.classList.remove('collapsed'); }
            else { node.expanded = false; collapsedEl.classList.add('collapsed'); }
            return;
          }
          self.open(key);
        });
      });
    },

    renderTabs: function () {
      var self = this;
      var root = document.getElementById('tabs');
      root.innerHTML = this.state.tabs.map(function (t) {
        var cls = 'tab' + (t.key === self.state.activeKey ? ' is-active' : '');
        return '<div class="' + cls + '" data-tab="' + t.key + '">' +
          '<span>' + (LABELS[t.key] || t.key) + '</span>' +
          (t.closable ? '<span class="tab-close" data-close="' + t.key + '">×</span>' : '') +
          '</div>';
      }).join('');

      root.querySelectorAll('.tab').forEach(function (el) {
        el.addEventListener('click', function (e) {
          if (e.target.dataset.close) return;
          self.open(el.dataset.tab);
        });
      });

      root.querySelectorAll('[data-close]').forEach(function (el) {
        el.addEventListener('click', function (e) {
          e.stopPropagation();
          self.closeTab(el.dataset.close);
        });
      });
    },

    open: function (key) {
      var tabs = this.state.tabs;
      if (!tabs.some(function (t) { return t.key === key; })) {
        tabs.push({ key: key, closable: true });
      }
      if (this.state.activeKey === key) {
        this.renderTabs();
        this.renderMenu();
        return;
      }
      this.state.activeKey = key;
      this.renderTabs();
      this.renderMenu();
      this.renderPage();
    },

    closeTab: function (key) {
      var tabs = this.state.tabs;
      if (tabs.length <= 1) { this.toast('至少保留一个页签'); return; }
      var idx = tabs.findIndex(function (t) { return t.key === key; });
      tabs.splice(idx, 1);
      if (this.state.activeKey === key) {
        this.state.activeKey = tabs[Math.max(0, idx - 1)].key;
        this.renderPage();
      }
      this.renderTabs();
      this.renderMenu();
    },

    /* ---------- 页面 ---------- */
    getPageState: function (key) {
      if (!this.state.pages[key]) this.state.pages[key] = defaultPageState();
      return this.state.pages[key];
    },

    renderPage: function () {
      var key = this.state.activeKey;
      var content = document.getElementById('content');
      if (this.state.current && this.state.current.def.unmount) {
        try { this.state.current.def.unmount(this.state.current.state); } catch (e) {}
      }
      var def = window.Pages[key] || window.PlaceholderPage(LABELS[key] || key);
      var st = this.getPageState(key);
      content.innerHTML = def.render(st);
      this.state.current = { key: key, def: def, state: st };
      if (def.mount) def.mount(content, st);
    },

    rerenderPage: function () {
      var cur = this.state.current;
      if (!cur) return;
      var content = document.getElementById('content');
      content.innerHTML = cur.def.render(cur.state);
      if (cur.def.mount) cur.def.mount(content, cur.state);
    },

    /* ---------- 通用 ---------- */
    toast: function (msg) {
      var wrap = document.getElementById('toastWrap');
      var el = document.createElement('div');
      el.className = 'toast';
      el.textContent = msg;
      wrap.appendChild(el);
      setTimeout(function () {
        el.style.transition = 'opacity .2s';
        el.style.opacity = '0';
        setTimeout(function () { el.remove(); }, 220);
      }, 1900);
    },

    confirm: function (opts) {
      var root = document.getElementById('modalRoot');
      root.innerHTML =
        '<div class="mask"><div class="dialog">' +
        '<div class="dialog-head">' + (opts.title || '提示') + '</div>' +
        '<div class="dialog-body">' + (opts.content || '') + '</div>' +
        '<div class="dialog-foot">' +
        '<button class="btn" data-act="cancel">取消</button>' +
        '<button class="btn btn-primary" data-act="ok">确定</button>' +
        '</div></div></div>';
      var close = function () { root.innerHTML = ''; };
      root.querySelector('[data-act="cancel"]').addEventListener('click', close);
      root.querySelector('[data-act="ok"]').addEventListener('click', function () {
        close();
        if (opts.onOk) opts.onOk();
      });
      root.querySelector('.mask').addEventListener('click', function (e) {
        if (e.target === e.currentTarget) close();
      });
    }
  };

  function findNode(nodes, key) {
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].key === key) return nodes[i];
      if (nodes[i].children) {
        var hit = findNode(nodes[i].children, key);
        if (hit) return hit;
      }
    }
    return null;
  }

  window.App = App;
  document.addEventListener('DOMContentLoaded', function () { App.init(); });
  if (document.readyState !== 'loading') App.init();
})();
