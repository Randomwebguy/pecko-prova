# Peçko Fırın sadakat provası

Sadakat sisteminin **tıklanabilir akış provası**. Gerçek bir sunucu yok: bütün
veriler tarayıcıda (`localStorage`) tutulur, hiçbir mesaj gerçekten gönderilmez.
Amaç, sistemin nasıl işlediğini telefonda dokunarak göstermek.

## Ekranlar

| Yol | Ne gösterir |
|---|---|
| `/` | NFC dokunuşu — ara ekran yok, uygulamaya ya da kayda yönlendirir |
| `/onay/` | Kayıt: numara, şifre, onaylar → SMS kodu |
| `/tanitim/` | Üyeliği bir kez anlatan dört ekran |
| `/puan/` | **Üye uygulaması**: Kartım · Geçmiş · Fiş · Hesabım |
| `/kasa/` | Kasadaki personel ekranı |
| `/panel/` | Yönetim paneli (10 bölüm) |

## Akış

1. NFC etiketi `/` adresini açar; etiket ara ekran göstermez.
2. İlk kez gelen kayıt formuna düşer: numara + şifre + onaylar.
3. Numaraya altı haneli bir kod gider — **numara bu kodla kanıtlanır**;
   formdaki numara tek başına yeterli değildir. (Provada gerçek SMS gitmez,
   kod ekranda gösterilir.)
4. Kod doğrulanınca üyelik açılır ve tanıtım bir kez gösterilir.
5. Giriş, kişi çıkana kadar açık kalır; kayıtlı cihaz etikete ikinci kez
   dokunduğunda doğrudan uygulamaya düşer.

WhatsApp akışın içinde değil: programdaki tek işi kampanya dağıtımı, rızası da
kayıt formunda alınıyor. Gelen WhatsApp kanalı yok — sohbet ekranı ve ona mesaj
üreten metin motoru ikinci sürümde kaldırıldı. Kasada ya da panelde yapılan
işlemi müşteri, uygulamasını açtığında görüyor: bakiye cüzdandan, fişin durumu
ve varsa red sebebi fiş listesinden okunuyor.

## Tasarım

`uygulama.css`, ürünün kendi stil dosyasının (`src/public/app.css`) birebir
kopyasıdır. Burada elle değiştirmeyin: değişiklik önce üründe yapılır, sonra bu
dosya yeniden kopyalanır. Böylece prova neyi gösteriyorsa müşteri onu görür.

## Test

```bash
node cuzdan.test.mjs     # hediye bakiye kurallarının testleri
```

## Yerelde çalıştırma

Derleme yok; herhangi bir statik sunucu yeter.

```bash
python3 -m http.server 4000
# http://localhost:4000
```

Telefondan denemek için makinenin yerel IP'sini kullanın
(`http://192.168.x.x:4000`). Prova bütün durumu tarayıcıda tuttuğu için
telefonda ayrı bir üyelik açılır.

Cüzdan kurallarının testleri:

```bash
node cuzdan.test.mjs
```

## Yayın

Netlify: depo bağlandığında `netlify.toml` yeterli — derleme komutu yok,
kök dizin yayınlanır.

`robots.txt` ve `X-Robots-Tag` başlığı arama motorlarını dışarıda tutar;
sayfalarda ayrıca `noindex` etiketi vardır.
