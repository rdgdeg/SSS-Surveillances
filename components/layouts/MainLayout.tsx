
import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { University, Sun, Moon, Home, BookOpen, Menu, X, Mail, Phone, MapPin } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../shared/Button';
import NetworkStatusIndicator from '../shared/NetworkStatusIndicator';
import OfflineQueueIndicator from '../shared/OfflineQueueIndicator';
import ContactModal from '../shared/ContactModal';

const MainLayout: React.FC = () => {
    const { isDarkMode, toggleTheme } = useTheme();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);

    // Empêcher le scroll quand le menu mobile est ouvert
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMobileMenuOpen]);

    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    return (
        <div className="min-h-screen text-gray-800 dark:text-gray-200">
            <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <NavLink to="/" className="flex items-center flex-shrink-0">
                            <University className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                            <span className="ml-3 text-lg font-semibold hidden sm:inline">Portail de Gestion des Surveillances</span>
                            <span className="ml-3 text-lg font-semibold sm:hidden">SSS</span>
                            <span className="ml-2 font-light text-sm text-gray-500 dark:text-gray-400 hidden lg:inline">SSS - UCLouvain</span>
                        </NavLink>
                        
                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-2">
                            <NavLink to="/consignes">
                                <Button variant="outline" size="sm">
                                    <BookOpen className="mr-2 h-4 w-4" />
                                    Consignes spécifiques des examens
                                </Button>
                            </NavLink>
                            <NavLink to="/">
                                <Button variant="outline" size="sm">
                                    <Home className="mr-2 h-4 w-4" />
                                    Retour à l'accueil
                                </Button>
                            </NavLink>
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                aria-label="Toggle theme"
                            >
                                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                            </button>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="flex md:hidden items-center space-x-2">
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                aria-label="Toggle theme"
                            >
                                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                            </button>
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                aria-label="Toggle menu"
                            >
                                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden fixed inset-0 top-16 bg-white dark:bg-gray-800 z-40 overflow-y-auto">
                        <nav className="container mx-auto px-4 py-4 space-y-2">
                            <NavLink 
                                to="/consignes" 
                                onClick={closeMobileMenu}
                                className="flex items-center px-4 py-3 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <BookOpen className="mr-3 h-5 w-5" />
                                <span className="font-medium">Consignes spécifiques des examens</span>
                            </NavLink>
                            <NavLink 
                                to="/" 
                                onClick={closeMobileMenu}
                                className="flex items-center px-4 py-3 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <Home className="mr-3 h-5 w-5" />
                                <span className="font-medium">Retour à l'accueil</span>
                            </NavLink>
                        </nav>
                    </div>
                )}
            </header>
            
            <main className="container mx-auto p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-16rem)]">
                <Outlet />
            </main>
            
            {/* Footer */}
            <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 mt-12">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* À propos */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                                <University className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                SSS - UCLouvain
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Système de gestion des surveillances d'examens pour l'Université catholique de Louvain.
                            </p>
                        </div>

                        {/* Liens rapides */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                Liens rapides
                            </h3>
                            <ul className="space-y-2 text-sm">
                                <li>
                                    <NavLink to="/" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                        Accueil
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/consignes" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                        Consignes spécifiques des examens
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/admin" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                        Administration
                                    </NavLink>
                                </li>
                            </ul>
                        </div>

                        {/* Contact */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                Besoin d'aide ?
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                En cas de problème ou de question, n'hésitez pas à nous contacter.
                            </p>
                            <Button 
                                onClick={() => setIsContactModalOpen(true)}
                                size="sm"
                                className="w-full md:w-auto"
                            >
                                <Mail className="mr-2 h-4 w-4" />
                                Nous contacter
                            </Button>
                        </div>
                    </div>

                    {/* Copyright */}
                    <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-600 dark:text-gray-400">
                        <p>© {new Date().getFullYear()} UCLouvain - Tous droits réservés</p>
                    </div>
                </div>
            </footer>
            
            {/* Indicateurs de fiabilité */}
            <NetworkStatusIndicator />
            <OfflineQueueIndicator />
            
            {/* Modal de contact */}
            <ContactModal 
                isOpen={isContactModalOpen} 
                onClose={() => setIsContactModalOpen(false)} 
            />
        </div>
    );
};

export default MainLayout;
