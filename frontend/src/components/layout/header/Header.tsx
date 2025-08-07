import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Menu, X, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button/Button'
import { useAuth } from '@/hooks/auth/useAuth'
import { useCart } from '@/hooks/cart/useCart'
import { CartDrawer } from '@/components/cart/cartDrawer/CartDrawer'

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const navigate = useNavigate()
  const { user, isAuthenticated, logout, isAdmin } = useAuth()
  const { totalItems } = useCart()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="text-2xl font-bold text-blue-600">
              GameStore
            </Link>

            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/products" className="text-gray-700 hover:text-blue-600">
                Games
              </Link>
              <Link to="/categories" className="text-gray-700 hover:text-blue-600">
                Categories
              </Link>
            </nav>

            <div className="hidden md:flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={() => setIsCartOpen(true)} className="relative">
                <ShoppingCart className="w-6 h-6" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Button>

              {isAuthenticated ? (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">Hi, {user?.firstName || 'User'}</span>
                  {isAdmin && (
                    <Link to="/admin/dashboard">
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4 mr-1" />
                        Admin
                      </Button>
                    </Link>
                  )}
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link to="/auth">
                    <Button variant="outline" size="sm">Login</Button>
                  </Link>
                  <Link to="/auth?mode=register">
                    <Button size="sm">Sign Up</Button>
                  </Link>
                </div>
              )}
            </div>

            <div className="md:hidden flex items-center space-x-2">
              <Button variant="ghost" size="icon" onClick={() => setIsCartOpen(true)} className="relative">
                <ShoppingCart className="w-6 h-6" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </div>
          </div>

          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <nav className="flex flex-col space-y-4">
                <Link to="/products" className="text-gray-700 hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>
                  Games
                </Link>
                <Link to="/categories" className="text-gray-700 hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>
                  Categories
                </Link>
                {isAuthenticated && isAdmin && (
                  <Link to="/admin/dashboard" className="text-gray-700 hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>
                    Admin Dashboard
                  </Link>
                )}
                {isAuthenticated ? (
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    Logout
                  </Button>
                ) : (
                  <div className="flex flex-col space-y-2">
                    <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full">Login</Button>
                    </Link>
                    <Link to="/auth?mode=register" onClick={() => setIsMenuOpen(false)}>
                      <Button size="sm" className="w-full">Sign Up</Button>
                    </Link>
                  </div>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={() => {
          setIsCartOpen(false)
          navigate('/checkout')
        }}
      />
    </>
  )
} 