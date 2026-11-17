/* 页面注册表 + 占位页 */
(function () {
  function esc(s) {
    return String(s === undefined || s === null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

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

  var registry = window.PageDefs || {};
  var pages = {};
  Object.keys(registry).forEach(function (k) { pages[k] = registry[k]; });

  window.Pages = pages;
  window.PlaceholderPage = placeholder;
})();
