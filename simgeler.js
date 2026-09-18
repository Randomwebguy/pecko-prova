/* Simge seti — ürünün src/views/app.js dosyasındaki SIMGE tablosunun kopyası.
 * Prova neyi gösteriyorsa müşteri onu görsün diye tek kaynaktan geliyor. */
(function (w) {
  'use strict';
  var SIMGE = {
    marka: '<path d="M7 8c0-2.8 2.2-5 5-5s5 2.2 5 5v2H7V8Z"/><path d="M5 10h14v8a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-8Z"/><path d="M9 14h6"/>',
    kart: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M7 9h10M7 14h6"/>',
    gecmis: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
    fis: '<path d="M4 7h4l2-2h4l2 2h4v12H4z"/><circle cx="12" cy="13" r="4"/>',
    hesap: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    kalkan: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
    karekod: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z"/><path d="M15 14h2v2h-2zM19 14h1v4h-3v2h-3v-3"/>',
    soru: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.7 2.7 0 1 1 4.5 2c-1.1.9-2 1.4-2 3"/><path d="M12 18h.01"/>',
    hediye: '<path d="M3 11h18v8H3z"/><path d="M12 11v8M4 7h16v4H4z"/><path d="M12 7H8.5A2.5 2.5 0 1 1 11 4.5V7Zm0 0h3.5A2.5 2.5 0 1 0 13 4.5V7Z"/>',
    torba: '<path d="M3 7h18l-2 12H5L3 7Z"/><path d="M8 7a4 4 0 0 1 8 0"/>',
    para: '<path d="M12 2v20M5 7h10.5a3.5 3.5 0 0 1 0 7H8.5a3.5 3.5 0 0 0 0 7H19"/>',
    kamera: '<path d="M4 7h4l2-2h4l2 2h4v12H4z"/><circle cx="12" cy="13" r="4"/>',
    zil: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
    izin: '<path d="M20 11.5a8 8 0 1 1-3.2-6.4"/><path d="M20 4v6h-6"/>',
    belge: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    cihaz: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h10M7 13h6"/>',
    cikis: '<path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"/>',
    cop: '<path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15M10 10v7M14 10v7"/>',
    nfc: '<rect x="3.2" y="3" width="10" height="18" rx="2.4"/><path d="M6.4 18.4h3.6"/><path d="M16.2 8.6a5 5 0 0 1 0 6.8"/><path d="M19.4 5.8a9 9 0 0 1 0 12.4"/>',
    tik: '<circle cx="12" cy="12" r="8.6"/><path d="m8.6 12 2.3 2.3 4.5-4.6"/>',
};

  w.PECKO_SIMGE = function (ad, kalinlik) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (kalinlik || 1.8)
      + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (SIMGE[ad] || '') + '</svg>';
  };
})(window);
