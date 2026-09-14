// Entry for the <script>-tag build: exposes window.Fernwell and auto-inits.
import Fernwell from './index';

export * from './index';
export { default } from './index';

const script = typeof document !== 'undefined' ? document.currentScript : null;
if (typeof document !== 'undefined' && !(script && script.hasAttribute('data-fw-no-init'))) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Fernwell.init());
  } else {
    Fernwell.init();
  }
}
