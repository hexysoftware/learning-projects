const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

class CodingVeriServer {
    constructor(port) {
        this.app = express();
        this.port = port;
        this.dbPool = null;
    }

    async setup() {
        this.app.use(cors());
        this.app.use(express.json());

        // 🇹🇷 TÜRKÇE KARAKTER KESİN ÇÖZÜMÜ: charset eklendi
        this.dbPool = mysql.createPool({
            host: 'localhost', user: 'root', password: '', database: 'test',
            waitForConnections: true, connectionLimit: 10,
            charset: 'utf8mb4' 
        });

        await this.initTables();
        this.setupRoutes();
        this.app.listen(this.port, () => console.log(`🚀 Coding Veri Sunucusu Aktif: ${this.port}`));
    }

    async initTables() {
        await this.dbPool.query(`
            CREATE TABLE IF NOT EXISTS kullanicilar (
                id INT AUTO_INCREMENT PRIMARY KEY,
                isim VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                kayit_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await this.dbPool.query(`
            CREATE TABLE IF NOT EXISTS adminler (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL
            )
        `);

        // Eksik Sütunları Ekle
        try { await this.dbPool.query("ALTER TABLE kullanicilar ADD COLUMN telefon VARCHAR(30)"); } catch (e) { }
        try { await this.dbPool.query("ALTER TABLE kullanicilar ADD COLUMN sehir VARCHAR(50) DEFAULT 'Belirtilmedi'"); } catch (e) { }
        
        // 🇹🇷 Eski kayıtların karakter setini UTF-8'e zorla çevir
        try { await this.dbPool.query("ALTER TABLE kullanicilar CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"); } catch (e) { }
    }

    setupRoutes() {
        // GİRİŞ
        this.app.post('/api/login', async (req, res) => {
            const { username, password } = req.body;
            const [rows] = await this.dbPool.query("SELECT * FROM adminler WHERE username = ? AND password = ?", [username, password]);
            if (rows.length > 0) res.json({ login: true });
            else res.status(401).json({ login: false });
        });

        // İSTATİSTİKLER (LIMIT kaldırıldı, tüm şehirler çekiliyor)
        this.app.get('/api/stats/tr', async (req, res) => {
            try {
                const [[{ total }]] = await this.dbPool.query("SELECT COUNT(*) as total FROM kullanicilar");
                const [[{ today }]] = await this.dbPool.query("SELECT COUNT(*) as today FROM kullanicilar WHERE DATE(kayit_tarihi) = CURDATE()");
                // Sınır yok, verisi olan tüm şehirleri getir
                const [cityStats] = await this.dbPool.query("SELECT sehir, COUNT(*) as count FROM kullanicilar WHERE sehir IS NOT NULL GROUP BY sehir ORDER BY count DESC");
                res.json({ total, today, cityStats });
            } catch (error) {
                res.status(500).json({ error: "İstatistik hatası" });
            }
        });

        // CRUD
        this.app.get('/api/kullanicilar', async (req, res) => {
            const { q } = req.query;
            let sql = "SELECT * FROM kullanicilar ORDER BY id DESC";
            let params = [];
            if (q) {
                sql = "SELECT * FROM kullanicilar WHERE isim LIKE ? OR email LIKE ? OR sehir LIKE ? OR telefon LIKE ? ORDER BY id DESC";
                params = [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%` ];
            }
            const [rows] = await this.dbPool.query(sql, params);
            res.json({ veri: rows });
        });

        this.app.post('/api/kullanicilar', async (req, res) => {
            const { isim, email, telefon, sehir } = req.body;
            await this.dbPool.query("INSERT INTO kullanicilar (isim, email, telefon, sehir) VALUES (?, ?, ?, ?)", [isim, email, telefon, sehir]);
            res.json({ mesaj: "Başarılı" });
        });

        this.app.put('/api/kullanicilar/:id', async (req, res) => {
            const { isim, email, telefon, sehir } = req.body;
            await this.dbPool.query("UPDATE kullanicilar SET isim = ?, email = ?, telefon = ?, sehir = ? WHERE id = ?", [isim, email, telefon, sehir, req.params.id]);
            res.json({ mesaj: "Güncellendi" });
        });

        this.app.delete('/api/kullanicilar/:id', async (req, res) => {
            await this.dbPool.query("DELETE FROM kullanicilar WHERE id = ?", [req.params.id]);
            res.json({ mesaj: "Silindi" });
        });
    }
}

new CodingVeriServer(3000).setup();