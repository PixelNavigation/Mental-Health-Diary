import React from 'react';
import './NavBar.css';
import { Link } from 'react-router-dom';
import Logo from '../assets/Logo.png';

const NavBar = () => {
    return (
        <nav className="navbar">
            <div className="Logo">
                <Link to="/">
                    <img src={Logo} alt="Logo" />
                    <h1>Signature</h1>
                </Link>
            </div>
            <ul className="navbar-nav">
                <li>
                    <Link to="/dashboard" className="nav-link">Dashboard</Link>
                </li>
                <li>
                    <Link to="/diary" className="nav-link">Diary</Link>
                </li>
            </ul>
        </nav>
    );
};

export default NavBar;
