/* Peçko sadakat akış provası — ortak durum ve yardımcılar.
   Durum tarayıcıda (localStorage) tutulur, böylece açılış → kayıt → tanıtım →
   uygulama → kasa → panel sayfaları arasında gidip gelindiğinde akış kaldığı
   yerden sürer.

   İkinci sürümde gelen WhatsApp kanalı yok: müşteri her şeyi uygulamadan
   görüyor, WhatsApp yalnızca kampanya dağıtımının kanalı. Sohbet ekranı ve
   ona mesaj üreten metin motoru bu yüzden kaldırıldı; kasada ya da panelde
   yapılan işlem artık uygulamanın akışına (P.event) düşüyor. */
(function (w) {
  'use strict';

  // Model değiştiğinde anahtar da değişir: eski tarayıcı durumu yeni alanlarla
  // karışıp yarım bir cüzdan üretmesin.
  var KEY = 'pecko.sadakat.prova.v2';
  var P = {};

  P.BUSINESS = 'Peçko Fırın';     // sitedeki ticari ad
  // Ödül kataloğu ikinci aşama olarak duruyor: işletmenin onayladığı modelde
  // tek ödül hediye bakiye. Katalog açılırsa müşteri iki ayrı birim (puan ve
  // bakiye) taşımak zorunda kalır; o yüzden öntanımlı kapalı.
  P.ODUL_KATALOGU = false;
  P.rewardLabel = function (r) {
    return r.tur === 'yuzde' ? '%' + r.yuzde + ' indirim' : r.ad;
  };
  P.activeRewards = function (s) {
    var list = (s && s.rewards) || [];
    return list.filter(function (r) { return r.aktif; }).sort(function (a, b) { return a.bedel - b.bedel; });
  };
  // Instagram bonusu da bakiye veriyor: müşterinin tek bir cüzdanı olsun.
  P.IG = { handle: '@peckofirin', storyTl: 15, postTl: 30, max: 2, win: 60 };

  /* --- fiş okuma ---
     Fiş, alışverişi sisteme sokmanın yollarından biri: kasadan tutar girişi,
     fiş fotoğrafı ve (gerçek kurulumda) POS entegrasyonu aynı kaydı üretir. */
  P.RECEIPT = { enAz: 75, enFazlaSaat: 48, gunluk: 3, kontrolUstu: 1000, pencere: 60 };
  P.tl = function (n) {
    return Number(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL';
  };
  // Sayaç kutularında kuruş satırı kırar; oralarda tam TL gösterilir.
  P.tlKisa = function (n) { return Math.round(Number(n || 0)).toLocaleString('tr-TR') + ' TL'; };

  /* ================= HEDİYE BAKİYE =================
     İşletmenin modeli: müşteri 10 alışverişini tamamlayınca, o 10 alışverişte
     ödediği NET tutarın %5'i kadar hediye bakiye kazanır. Bakiye 30 gün
     geçerli ve yeni bir alışverişin en fazla %25'ini karşılayabilir.

     Kurallar ve gerekçeleri — hepsi birlikte çalışır, biri gevşetilince
     diğerleri açığı kapatmaz:

     1) NET tutar esas alınır. Bakiyeyle ödenen kısım harcamaya sayılmaz;
        aksi hâlde bakiye kendini besler (bakiyeyle alışveriş → yeni bakiye)
        ve iskonto bileşik faiz gibi büyür.
     2) Aynı gündeki fişler TEK alışveriş sayılır. Fişi bölerek sayacı
        şişirmenin önüne geçen madde budur.
     3) Alt sınırın altındaki gün alışveriş sayılmaz: 10 tane çay alıp
        döngü tamamlanamasın.
     4) Bakiye PARTİLER hâlinde tutulur; her partinin kendi son kullanma
        tarihi vardır ve harcarken önce en yakın sona erecek parti düşer.
        Tek bir sayı tutulsaydı hangi kısmın ne zaman öleceği bilinemezdi.
     5) Tavan BRÜT tutar üzerinden: 2.000 TL'lik fişte en fazla 500 TL.
        İşletmenin verdiği örnek de bunu söylüyor.
     6) İade, ait olduğu günün ve döngünün toplamından düşülür; döngü
        kapanmışsa kazanılan bakiyeden orantılı kesinti yapılır.
  */
  P.CUZDAN = {
    turUzunlugu: 10,        // kaç alışverişte bir bakiye
    oran: 0.05,             // döngü net harcamasının yüzdesi
    tavanOrani: 0.25,       // yeni alışverişin en fazla bu kadarı bakiyeyle
    gecerlilikGun: 30,
    enAzAlisverisKurus: 7500, // 75 TL — bu tutarın altındaki gün sayılmaz
    hatirlatmaGun: 7          // son kullanmaya bu kadar kalınca hatırlat
  };

  P.kurus = function (tl) { return Math.round(Number(tl || 0) * 100); };
  P.tlk = function (kurus) { return P.tl((kurus || 0) / 100); };
  P.tlkKisa = function (kurus) { return P.tlKisa((kurus || 0) / 100); };
  P.gunKodu = function (ts) {
    var d = new Date(ts == null ? Date.now() : ts);
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  };
  P.gunAdi = function (kod) {
    var p = String(kod).split('-');
    return p[2] + '.' + p[1] + '.' + p[0];
  };

  function cuzdan(s) {
    if (!s.cuzdan) s.cuzdan = { turNo: 1, turAlisveris: 0, turNetKurus: 0, partiler: [], gecmisTurlar: [] };
    if (!s.alisverisler) s.alisverisler = [];
    return s.cuzdan;
  }
  P.cuzdanKur = cuzdan;

  // Süresi dolan partiler burada kapanır: bakiye her okunduğunda tarih kontrol
  // edilir, ayrı bir zamanlayıcıya gerek kalmaz.
  P.bakiyeTemizle = function (s, simdi) {
    var c = cuzdan(s), t = simdi || Date.now(), dolan = 0;
    c.partiler.forEach(function (p) {
      if (p.kalan > 0 && p.sonKullanmaTs <= t) {
        // Ölen tutar ayrı saklanır: "kazanılan − kullanılan − dolan = açık"
        // eşitliği panelde kurulabilsin, arada kayıp bir kalem görünmesin.
        p.dolan = (p.dolan || 0) + p.kalan;
        dolan += p.kalan; p.kalan = 0; p.doldu = true;
      }
    });
    return dolan;
  };
  P.aktifBakiye = function (s, simdi) {
    var c = cuzdan(s), t = simdi || Date.now();
    return c.partiler.reduce(function (a, p) {
      return a + (p.sonKullanmaTs > t ? p.kalan : 0);
    }, 0);
  };
  // Müşteriye gösterilecek tek tarih: elindeki paranın ilk ölecek diliminin günü.
  P.ilkSonKullanma = function (s, simdi) {
    var c = cuzdan(s), t = simdi || Date.now();
    var acik = c.partiler.filter(function (p) { return p.kalan > 0 && p.sonKullanmaTs > t; })
      .sort(function (a, b) { return a.sonKullanmaTs - b.sonKullanmaTs; });
    return acik.length ? acik[0] : null;
  };
  /* "11. alışverişten itibaren kullanılabilecek" kuralı.
     Aynı gün içindeki alışverişler tek alışveriş sayıldığı için, 10. alışverişi
     tamamlayan günde yapılan ikinci bir alışveriş hâlâ 10. alışverişin parçası;
     11. alışveriş ancak ertesi bir günde olur. Bu yüzden bugün kazanılan bakiye
     bugün harcanamaz. Aksi hâlde müşteri ödülü kazandığı alışverişte kullanır ve
     işletmenin koyduğu kural delinir. */
  P.bekleyenBakiye = function (s, simdi) {
    var c = cuzdan(s), t = simdi || Date.now(), bugun = P.gunKodu(t);
    return c.partiler.reduce(function (a, p) {
      return a + (p.kalan > 0 && p.sonKullanmaTs > t && P.gunKodu(p.kazanildiTs) === bugun ? p.kalan : 0);
    }, 0);
  };
  P.kullanilabilir = function (s, brutKurus, simdi) {
    var tavan = Math.floor((brutKurus || 0) * P.CUZDAN.tavanOrani);
    var hazir = P.aktifBakiye(s, simdi) - P.bekleyenBakiye(s, simdi);
    return Math.max(0, Math.min(hazir, tavan));
  };

  // Bakiye harcanırken önce en yakın sona erecek parti düşer: müşterinin
  // parası boşa gitmesin.
  function bakiyeDus(s, kurus, simdi) {
    var c = cuzdan(s), t = simdi || Date.now(), kalan = kurus, kullanilan = [];
    var bugun = P.gunKodu(t);
    c.partiler.filter(function (p) {
      return p.kalan > 0 && p.sonKullanmaTs > t && P.gunKodu(p.kazanildiTs) !== bugun;
    })
      .sort(function (a, b) { return a.sonKullanmaTs - b.sonKullanmaTs; })
      .forEach(function (p) {
        if (kalan <= 0) return;
        var d = Math.min(p.kalan, kalan);
        p.kalan -= d; kalan -= d;
        kullanilan.push({ parti: p.id, tutar: d });
      });
    return { dusen: kurus - kalan, partiler: kullanilan };
  }

  function turKapat(s, simdi) {
    var c = cuzdan(s), t = simdi || Date.now();
    var bakiye = Math.floor(c.turNetKurus * P.CUZDAN.oran);
    var parti = {
      id: 'B' + t + '-' + c.turNo, turNo: c.turNo,
      kazanildiTs: t, sonKullanmaTs: t + P.CUZDAN.gecerlilikGun * 86400000,
      tutar: bakiye, kalan: bakiye
    };
    c.partiler.push(parti);
    c.gecmisTurlar.unshift({ no: c.turNo, alisveris: c.turAlisveris, netKurus: c.turNetKurus,
      bakiyeKurus: bakiye, kapanisTs: t, partiId: parti.id });
    c.turNo += 1; c.turAlisveris = 0; c.turNetKurus = 0;
    return parti;
  }

  /* Alışveriş kaydı. Aynı gün ikinci kez gelirse yeni alışveriş açılmaz,
     o günün kaydına eklenir — fiş bölme buradan engellenir. */
  P.alisverisEkle = function (s, o) {
    var c = cuzdan(s), t = o.ts || Date.now(), gun = P.gunKodu(t);
    var brut = Math.max(0, Math.round(o.brutKurus || 0));
    var bakiyeKurus = Math.max(0, Math.round(o.bakiyeKurus || 0));
    var net = Math.max(0, brut - bakiyeKurus);

    var kayit = null, i;
    for (i = 0; i < s.alisverisler.length; i++) if (s.alisverisler[i].gun === gun) { kayit = s.alisverisler[i]; break; }
    var yeniGun = !kayit;
    if (!kayit) {
      kayit = { id: 'A' + t, gun: gun, ts: t, brutKurus: 0, bakiyeKurus: 0, netKurus: 0,
        iadeKurus: 0, fis: 0, sayildi: false, turNo: c.turNo, kaynak: [] };
      s.alisverisler.unshift(kayit);
    }
    kayit.brutKurus += brut;
    kayit.bakiyeKurus += bakiyeKurus;
    kayit.netKurus += net;
    kayit.fis += 1;
    kayit.sonTs = t;
    if (o.kaynak) kayit.kaynak.push(o.kaynak);

    var kullanim = bakiyeKurus ? bakiyeDus(s, bakiyeKurus, t) : null;

    // Gün alt sınırı geçtiği anda bir alışveriş sayılır; aynı gün ikinci kez sayılmaz.
    var sayildiSimdi = false;
    if (!kayit.sayildi && kayit.netKurus >= P.CUZDAN.enAzAlisverisKurus) {
      kayit.sayildi = true; sayildiSimdi = true;
      kayit.turNo = c.turNo;
      c.turAlisveris += 1;
    }
    // Net tutar, günün ait olduğu döngüye yazılır.
    var acikTur = kayit.turNo === c.turNo;
    if (kayit.sayildi) {
      if (acikTur) c.turNetKurus += net;
      else P.kapaliTurGuncelle(s, kayit.turNo, net);
    }

    var parti = null;
    if (c.turAlisveris >= P.CUZDAN.turUzunlugu) parti = turKapat(s, t);

    return { alisveris: kayit, yeniGun: yeniGun, sayildi: sayildiSimdi, net: net,
      bakiyeKullanimi: kullanim, parti: parti, tur: P.turDurumu(s) };
  };

  // Kapanmış bir döngüye aynı gün içinde ek harcama gelirse ödül yeniden
  // hesaplanır: müşteriye "bu 10 alışverişin toplamının %5'i" sözü verildi.
  P.kapaliTurGuncelle = function (s, turNo, netFark) {
    var c = cuzdan(s);
    var g = c.gecmisTurlar.filter(function (x) { return x.no === turNo; })[0];
    if (!g) return null;
    g.netKurus = Math.max(0, g.netKurus + netFark);
    var yeni = Math.floor(g.netKurus * P.CUZDAN.oran);
    var fark = yeni - g.bakiyeKurus;
    g.bakiyeKurus = yeni;
    var p = c.partiler.filter(function (x) { return x.id === g.partiId; })[0];
    if (p) { p.tutar = yeni; p.kalan = Math.max(0, p.kalan + fark); }
    return { fark: fark, tur: g };
  };

  /* İade: ait olduğu günün ve döngünün toplamından düşülür. Gün alt sınırın
     altına inerse o alışveriş sayımdan da düşer. */
  P.iadeEkle = function (s, o) {
    var c = cuzdan(s), t = o.ts || Date.now();
    var tutar = Math.max(0, Math.round(o.tutarKurus || 0));
    var gun = o.gun || P.gunKodu(t);
    var kayit = s.alisverisler.filter(function (a) { return a.gun === gun; })[0];
    if (!kayit) return { ok: false, sebep: 'O güne ait alışveriş bulunamadı.' };
    var dusulen = Math.min(tutar, kayit.netKurus);
    if (!dusulen) return { ok: false, sebep: 'Bu günün net tutarı zaten sıfır.' };

    kayit.netKurus -= dusulen;
    kayit.iadeKurus += dusulen;
    var sayimDustu = false;
    if (kayit.sayildi && kayit.netKurus < P.CUZDAN.enAzAlisverisKurus) {
      kayit.sayildi = false; sayimDustu = true;
      if (kayit.turNo === c.turNo) c.turAlisveris = Math.max(0, c.turAlisveris - 1);
    }
    var bakiyeKesinti = 0;
    if (kayit.turNo === c.turNo) {
      c.turNetKurus = Math.max(0, c.turNetKurus - dusulen);
    } else {
      var g = P.kapaliTurGuncelle(s, kayit.turNo, -dusulen);
      if (g) bakiyeKesinti = -g.fark;
    }
    return { ok: true, dusulen: dusulen, sayimDustu: sayimDustu, bakiyeKesinti: bakiyeKesinti,
      alisveris: kayit, tur: P.turDurumu(s) };
  };

  P.turDurumu = function (s) {
    var c = cuzdan(s);
    var kalan = Math.max(0, P.CUZDAN.turUzunlugu - c.turAlisveris);
    return {
      no: c.turNo, alisveris: c.turAlisveris, uzunluk: P.CUZDAN.turUzunlugu, kalan: kalan,
      netKurus: c.turNetKurus,
      // "Şu an tamamlasan bu kadar" — müşteriyi bir sonraki alışverişe çeken sayı.
      tahminiBakiyeKurus: Math.floor(c.turNetKurus * P.CUZDAN.oran),
      ortalamaKurus: c.turAlisveris ? Math.round(c.turNetKurus / c.turAlisveris) : 0
    };
  };

  // Instagram paylaşımı da bakiye kazandırır: tek cüzdan, tek dil.
  P.bakiyeVer = function (s, kurus, sebep, simdi) {
    var c = cuzdan(s), t = simdi || Date.now();
    var parti = { id: 'B' + t + '-' + sebep, turNo: null, sebep: sebep,
      kazanildiTs: t, sonKullanmaTs: t + P.CUZDAN.gecerlilikGun * 86400000,
      tutar: kurus, kalan: kurus };
    c.partiler.push(parti);
    return parti;
  };

  /* --- üye uygulaması (2. sürüm) ------------------------------------------
     Kayıt numara + şifre + onaylarla yapılıyor, giriş kişi çıkana kadar açık
     kalıyor. Provada sunucu yok; "oturum" da localStorage'ta duruyor. */

  // 0532…, +90 532…, 90532… hepsi 905321234567'ye iner. Geçersizse null.
  P.telTemiz = function (ham) {
    var d = String(ham || '').replace(/\D/g, '');
    if (d.length === 10 && d[0] === '5') d = '90' + d;
    else if (d.length === 11 && d.slice(0, 2) === '05') d = '9' + d;
    else if (d.length === 12 && d.slice(0, 2) === '90') { /* hazır */ }
    else return null;
    return /^905\d{9}$/.test(d) ? d : null;
  };

  P.telMaske = function (d) {
    return String(d || '').replace(/^(\d{2})(\d{3})\d{3}(\d{2})(\d{2})$/, '+$1 $2 *** ** $4');
  };

  // Provanın şifreyi düz metin saklamaması için küçük bir özet (FNV-1a).
  // Gerçek sistemde şifre sunucuda scrypt ile özetlenir; buradaki yalnızca
  // "aynı şifre mi" sorusunu tarayıcıda cevaplamak için var.
  P.sifreOzet = function (sifre) {
    var h = 0x811c9dc5, i;
    for (i = 0; i < String(sifre).length; i++) {
      h ^= String(sifre).charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return 'p1$' + h.toString(16);
  };

  P.sifreSorunu = function (sifre) {
    var s = String(sifre || '');
    if (s.length < 8) return 'Şifre en az 8 karakter olmalı.';
    if (/^\d+$/.test(s)) return 'Şifre yalnızca rakamlardan oluşmasın.';
    return null;
  };

  // Açık oturumlar listesinin tek işi tanınmayan oturumu fark ettirmek;
  // "Başka bir cihaz" yazan satırlar bunu yapmaz.
  P.cihazAdi = function (ua) {
    var u = String(ua == null ? (w.navigator && w.navigator.userAgent) || '' : ua);
    if (!u) return 'Bilinmeyen cihaz';
    var platformlar = [[/iPhone/i, 'iPhone'], [/iPad/i, 'iPad'], [/Android/i, 'Android'],
      [/Macintosh|Mac OS X/i, 'Mac'], [/Windows/i, 'Windows'], [/Linux/i, 'Linux']];
    var tarayicilar = [[/SamsungBrowser/i, 'Samsung Internet'], [/Edg\//i, 'Edge'],
      [/OPR\/|Opera/i, 'Opera'], [/Firefox|FxiOS/i, 'Firefox'], [/CriOS|Chrome/i, 'Chrome'],
      [/Safari/i, 'Safari']];
    function bul(liste) {
      for (var i = 0; i < liste.length; i++) if (liste[i][0].test(u)) return liste[i][1];
      return null;
    }
    var ad = [bul(platformlar), bul(tarayicilar)].filter(Boolean).join(' · ');
    return ad || 'Bilinmeyen cihaz';
  };

  P.LEGAL_VERSION = '1.4';
  P.KVKK_URL = 'https://peckofirin.com.tr/sadakat/kvkk';

  /* --- üye kodu: gerçek 31 sembollü alfabe + ağırlıklı kontrol karakteri --- */
  var ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  P.checkChar = function (body) {
    var sum = 0;
    for (var i = 0; i < body.length; i++) sum += ALPHABET.indexOf(body[i]) * (i + 2);
    return ALPHABET[sum % ALPHABET.length];
  };
  P.newCode = function () {
    var b = '', i, r = new Uint32Array(6);
    if (w.crypto && w.crypto.getRandomValues) w.crypto.getRandomValues(r);
    else for (i = 0; i < 6; i++) r[i] = Math.floor(Math.random() * 4294967296);
    for (i = 0; i < 6; i++) b += ALPHABET[r[i] % ALPHABET.length];
    var full = b + P.checkChar(b);
    return 'PK-' + full.slice(0, 4) + '-' + full.slice(4);
  };
  // Kasada özensiz yazımı toparlar, kontrol karakteri tutmazsa null döner.
  P.normalizeCode = function (input) {
    if (input == null) return null;
    var s = String(input).toLocaleUpperCase('tr-TR').replace(/İ/g, 'I').replace(/[^A-Z0-9]/g, '');
    if (s.indexOf('PK') === 0 && s.length === 9) s = s.slice(2);
    if (s.length !== 7) return null;
    var body = s.slice(0, 6);
    if (P.checkChar(body) !== s[6]) return null;
    return 'PK-' + s.slice(0, 4) + '-' + s.slice(4);
  };

  /* --- durum --- */
  function blank() {
    return {
      token: 'KASA1', code: null, status: 'none',
      // Hediye bakiye cüzdanı ve günlük alışveriş kayıtları.
      cuzdan: null, alisverisler: null,
      marketing: false, ig: null, events: [], pending: null,
      // 2. sürüm: numara + şifreyle kalıcı oturum.
      phone: null, sifre: null, oturum: true, onboarded: false, dogrulandi: false,
      createdAt: null, activatedAt: null,
      rewards: null, staff: null, shift: null, audit: null, claims: null,
      campaigns: null, cards: null, iys: null, ornek: null,
      receipts: null, ledger: null, fisArm: null
    };
  }
  // Depolama kapalı olabilir (gizli sekme, engellenmiş site verisi): sayfa yine çalışmalı.
  var memory = null;
  P.load = function () {
    try {
      var raw = w.localStorage.getItem(KEY);
      if (raw) return Object.assign(blank(), JSON.parse(raw));
    } catch (e) { /* yoksayılır */ }
    return memory ? Object.assign(blank(), memory) : blank();
  };
  // P.yazildi: son kaydın diske gidip gitmediği. Fotoğraflı bir günlük kotayı
  // doldurabilir; çağıran bunu görüp görselleri atarak yeniden deneyebilsin.
  P.yazildi = true;
  P.save = function (s) {
    memory = s;
    try { w.localStorage.setItem(KEY, JSON.stringify(s)); P.yazildi = true; }
    catch (e) { P.yazildi = false; }
    return s;
  };
  P.reset = function () {
    memory = null;
    try { w.localStorage.removeItem(KEY); } catch (e) { /* yoksayılır */ }
  };

  /* --- yardımcılar --- */
  P.now = function () {
    var d = new Date();
    return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  };
  P.today = function () { return new Date().toLocaleDateString('tr-TR'); };
  P.esc = function (s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  };
  // Puan hareketi. tur/puan verilirse yapılandırılmış deftere de yazılır: üye
  // kartındaki "hangi puan nereden geldi" dökümü metinden değil bundan üretilir.
  P.event = function (s, text, tur, puan) {
    s.events.push('• ' + P.today() + ' ' + P.now() + ' – ' + text);
    if (s.events.length > 40) s.events.splice(0, s.events.length - 40);
    if (tur) {
      s.ledger = s.ledger || [];
      s.ledger.unshift({ ts: Date.now(), t: P.today() + ' ' + P.now(), tur: tur, puan: puan || 0, not: text });
      if (s.ledger.length > 60) s.ledger.length = 60;
    }
    return s;
  };

  /* --- fiş akışı: src/services/receipts.js ile aynı sıra ---------------------
     Süzgeçler üst üste biner; biri gevşetilince diğerleri açığı kapatmaz. */
  P.KAYNAK = {
    ziyaret: { ad: 'Ziyaret', ikon: '🏪' },
    fis: { ad: 'Fiş', ikon: '🧾' },
    instagram: { ad: 'Instagram', ikon: '📸' },
    odul: { ad: 'Ödül', ikon: '🎁' }
  };

  // Provada "okuma": gerçekte görseli model okur, burada senaryo üretir.
  P.fisOku = function (s, senaryo, tohum) {
    var simdi = Date.now();
    var onceki = (s.receipts || []).filter(function (r) { return r.durum === 'onaylandı'; })[0];
    var no = String(100000 + (tohum % 899999));
    switch (senaryo) {
      case 'okunmaz':
        return { okunabilir: false, not: 'Fotoğraftan fiş okunamadı. Fişin tamamı görünecek şekilde, düz ve net bir fotoğraf gönderin.' };
      case 'baska':
        return { okunabilir: true, tutar: 180, no: no, ts: simdi, isletme: 'SİMİT SARAYI ŞUBE 12', guven: 0.95 };
      case 'eski':
        return { okunabilir: true, tutar: 240, no: no, ts: simdi - 4 * 86400000, isletme: 'PEÇKO FIRIN', guven: 0.94 };
      case 'yuksek':
        return { okunabilir: true, tutar: 1450, no: no, ts: simdi, isletme: 'PEÇKO FIRIN', guven: 0.92 };
      case 'tekrar':
        return onceki
          ? { okunabilir: true, tutar: onceki.tutar, no: onceki.no, ts: onceki.fisTs, isletme: 'PEÇKO FIRIN', guven: 0.95 }
          : { okunabilir: true, tutar: 120, no: no, ts: simdi, isletme: 'PEÇKO FIRIN', guven: 0.95 };
      case 'kucuk':
        return { okunabilir: true, tutar: 48, no: no, ts: simdi, isletme: 'PEÇKO FIRIN', guven: 0.95 };
      default:
        // Fotoğraftan türetilen, makul aralıkta bir tutar. Alt sınırın üstünde
        // kalır: "geçerli fiş" senaryosu bazen reddedilirse akış anlaşılmaz olur.
        return { okunabilir: true, tutar: P.RECEIPT.enAz + 10 + (tohum % 3600) / 10, no: no, ts: simdi, isletme: 'PEÇKO FIRIN', guven: 0.93 };
    }
  };

  // Hazır senaryolarda gönderilen "fotoğraf": okunan fişin kendisi çizilir ki
  // balondaki görsel ile birazdan gelen okuma sonucu birbirini tutsun.
  P.fisGorseli = function (okuma) {
    var kagit = '#F7F3EC', m = '#3B2622', y = 92, satirlar = '';
    if (okuma.okunabilir) {
      [[3, 'Poğaça'], [2, 'Kahve'], [1, 'Yaş pasta dilim']].forEach(function (kal) {
        satirlar += '<text x="16" y="' + y + '" font-size="11" fill="' + m + '">' + kal[0] + ' x ' + kal[1] + '</text>';
        y += 18;
      });
      satirlar += '<line x1="16" y1="' + (y - 4) + '" x2="224" y2="' + (y - 4) + '" stroke="#C9BFB2" stroke-dasharray="3 3"/>' +
        '<text x="16" y="' + (y + 18) + '" font-size="14" font-weight="700" fill="' + m + '">TOPLAM</text>' +
        '<text x="224" y="' + (y + 18) + '" font-size="14" font-weight="700" text-anchor="end" fill="' + m + '">' +
        P.tl(okuma.tutar) + '</text>' +
        '<text x="16" y="' + (y + 40) + '" font-size="10" fill="#7A6C5D">FİŞ NO ' + (okuma.no || '—') + '</text>' +
        '<text x="224" y="' + (y + 40) + '" font-size="10" text-anchor="end" fill="#7A6C5D">' +
        new Date(okuma.ts).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }) + '</text>';
      y += 52;
    } else {
      satirlar = '<text x="120" y="110" font-size="12" text-anchor="middle" fill="#A2968A">bulanık fotoğraf</text>';
      y = 160;
    }
    // Yükseklik içeriğe göre: balonun altında boş kâğıt kalmasın.
    var h = y + 10;
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="' + h + '" viewBox="0 0 240 ' + h + '">' +
      '<rect width="240" height="' + h + '" fill="#E8E1D6"/>' +
      '<rect x="8" y="10" width="224" height="' + (h - 20) + '" rx="4" fill="' + kagit + '"' +
        (okuma.okunabilir ? '' : ' opacity=".55"') + '/>' +
      (okuma.okunabilir
        ? '<text x="120" y="40" font-size="15" font-weight="700" text-anchor="middle" fill="' + m + '">' +
          P.esc(okuma.isletme || '') + '</text>' +
          '<text x="120" y="60" font-size="10" text-anchor="middle" fill="#7A6C5D">SATIŞ FİŞİ</text>'
        : '') +
      satirlar + '</svg>';
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  };

  P.fisGonder = function (s, okuma, gorsel) {
    var c = P.RECEIPT, simdi = Date.now();
    s.receipts = s.receipts || [];
    var kayit = {
      id: 'F' + simdi, ts: simdi, t: P.today() + ' ' + P.now(),
      tutar: okuma.tutar || 0, no: okuma.no || null, fisTs: okuma.ts || null,
      fisTarih: okuma.ts ? new Date(okuma.ts).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }) : '—',
      isletme: okuma.isletme || '—', guven: okuma.guven || 0,
      durum: 'bekliyor', puan: 0, sebep: null, gorsel: gorsel || null, kod: s.code
    };
    s.receipts.unshift(kayit);

    function red(sebep) { kayit.durum = 'reddedildi'; kayit.sebep = sebep; return { durum: 'reddedildi', sebep: sebep, fis: kayit }; }
    function beklet(sebep) { kayit.sebep = sebep; return { durum: 'bekliyor', sebep: sebep, fis: kayit }; }

    // 0) Günlük sınır — okuma isteğinin maliyetini de sınırlayan süzgeç budur.
    var bugun = new Date(); bugun.setHours(0, 0, 0, 0);
    var bugunku = s.receipts.filter(function (r) { return r.ts >= bugun.getTime() && r.id !== kayit.id; }).length;
    if (bugunku >= c.gunluk) return red('Bugün için fiş sınırına ulaştınız (günde en çok ' + c.gunluk + ' fiş). Yarın tekrar deneyebilirsiniz.');
    // 1) Okunabilirlik
    if (!okuma.okunabilir || !okuma.tutar) return red(okuma.not || 'Fotoğraftan fiş okunamadı. Fişin tamamı görünecek şekilde, düz ve net bir fotoğraf gönderin.');
    // 2) Bize mi ait
    if (String(okuma.isletme || '').toLocaleUpperCase('tr-TR').indexOf('PEÇKO') < 0) {
      return red('Bu fiş bize ait görünmüyor. Yalnızca mağazalarımızdan aldığınız fişler puan kazandırır.');
    }
    // 3) Tazelik
    var yas = (simdi - okuma.ts) / 3600000;
    if (yas > c.enFazlaSaat) return red('Fiş ' + Math.round(yas) + ' saatlik; en fazla ' + c.enFazlaSaat + ' saatlik fiş kabul ediliyor.');
    if (yas < -2) return red('Fişin tarihi ileri tarihli görünüyor.');
    // 4) Alt sınır
    if (okuma.tutar < c.enAz) return red('Alışveriş kaydı için en az ' + P.tl(c.enAz) + ' tutarında fiş gerekiyor.');
    // 5) Tekillik — parmak izi fiş no + tarih + tutardan çıkar
    kayit.iz = kayit.no + '|' + Math.floor(kayit.fisTs / 60000) + '|' + Math.round(kayit.tutar * 100);
    var tekrar = s.receipts.some(function (r) { return r.id !== kayit.id && r.iz === kayit.iz && r.durum !== 'reddedildi'; });
    if (tekrar) return red('Bu fiş daha önce yüklenmiş. Her fiş yalnızca bir kez işlenir.');
    // 6) Kontrole düşenler
    if (okuma.tutar > c.kontrolUstu) return beklet('Tutar yüksek olduğu için personel kontrolüne alındı.');
    if (okuma.guven < 0.75) return beklet('Okuma netleşmediği için personel kontrolüne alındı.');

    return P.fisOnayla(s, kayit);
  };

  // Onay: fiş alışveriş hesabına işlenir. Aynı gün ikinci fiş yeni alışveriş
  // açmaz, o günün tutarına eklenir — fiş bölme buradan engellenir.
  P.fisOnayla = function (s, kayit) {
    if (kayit.durum === 'onaylandı') return { durum: 'zaten', fis: kayit };
    kayit.durum = 'onaylandı';
    var r = P.alisverisEkle(s, { brutKurus: P.kurus(kayit.tutar), ts: kayit.fisTs || kayit.ts,
      kaynak: 'fis:' + kayit.id });
    kayit.alisverisId = r.alisveris.id;
    kayit.sayildi = r.sayildi;
    P.event(s, 'Alışveriş ' + P.tl(kayit.tutar) + ' (fiş)' + (r.sayildi ? ' · ' + r.tur.alisveris + '/' + r.tur.uzunluk : ' · aynı güne eklendi'),
      'fis', 0);
    return { durum: 'onaylandı', fis: kayit, sayildi: r.sayildi, alisveris: r.alisveris,
      tur: r.tur, parti: r.parti };
  };

  P.audit = function (s, islem, detay) {
    s.audit = s.audit || [];
    s.audit.unshift({ t: P.today() + ' ' + P.now(), kim: s.shift ? s.shift + ' (personel)' : 'yönetici', islem: islem, detay: detay || '' });
    if (s.audit.length > 200) s.audit.length = 200;
    return s;
  };

  // Logo adresi marka.css'teki --marka-logo değişkeninden gelir; tek kaynak orası.
  // <img> kullanılır ki hotlink kesilse bile yedek karakter görünsün ve sayfa bozulmasın.
  P.logoUygula = function (kok) {
    var ham = getComputedStyle(document.documentElement).getPropertyValue('--marka-logo').trim();
    if (!ham || ham === 'none') return;
    var url = ham.replace(/^url\((["']?)/, '').replace(/(["']?)\)$/, '');
    (kok || document).querySelectorAll('.marka-logo, .marka-yazi-logo').forEach(function (el) {
      if (el.querySelector('img')) return;
      var yedek = el.textContent;
      var img = new Image();
      img.alt = P.BUSINESS;
      img.onload = function () { el.textContent = ''; el.appendChild(img); };
      img.onerror = function () { /* yedek karakter yerinde kalır */ };
      img.src = url;
      void yedek;
    });
  };

  w.PECKO = P;
})(window);
