import React, { useState, useMemo } from 'react';
import './ProductSearchModal.css';

const ProductSearchModal = ({ products, onSelect, onClose, existingProductIds }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter produk yang belum ada di daftar kunjungan
  const availableProducts = useMemo(() => {
    return products.filter(p => !existingProductIds.includes(p._id));
  }, [products, existingProductIds]);

  // Filter produk berdasarkan input pencarian
  const filteredProducts = useMemo(() => {
    if (!searchTerm) {
      return availableProducts;
    }
    return availableProducts.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, availableProducts]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Cari dan Tambah Produk</h3>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>
        <div className="modal-body">
          <input
            type="text"
            className="search-input-modal"
            placeholder="Ketik nama produk..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            autoFocus
          />
          <div className="product-list-modal">
            {filteredProducts.length > 0 ? (
              filteredProducts.map(product => (
                <div
                  key={product._id}
                  className="product-item-modal"
                  onClick={() => onSelect(product)}
                >
                  {product.name}
                </div>
              ))
            ) : (
              <p>Produk tidak ditemukan atau sudah ditambahkan.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductSearchModal;
