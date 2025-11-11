
import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { University, Sun, Moon, Home, CalendarDays, Users, Clock, FileText, MessageSquare, LogOut, ClipboardList, CheckSquare, BarChart3 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../shared/Button';

const AdminLayout: React.FC = () => {
    const { isDarkMode, toggleTheme } = useTheme();
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };
    
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
    ];

    const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
        `flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-md transition-colors duration-200 ${
        isActive
            ? 'bg-indigo-50 text-indigo-700 dark:bg-gray-800 dark:text-indigo-300'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700/50'
        }`;

    return (
        <div className="min-h-screen flex flex-col">
             <header className="sticky top-0 z-40 w-full border-b bg-white dark:bg-gray-900 dark:border-gray-800">
                <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                     <div className="flex items-center">
                        <University className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                        <div className="ml-3">
                            <span className="text-xl font-bold">Admin Panel</span>
                            <span className="ml-2 font-light text-gray-500 dark:text-gray-400 text-sm">UCLouvain</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <NavLink to="/">
                            <Button variant="outline" size="sm">
                                <Home className="mr-2 h-4 w-4" />
                                Retour à l'accueil
                            </Button>
                        </NavLink>
                        <Button variant="outline" size="sm" onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Déconnexion
                        </Button>
                        <button 
                          onClick={toggleTheme} 
                          className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          aria-label="Toggle theme"
                        >
                          {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
                <nav className="border-t dark:border-gray-800">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="py-2 flex space-x-2 overflow-x-auto">
                            {navLinks.map(({ to, label, icon: Icon }) => (
                                <NavLink key={to} to={to} className={navLinkClasses}>
                                    <Icon className="h-4 w-4"/>
                                    <span>{label}</span>
                                </NavLink>
                            ))}
                        </div>
                    </div>
                </nav>
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