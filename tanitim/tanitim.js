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
  var SVG = window.PECKO_SIMGE;

  var ADIMLAR = [
    {
      cizim: 'kart',
      baslik: 'Kartın hazır',
      metin: 'Üyelik kodun bu. Kasada söylemen yeterli.',
      kod: true,
    },
    {
      cizim: 'tik',
      baslik: c.turUzunlugu + ' alışveriş, bir hediye',
      metin: 'Tur dolunca, o turda ödediğin tutarın <strong>%' + yuzde(c.oran) + "'i</strong> hediye bakiye olarak hesabına geçer.",
      not: 'Aynı gün içindeki fişler tek alışveriş sayılır; günlük toplamın '
        + P.tlkKisa(c.enAzAlisverisKurus) + ' ve üzeri olması gerekir.',
    },
    {
      cizim: 'hediye',
      baslik: 'Bakiyen kasada iner',
      metin: 'Kasada kodunu söylediğinde hediye bakiyen tutardan düşülür. Başka bir şey yapmana gerek yok.',
      not: 'Bir alışverişin en fazla %' + yuzde(c.tavanOrani) + "'ini karşılar, "
        + c.gecerlilikGun + ' gün geçerlidir ve nakde çevrilmez.',
    },
    {
      cizim: 'nfc',
      baslik: 'Buraya dönmek kolay',
      metin: 'Kasadaki etikete telefonunu okuttuğunda bu uygulama açılır. Uygulama yüklemene gerek yok.',
      not: 'Girişin sen çıkana kadar açık kalır; bakiyeni ve alışverişlerini alttaki sekmelerden takip edersin.',
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
    $('cizim').innerHTML = SVG(a.cizim, 1.6);
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
