import React from 'react';
import { motion } from 'framer-motion';
import './Home.css';

const HomePage = () => {
    return (
        <div className="container">
            <header className="header">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    Welcome to Mental Wellness
                </motion.h1>
            </header>

            <div className="content">
                <motion.div
                    className="info-card"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <h2>Daily Mindfulness</h2>
                    <p>Practice mindfulness exercises to reduce stress and anxiety.</p>
                </motion.div>

                <motion.div
                    className="info-card"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <h2>Mood Tracker</h2>
                    <p>Keep track of your emotions and identify patterns.</p>
                </motion.div>

                <motion.div
                    className="info-card"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <h2>Relaxation Techniques</h2>
                    <p>Learn and practice various relaxation methods.</p>
                </motion.div>
            </div>

            <div className="button-container">
                <motion.button
                    className="styled-button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    Start Your Journey
                </motion.button>
            </div>
        </div>
    );
};

export default HomePage;