import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Settings, Package } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Badge } from './ui/badge';

export const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const { totalItems, setIsOpen } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 glass border-b" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2" data-testid="logo-link">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">F</span>
            </div>
            <span className="font-bold text-xl text-primary" style={{ fontFamily: 'Playfair Display, serif' }}>
              FoodNova
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link 
              to="/" 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              data-testid="nav-home"
            >
              Home
            </Link>
            <Link 
              to="/#products" 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              data-testid="nav-products"
            >
              Products
            </Link>
            <Link 
              to="/#packs" 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              data-testid="nav-packs"
            >
              Packs
            </Link>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Cart Button */}
            <Button
              variant="outline"
              size="icon"
              className="relative"
              onClick={() => setIsOpen(true)}
              data-testid="cart-button"
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <Badge 
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-accent text-white"
                  data-testid="cart-badge"
                >
                  {totalItems}
                </Badge>
              )}
            </Button>

            {user ? (
              <div className="flex items-center gap-2">
                {isAdmin ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate('/admin')}
                    data-testid="admin-dashboard-btn"
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Admin
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate('/orders')}
                    data-testid="my-orders-btn"
                  >
                    <Package className="h-4 w-4 mr-1" />
                    Orders
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleLogout}
                  data-testid="logout-btn"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate('/login')}
                  data-testid="login-btn"
                >
                  Login
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => navigate('/register')}
                  className="bg-primary hover:bg-primary/90 btn-glow"
                  data-testid="register-btn"
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
