
import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { University, Sun, Moon, Home, CalendarDays, Users, Clock, FileText, MessageSquare, LogOut, ClipboardList, CheckSquare, BarChart3, BookOpen, Menu, X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../shared/Button';

const AdminLayout: React.FC = () => {
    const { isDarkMode, toggleTheme } = useTheme();
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

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
    
    const navLinks = [
        { to: 'dashboard', label: 'Tableau de bord', icon: Home },
        { to: 'sessions', label: 'Sessions', icon: CalendarDays },
        { to: 'surveillants', label: 'Surveillants', icon: Users },
        { to: 'creneaux', label: 'Créneaux', icon: Clock },
        { to: 'disponibilites', label: 'Disponibilités', icon: FileText },
        { to: 'statistiques', label: 'Statistiques', icon: BarChart3 },
        { to: 'soumissions', label: 'Suivi Soumissions', icon: ClipboardList },
        { to: 'suivi-soumissions', label: 'Relances', icon: CheckSquare },
        { to: 'messages', label: 'Messages', icon: MessageSquare },
        { to: 'cours', label: 'Cours', icon: BookOpen },
    ];

    const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
        `flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-md transition-colors duration-200 whitespace-nowrap ${
        isActive
            ? 'bg-indigo-50 text-indigo-700 dark:bg-gray-800 dark:text-indigo-300'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700/50'
        }`;

    const mobileNavLinkClasses = ({ isActive }: { isActive: boolean }) =>
        `flex items-center gap-3 px-4 py-3 text-base font-medium rounded-lg transition-colors ${
        isActive
            ? 'bg-indigo-50 text-indigo-700 dark:bg-gray-800 dark:text-indigo-300'
            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700'
        }`;

    return (
        <div className="min-h-screen flex flex-col">
             <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-gray-900 dark:border-gray-800">
                <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                     <div className="flex items-center flex-shrink-0">
                        <University className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                        <div className="ml-3">
                            <span className="text-xl font-bold hidden sm:inline">Admin Panel</span>
                            <span className="text-xl font-bold sm:hidden">Admin</span>
                            <span className="ml-2 font-light text-gray-500 dark:text-gray-400 text-sm hidden lg:inline">UCLouvain</span>
                        </div>
                    </div>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center space-x-2">
                        <NavLink to="/">
                            <Button variant="outline" size="sm">
                                <Home className="mr-2 h-4 w-4" />
                                <span className="hidden lg:inline">Retour à l'accueil</span>
                                <span className="lg:hidden">Accueil</span>
                            </Button>
                        </NavLink>
                        <Button variant="outline" size="sm" onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span className="hidden lg:inline">Déconnexion</span>
                        </Button>
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

                {/* Desktop Navigation */}
                <nav className="hidden md:block border-t dark:border-gray-800">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="py-2 flex space-x-2 overflow-x-auto scrollbar-hide">
                            {navLinks.map(({ to, label, icon: Icon }) => (
                                <NavLink key={to} to={to} className={navLinkClasses}>
                                    <Icon className="h-4 w-4"/>
                                    <span>{label}</span>
                                </NavLink>
                            ))}
                        </div>
                    </div>
                </nav>

                {/* Mobile Navigation Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden fixed inset-0 top-16 bg-white dark:bg-gray-900 z-40 overflow-y-auto">
                        <nav className="container mx-auto px-4 py-4 space-y-1">
                            {navLinks.map(({ to, label, icon: Icon }) => (
                                <NavLink 
                                    key={to} 
                                    to={to} 
                                    onClick={closeMobileMenu}
                                    className={mobileNavLinkClasses}
                                >
                                    <Icon className="h-5 w-5" />
                                    <span>{label}</span>
                                </NavLink>
                            ))}
                            <div className="pt-4 mt-4 border-t dark:border-gray-800 space-y-1">
                                <button
                                    onClick={() => {
                                        closeMobileMenu();
                                        navigate('/');
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-base font-medium rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 transition-colors"
                                >
                                    <Home className="h-5 w-5" />
                                    <span>Retour à l'accueil</span>
                                </button>
                                <button
                                    onClick={() => {
                                        closeMobileMenu();
                                        handleLogout();
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-base font-medium rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 transition-colors"
                                >
                                    <LogOut className="h-5 w-5" />
                                    <span>Déconnexion</span>
                                </button>
                            </div>
                        </nav>
                    </div>
                )}
            </header>
            <main className="flex-1">
                 <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                    <Outlet />
                 </div>
            </main>
        </div>
    );
};

export default AdminLayout;