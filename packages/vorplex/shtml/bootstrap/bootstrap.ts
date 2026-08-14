import { ShtmlDocument } from '../src/shtml';

declare global {
  interface Window {
    bootstrappingStml?: boolean;
  }
}

if (!window.bootstrappingStml) {
  window.bootstrappingStml = true;

  async function bootstrap() {
    try {
      const base = document.baseURI.slice(0, document.baseURI.lastIndexOf('/') + 1);
      const shtmlDocument = await ShtmlDocument.load(document.body.innerHTML, {
        import: (path) => fetch(base + path).then((response) => response.text()),
      });
      document.body.replaceChildren();
      await shtmlDocument.mount(document.body);
    } catch (error) {
      console.error('[shtml] failed to bootstrap this page', error);
      document.body.replaceChildren();
      const pre = document.createElement('pre');
      pre.style.cssText = 'white-space:pre-wrap; color:#b00020; font:13px/1.5 ui-monospace,monospace; padding:16px; margin:0;';
      pre.textContent = `This page failed to render.\n\n${Error.isError(error) ? error.stack ?? error.message : String(error)}`;
      document.body.appendChild(pre);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
  } else {
    bootstrap();
  }
}
