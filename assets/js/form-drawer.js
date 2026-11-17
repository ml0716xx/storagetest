/* 通用抽屉框架：企业管理 / 光伏测算数据 共用
 * 用法：FormDrawer.open({ title, sub, width, bodyHtml, onMount, onSubmit, okText }) */
(function () {
  var ICON = {
    close: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>'
  };

  var escHandler = null;

  function close() {
    var mask = document.getElementById('formDrawerMask');
    var drawer = document.getElementById('formDrawer');
    if (!drawer) return;
    if (escHandler) { document.removeEventListener('keydown', escHandler); escHandler = null; }
    mask.classList.remove('is-open');
    drawer.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(function () {
      if (mask && mask.parentElement) mask.remove();
      if (drawer && drawer.parentElement) drawer.remove();
    }, 220);
  }

  function open(opts) {
    if (document.getElementById('formDrawer')) close();

    var mask = document.createElement('div');
    mask.className = 'drawer-mask';
    mask.id = 'formDrawerMask';

    var drawer = document.createElement('aside');
    drawer.className = 'drawer';
    drawer.id = 'formDrawer';
    if (opts.width) drawer.style.width = opts.width + 'px';

    drawer.innerHTML =
      '<div class="drawer-head">' +
      '<div>' +
      '<div class="drawer-title">' + opts.title + '</div>' +
      (opts.sub ? '<div class="drawer-sub">' + opts.sub + '</div>' : '') +
      '</div>' +
      '<span class="drawer-close" id="formDrawerClose">' + ICON.close + '</span>' +
      '</div>' +
      '<div class="drawer-body" id="formDrawerBody">' + (opts.bodyHtml || '') + '</div>' +
      '<div class="drawer-foot">' +
      '<button class="btn" id="formDrawerCancel">取消</button>' +
      '<button class="btn btn-primary" id="formDrawerOk">' + (opts.okText || '提交') + '</button>' +
      '</div>';

    document.body.appendChild(mask);
    document.body.appendChild(drawer);
    document.body.style.overflow = 'hidden';

    mask.addEventListener('click', close);
    drawer.querySelector('#formDrawerClose').addEventListener('click', close);
    drawer.querySelector('#formDrawerCancel').addEventListener('click', close);
    drawer.querySelector('#formDrawerOk').addEventListener('click', function () {
      if (opts.onSubmit) opts.onSubmit(drawer);
    });
    escHandler = function (e) { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', escHandler);

    requestAnimationFrame(function () {
      mask.classList.add('is-open');
      drawer.classList.add('is-open');
    });

    if (opts.onMount) opts.onMount(drawer);
  }

  window.FormDrawer = { open: open, close: close };
})();
