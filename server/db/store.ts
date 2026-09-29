import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  Product,
  Order,
  Customer,
  Coupon,
  AbandonedCheckout,
  NotificationLog,
  WebhookLog,
  AuditLog,
  PlatformSettings,
  SecureDownload,
  LicenseKey
} from '../../src/types/schema';

// In-memory relational store with seed data
class DatabaseStore {
  public products: Product[] = [];
  public orders: Order[] = [];
  public customers: Customer[] = [];
  public coupons: Coupon[] = [];
  public abandonedCheckouts: AbandonedCheckout[] = [];
  public notificationLogs: NotificationLog[] = [];
  public webhookLogs: WebhookLog[] = [];
  public auditLogs: AuditLog[] = [];
  public downloads: SecureDownload[] = [];
  public licenses: LicenseKey[] = [];
  public settings: PlatformSettings;
  public adminUser = {
    id: 'admin_1',
    name: 'Aan Pangestu',
    email: 'aanpangestu09@gmail.com',
    role: 'Super Administrator',
    password: 'adminpassword123',
    passwordHash: crypto.createHash('sha256').update('adminpassword123').digest('hex')
  };

  private dataFilePath: string;

  constructor() {
    this.dataFilePath = path.resolve(process.cwd(), 'data_store.json');
    this.settings = this.getDefaultSettings();
    this.initSeedData();
    this.loadFromFile();
  }

  private getDefaultSettings(): PlatformSettings {
    return {
      general: {
        businessName: 'Ruang Proyek',
        tagline: 'Platform Produk Digital Arsitektur & Rekayasa Teknik Terlengkap',
        logoUrl: '/assets/default_store_logo.webp',
        currency: 'IDR',
        timezone: 'Asia/Jakarta',
        supportEmail: 'support@ruangproyek.id',
        supportWhatsapp: '6281234567890',
      },
      payment: {
        provider: 'SANDBOX',
        isSandbox: true,
        serverKey: 'SB-Mid-server-Rp77x9aZq110',
        clientKey: 'SB-Mid-client-Rp22x0bYw991',
        webhookSecret: 'whsec_ruang_proyek_production_key_2026',
        merchantId: 'M-RUANGPROYEK-01',
      },
      email: {
        provider: 'SMTP',
        host: 'smtp.mailtrap.io',
        port: 587,
        username: 'ruang_smtp_user',
        password: '••••••••••••',
        fromName: 'Ruang Proyek Official',
        fromEmail: 'delivery@ruangproyek.id',
        isEnabled: true,
      },
      whatsapp: {
        provider: 'FONNTE',
        apiKey: 'fonnte_live_tok_9918237198',
        senderNumber: '6281234567890',
        isEnabled: true,
      },
      whatsappFollowUp: {
        provider: 'FONNTE',
        apiKey: 'fonnte_live_tok_9918237198',
        senderNumber: '6281234567890',
        rules: {
          waitingPayment: {
            isEnabled: true,
            delayMinutes: 15,
            template: `Halo {nama_pembeli} 👋\n\nTerima kasih telah memesan *{nama_produk}*.\n\nPesanan Anda dengan nomor *{nomor_order}* sebesar *{total_harga}* saat ini masih menunggu penyelesaian pembayaran.\n\nSegera selesaikan pembayaran melalui tautan berikut sebelum batas waktu berakhir:\n👉 {link_pembayaran}\n\nJika Anda mengalami kendala saat transfer atau butuh bantuan rekening, jangan ragu untuk membalas pesan ini ya! 🙏`
          },
          paid: {
            isEnabled: true,
            delayMinutes: 0,
            template: `Halo {nama_pembeli} 🎉\n\nPembayaran untuk pesanan *{nomor_order}* telah kami terima dan terverifikasi LUNAS!\n\nRincian Pesanan:\n• Produk: *{nama_produk}*\n• Total: {total_harga}\n• Status: Lunas & Terkirim\n\nAkses & unduh file produk digital Anda langsung melalui tautan di bawah ini:\n🚀 {link_produk}\n\nTerima kasih atas kepercayaannya. Semoga produk ini bermanfaat maksimal untuk pekerjaan dan proyek Anda! ✨`
          },
          expiredFailed: {
            isEnabled: false,
            delayMinutes: 60,
            template: `Halo {nama_pembeli},\n\nKami melihat bahwa pesanan *{nomor_order}* untuk *{nama_produk}* telah kedaluwarsa atau belum berhasil diselesaikan.\n\nApakah Anda masih berminat untuk mendapatkan produk ini?\nKhusus hari ini, Anda bisa memesan ulang dan mengamankan penawaran terbaik melalui tautan berikut:\n👉 {link_pembayaran}\n\nJika ada kendala metode pembayaran atau pertanyaan seputar produk, kami siap membantu!`
          }
        }
      },
      telegram: {
        botToken: '719283749:AAH17823908kjsd90123hds',
        chatId: '-100987654321',
        isEnabled: true,
      },
      tracking: {
        metaPixelId: '109283746152839',
        metaCapiToken: 'EAAB91827361928374910283',
        googleAnalyticsId: 'G-RP20269988',
        googleTagManagerId: 'GTM-RP001',
        tiktokPixelId: 'C991827364501',
      },
      storage: {
        provider: 'S3',
        bucketName: 'ruangproyek-vault-secure',
        region: 'ap-southeast-1',
        accessKey: 'AKIA_SECURE_STORAGE_KEY',
        secretKey: '••••••••••••••••••••••••••••••••',
      }
    };
  }

