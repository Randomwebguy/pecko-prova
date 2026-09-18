/* Tanıtım provası — üründeki dört ekranın aynısı.
 * Her adımda tek fikir; kural, fikrin altında sessiz bir dipnot. */
(function () {
  'use strict';
  var P = window.PECKO;
  var $ = function (id) { return document.getElementById(id); };
  var S = P.load();
  if (S.status !== 'active') { location.replace('../onay/?yeni=1'); return; }

  var c = P.CUZDAN;
  var yuzde = function (o) { return Math.round(o * 100); };
  var SVG = function (yol) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" '
      + 'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + yol + '</svg>';
  };

  var ADIMLAR = [
    {
      cizim: '<rect x="3" y="6" width="18" height="12" rx="2.5"/><path d="M3 10.5h18"/><path d="M6.5 14.5h4"/><circle cx="17" cy="14.5" r="1.4"/>',
      baslik: 'Kartınız hazır',
      metin: 'Üyelik kodunuz bu. Kasada söylemeniz yeterli.',
      kod: true,
    },
    {
      cizim: '<circle cx="12" cy="12" r="8.6"/><path d="M12 3.4v3"/><path d="M12 17.6v3"/><path d="M3.4 12h3"/><path d="M17.6 12h3"/><path d="m8.6 12 2.3 2.3 4.5-4.6"/>',
      baslik: c.turUzunlugu + ' alışveriş, bir hediye',
      metin: 'Tur dolunca, o turda ödediğiniz tutarın <strong>%' + yuzde(c.oran) + "'i</strong> hediye bakiye olarak hesabınıza geçer.",
      not: 'Aynı gün içindeki fişler tek alışveriş sayılır; günlük toplamın '
        + P.tlkKisa(c.enAzAlisverisKurus) + ' ve üzeri olması gerekir.',
    },
    {
      cizim: '<path d="M4.6 11.6h14.8V20H4.6z"/><path d="M3.6 7.8h16.8v3.8H3.6z"/><path d="M12 7.8V20"/><path d="M12 7.8S10.8 4.2 8.8 4.2a1.9 1.9 0 0 0 0 3.6z"/><path d="M12 7.8s1.2-3.6 3.2-3.6a1.9 1.9 0 0 1 0 3.6z"/>',
      baslik: 'Bakiyeniz kasada iner',
      metin: 'Kasada kodunuzu söylediğinizde hediye bakiyeniz tutardan düşülür. Başka bir şey yapmanıza gerek yok.',
      not: 'Bir alışverişin en fazla %' + yuzde(c.tavanOrani) + "'ini karşılar, "
        + c.gecerlilikGun + ' gün geçerlidir ve nakde çevrilmez.',
    },
    {
      cizim: '<rect x="3.2" y="3" width="10" height="18" rx="2.4"/><path d="M6.4 18.4h3.6"/><path d="M16.2 8.6a5 5 0 0 1 0 6.8"/><path d="M19.4 5.8a9 9 0 0 1 0 12.4"/>',
      baslik: 'Buraya dönmek kolay',
      metin: 'Kasadaki etikete telefonunuzu okuttuğunuzda bu uygulama açılır. Uygulama yüklemenize gerek yok.',
      not: 'Girişiniz siz çıkana kadar açık kalır; bakiyenizi ve alışverişlerinizi alttaki sekmelerden takip edersiniz.',
    },
  ];

  var adim = 1;

  function bitir() {
    S.onboarded = true;
    P.save(S);
    location.href = '../puan/';
  }

  function ciz() {
    var a = ADIMLAR[adim - 1];
    var kap = $('ilerleme');
    kap.innerHTML = '';
    ADIMLAR.forEach(function (_, i) {
      var n = document.createElement('span');
      if (i + 1 === adim) n.className = 'acik';
      kap.appendChild(n);
    });
    kap.setAttribute('aria-label', adim + ' / ' + ADIMLAR.length + '. adım');
    $('cizim').innerHTML = SVG(a.cizim);
    $('baslik').textContent = a.baslik;
    $('metin').innerHTML = a.metin;
    $('not').hidden = !a.not;
    if (a.not) $('not').textContent = a.not;
    $('kod-kart').hidden = !a.kod;
    if (a.kod) $('kod').textContent = S.code;
    var son = adim === ADIMLAR.length;
    $('devam').textContent = son ? 'Hadi başlayalım' : 'Devam';
    $('gec').hidden = son;
    window.scrollTo(0, 0);
  }

  $('devam').addEventListener('click', function () {
    if (adim === ADIMLAR.length) return bitir();
    adim += 1;
    ciz();
  });
  $('gec').addEventListener('click', bitir);
  ciz();
})();
