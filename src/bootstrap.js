import { init } from './game/launcher';

init();

if (module.onReload) {
  module.onReload(() => {
    window.location.reload();
  });
}

