/* Kayıt ve SMS doğrulaması provası.
 *
 * Ürünle aynı iki adım: form kodu tetikler, kod üyeliği açar. Fark, kodun
 * gerçekten gönderilmemesi — prova kutusunda ekranda gösteriliyor. Numarayı
 * kanıtlayan şey burada bir şey değil; gerçek sistemde SMS.
 */
(function () {
  'use strict';
  var P = window.PECKO;
  var $ = function (id) { return document.getElementById(id); };
  var S = P.load();
  var q = new URLSearchParams(location.search);

  // "Bu telefonla başka biri üye olacak": provada cihaz tek üyelik tutuyor.
  if (q.get('yeni') === '1' && S.status === 'active') { P.reset(); S = P.load(); }
  if (q.get('nokta')) { S.token = q.get('nokta').toUpperCase().slice(0, 20); P.save(S); }

  var bekleyen = null;   // { tel, sifre, pazarlama, kod, deneme }

  function hata(kutu, mesaj) {
    kutu.textContent = mesaj;
    kutu.hidden = !mesaj;
    if (mesaj) kutu.scrollIntoView({ block: 'center' });
  }

  function kodEkrani() {
    $('form-bolum').hidden = true;
    $('kod-bolum').hidden = false;
    $('baslik').textContent = 'Numaranızı doğrulayın';
    $('alt').textContent = P.telMaske(bekleyen.tel) + ' numarasına altı haneli bir kod gönderdik.';
    $('path').textContent = '/sadakat/uye/dogrula';
    $('prova-kod').textContent = bekleyen.kod;
    $('kod').value = '';
    // Önce başa sar, sonra odaklan: odak sayfayı kaydırınca başlık yapışkan
    // adres çubuğunun altında kalıyordu.
    window.scrollTo(0, 0);
    $('kod').focus({ preventScroll: true });
  }

  function yeniKod() {
    return String(Math.floor(Math.random() * 900000) + 100000);
  }

  $('kayit').addEventListener('submit', function (e) {
    e.preventDefault();
    var tel = P.telTemiz($('tel').value);
    if (!tel) return hata($('hata'), 'Telefon numarası geçersiz görünüyor (örnek: 0532 123 45 67).');
    var sifreSorun = P.sifreSorunu($('sifre').value);
    if (sifreSorun) return hata($('hata'), sifreSorun);

    var eksik = [];
    if (!$('okudum').checked) eksik.push("Aydınlatma Metni'ni okuduğunuzu");
    if (!$('riza').checked) eksik.push('program üyeliği için açık rızanızı');
    if (!$('yas').checked) eksik.push('18 yaşından büyük olduğunuzu');
    if (eksik.length) {
      return hata($('hata'), 'Devam etmek için lütfen ' + eksik.join(', ')
        + ' onaylayın. Kampanya izni isteğe bağlıdır.');
    }

    hata($('hata'), '');
    bekleyen = {
      tel: tel,
      sifre: P.sifreOzet($('sifre').value),
      pazarlama: $('pazarlama').checked,
      kod: yeniKod(),
      deneme: 0,
    };
    kodEkrani();
  });

  $('dogrula').addEventListener('submit', function (e) {
    e.preventDefault();
    var girilen = $('kod').value.replace(/\D/g, '');
    if (girilen !== bekleyen.kod) {
      bekleyen.deneme += 1;
      var kalan = 5 - bekleyen.deneme;
      if (kalan <= 0) {
        hata($('kod-hata'), 'Çok fazla hatalı deneme. Yeni kod isteyin.');
        return;
      }
      return hata($('kod-hata'), 'Kod doğru değil. ' + kalan + ' deneme hakkınız kaldı.');
    }

    // Numara kanıtlandı: üyelik açılır.
    hata($('kod-hata'), '');
    S.code = P.newCode();
    S.status = 'active';
    S.phone = bekleyen.tel;
    S.sifre = bekleyen.sifre;
    S.oturum = true;
    S.marketing = bekleyen.pazarlama;
    S.dogrulandi = true;
    S.createdAt = S.activatedAt = P.today() + ' ' + P.now();
    P.event(S, 'Üyelik açıldı · numara SMS ile doğrulandı', 'uyelik', 0);
    P.save(S);
    location.href = '../tanitim/';
  });

  $('yenile').addEventListener('click', function () {
    bekleyen.kod = yeniKod();
    bekleyen.deneme = 0;
    $('prova-kod').textContent = bekleyen.kod;
    hata($('kod-hata'), '');
    var bilgi = $('kod-bilgi');
    bilgi.textContent = 'Yeni kod gönderildi.';
    bilgi.hidden = false;
  });

  $('geri').addEventListener('click', function (e) {
    e.preventDefault();
    $('kod-bolum').hidden = true;
    $('form-bolum').hidden = false;
    $('baslik').textContent = 'Üye olun';
    $('alt').textContent = 'Numaranız, bir şifre ve onaylarınız yeterli.';
    $('path').textContent = '/sadakat/uye/kayit';
  });
})();
