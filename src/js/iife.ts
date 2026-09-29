// Entry for the <script>-tag build: exposes window.Fernwell and auto-inits.
import Fernwell from './index.js';

export * from './index.js';
export { default } from './index.js';

const script = typeof document !== 'undefined' ? document.currentScript : null;
if (typeof document !== 'undefined' && !(script && script.hasAttribute('data-fw-no-init'))) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Fernwell.init());
  } else {
    Fernwell.init();
  }
}
