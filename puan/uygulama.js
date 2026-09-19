/* Üye uygulaması provası.
 *
 * Ürünle aynı ekranlar, aynı stil dosyası, aynı simgeler; veriler tarayıcıdaki
 * prova durumundan geliyor. Sunucu yok, bu yüzden "oturum" da yok: uygulamanın
 * kalıcı girişini burada localStorage temsil ediyor.
 */
(function () {
  'use strict';
  var P = window.PECKO;
  var S = window.PECKO_SIMGE;
  var $ = function (id) { return document.getElementById(id); };
  var D = P.load();
  var c = P.CUZDAN;
  var yuzde = function (o) { return Math.round(o * 100); };
  var kisaTl = function (kurus) { return Math.round((kurus || 0) / 100).toLocaleString('tr-TR') + ' TL'; };

  var SEKME = {
    kart: ['s-kart', 'Kartım', 'Hediye bakiyen, tur durumun ve üyelik kodun.', '/sadakat/uye'],
    gecmis: ['s-gecmis', 'Geçmiş', 'Alışveriş ve bakiye hareketlerinin tamamı.', '/sadakat/uye/gecmis'],
    fis: ['s-fis', 'Fiş yükle', 'Alışverişini fiş fotoğrafıyla hesabına ekle.', '/sadakat/uye/fis'],
    hesap: ['s-hesap', 'Hesabım', 'Üyelik, izinler ve veri tercihlerin.', '/sadakat/uye/hesap'],
  };
  var SIRA = [['kart', 'Kartım'], ['gecmis', 'Geçmiş'], ['fis', 'Fiş'], ['hesap', 'Hesap']];

  function kalanGun(ts) {
    if (!ts) return null;
    var f = ts - Date.now();
    return f <= 0 ? 0 : Math.ceil(f / 86400000);
  }
  function kisaTarih(ts) {
    return new Date(ts).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  }
  function uzunGun(ts) {
    return new Date(ts).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
      .toLocaleUpperCase('tr-TR');
  }
  function bosDurum(ikon, baslik, alt) {
    return '<div class="kart"><div class="bos">' + S(ikon) + '<b>' + baslik + '</b><span>' + alt + '</span></div></div>';
  }

  /* --- ekranlar --- */

  function kartCiz() {
    var tur = P.turDurumu(D);
    var bakiye = P.aktifBakiye(D);
    var bekleyen = P.bekleyenBakiye(D);
    var ilk = P.ilkSonKullanma(D);
    var gun = ilk ? kalanGun(ilk.sonKullanmaTs) : null;
    var noktalar = '';
    for (var i = 0; i < tur.uzunluk; i++) noktalar += '<i class="' + (i < tur.alisveris ? 'dolu' : '') + '"></i>';

    $('s-kart').innerHTML =
      '<div class="hero">'
      + '<p class="etiket">KULLANILABİLİR HEDİYE BAKİYESİ</p>'
      + '<div class="hero-satir">'
      +   '<p class="tutar">' + Math.round(bakiye / 100).toLocaleString('tr-TR') + ' <small>TL</small></p>'
      +   (gun !== null ? '<span class="rozet uyari">' + gun + ' gün kaldı</span>' : '')
      + '</div>'
      + '<div class="hero-satir">'
      +   '<span class="rozet acik">' + D.code + '</span>'
      +   (ilk ? '<span class="etiket">Son kullanım ' + kisaTarih(ilk.sonKullanmaTs) + '</span>' : '')
      + '</div>'
      + '<p class="ipucu-satir">' + S('kalkan') + ' Bir alışverişin en fazla %' + yuzde(c.tavanOrani) + "'inde kullanabilirsin.</p>"
      + '</div>'

      + '<div class="hizli">'
      +   '<a class="dugme birincil" href="#hesap" data-git="hesap">' + S('karekod', 2) + 'Kodu göster</a>'
      +   '<a class="dugme ikincil" href="../tanitim/">' + S('soru', 2) + 'Nasıl kazanılır?</a>'
      + '</div>'

      + (bekleyen ? '<div class="uyari bilgi">' + kisaTl(bekleyen) + ' bugün kazanıldı; yarından itibaren kullanabilirsin.</div>' : '')

      + '<div class="kart">'
      +   '<div class="tur-ust"><div>'
      +     '<p class="baslik-sm">Alışveriş turun</p>'
      +     '<p class="mini">' + (tur.kalan ? tur.kalan + ' alışveriş sonra yeni bakiye' : 'Tur doldu') + '</p>'
      +   '</div><div class="tur-sayi">' + tur.alisveris + ' <span>/ ' + tur.uzunluk + '</span></div></div>'
      +   '<div class="noktalar" role="img" aria-label="' + tur.alisveris + ' / ' + tur.uzunluk + ' alışveriş">' + noktalar + '</div>'
      +   '<div class="kutucuklar">'
      +     '<div class="kutucuk"><b>' + kisaTl(tur.netKurus) + '</b><span>Bu turdaki net harcama</span></div>'
      +     '<div class="kutucuk"><b>%' + yuzde(c.oran) + '</b><span>Tur sonunda hediye bakiye</span></div>'
      +   '</div>'
      + '</div>'

      + '<div class="serit"><span class="im">' + S('hediye', 1.9) + '</span><div>'
      +   '<b>' + c.turUzunlugu + ' alışveriş = 1 tur</b>'
      +   '<span>Tur tamamlandığında net harcamanın %' + yuzde(c.oran) + "'i hediye bakiye olur.</span>"
      + '</div></div>';
  }

  function gecmisCiz() {
    var olaylar = [];
    (D.alisverisler || []).forEach(function (a) {
      var notlar = [];
      if (a.sayildi) notlar.push('Tur ' + a.turNo); else notlar.push('Tura sayılmadı');
      if (a.fis > 1) notlar.push(a.fis + ' fiş birleştirildi');
      olaylar.push({ tur: 'alisveris', ts: a.ts, ikon: 'torba', renk: '', baslik: 'Peçko Fırın alışverişi',
        alt: notlar.join(' · '), miktar: kisaTl(a.netKurus), sinif: '' });
      if (a.bakiyeKurus) {
        olaylar.push({ tur: 'bakiye', ts: a.ts + 1, ikon: 'para', renk: 'yesil', baslik: 'Hediye bakiye kullanıldı',
          alt: 'Kasada kullanım', miktar: '−' + kisaTl(a.bakiyeKurus), sinif: 'eksi' });
      }
    });
    ((D.cuzdan && D.cuzdan.partiler) || []).forEach(function (p) {
      olaylar.push({ tur: 'bakiye', ts: p.kazanildiTs, ikon: 'hediye', renk: 'turuncu',
        baslik: p.turNo ? 'Tur tamamlandı' : 'Hediye bakiye',
        alt: (p.turNo ? 'Tur ' + p.turNo + ' · ' : '') + 'Son kullanım ' + kisaTarih(p.sonKullanmaTs),
        miktar: '+' + kisaTl(p.tutar), sinif: 'arti' });
    });
    olaylar.sort(function (a, b) { return b.ts - a.ts; });

    var ayBasi = new Date(); ayBasi.setDate(1); ayBasi.setHours(0, 0, 0, 0);
    var ayToplam = (D.alisverisler || []).filter(function (a) { return a.ts >= ayBasi.getTime(); })
      .reduce(function (t, a) { return t + a.netKurus; }, 0);
    var ayAdi = new Date().toLocaleDateString('tr-TR', { month: 'long' }).toLocaleUpperCase('tr-TR');

    var bugun = uzunGun(Date.now());
    var govde = '';
    if (!olaylar.length) {
      govde = bosDurum('torba', 'Henüz hareket yok',
        'İlk alışverişin kasada işlendiğinde burada görünür. ' + c.turUzunlugu + ' alışverişte bir hediye bakiye kazanırsın.');
    } else {
      var oncekiGun = null;
      govde = '<ul class="akis">';
      olaylar.forEach(function (o) {
        var ad = uzunGun(o.ts);
        if (ad !== oncekiGun) {
          govde += '<li class="gun" data-tur="baslik">' + ad + (ad === bugun ? ' · BUGÜN' : '') + '</li>';
          oncekiGun = ad;
        }
        govde += '<li class="olay" data-tur="' + o.tur + '">'
          + '<span class="olay-im ' + o.renk + '">' + S(o.ikon) + '</span>'
          + '<div><b>' + o.baslik + '</b>' + (o.alt ? '<span>' + o.alt + '</span>' : '') + '</div>'
          + '<span class="miktar ' + o.sinif + '">' + o.miktar + '</span></li>';
      });
      govde += '</ul>';
    }

    $('s-gecmis').innerHTML =
      '<div class="secim" data-suzgec>'
      + '<button type="button" class="acik" data-tur="hepsi">Tümü</button>'
      + '<button type="button" data-tur="alisveris">Alışveriş</button>'
      + '<button type="button" data-tur="bakiye">Bakiye</button>'
      + '</div>'
      + '<div class="ozet">'
      +   '<div><label>' + ayAdi + ' ALIŞVERİŞİ</label><strong>' + kisaTl(ayToplam) + '</strong></div>'
      +   '<div><label>AKTİF BAKİYE</label><strong class="turuncu">' + kisaTl(P.aktifBakiye(D)) + '</strong></div>'
      + '</div>' + govde;
    suzgeciBagla();
  }

  var DURUM = { 'onaylandı': ['olumlu', 'Onaylandı'], 'bekliyor': ['bekliyor', 'İnceleniyor'], 'reddedildi': ['', 'Reddedildi'] };

  function fisCiz() {
    var liste = D.receipts || [];
    var satirlar = liste.map(function (r) {
      var d = DURUM[r.durum] || ['', r.durum];
      return '<div class="fis-satir"><span class="fis-im" aria-hidden="true"></span>'
        + '<span class="orta"><b>' + r.t.split(' ')[0] + (r.tutar ? ' · ' + P.tl(r.tutar) : '') + '</b>'
        + '<span>' + r.t.split(' ')[1] + (r.durum === 'reddedildi' && r.sebep ? ' · ' + r.sebep : '') + '</span></span>'
        + '<span class="durum ' + d[0] + '">' + d[1] + '</span></div>';
    }).join('');

    $('s-fis').innerHTML =
      '<form class="yukle" id="fis-form">'
      + '<div class="kamera">' + S('kamera') + '</div>'
      + '<h2>Fişini fotoğraflayıp gönder</h2>'
      + '<p>Fişin tamamı kadrajda, düz ve okunaklı olsun. Sistem tutarı ve tarihi kontrol eder.</p>'
      + '<div class="uyari" id="fis-durum" hidden></div>'
      + '<label class="dugme birincil genis">' + S('kamera', 2) + '<span id="fis-ad">Fotoğraf seç</span>'
      +   '<input type="file" accept="image/*" id="fis-girdi"></label>'
      + '<button class="dugme ikincil genis" type="submit">Gönder</button>'
      + '</form>'
      + '<div class="ipuclari">'
      +   '<div class="ipucu"><div class="n">1</div><b>Tamamı görünsün</b><span>Kenarlar kesilmesin</span></div>'
      +   '<div class="ipucu"><div class="n">2</div><b>Net çek</b><span>Yazılar okunabilsin</span></div>'
      +   '<div class="ipucu"><div class="n">3</div><b>Aynı gün sorun değil</b><span>Fişler birleştirilir</span></div>'
      + '</div>'
      + '<div class="bolum-basi"><h2>Son gönderdiklerim</h2></div>'
      + (liste.length ? '<div class="kart fis-listesi">' + satirlar + '</div>'
        : bosDurum('fis', 'Henüz fiş göndermedin', 'Gönderdiğin fişlerin durumunu bu listeden takip edersin.'));
    fisBagla();
  }

  function hesapCiz() {
    $('s-hesap').innerHTML =
      '<div class="profil">'
      + '<div class="avatar" aria-hidden="true">' + D.code.replace(/[^A-Z0-9]/g, '').slice(0, 2) + '</div>'
      + '<div><b>Peçko Fırın üyesi</b><span>' + (D.phone ? P.telMaske(D.phone) : '—') + ' · Üyelik aktif</span></div>'
      + '</div>'

      + '<div class="uye-kart" id="hesap-kod"><label>ÜYELİK KODUN</label>'
      + '<div class="kod">' + D.code + '</div>'
      + '<div class="satir"><span class="etiket">Kasada bu kodu söyle</span>'
      + '<span class="etiket">Üyelik ' + String(D.activatedAt || '').split(' ')[0] + '</span></div></div>'

      + '<div class="ayarlar"><label class="ayar">'
      + '<span class="im">' + S('izin') + '</span>'
      + '<span class="metin"><b>Kampanya mesajları</b><span>WhatsApp\'tan indirim ve yenilikler</span></span>'
      + '<input class="anahtar" type="checkbox" id="izin"' + (D.marketing ? ' checked' : '') + '></label></div>'

      + '<div class="ayarlar">'
      + '<a class="ayar" href="../onay/?oku=1"><span class="im">' + S('kalkan') + '</span>'
      +   '<span class="metin"><b>Aydınlatma metni</b><span>KVKK ve veri işleme bilgileri</span></span><span class="ok">›</span></a>'
      + '<a class="ayar" href="../onay/?oku=1#haklar"><span class="im">' + S('belge') + '</span>'
      +   '<span class="metin"><b>Verilerim</b><span>Hakkında tutulan verilerin dökümünü isteyebilirsin</span></span><span class="ok">›</span></a>'
      + '<div class="ayar"><span class="im">' + S('cihaz') + '</span>'
      +   '<span class="metin"><b>Açık oturumlar</b><span>' + P.cihazAdi() + ' · aktif</span></span></div>'
      + '</div>'

      + '<div class="ayarlar">'
      + '<button class="ayar" type="button" id="cikis"><span class="im">' + S('cikis') + '</span>'
      +   '<span class="metin"><b>Çıkış yap</b><span>Bu cihazdaki oturumu kapat</span></span><span class="ok">›</span></button>'
      + '<a class="ayar" href="../onay/?oku=1#haklar"><span class="im">' + S('cop') + '</span>'
      +   '<span class="metin"><b class="tehlike">Üyeliği sil</b><span>Başvuru yolu aydınlatma metninde · geri alınamaz</span></span><span class="ok">›</span></a>'
      + '</div>'

      + '<p class="yasal">Tur ve bakiye bildirimleri üyeliğin işleyişi gereği gönderilir. '
      + 'Kampanya mesajları tercihini istediğin zaman değiştirebilirsin.</p>';

    $('izin').addEventListener('change', function () {
      D.marketing = this.checked;
      P.event(D, 'Kampanya izni ' + (this.checked ? 'verildi' : 'geri alındı') + ' (uygulama)', 'izin', 0);
      P.save(D);
    });
    $('cikis').addEventListener('click', function () {
      D.oturum = false; P.save(D); girisiAc();
    });
  }

  /* --- süzgeç ve fiş --- */

  function suzgeciBagla() {
    var suzgec = document.querySelector('[data-suzgec]');
    var akis = document.querySelector('.akis');
    if (!suzgec || !akis) return;
    suzgec.addEventListener('click', function (e) {
      var dugme = e.target.closest('button[data-tur]');
      if (!dugme) return;
      var tur = dugme.getAttribute('data-tur');
      var hepsi = suzgec.querySelectorAll('button');
      for (var i = 0; i < hepsi.length; i++) hepsi[i].className = hepsi[i] === dugme ? 'acik' : '';
      var satirlar = akis.children;
      for (var j = 0; j < satirlar.length; j++) {
        var t = satirlar[j].getAttribute('data-tur');
        satirlar[j].hidden = tur !== 'hepsi' && t !== 'baslik' && t !== tur;
      }
      for (var k = 0; k < satirlar.length; k++) {
        if (satirlar[k].getAttribute('data-tur') !== 'baslik') continue;
        var bos = true;
        for (var m = k + 1; m < satirlar.length; m++) {
          if (satirlar[m].getAttribute('data-tur') === 'baslik') break;
          if (!satirlar[m].hidden) { bos = false; break; }
        }
        satirlar[k].hidden = bos;
      }
    });
  }

  function fisBagla() {
    var girdi = $('fis-girdi'), ad = $('fis-ad'), kutu = $('fis-durum');
    var gorsel = null;
    girdi.addEventListener('change', function () {
      var d = girdi.files && girdi.files[0];
      ad.textContent = d ? d.name : 'Fotoğraf seç';
      gorsel = null;
      if (!d) return;
      var fr = new FileReader();
      fr.onload = function () { gorsel = fr.result; };
      fr.readAsDataURL(d);
    });
    $('fis-form').addEventListener('submit', function (e) {
      e.preventDefault();
      function yaz(metin, sinif) { kutu.textContent = metin; kutu.className = 'uyari ' + sinif; kutu.hidden = false; }
      if (!girdi.files || !girdi.files[0]) return yaz('Önce fişin fotoğrafını seç.', 'hata');
      var okuma = P.fisOku(D, 'temiz', Date.now() % 1000000);
      var sonuc = P.fisGonder(D, okuma, gorsel || P.fisGorseli(okuma));
      if (sonuc.durum === 'reddedildi') yaz(sonuc.sebep, 'hata');
      else yaz('Fişin alındı: ' + P.tl(sonuc.fis.tutar) + '.', 'bilgi');
      P.save(D);
      fisCiz();
    });
  }

  /* --- sekmeler --- */

  function sekmeCubugu(aktif) {
    $('sekmeler').innerHTML = SIRA.map(function (x) {
      return '<a href="#' + x[0] + '" data-git="' + x[0] + '" class="' + (x[0] === aktif ? 'acik' : '') + '">'
        + S(x[0] === 'kart' ? 'kart' : x[0] === 'gecmis' ? 'gecmis' : x[0] === 'fis' ? 'fis' : 'hesap')
        + '<span>' + x[1] + '</span></a>';
    }).join('');
  }

  function git(ad) {
    if (!SEKME[ad]) ad = 'kart';
    Object.keys(SEKME).forEach(function (k) { $(SEKME[k][0]).hidden = k !== ad; });
    $('baslik').textContent = SEKME[ad][1];
    $('alt').textContent = SEKME[ad][2];
    $('path').textContent = SEKME[ad][3];
    $('ust-eylem').innerHTML = ad === 'fis' ? '<span class="rozet olumlu">Güvenli</span>'
      : ad === 'kart' ? '<a class="simge-dugme" href="#hesap" data-git="hesap" aria-label="Hesabım">' + S('zil') + '</a>' : '';
    sekmeCubugu(ad);
    if (ad === 'kart') kartCiz();
    if (ad === 'gecmis') gecmisCiz();
    if (ad === 'fis') fisCiz();
    if (ad === 'hesap') hesapCiz();
    window.scrollTo(0, 0);
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('[data-git]') : null;
    if (!a) return;
    e.preventDefault();
    location.hash = a.getAttribute('data-git');
    git(a.getAttribute('data-git'));
  });

  /* --- oturum --- */

  function uygulamayiAc() {
    $('giris').hidden = true;
    $('sekmeler').hidden = false;
    git((location.hash || '#kart').slice(1));
  }

  function girisiAc() {
    $('giris').hidden = false;
    $('sekmeler').hidden = true;
    Object.keys(SEKME).forEach(function (k) { $(SEKME[k][0]).hidden = true; });
    $('baslik').textContent = 'Giriş yap';
    $('alt').textContent = 'Üyelik kodun, bakiyen ve alışverişlerin burada.';
    $('path').textContent = '/sadakat/uye/giris';
    $('ust-eylem').innerHTML = '';
    var sifresiz = D.status === 'active' && !D.sifre;
    $('sifresiz').hidden = !sifresiz;
    $('giris-form').hidden = sifresiz;
  }

  $('giris-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var tel = P.telTemiz(this.telefon.value);
    var sifre = this.sifre.value;
    var hata = $('giris-hata');
    if (!tel || tel !== D.phone || !sifre || P.sifreOzet(sifre) !== D.sifre) {
      hata.textContent = 'Numara veya şifre hatalı.';
      hata.hidden = false;
      return;
    }
    hata.hidden = true;
    D.oturum = true;
    P.save(D);
    uygulamayiAc();
  });

  /* --- açılış --- */

  $('marka-im').innerHTML = S('marka', 2);
  if (D.status === 'active' && D.code) {
    if (D.oturum === false) girisiAc();
    else if (!D.onboarded) { location.replace('../tanitim/'); return; }
    else { D.oturum = true; P.save(D); uygulamayiAc(); }
  } else {
    location.replace('../onay/?yeni=1');
  }

  window.addEventListener('hashchange', function () {
    if (!$('sekmeler').hidden) git((location.hash || '#kart').slice(1));
  });
})();
