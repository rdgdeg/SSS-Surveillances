
import React, { useState, useEffect, useMemo } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { University, Sun, Moon, Home, CalendarDays, Users, Clock, FileText, MessageSquare, LogOut, ClipboardList, CheckSquare, BarChart3, BookOpen, Menu, X, HelpCircle, Phone, Edit3, GitBranch, UserCheck, BarChart2, CheckCircle } from 'lucide-react';
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
    
    // Définir tous les liens de navigation avec une meilleure organisation
    const allNavLinks = [
        // === TABLEAU DE BORD ===
        { to: 'dashboard', label: 'Tableau de bord', icon: Home, category: 'dashboard', adminOnly: true, description: 'Vue d\'ensemble et statistiques' },
        
        // === GESTION DES SESSIONS ===
        { to: 'sessions', label: 'Sessions d\'examens', icon: CalendarDays, category: 'sessions', adminOnly: true, description: 'Créer et gérer les sessions' },
        { to: 'examens', label: 'Examens', icon: FileText, category: 'sessions', adminOnly: false, description: 'Planning et organisation des examens' },
        { to: 'creneaux', label: 'Créneaux de surveillance', icon: Clock, category: 'sessions', adminOnly: false, description: 'Horaires et capacités' },
        
        // === SURVEILLANTS ===
        { to: 'surveillants', label: 'Base surveillants', icon: Users, category: 'surveillants', adminOnly: false, description: 'Gestion des surveillants' },
        { to: 'disponibilites', label: 'Disponibilités', icon: CheckCircle, category: 'surveillants', adminOnly: false, description: 'Collecte des disponibilités' },
        { to: 'contacts', label: 'Contacts & téléphones', icon: Phone, category: 'surveillants', adminOnly: false, description: 'Coordonnées des surveillants' },
        { to: 'messages-disponibilites', label: 'Messages disponibilités', icon: MessageSquare, category: 'surveillants', adminOnly: false, description: 'Communication avec les surveillants' },
        { to: 'soumissions', label: 'Suivi des soumissions', icon: ClipboardList, category: 'surveillants', adminOnly: true, description: 'Monitoring des réponses' },
        { to: 'suivi-soumissions', label: 'Relances automatiques', icon: CheckSquare, category: 'surveillants', adminOnly: true, description: 'Gestion des relances' },
        
        // === ENSEIGNANTS ===
        { to: 'cours', label: 'Cours', icon: BookOpen, category: 'enseignants', adminOnly: false, description: 'Base de données des cours' },
        { to: 'presences-enseignants', label: 'Présences enseignants', icon: UserCheck, category: 'enseignants', adminOnly: false, description: 'Déclarations de présence' },
        { to: 'consignes-secretariat', label: 'Consignes par secrétariat', icon: FileText, category: 'enseignants', adminOnly: false, description: 'Instructions spécifiques' },
        
        // === RAPPORTS & ANALYSES ===
        { to: 'statistiques', label: 'Statistiques', icon: BarChart3, category: 'rapports', adminOnly: true, description: 'Analyses et métriques' },
        { to: 'rapports', label: 'Rapports généraux', icon: FileText, category: 'rapports', adminOnly: true, description: 'Rapports détaillés' },
        { to: 'rapport-surveillances', label: 'Rapport surveillances', icon: Users, category: 'rapports', adminOnly: true, description: 'Suivi des attributions' },
        { to: 'analyse-examens', label: 'Analyse des examens', icon: BarChart2, category: 'rapports', adminOnly: true, description: 'Analyses approfondies' },
        
        // === ADMINISTRATION ===
        { to: 'users', label: 'Utilisateurs admin', icon: Users, category: 'admin', adminOnly: true, description: 'Gestion des comptes admin' },
        { to: 'demandes-modification', label: 'Demandes de modification', icon: Edit3, category: 'admin', adminOnly: true, description: 'Demandes des enseignants' },
        { to: 'messages', label: 'Messages système', icon: MessageSquare, category: 'admin', adminOnly: true, description: 'Communication système' },
        { to: 'versioning', label: 'Historique & Rollback', icon: GitBranch, category: 'admin', adminOnly: true, description: 'Versioning et restauration' },
        
        // === AIDE ===
        { to: 'aide', label: 'Aide & Documentation', icon: HelpCircle, category: 'aide', adminOnly: false, description: 'Guides et support' },
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
                    {/* Tableau de bord */}
                    {navLinks.some(link => link.category === 'dashboard') && (
                        <>
                            <div className="pb-3">
                                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800">
                                    <Home className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                    <h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                                        Tableau de bord
                                    </h3>
                                </div>
                            </div>
                            {navLinks.filter(link => link.category === 'dashboard').map(({ to, label, icon: Icon, description }) => (
                                <NavLink 
                                    key={to} 
                                    to={to} 
                                    className={navLinkClasses}
                                    onMouseEnter={() => preloadRoute(`/admin/${to}`)}
                                    title={description}
                                >
                                    <Icon className="h-5 w-5"/>
                                    <span>{label}</span>
                                </NavLink>
                            ))}
                        </>
                    )}

                    {/* Sessions & Examens */}
                    {navLinks.some(link => link.category === 'sessions') && (
                        <>
                            <div className="pt-4 pb-3">
                                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                                    <CalendarDays className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                                        Sessions & Examens
                                    </h3>
                                </div>
                            </div>
                            {navLinks.filter(link => link.category === 'sessions').map(({ to, label, icon: Icon, description }) => (
                                <NavLink 
                                    key={to} 
                                    to={to} 
                                    className={navLinkClasses}
                                    onMouseEnter={() => preloadRoute(`/admin/${to}`)}
                                    title={description}
                                >
                                    <Icon className="h-5 w-5"/>
                                    <span>{label}</span>
                                </NavLink>
                            ))}
                        </>
                    )}
                    
                    {/* Surveillants */}
                    {navLinks.some(link => link.category === 'surveillants') && (
                        <>
                            <div className="pt-4 pb-3">
                                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-100 dark:border-green-800">
                                    <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    <h3 className="text-sm font-semibold text-green-700 dark:text-green-300 uppercase tracking-wider">
                                        Surveillants
                                    </h3>
                                </div>
                            </div>
                            {navLinks.filter(link => link.category === 'surveillants').map(({ to, label, icon: Icon, description }) => (
                                <NavLink 
                                    key={to} 
                                    to={to} 
                                    className={navLinkClasses}
                                    onMouseEnter={() => preloadRoute(`/admin/${to}`)}
                                    title={description}
                                >
                                    <Icon className="h-5 w-5"/>
                                    <span>{label}</span>
                                </NavLink>
                            ))}
                        </>
                    )}
                    
                    {/* Enseignants */}
                    {navLinks.some(link => link.category === 'enseignants') && (
                        <>
                            <div className="pt-4 pb-3">
                                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg border border-orange-100 dark:border-orange-800">
                                    <BookOpen className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                    <h3 className="text-sm font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wider">
                                        Enseignants
                                    </h3>
                                </div>
                            </div>
                            {navLinks.filter(link => link.category === 'enseignants').map(({ to, label, icon: Icon, description }) => (
                                <NavLink 
                                    key={to} 
                                    to={to} 
                                    className={navLinkClasses}
                                    onMouseEnter={() => preloadRoute(`/admin/${to}`)}
                                    title={description}
                                >
                                    <Icon className="h-5 w-5"/>
                                    <span>{label}</span>
                                </NavLink>
                            ))}
                        </>
                    )}
                    
                    {/* Rapports & Analyses */}
                    {navLinks.some(link => link.category === 'rapports') && (
                        <>
                            <div className="pt-4 pb-3">
                                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
                                    <BarChart3 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                    <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                                        Rapports & Analyses
                                    </h3>
                                </div>
                            </div>
                            {navLinks.filter(link => link.category === 'rapports').map(({ to, label, icon: Icon, description }) => (
                                <NavLink 
                                    key={to} 
                                    to={to} 
                                    className={navLinkClasses}
                                    onMouseEnter={() => preloadRoute(`/admin/${to}`)}
                                    title={description}
                                >
                                    <Icon className="h-5 w-5"/>
                                    <span>{label}</span>
                                </NavLink>
                            ))}
                        </>
                    )}

                    {/* Administration */}
                    {navLinks.some(link => link.category === 'admin') && (
                        <>
                            <div className="pt-4 pb-3">
                                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-lg border border-red-100 dark:border-red-800">
                                    <Users className="h-4 w-4 text-red-600 dark:text-red-400" />
                                    <h3 className="text-sm font-semibold text-red-700 dark:text-red-300 uppercase tracking-wider">
                                        Administration
                                    </h3>
                                </div>
                            </div>
                            {navLinks.filter(link => link.category === 'admin').map(({ to, label, icon: Icon, description }) => (
                                <NavLink 
                                    key={to} 
                                    to={to} 
                                    className={navLinkClasses}
                                    onMouseEnter={() => preloadRoute(`/admin/${to}`)}
                                    title={description}
                                >
                                    <Icon className="h-5 w-5"/>
                                    <span>{label}</span>
                                </NavLink>
                            ))}
                        </>
                    )}

                    {/* Aide */}
                    {navLinks.some(link => link.category === 'aide') && (
                        <>
                            <div className="pt-4 pb-3">
                                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 rounded-lg border border-gray-100 dark:border-gray-800">
                                    <HelpCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Support
                                    </h3>
                                </div>
                            </div>
                            {navLinks.filter(link => link.category === 'aide').map(({ to, label, icon: Icon, description }) => (
                                <NavLink 
                                    key={to} 
                                    to={to} 
                                    className={navLinkClasses}
                                    onMouseEnter={() => preloadRoute(`/admin/${to}`)}
                                    title={description}
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
                        {/* Tableau de bord */}
                        {navLinks.some(link => link.category === 'dashboard') && (
                            <>
                                <div className="pb-2">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800">
                                        <Home className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                        <h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                                            Tableau de bord
                                        </h3>
                                    </div>
                                </div>
                                {navLinks.filter(link => link.category === 'dashboard').map(({ to, label, icon: Icon }) => (
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

                        {/* Sessions & Examens */}
                        {navLinks.some(link => link.category === 'sessions') && (
                            <>
                                <div className="pt-4 pb-2">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                                        <CalendarDays className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                                            Sessions & Examens
                                        </h3>
                                    </div>
                                </div>
                                {navLinks.filter(link => link.category === 'sessions').map(({ to, label, icon: Icon }) => (
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
                        
                        {/* Surveillants */}
                        {navLinks.some(link => link.category === 'surveillants') && (
                            <>
                                <div className="pt-4 pb-2">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-100 dark:border-green-800">
                                        <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                                        <h3 className="text-sm font-semibold text-green-700 dark:text-green-300 uppercase tracking-wider">
                                            Surveillants
                                        </h3>
                                    </div>
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
                        
                        {/* Enseignants */}
                        {navLinks.some(link => link.category === 'enseignants') && (
                            <>
                                <div className="pt-4 pb-2">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg border border-orange-100 dark:border-orange-800">
                                        <BookOpen className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                        <h3 className="text-sm font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wider">
                                            Enseignants
                                        </h3>
                                    </div>
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
                        
                        {/* Rapports & Analyses */}
                        {navLinks.some(link => link.category === 'rapports') && (
                            <>
                                <div className="pt-4 pb-2">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
                                        <BarChart3 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                        <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                                            Rapports & Analyses
                                        </h3>
                                    </div>
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

                        {/* Administration */}
                        {navLinks.some(link => link.category === 'admin') && (
                            <>
                                <div className="pt-4 pb-2">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-lg border border-red-100 dark:border-red-800">
                                        <Users className="h-4 w-4 text-red-600 dark:text-red-400" />
                                        <h3 className="text-sm font-semibold text-red-700 dark:text-red-300 uppercase tracking-wider">
                                            Administration
                                        </h3>
                                    </div>
                                </div>
                                {navLinks.filter(link => link.category === 'admin').map(({ to, label, icon: Icon }) => (
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

                        {/* Aide */}
                        {navLinks.some(link => link.category === 'aide') && (
                            <>
                                <div className="pt-4 pb-2">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 rounded-lg border border-gray-100 dark:border-gray-800">
                                        <HelpCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Support
                                        </h3>
                                    </div>
                                </div>
                                {navLinks.filter(link => link.category === 'aide').map(({ to, label, icon: Icon }) => (
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