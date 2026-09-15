/**
 * docs/demo.html glue — docs-only, not part of the fernwell package.
 *
 * Two things live here:
 *   - initDemoTabs: a WAI-ARIA "Tabs" pattern switcher for the HTML/JS vs
 *     React code samples. Inactive panels are `hidden` in the static markup,
 *     so this is enhancement over a working no-JS fallback, not a requirement.
 *   - initDemoTriggers: small render-pane wiring (toast/loading buttons) that
 *     only exists to make this reference page interactive — real usage is
 *     just the calls shown in the code samples themselves.
 */
(function () {
  function initDemoTabs(root) {
    root = root || document;
    root.querySelectorAll('[data-demo-tabs]').forEach(function (wrap) {
      if (wrap.dataset.demoBound) return;
      wrap.dataset.demoBound = '1';

      var tablist = wrap.querySelector('[role="tablist"]');
      var tabs = Array.prototype.slice.call(wrap.querySelectorAll('[role="tab"]'));

      function panelFor(tab) {
        return document.getElementById(tab.getAttribute('aria-controls'));
      }

      function activate(tab, focus) {
        tabs.forEach(function (t) {
          var selected = t === tab;
          t.setAttribute('aria-selected', String(selected));
          t.tabIndex = selected ? 0 : -1;
          panelFor(t).hidden = !selected;
        });
        if (focus) tab.focus();
      }

      tablist.addEventListener('click', function (e) {
        var tab = e.target.closest('[role="tab"]');
        if (tab) activate(tab, false);
      });

      tablist.addEventListener('keydown', function (e) {
        var i = tabs.indexOf(document.activeElement);
        if (i === -1) return;
        var moves = { ArrowRight: 1, ArrowLeft: -1 };
        if (e.key in moves) {
          e.preventDefault();
          activate(tabs[(i + moves[e.key] + tabs.length) % tabs.length], true);
        } else if (e.key === 'Home') {
          e.preventDefault();
          activate(tabs[0], true);
        } else if (e.key === 'End') {
          e.preventDefault();
          activate(tabs[tabs.length - 1], true);
        }
      });
    });
  }

  function initDemoTriggers(root) {
    root = root || document;

    root.querySelectorAll('[data-demo-toast]').forEach(function (btn) {
      if (btn.dataset.demoBound) return;
      btn.dataset.demoBound = '1';
      btn.addEventListener('click', function () {
        var variant = btn.dataset.demoToast;
        var messages = {
          success: 'Invoice sent',
          error: 'That card was declined',
          pending: 'Saving…',
          info: 'Reminder scheduled for Monday',
        };
        window.Fernwell.toast.show(messages[variant] || 'Done', { variant: variant });
      });
    });

    root.querySelectorAll('[data-demo-loading]').forEach(function (btn) {
      if (btn.dataset.demoBound) return;
      btn.dataset.demoBound = '1';
      btn.addEventListener('click', function () {
        window.Fernwell.loading.setButtonLoading(btn, 'Sending…');
        setTimeout(function () {
          window.Fernwell.loading.resetButtonLoading(btn);
        }, 1800);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initDemoTabs();
    initDemoTriggers();
  });
})();
