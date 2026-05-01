import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 font-bold text-xl text-primary">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">J</div>
            <span>Job Intelligent</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-text hover:text-primary transition">Offres</Link>
            <Link to="/recommendations" className="text-text hover:text-primary transition">Recommandations</Link>
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-text-secondary">{user.email}</span>
                <Link
                  to="/dashboard"
                  className="p-2 hover:bg-slate-100 rounded-lg transition"
                >
                  <User size={20} />
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-danger/10 text-danger rounded-lg transition"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <div className="flex space-x-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-primary border border-primary rounded-lg hover:bg-primary-light transition"
                >
                  Se connecter
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
                >
                  S'inscrire
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-3">
            <Link
              to="/"
              className="block px-4 py-2 text-text hover:bg-slate-100 rounded-lg transition"
              onClick={() => setIsOpen(false)}
            >
              Offres
            </Link>
            <Link
              to="/recommendations"
              className="block px-4 py-2 text-text hover:bg-slate-100 rounded-lg transition"
              onClick={() => setIsOpen(false)}
            >
              Recommandations
            </Link>
            {isAuthenticated && user ? (
              <>
                <Link
                  to="/dashboard"
                  className="block px-4 py-2 text-text hover:bg-slate-100 rounded-lg transition"
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-danger hover:bg-danger/10 rounded-lg transition"
                >
                  Se déconnecter
                </button>
              </>
            ) : (
              <div className="space-y-2 px-4">
                <Link
                  to="/login"
                  className="block text-center px-4 py-2 text-primary border border-primary rounded-lg hover:bg-primary-light transition"
                  onClick={() => setIsOpen(false)}
                >
                  Se connecter
                </Link>
                <Link
                  to="/signup"
                  className="block text-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
                  onClick={() => setIsOpen(false)}
                >
                  S'inscrire
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
