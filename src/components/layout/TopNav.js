
import React from 'react';
import './TopNav.css';

const TopNav = ({ title }) => {
  return (
    <div className="top-nav">
      <h1>{title}</h1>
    </div>
  );
};

export default TopNav;
