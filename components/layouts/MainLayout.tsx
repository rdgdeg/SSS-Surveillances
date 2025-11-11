
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { University, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const MainLayout: React.FC = () => {
    const { isDarkMode, toggleTheme } = useTheme();

    return (
        <div className="min-h-screen text-gray-800 dark:text-gray-200">
            <header className="bg-white dark:bg-gray-800 shadow-md">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <NavLink to="/" className="flex items-center">
                            <University className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                            <span className="ml-3 text-lg font-semibold">Portail de Gestion des Surveillances</span>
                            <span className="ml-2 font-light text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">SSS - UCLouvain</span>
                        </NavLink>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                aria-label="Toggle theme"
                            >
                                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                </div>
            </header>
            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;
