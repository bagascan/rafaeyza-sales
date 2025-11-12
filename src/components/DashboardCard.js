
import React from 'react';
import './DashboardCard.css';

const DashboardCard = ({ title, value, icon }) => {
  return (
    <div className="dashboard-card">
      <div className="card-icon">
        {icon}
      </div>
      <div className="card-content">
        <p className="card-title">{title}</p>
        <h3 className="card-value">{value}</h3>
      </div>
    </div>
  );
};

export default DashboardCard;
