# Peçko Fırın sadakat provası

Sadakat sisteminin **tıklanabilir akış provası**. Gerçek bir sunucu yok: bütün
veriler tarayıcıda (`localStorage`) tutulur, hiçbir mesaj gerçekten gönderilmez.
Amaç, sistemin nasıl işlediğini telefonda dokunarak göstermek.

## Ekranlar

| Yol | Ne gösterir |
|---|---|
| `/` | NFC etiketine dokunulduğunda açılan sayfa |
| `/onay/` | Katılım şartları — numara, şifre ve onaylar |
| `/sohbet/` | WhatsApp sohbeti (numara bu mesajla doğrulanır) |
| `/puan/` | **Üye uygulaması**: Kartım · Geçmiş · Fiş · Hesabım |
| `/kasa/` | Kasadaki personel ekranı |
| `/panel/` | Yönetim paneli (10 bölüm) |

## Akış

1. NFC etiketi `/` adresini açar.
2. Katılım şartlarında numara + şifre girilir, onaylar işaretlenir.
3. WhatsApp'ta hazır mesaj gönderilir — **numara ancak bu mesajla doğrulanır**;
   formdaki numara tek başına yeterli değildir.
4. Üyelik açılır ve uygulama girişi, kişi çıkana kadar açık kalır.
5. Kayıtlı bir cihaz etikete ikinci kez dokunduğunda doğrudan uygulamaya düşer.

## Tasarım

`uygulama.css`, ürünün kendi stil dosyasının (`src/public/app.css`) birebir
kopyasıdır. Burada elle değiştirmeyin: değişiklik önce üründe yapılır, sonra bu
dosya yeniden kopyalanır. Böylece prova neyi gösteriyorsa müşteri onu görür.

## Test

```bash
node cuzdan.test.mjs     # hediye bakiye kurallarının testleri
```

## Yayın

`main` dalına her gönderimde `.github/workflows/pages.yml` çalışır ve site
GitHub Pages'e dağıtılır. `robots.txt` arama motorlarını dışarıda tutar;
sayfalarda ayrıca `noindex` etiketi vardır.
