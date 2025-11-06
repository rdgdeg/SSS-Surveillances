
import React, { useState } from 'react';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/shared/Card';
import { Input } from '../components/shared/Input';
import { Button } from '../components/shared/Button';
import { Lock, LogIn, University, Home, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const LoginPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/admin';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);
    
    setTimeout(() => {
        if (auth.login(password)) {
            toast.success('Connexion réussie !');
            navigate(from, { replace: true });
        } else {
            setError('Mot de passe incorrect.');
            toast.error('Mot de passe incorrect.');
            setIsLoggingIn(false);
        }
    }, 300);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <University className="mx-auto h-12 w-12 text-indigo-600" />
            <CardTitle className="mt-4 text-2xl">Accès Administration</CardTitle>
            <CardDescription>Veuillez entrer le mot de passe pour continuer.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="sr-only">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mot de passe"
                  required
                  className="pl-10"
                  aria-describedby="password-error"
                />
              </div>
              {error && <p id="password-error" className="text-sm text-red-500 mt-2 text-center">{error}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isLoggingIn}>
                {isLoggingIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                Se connecter
            </Button>
          </form>
        </CardContent>
        <CardFooter>
            <NavLink to="/" className="w-full">
                <Button variant="outline" className="w-full">
                    <Home className="mr-2 h-4 w-4" />
                    Retour à l'accueil
                </Button>
            </NavLink>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;