  private initSeedData() {
    // 1. Products
    this.products = [
      {
        id: 'prod_buku_kas',
        name: 'Laporan Kas Proyek Otomatis',
        slug: 'buku-kas-proyek-otomatis',
        shortDescription: 'Template Excel siap pakai untuk kelola keuangan proyek lebih mudah, cepat, dan akurat. Dilengkapi dashboard visual otomatis & formula SNI.',
        description: 'Kelola arus kas keluar masuk proyek kontraktor dan konsultan secara real-time. Dilengkapi monitoring budget per kategori, rekap mingguan dan bulanan, kapasitas 12.000 transaksi tanpa macro (aman digunakan), serta kompatibel dengan Excel 2019 ke atas dan Microsoft 365.',
        thumbnail: '/src/assets/images/buku_kas_banner_1790626196511.jpg',
        gallery: [
          '/src/assets/images/buku_kas_banner_1790626196511.jpg'
        ],
        categoryId: 'cat_finance',
        categoryName: 'Bisnis & Finansial',
        regularPrice: 249000,
        discountPrice: 99000,
        productType: 'EXCEL',
        status: 'ACTIVE',
        sku: 'RP-KAS-2026',
        accessDurationDays: 0,
        downloadLimit: 10,
        thankYouMessage: 'Selamat! Template Excel Buku Kas Proyek Otomatis Anda telah siap diunduh dan digunakan.',
        orderBump: {
          id: 'bump_ahsp_2026',
          productId: 'prod_buku_kas',
          bumpName: 'AHSP 2026 LENGKAP: BINA MARGA, CIPTA KARYA & SDA',
          bumpTagline: 'Lengkapi referensi perhitungan konstruksi dalam 1 paket. Cocok untuk kebutuhan RAB, analisa harga satuan, dan pekerjaan konstruksi. Cocok untuk Kontraktor, Konsultan, Engineer, QS, Pelaksana, dan praktisi konstruksi yang membutuhkan referensi AHSP dalam pekerjaan sehari-hari.',
          bumpPrice: 49000,
          bumpThumbnail: '/src/assets/images/ahsp_bump_thumb_1790626215648.jpg',
          isActive: true
        },
        checkoutConfig: {
          bannerImage: '/src/assets/images/buku_kas_banner_1790626196511.jpg',
          trustBadge1: 'Garansi Uang Kembali',
          trustBadge2: 'Jaminan Kepuasan',
          recipientTitle: 'Data Penerima:',
          noticeText: '*Pastikan Email dengan benar. Produk Akan terkirim secara otomatis melalui Email setelah pembayaran.',
          ctaText: 'Beli Sekarang',
          paymentMethods: [
            {
              id: 'pm_bri_va',
              name: 'BRI Virtual Account',
              code: 'VA_BRI',
              adminFeeText: 'Admin fee Rp4.440',
              adminFeeAmount: 4440,
              adminFeeType: 'FIXED',
              gatewayTag: 'Midtrans',
              logoType: 'BRI',
              isActive: true
            },
            {
              id: 'pm_bca_va',
              name: 'BCA Virtual Account',
              code: 'VA_BCA',
              adminFeeText: 'Admin fee Rp4.440',
              adminFeeAmount: 4440,
              adminFeeType: 'FIXED',
              gatewayTag: 'Midtrans',
              logoType: 'BCA',
              isActive: true
            },
            {
              id: 'pm_qris',
              name: 'QRIS',
              code: 'QRIS',
              adminFeeText: 'Admin fee 0.7%',
              adminFeeAmount: 700,
              adminFeeType: 'PERCENT',
              gatewayTag: 'Midtrans',
              logoType: 'QRIS',
              isActive: true
            },
            {
              id: 'pm_mandiri_bill',
              name: 'Mandiri Bill',
              code: 'VA_MANDIRI',
              adminFeeText: 'Admin fee Rp4.440',
              adminFeeAmount: 4440,
              adminFeeType: 'FIXED',
              gatewayTag: 'Midtrans',
              logoType: 'MANDIRI',
              isActive: true
            },
            {
              id: 'pm_bni_va',
              name: 'BNI Virtual Account',
              code: 'VA_BNI',
              adminFeeText: 'Admin fee Rp4.440',
              adminFeeAmount: 4440,
              adminFeeType: 'FIXED',
              gatewayTag: 'Midtrans',
              logoType: 'BNI',
              isActive: true
            }
          ],
          tracking: {
            conversionRule: 'EVERY',
            facebookPixels: [
              {
                id: '1486222885740379',
                name: 'PIXEL WL',
                events: ['AddToCart', 'InitiateCheckout']
              }
            ],
            tiktokPixels: [],
            googleAds: [],
            googleTagManager: [],
            snackVideo: []
          },
          successPage: {
            headline: 'Pembayaran Anda Berhasil!',
            message: 'Terima kasih telah mempercayai Ruang Proyek. File Buku Kas Proyek dan lisensi telah dikirim ke WhatsApp dan Email Anda.',
            whatsappSupport: '6281234567890'
          }
        },
        files: [
          {
            id: 'file_kas_proyek_master',
            productId: 'prod_buku_kas',
            fileName: 'Template_Buku_Kas_Proyek_Otomatis_v2026.xlsx',
            fileSizeBytes: 24500000,
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            storagePath: 'vault/finance/Template_Buku_Kas_Proyek_Otomatis_v2026.xlsx',
            fileType: 'EXCEL',
            version: '2026.1',
            accessInstructions: 'Buka langsung menggunakan Microsoft Excel atau Google Sheets. Aktifkan editing mode.'
          }
        ],
        createdAt: '2026-09-28T09:00:00.000Z',
        updatedAt: '2026-09-28T09:00:00.000Z'
      },
      {
        id: 'prod_arsitektur_pack',
        name: '10.000+ Template Arsitektur & Engineering Pack Pro 2026',
        slug: '10000-template-arsitektur-pro',
        shortDescription: 'Mega bundle terlengkap file AutoCAD, SketchUp, 3ds Max, DWG detail pondasi, RAB Excel formula otomatis & 50+ plugins.',
        description: 'Paket terlengkap untuk arsitek, drafter, kontraktor, dan mahasiswa teknik sipil. Berisi ribuan template kerja siap pakai, library 2D/3D blocks terlengkap, RAB formula SNI terbaru, dan lisensi komersial seumur hidup.',
        thumbnail: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&auto=format&fit=crop&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?w=800&auto=format&fit=crop&q=80'
        ],
        categoryId: 'cat_architecture',
        categoryName: 'Arsitektur & Konstruksi',
        regularPrice: 799000,
        discountPrice: 219000,
        productType: 'BUNDLE',
        status: 'ACTIVE',
        sku: 'RP-ARCH-10K',
        accessDurationDays: 0, // Lifetime
        downloadLimit: 10,
        thankYouMessage: 'Terima kasih atas pembelian Anda! Seluruh paket file DWG, SketchUp, dan RAB Excel telah siap diunduh.',
        files: [
          {
            id: 'file_dwg_templates',
            productId: 'prod_arsitektur_pack',
            fileName: 'AutoCAD_Library_DWG_Full_Pack_v4.2.zip',
            fileSizeBytes: 2450000000, // 2.45 GB
            mimeType: 'application/zip',
            storagePath: 'vault/architecture/AutoCAD_Library_DWG_Full_Pack_v4.2.zip',
            fileType: 'ZIP',
            version: '2026.4',
            accessInstructions: 'Ekstrak menggunakan WinRAR / 7-Zip versi terbaru. Kompatibel dengan AutoCAD 2018 ke atas.'
          },
          {
            id: 'file_sketchup_models',
            productId: 'prod_arsitektur_pack',
            fileName: 'SketchUp_Vray_3D_Models_Interior_Exterior.zip',
            fileSizeBytes: 4100000000, // 4.1 GB
            mimeType: 'application/zip',
            storagePath: 'vault/architecture/SketchUp_Vray_3D_Models.zip',
            fileType: 'ZIP',
            version: '2026.1',
            accessInstructions: 'Buka langsung pada SketchUp 2020 ke atas. Dilengkapi material V-Ray 5/6.'
          },
          {
            id: 'file_rab_excel',
            productId: 'prod_arsitektur_pack',
            fileName: 'RAB_Otomatis_Formula_SNI_2026_AHSP.xlsx',
            fileSizeBytes: 35000000, // 35 MB
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            storagePath: 'vault/architecture/RAB_Otomatis_Formula_SNI_2026_AHSP.xlsx',
            fileType: 'EXCEL',
            version: '5.0',
            accessInstructions: 'Aktifkan macro pada Microsoft Excel. Terdapat tutorial video di sheet panduan.'
          },
          {
            id: 'file_plugins',
            productId: 'prod_arsitektur_pack',
            fileName: 'Curic_1001bit_Architecture_Plugins.zip',
            fileSizeBytes: 120000000, // 120 MB
            mimeType: 'application/zip',
            storagePath: 'vault/architecture/Curic_Plugins.zip',
            fileType: 'SOFTWARE',
            version: '3.1'
          }
        ],
        orderBump: {
          id: 'bump_dwg_blocks',
          productId: 'prod_arsitektur_pack',
          bumpName: 'Tambahkan 5.000+ Dynamic AutoCAD Blocks',
          bumpTagline: 'Hemat 85%! Library pintu, jendela, furnitur dinamis yang dapat di-resize dalam 1 klik.',
          bumpPrice: 47000,
          bumpThumbnail: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?w=200&auto=format&fit=crop&q=80',
          isActive: true
        },
        upsell: {
          id: 'upsell_rab_mastery',
          triggerProductId: 'prod_arsitektur_pack',
          offerProductId: 'prod_rab_mastery',
          title: 'SPESIAL UNTUK ANDA HARI INI',
          subtitle: 'Upgrade ke Video Course: Manajemen Proyek & Estimasi Biaya RAB Konstruksi Real',
          specialPrice: 97000,
          regularPrice: 450000,
          headline: 'Kuasai Pembuatan RAB Proyek Nyata Bernilai Milyaran dalam 7 Hari',
          benefits: [
            '25 Video Tutorial HD Studi Kasus Rumah 2 Lantai & Ruko',
            'Template Kontrak Kerja & Surat Perjanjian Pemborong Legal',
            'Grup Diskusi Arsitek & Kontraktor Se-Indonesia',
            'Sertifikat Kelulusan Resmi Digital'
          ],
          thumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&auto=format&fit=crop&q=80',
          isActive: true
        },
        landingConfig: {
          hero: {
            badge: '⚡ MEGA BUNDLE ARSITEK 2026',
            headline: 'Selesaikan Desain Gambar Kerja & RAB 5x Lebih Cepat Tanpa Gambar Dari Nol',
            subheadline: 'Koleksi 10.000+ file DWG, 3D SketchUp V-Ray render, RAB formula otomatis SNI 2026, dan kumpulan detail pondasi siap pakai untuk proyek impian Anda.',
            ctaText: 'Dapatkan Akses Instan Sekarang',
            rating: 4.9,
            ratingCount: 3840
          },
          problem: {
            title: 'Apakah Masalah Ini Sering Menghambat Proyek Anda?',
            description: 'Banyak arsitek, drafter, dan kontraktor kehilangan jam tidur berharga hanya untuk hal berulang.',
            points: [
              'Membuang waktu 2-3 hari hanya untuk menggambar detail pondasi & kusen dari nol.',
              'Klien minta revisi mendadak dan perhitungan RAB berantakan karena salah rumus manual.',
              'Hasil render 3D SketchUp terlihat kaku karena kekurangan library material & pohon photorealistic.',
              'Pusing menyusun dokumen tender proyek karena format RAB tidak sesuai standar SNI terbaru.'
            ]
          },
          solution: {
            title: 'Solusi All-in-One Ruang Proyek: Langsung Pakai & Bebas Edit!',
            description: 'Kami telah merapikan ribuan aset digital terstruktur rapi per folder kategori sehingga Anda bisa drag-and-drop langsung ke software desain favorit Anda.',
            points: [
              'Folder rapi dan terorganisir: Denah, Tampak, Potongan, ME & Elektrikal, Struktur Baja & Beton.',
              'RAB Excel terhubung otomatis: Ganti harga satuan semen & pasir, total biaya langsung terupdate.',
              'Lisensi komersial seumur hidup bebas royalti untuk proyek komersial maupun pribadi.',
              'Update file berkala tanpa biaya langganan bulanan selamanya.'
            ]
          },
          benefits: {
            title: 'Keuntungan Utama yang Akan Anda Rasakan',
            items: [
              {
                icon: 'Zap',
                title: 'Hemat Waktu Hingga 80%',
                desc: 'Tidak perlu lagi mendesain blok toilet, pintu, dan tangga dari awal. Tinggal copy-paste.'
              },
              {
                icon: 'ShieldCheck',
                title: 'Standar SNI & Dinas PU',
                desc: 'Seluruh formula AHSP dan gambar detail mengacu pada standar resmi konstruksi Indonesia.'
              },
              {
                icon: 'FolderSync',
                title: 'Akses Selamanya & Download Cepat',
                desc: 'Server cloud berkecepatan tinggi dengan sistem resume download tanpa takut putus di tengah jalan.'
              },
              {
                icon: 'CheckCircle2',
                title: 'Bebas Dipakai Proyek Klien',
                desc: 'Gunakan seluruh aset untuk tender, presentasi owner, dan dokumen kontraktor tanpa batasan.'
              }
            ]
          },
          whatsIncluded: {
            title: 'Apa Saja yang Anda Dapatkan di Paket Ini?',
            items: [
              {
                name: 'AutoCAD Architectural Library (DWG)',
                size: '2.45 GB',
                type: 'DWG / CAD',
                desc: 'Ribuan denah rumah tipe 36/45/60/120, detail tangga putar, struktur baja WF, plumbing & septic tank.'
              },
              {
                name: 'SketchUp Photorealistic 3D Warehouse',
                size: '4.1 GB',
                type: 'SKP / 3DS',
                desc: 'Model 3D interior modern Japandi, fasad minimalis kontemporer, lengkap dengan settingan lighting V-Ray.'
              },
              {
                name: 'Master RAB Excel SNI & AHSP 2026',
                size: '35 MB',
                type: 'XLSX (Macro)',
                desc: 'Formula otomatis kalkulasi volume cor beton, pembesian tulangan, biaya upah tukang, dan kurva S.'
              },
              {
                name: 'Engineering & Architecture Plugins Pack',
                size: '120 MB',
                type: 'RBZ / EXE',
                desc: 'Plugin otomatis buat atap limas 1 klik, perpanjang garis cepat, dan kalkulator luas bangunan instan.'
              }
            ]
          },
          faqs: [
            {
              question: 'Bagaimana cara mengakses file setelah pembayaran?',
              answer: 'Sistem Ruang Proyek memproses secara otomatis 100%. Begitu pembayaran berhasil (via QRIS, Virtual Account, dsb), halaman langsung memberikan tautan unduhan aman, dan kami juga mengirimkan salinannya ke Email & WhatsApp Anda.'
            },
            {
              question: 'Apakah file bisa dibuka di AutoCAD atau SketchUp versi lama?',
              answer: 'Ya, seluruh file DWG disimpan dalam format DWG 2013/2018 sehingga dapat dibuka di AutoCAD versi manapun. File SketchUp kompatibel untuk SketchUp 2019 ke atas.'
            },
            {
              question: 'Apakah ada biaya langganan bulanan?',
              answer: 'Tidak ada. Pembelian ini adalah sekali bayar (one-time payment) untuk akses seumur hidup tanpa tagihan tersembunyi.'
            },
            {
              question: 'Bagaimana jika link download saya hilang atau kuota habis?',
              answer: 'Anda dapat menghubungi layanan bantuan kami via WhatsApp atau meminta pengiriman ulang link download melalui dashboard pembeli kapan saja.'
            }
          ],
          testimonials: [
            {
              name: 'Ar. Dimas Prasetyo, IAI',
              role: 'Principal Architect di Studio Karya Bangun',
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
              rating: 5,
              content: 'Paket template DWG & SketchUp dari Ruang Proyek sangat menyelamatkan deadline studio kami. Detail sambungan baja dan RAB Excel-nya luar biasa presisi.'
            },
            {
              name: 'Ir. Hendra Gunawan',
              role: 'Kontraktor Perumahan Jawa Barat',
              avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
              rating: 5,
              content: 'RAB otomatisnya benar-benar langsung update saat harga material berubah. Order bump dynamic block-nya juga sangat berguna.'
            },
            {
              name: 'Sarah Amanda, S.T.',
              role: 'Freelance 3D Visualizer',
              avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
              rating: 5,
              content: 'Proses checkout via QRIS-nya instan banget, 3 detik langsung diarahkan ke download link dan file langsung terkirim ke WhatsApp!'
            }
          ]
        },
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'prod_finance_excel',
        name: 'Ultimate Financial Model & Business Dashboard Excel 2026',
        slug: 'financial-model-dashboard-excel',
        shortDescription: 'Template Excel & Google Sheets untuk proyeksi cash flow, valuasi startup, laporan laba rugi otomatis, dan KPI monitoring.',
        description: 'Dashboard finansial tingkat eksekutif. Dirancang oleh konsultan keuangan profesional untuk memantau performa bisnis, analisa break-even point, dan laporan investor siap cetak.',
        thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80'
        ],
        categoryId: 'cat_finance',
        categoryName: 'Bisnis & Finansial',
        regularPrice: 499000,
        discountPrice: 179000,
        productType: 'EXCEL',
        status: 'ACTIVE',
        sku: 'RP-FIN-EXCEL',
        accessDurationDays: 0,
        downloadLimit: 5,
        files: [
          {
            id: 'file_fin_master',
            productId: 'prod_finance_excel',
            fileName: 'RuangProyek_Financial_Model_Pro_v3.xlsx',
            fileSizeBytes: 18000000,
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            storagePath: 'vault/finance/RuangProyek_Financial_Model_Pro_v3.xlsx',
            fileType: 'EXCEL',
            version: '3.0'
          }
        ],
        orderBump: {
          id: 'bump_pitch_deck',
          productId: 'prod_finance_excel',
          bumpName: 'Tambahkan 50+ Slide Pitch Deck Investor (PPTX)',
          bumpTagline: 'Format slide presentasi kelas Silicon Valley yang disukai investor.',
          bumpPrice: 39000,
          isActive: true
        },
        createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'prod_saas_figma',
        name: 'Nexus UI Kit - Modern SaaS Dashboard Design System (Figma)',
        slug: 'nexus-ui-kit-saas-figma',
        shortDescription: '1.200+ komponen UI, 120 screen halaman SaaS, dark & light mode, auto-layout 5.0, dan token desain siap coding.',
        description: 'Design system terlengkap untuk desainer produk dan developer frontend. Hemat ratusan jam pembuatan dashboard CRM, analytics, billing, dan user settings.',
        thumbnail: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80'
        ],
        categoryId: 'cat_design',
        categoryName: 'Design & UI/UX',
        regularPrice: 650000,
        discountPrice: 249000,
        productType: 'LINK',
        status: 'ACTIVE',
        sku: 'RP-FIGMA-NEXUS',
        accessDurationDays: 0,
        downloadLimit: 0,
        files: [
          {
            id: 'file_figma_access',
            productId: 'prod_saas_figma',
            fileName: 'Figma_Access_Community_File_Token.pdf',
            fileSizeBytes: 4200000,
            mimeType: 'application/pdf',
            storagePath: 'vault/design/Nexus_Figma_Access.pdf',
            fileType: 'PDF',
            version: '2.5',
            externalLink: 'https://figma.com/@ruangproyek/nexus-ui-system',
            accessInstructions: 'Buka tautan Figma di dalam dokumen PDF dan klik Duplicate to Your Drafts.'
          }
        ],
        createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // 2. Customers
    this.customers = [
      {
        id: 'cust_budi_santoso',
        name: 'Budi Santoso, S.T.',
        email: 'budi.santoso@archprima.co.id',
        phone: '6281288992211',
        company: 'PT Arch Prima Studio',
        totalOrders: 2,
        totalSpent: 485000,
        firstOrderAt: new Date(Date.now() - 10 * 86400000).toISOString(),
        lastOrderAt: new Date(Date.now() - 1 * 86400000).toISOString(),
        createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      },
      {
        id: 'cust_sarah_wijaya',
        name: 'Sarah Wijaya',
        email: 'sarah.wijaya@gmail.com',
        phone: '6281900112233',
        totalOrders: 1,
        totalSpent: 266000,
        firstOrderAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        lastOrderAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
      {
        id: 'cust_aan_pangestu',
        name: 'Aan Pangestu',
        email: 'aanpangestu09@gmail.com',
        phone: '6285712345678',
        company: 'Ruang Proyek Digital',
        totalOrders: 3,
        totalSpent: 687000,
        firstOrderAt: new Date(Date.now() - 14 * 86400000).toISOString(),
        lastOrderAt: new Date(Date.now() - 2 * 3600000).toISOString(),
        createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      }
    ];

    // 3. Coupons
    this.coupons = [
      {
        id: 'coup_bright20',
        code: 'BRIGHT20',
        discountType: 'PERCENT',
        discountValue: 20,
        minPurchase: 150000,
        maxDiscount: 50000,
        usageLimit: 500,
        usageCount: 142,
        perCustomerLimit: 1,
        startDate: new Date(Date.now() - 30 * 86400000).toISOString(),
        endDate: new Date(Date.now() + 60 * 86400000).toISOString(),
        applicableProductIds: [],
        isActive: true
      },
      {
        id: 'coup_hemat30k',
        code: 'HEMAT30K',
        discountType: 'FIXED',
        discountValue: 30000,
        minPurchase: 200000,
        maxDiscount: 30000,
        usageLimit: 200,
        usageCount: 88,
        perCustomerLimit: 1,
        startDate: new Date(Date.now() - 15 * 86400000).toISOString(),
        endDate: new Date(Date.now() + 45 * 86400000).toISOString(),
        applicableProductIds: [],
        isActive: true
      }
    ];

    // 4. Preloaded Orders with Realistic Timeline
    const sampleToken = 'sec_tok_' + crypto.randomBytes(16).toString('hex');
    this.orders = [
      {
        id: 'ord_101',
        orderNumber: 'ORD-20260928-000142',
        customerId: 'cust_budi_santoso',
        customerName: 'Budi Santoso, S.T.',
        customerEmail: 'budi.santoso@archprima.co.id',
        customerPhone: '6281288992211',
        customerCompany: 'PT Arch Prima Studio',
        items: [
          {
            id: 'item_1',
            orderId: 'ord_101',
            productId: 'prod_arsitektur_pack',
            productName: '10.000+ Template Arsitektur & Engineering Pack Pro 2026',
            productThumbnail: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&auto=format&fit=crop&q=80',
            price: 219000,
            itemType: 'MAIN'
          },
          {
            id: 'item_2',
            orderId: 'ord_101',
            productId: 'bump_dwg_blocks',
            productName: 'Tambahkan 5.000+ Dynamic AutoCAD Blocks',
            price: 47000,
            itemType: 'BUMP'
          }
        ],
        subtotalAmount: 266000,
        discountAmount: 0,
        totalAmount: 266000,
        paymentMethod: 'QRIS',
        paymentStatus: 'PAID',
        deliveryStatus: 'DELIVERED',
        transactionId: 'TRX-QRIS-99281729',
        orderBumpAdded: true,
        upsellAdded: false,
        utmSource: 'facebook',
        utmMedium: 'cpc',
        utmCampaign: 'arsitek_promo_q3',
        downloadToken: sampleToken,
        licenseKey: 'ARCH-2026-B812-99FA-X101',
        timeline: [
          {
            id: 'tl_1',
            orderId: 'ord_101',
            title: 'Checkout Dimulai',
            description: 'Customer mengisi formulir checkout dan memilih metode pembayaran QRIS.',
            timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
            actor: 'CUSTOMER'
          },
          {
            id: 'tl_2',
            orderId: 'ord_101',
            title: 'Pembayaran Dibuat (QRIS)',
            description: 'QR Code QRIS dinamis berhasil di-generate senilai Rp 266.000.',
            timestamp: new Date(Date.now() - 3600000 * 4 + 45000).toISOString(),
            actor: 'PAYMENT_GATEWAY'
          },
          {
            id: 'tl_3',
            orderId: 'ord_101',
            title: 'Webhook Diterima: Pembayaran Lunas',
            description: 'Payment gateway memvalidasi transaksi lunas via webhook resmi. Status diperbarui ke PAID.',
            timestamp: new Date(Date.now() - 3600000 * 4 + 120000).toISOString(),
            actor: 'PAYMENT_GATEWAY'
          },
          {
            id: 'tl_4',
            orderId: 'ord_101',
            title: 'Tautan Unduhan Aman Dihasilkan',
            description: `Token akses digital unik ${sampleToken.slice(0, 16)}... dibuat dengan kuota 10 unduhan.`,
            timestamp: new Date(Date.now() - 3600000 * 4 + 122000).toISOString(),
            actor: 'SYSTEM'
          },
          {
            id: 'tl_5',
            orderId: 'ord_101',
            title: 'Notifikasi Email & WhatsApp Terkirim',
            description: 'Link download dikirimkan ke budi.santoso@archprima.co.id & WhatsApp 6281288992211.',
            timestamp: new Date(Date.now() - 3600000 * 4 + 125000).toISOString(),
            actor: 'SYSTEM'
          }
        ],
        internalNotes: 'Customer konfirmasi via WhatsApp telah menerima link dan berhasil mendownload file 2.45GB.',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        paidAt: new Date(Date.now() - 3600000 * 4 + 120000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ord_102',
        orderNumber: 'ORD-20260928-000143',
        customerId: 'cust_sarah_wijaya',
        customerName: 'Sarah Wijaya',
        customerEmail: 'sarah.wijaya@gmail.com',
        customerPhone: '6281900112233',
        items: [
          {
            id: 'item_3',
            orderId: 'ord_102',
            productId: 'prod_arsitektur_pack',
            productName: '10.000+ Template Arsitektur & Engineering Pack Pro 2026',
            price: 219000,
            itemType: 'MAIN'
          }
        ],
        subtotalAmount: 219000,
        discountAmount: 0,
        totalAmount: 219000,
        paymentMethod: 'VA_BCA',
        paymentStatus: 'WAITING_PAYMENT',
        deliveryStatus: 'PENDING',
        transactionId: 'TRX-VABCA-8819238',
        orderBumpAdded: false,
        upsellAdded: false,
        utmSource: 'tiktok',
        utmMedium: 'organic',
        timeline: [
          {
            id: 'tl_201',
            orderId: 'ord_102',
            title: 'Checkout Dibuat',
            description: 'Customer memilih metode BCA Virtual Account.',
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            actor: 'CUSTOMER'
          },
          {
            id: 'tl_202',
            orderId: 'ord_102',
            title: 'Menunggu Pembayaran',
            description: 'Nomor VA BCA 8000123991028374 dibuat. Menunggu transfer dari nasabah.',
            timestamp: new Date(Date.now() - 1790000).toISOString(),
            actor: 'PAYMENT_GATEWAY'
          }
        ],
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // Seed secure download for ord_101
    this.downloads.push({
      id: 'dl_101',
      orderId: 'ord_101',
      productId: 'prod_arsitektur_pack',
      secureToken: sampleToken,
      tokenExpiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      downloadLimit: 10,
      downloadCount: 2,
      isRevoked: false,
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      downloadLogs: [
        {
          id: 'log_1',
          fileId: 'file_dwg_templates',
          fileName: 'AutoCAD_Library_DWG_Full_Pack_v4.2.zip',
          downloadedAt: new Date(Date.now() - 3600000 * 3.5).toISOString(),
          ipAddress: '180.252.164.22'
        },
        {
          id: 'log_2',
          fileId: 'file_rab_excel',
          fileName: 'RAB_Otomatis_Formula_SNI_2026_AHSP.xlsx',
          downloadedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
          ipAddress: '180.252.164.22'
        }
      ]
    });

    // 5. Abandoned checkouts
    this.abandonedCheckouts = [
      {
        id: 'ab_1',
        customerName: 'Rian Pratama',
        customerEmail: 'rian.pratama99@gmail.com',
        customerPhone: '6281399887766',
        productId: 'prod_arsitektur_pack',
        productName: '10.000+ Template Arsitektur & Engineering Pack Pro 2026',
        totalAmount: 266000,
        recovered: false,
        remindersSent: 1,
        lastReminderSentAt: new Date(Date.now() - 7200000).toISOString(),
        createdAt: new Date(Date.now() - 10800000).toISOString()
      }
    ];

    // 6. Audit logs
    this.auditLogs = [
      {
        id: 'audit_1',
        userName: 'Aan Pangestu',
        userRole: 'SUPER_ADMIN',
        action: 'UPDATE_PRODUCT_PRICE',
        targetType: 'PRODUCT',
        targetId: 'prod_arsitektur_pack',
        details: 'Mengubah harga diskon produk 10.000+ Template Arsitektur menjadi Rp 219.000',
        ipAddress: '114.124.201.88',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'audit_2',
        userName: 'Aan Pangestu',
        userRole: 'SUPER_ADMIN',
        action: 'CREATE_ORDER_BUMP',
        targetType: 'ORDER_BUMP',
        targetId: 'bump_dwg_blocks',
        details: 'Menambahkan order bump Dynamic AutoCAD Blocks seharga Rp 47.000',
        ipAddress: '114.124.201.88',
        createdAt: new Date(Date.now() - 85000000).toISOString()
      }
    ];
  }

  public saveToFile() {
    try {
      const data = {
        products: this.products,
        orders: this.orders,
        customers: this.customers,
        coupons: this.coupons,
        abandonedCheckouts: this.abandonedCheckouts,
        notificationLogs: this.notificationLogs,
        webhookLogs: this.webhookLogs,
        auditLogs: this.auditLogs,
        downloads: this.downloads,
        licenses: this.licenses,
        settings: this.settings,
        adminUser: this.adminUser
      };
      fs.writeFileSync(this.dataFilePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save data store to file:', err);
    }
  }

  private loadFromFile() {
    try {
      if (fs.existsSync(this.dataFilePath)) {
        const raw = fs.readFileSync(this.dataFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.products?.length) {
          const existingIds = new Set(parsed.products.map((p: any) => p.id));
          const missing = this.products.filter(p => !existingIds.has(p.id));
          this.products = [...missing, ...parsed.products];
          // Ensure products have orderBumps array with 3 bump products
          this.products.forEach(prod => {
            if (!prod.orderBumps || prod.orderBumps.length === 0) {
              if (prod.orderBump) {
                prod.orderBumps = [
                  prod.orderBump,
                  {
                    id: 'bump_dwg_blocks',
                    bumpName: '5.000+ Dynamic AutoCAD Blocks & Detail Konstruksi',
                    bumpTagline: 'Library pintu, jendela, furnitur, MEP, dan struktur dinamis siap pakai. Hemat ratusan jam drafting.',
                    bumpPrice: 47000,
                    bumpThumbnail: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=200&auto=format&fit=crop&q=80',
                    isActive: true
                  },
                  {
                    id: 'bump_rab_master',
                    bumpName: 'Template Master RAB Otomatis & Cashflow Proyek (Excel Macro)',
                    bumpTagline: 'Hitung rekapitulasi, analisa harga satuan, time schedule kurva S dan cashflow otomatis terhubung.',
                    bumpPrice: 39000,
                    bumpThumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=200&auto=format&fit=crop&q=80',
                    isActive: true
                  }
                ];
              }
            }
          });
        }
        if (parsed.orders?.length) this.orders = parsed.orders;
        if (parsed.customers?.length) this.customers = parsed.customers;
        if (parsed.coupons?.length) this.coupons = parsed.coupons;
        if (parsed.abandonedCheckouts) this.abandonedCheckouts = parsed.abandonedCheckouts;
        if (parsed.notificationLogs) this.notificationLogs = parsed.notificationLogs;
        if (parsed.webhookLogs) this.webhookLogs = parsed.webhookLogs;
        if (parsed.auditLogs) this.auditLogs = parsed.auditLogs;
        if (parsed.downloads) this.downloads = parsed.downloads;
        if (parsed.licenses) this.licenses = parsed.licenses;
        if (parsed.settings) {
          this.settings = {
            ...this.getDefaultSettings(),
            ...parsed.settings,
            whatsappFollowUp: parsed.settings.whatsappFollowUp || this.getDefaultSettings().whatsappFollowUp
          };
        }
        if (parsed.adminUser) this.adminUser = parsed.adminUser;
      }
    } catch (err) {
      console.warn('Could not read existing store file, using in-memory seed.', err);
    }
  }

  public verifyAdminPassword(passwordAttempt: string): boolean {
    if (!passwordAttempt) return false;
    const hash = crypto.createHash('sha256').update(passwordAttempt).digest('hex');
    return this.adminUser.password === passwordAttempt || this.adminUser.passwordHash === hash;
  }

  public updateAdminPassword(newPassword: string): boolean {
    this.adminUser.password = newPassword;
    this.adminUser.passwordHash = crypto.createHash('sha256').update(newPassword).digest('hex');
    this.saveToFile();
    return true;
  }
}

export const db = new DatabaseStore();
