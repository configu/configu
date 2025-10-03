/* eslint-disable no-undef */

const getImportMetaUrl = () =>
  typeof document === 'undefined'
    ? new URL(`file:${__filename}`).href
    : (document.currentScript && document.currentScript.src) || new URL('main.js', document.baseURI).href;

export const importMetaUrl = /* @__PURE__ */ getImportMetaUrl();
