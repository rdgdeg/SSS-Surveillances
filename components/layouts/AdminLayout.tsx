
import React, { useState, useEffect, useMemo } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { University, Sun, Moon, Home, CalendarDays, Users, Clock, FileText, MessageSquare, LogOut, ClipboardList, CheckSquare, BarChart3, BookOpen, Menu, X, HelpCircle, Phone } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { preloadRoute } from '../../lib/routePreloader';

const AdminLayout: React.FC = () => {
    const { isDarkMode, toggleTheme } = useTheme();
    const { user, logout } = useAuth();
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
    
    // Vérifier si l'utilisateur est RaphD (admin complet)
    const isFullAdmin = user?.username === 'RaphD';
    
    // Définir tous les liens de navigation
    const allNavLinks = [
        { to: 'dashboard', label: 'Tableau de bord', icon: Home, category: null, adminOnly: true },
        { to: 'sessions', label: 'Sessions', icon: CalendarDays, category: null, adminOnly: true },
        { to: 'users', label: 'Utilisateurs', icon: Users, category: null, adminOnly: true },
        { to: 'surveillants', label: 'Surveillants', icon: Users, category: 'surveillants', adminOnly: false },
        { to: 'contacts', label: 'Contacts', icon: Phone, category: 'surveillants', adminOnly: false },
        { to: 'creneaux', label: 'Créneaux', icon: Clock, category: 'surveillants', adminOnly: false },
        { to: 'disponibilites', label: 'Disponibilités', icon: FileText, category: 'surveillants', adminOnly: false },
        { to: 'messages-disponibilites', label: 'Messages', icon: MessageSquare, category: 'surveillants', adminOnly: false },
        { to: 'soumissions', label: 'Suivi Soumissions', icon: ClipboardList, category: 'surveillants', adminOnly: true },
        { to: 'suivi-soumissions', label: 'Relances', icon: CheckSquare, category: 'surveillants', adminOnly: true },
        { to: 'cours', label: 'Cours', icon: BookOpen, category: 'enseignants', adminOnly: false },
        { to: 'examens', label: 'Examens', icon: FileText, category: 'enseignants', adminOnly: false },
        { to: 'presences-enseignants', label: 'Présences', icon: CheckSquare, category: 'enseignants', adminOnly: false },
        { to: 'consignes-secretariat', label: 'Consignes Secrétariat', icon: FileText, category: 'enseignants', adminOnly: false },
        { to: 'statistiques', label: 'Statistiques', icon: BarChart3, category: 'rapports', adminOnly: true },
        { to: 'rapports', label: 'Rapports', icon: FileText, category: 'rapports', adminOnly: true },
        { to: 'rapport-surveillances', label: 'Rapport Surveillances', icon: Users, category: 'rapports', adminOnly: true },
        { to: 'messages', label: 'Messages', icon: MessageSquare, category: null, adminOnly: true },
        { to: 'aide', label: 'Aide', icon: HelpCircle, category: null, adminOnly: false },
    ];
    
    // Filtrer les liens selon les permissions
    const navLinks = useMemo(() => {
        if (isFullAdmin) {
            return allNavLinks; // RaphD voit tout
        }
        // Les autres utilisateurs ne voient que les liens non-admin
        return allNavLinks.filter(link => !link.adminOnly);
    }, [isFullAdmin]);

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
        <div className="min-h-screen flex flex-col md:flex-row">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-white dark:bg-gray-900 border-r dark:border-gray-800">
                {/* Sidebar Header */}
                <div className="flex items-center h-16 px-6 border-b dark:border-gray-800">
                    <University className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                    <div className="ml-3">
                        <span className="text-xl font-bold">Admin</span>
                        <span className="ml-2 font-light text-gray-500 dark:text-gray-400 text-sm">UCLouvain</span>
                    </div>
                </div>

                {/* Sidebar Navigation */}
                <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                    {/* General Links */}
                    {navLinks.filter(link => !link.category).map(({ to, label, icon: Icon }) => (
                        <NavLink 
                            key={to} 
                            to={to} 
                            className={navLinkClasses}
                            onMouseEnter={() => preloadRoute(`/admin/${to}`)}
                        >
                            <Icon className="h-5 w-5"/>
                            <span>{label}</span>
                        </NavLink>
                    ))}
                    
                    {/* Surveillants Section */}
                    {navLinks.some(link => link.category === 'surveillants') && (
                        <>
                            <div className="pt-4 pb-2">
                                <h3 className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Surveillants
                                </h3>
                            </div>
                            {navLinks.filter(link => link.category === 'surveillants').map(({ to, label, icon: Icon }) => (
                                <NavLink 
                                    key={to} 
                                    to={to} 
                                    className={navLinkClasses}
                                    onMouseEnter={() => preloadRoute(`/admin/${to}`)}
                                >
                                    <Icon className="h-5 w-5"/>
                                    <span>{label}</span>
                                </NavLink>
                            ))}
                        </>
                    )}
                    
                    {/* Enseignants Section */}
                    {navLinks.some(link => link.category === 'enseignants') && (
                        <>
                            <div className="pt-4 pb-2">
                                <h3 className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Enseignants
                                </h3>
                            </div>
                            {navLinks.filter(link => link.category === 'enseignants').map(({ to, label, icon: Icon }) => (
                                <NavLink 
                                    key={to} 
                                    to={to} 
                                    className={navLinkClasses}
                                    onMouseEnter={() => preloadRoute(`/admin/${to}`)}
                                >
                                    <Icon className="h-5 w-5"/>
                                    <span>{label}</span>
                                </NavLink>
                            ))}
                        </>
                    )}
                    
                    {/* Rapports Section */}
                    {navLinks.some(link => link.category === 'rapports') && (
                        <>
                            <div className="pt-4 pb-2">
                                <h3 className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Rapports
                                </h3>
                            </div>
                            {navLinks.filter(link => link.category === 'rapports').map(({ to, label, icon: Icon }) => (
                                <NavLink 
                                    key={to} 
                                    to={to} 
                                    className={navLinkClasses}
                                    onMouseEnter={() => preloadRoute(`/admin/${to}`)}
                                >
                                    <Icon className="h-5 w-5"/>
                                    <span>{label}</span>
                                </NavLink>
                            ))}
                        </>
                    )}
                </nav>

                {/* Sidebar Footer */}
                <div className="border-t dark:border-gray-800 p-4 space-y-2">
                    <NavLink to="/" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700 transition-colors">
                        <Home className="h-5 w-5" />
                        <span>Accueil</span>
                    </NavLink>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-md text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 transition-colors"
                    >
                        <LogOut className="h-5 w-5" />
                        <span>Déconnexion</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <header className="md:hidden sticky top-0 z-50 w-full border-b bg-white dark:bg-gray-900 dark:border-gray-800">
                <div className="flex h-16 items-center justify-between px-4">
                    <div className="flex items-center flex-shrink-0">
                        <University className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                        <div className="ml-3">
                            <span className="text-xl font-bold">Admin</span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
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

            {/* Mobile Navigation Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 top-16 bg-white dark:bg-gray-900 z-40 overflow-y-auto">
                    <nav className="px-4 py-4 space-y-1">
                        {/* General Links */}
                        {navLinks.filter(link => !link.category).map(({ to, label, icon: Icon }) => (
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
                        
                        {/* Surveillants Section */}
                        {navLinks.some(link => link.category === 'surveillants') && (
                            <>
                                <div className="pt-4 pb-2">
                                    <h3 className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Surveillants
                                    </h3>
                                </div>
                                {navLinks.filter(link => link.category === 'surveillants').map(({ to, label, icon: Icon }) => (
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
                            </>
                        )}
                        
                        {/* Enseignants Section */}
                        {navLinks.some(link => link.category === 'enseignants') && (
                            <>
                                <div className="pt-4 pb-2">
                                    <h3 className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Enseignants
                                    </h3>
                                </div>
                                {navLinks.filter(link => link.category === 'enseignants').map(({ to, label, icon: Icon }) => (
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
                            </>
                        )}
                        
                        {/* Rapports Section */}
                        {navLinks.some(link => link.category === 'rapports') && (
                            <>
                                <div className="pt-4 pb-2">
                                    <h3 className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Rapports
                                    </h3>
                                </div>
                                {navLinks.filter(link => link.category === 'rapports').map(({ to, label, icon: Icon }) => (
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
                            </>
                        )}
                        
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

            {/* Main Content Area */}
            <main className="flex-1 md:ml-64">
                {/* Top Bar for Desktop (Theme Toggle) */}
                <div className="hidden md:flex items-center justify-end h-16 px-6 border-b bg-white dark:bg-gray-900 dark:border-gray-800">
                    <button 
                        onClick={toggleTheme} 
                        className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        aria-label="Toggle theme"
                    >
                        {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </button>
                </div>
                
                <div className="p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;