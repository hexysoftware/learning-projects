// Önceden ürünleri elimizle yazıyorduk. Şimdi sunucudan çekeceğiz!

async function loadProductsFromServer() {
    try {
        // Node.js sunucumuza istek atıyoruz
        const response = await fetch('http://localhost:3000/api/products');
        
        // Hata yönetimi: Sunucu cevap vermiyorsa
        if (!response.ok) {
            throw new Error(`HTTP hatası! Durum: ${response.status}`);
        }

        const products = await response.json(); // Gelen veriyi JSON'a çevir
        const grid = document.getElementById('product-grid');
        grid.innerHTML = ''; // Önceki içeriği temizle
        
        // Gelen verileri ekrana bas
        products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <img src="${product.image_url}" alt="${product.name}" class="product-image">
                <div class="product-info">
                    <div class="product-title">${product.name}</div>
                    <div class="product-price">${product.price} TL</div>
                    <button class="btn-add" onclick="addToCart(${product.id})">SEPETE EKLE</button>
                </div>
            `;
            grid.appendChild(card);
        });

    } catch (error) {
        console.error("Ürünler yüklenirken hata:", error);
        document.getElementById('product-grid').innerHTML = "<p>Ürünler şu an yüklenemiyor. Lütfen daha sonra tekrar deneyin.</p>";
    }
}

// Sayfa yüklendiğinde artık sunucuyu çağırıyoruz
window.onload = loadProductsFromServer;