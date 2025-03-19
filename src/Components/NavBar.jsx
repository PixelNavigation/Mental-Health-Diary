import React from 'react'
import './Navbar.css'

const NavBar = () => {
    return (
        <nav className="navbar">
            <a href="/" className="Logo">Logo</a>
            <ul>
                <li><a href='Dashboard'>Dashboard</a></li>
                <li><a href='Diary'>Diary</a></li>
            </ul>
        </nav>
    )
}

export default NavBar