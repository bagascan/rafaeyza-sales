import React from 'react';
import './TopSalesList.css'; // Create this CSS file next

const TopSalesList = ({ topSales }) => {
  if (!topSales || topSales.length === 0) {
    return <p className="no-data-message">Belum ada data penjualan.</p>;
  }

  return (
    <div className="top-sales-list">
      <h3>Top Sales</h3>
      <ol className="sales-list">
        {topSales.map((sale, index) => (
          <li key={index} className="sales-item">
            <span className="sales-name">{sale.name}</span>
            <span className="sales-total">Rp {sale.totalSales.toLocaleString('id-ID')}</span>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default TopSalesList;