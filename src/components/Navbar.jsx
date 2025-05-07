"use client"

import { useState, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useCart } from "../contexts/CartContext"
import { Bars3Icon, XMarkIcon, ShoppingCartIcon } from "@heroicons/react/24/outline"

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const { user, logout, getUserInitials, isAdmin } = useAuth()
  const { getCartCount } = useCart()
  const location = useLocation()
  const navigate = useNavigate()
  const [isScrolled, setIsScrolled] = useState(false) // ADDED: Track scroll position

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false)
    setIsProfileOpen(false)
  }, [location])

  // ADDED: Track scroll position to add shadow to navbar when scrolled
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Generate breadcrumbs
  const generateBreadcrumbs = () => {
    const pathnames = location.pathname.split("/").filter((x) => x)

    if (pathnames.length === 0) {
      return [{ name: "Home", path: "/" }]
    }

    const breadcrumbs = [{ name: "Home", path: "/" }]

    let path = ""
    pathnames.forEach((name, index) => {
      path = `${path}/${name}`
      const formattedName = name.charAt(0).toUpperCase() + name.slice(1)
      breadcrumbs.push({ name: formattedName, path })
    })

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  const handleLogout = async () => {
    await logout()
    navigate("/")
  }

  // ADDED: Check if current page is admin page
  const isAdminPage = location.pathname.startsWith("/admin")

  return (
    <>
      {/* MODIFIED: Added shadow when scrolled and z-index to ensure it's above other content */}
      <nav className={`bg-white ${isScrolled ? "shadow-md" : ""} fixed top-0 left-0 right-0 z-50`}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <img
                src="https://i.ibb.co.com/ZpJKSvDB/traveloke-removebg-preview.png"
                alt="Traveloke Logo"
                className="h-10 mr-2"
              />
              <span className="text-2xl font-bold text-[#FF7757]">Traveloke</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {/* MODIFIED: Show Dashboard link for admin users */}
              {isAdmin() ? (
                <>
                  <Link to="/admin" className="text-gray-700 hover:text-[#FF7757]">
                    Dashboard
                  </Link>
                  <Link to="/category" className="text-gray-700 hover:text-[#FF7757]">
                    Category
                  </Link>
                  <Link to="/destination" className="text-gray-700 hover:text-[#FF7757]">
                    Destination
                  </Link>
                  <Link to="/admin/transactions" className="text-gray-700 hover:text-[#FF7757]">
                    Transactions
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/" className="text-gray-700 hover:text-[#FF7757]">
                    Home
                  </Link>
                  <Link to="/category" className="text-gray-700 hover:text-[#FF7757]">
                    Category
                  </Link>
                  <Link to="/destination" className="text-gray-700 hover:text-[#FF7757]">
                    Destination
                  </Link>
                  {user && (
                    <Link to="/admin/transactions" className="text-gray-700 hover:text-[#FF7757]">
                      Transactions
                    </Link>
                  )}
                </>
              )}
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  {/* Cart Icon with Counter */}
                  <Link to="/cart" className="relative">
                    <ShoppingCartIcon className="h-6 w-6 text-gray-700 hover:text-[#FF7757]" />
                    {getCartCount() > 0 && (
                      <span className="absolute -top-2 -right-2 bg-[#FF7757] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {getCartCount()}
                      </span>
                    )}
                  </Link>

                  {/* User Profile */}
                  <div className="relative">
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="h-8 w-8 rounded-full bg-[#FF7757] text-white flex items-center justify-center font-medium"
                    >
                      {getUserInitials()}
                    </button>

                    {isProfileOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                        <div className="px-4 py-2 border-b">
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                          <p className="text-xs text-gray-500 capitalize">Role: {user.role}</p>
                        </div>

                        {isAdmin() && (
                          <Link to="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            Admin Dashboard
                          </Link>
                        )}

                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="hidden md:flex space-x-4">
                  <Link
                    to="/login"
                    className="px-4 py-2 rounded-md text-gray-700 hover:text-[#FF7757] border border-gray-300 hover:border-[#FF7757]"
                  >
                    Login
                  </Link>
                  <Link to="/register" className="px-4 py-2 rounded-md bg-[#FF7757] text-white hover:bg-[#ff6242]">
                    Register
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button onClick={() => setIsOpen(!isOpen)} className="md:hidden">
                {isOpen ? (
                  <XMarkIcon className="h-6 w-6 text-gray-700" />
                ) : (
                  <Bars3Icon className="h-6 w-6 text-gray-700" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isOpen && (
            <div className="md:hidden mt-4 pb-4">
              <div className="flex flex-col space-y-4">
                {/* MODIFIED: Show Dashboard link for admin users in mobile menu */}
                {isAdmin() ? (
                  <>
                    <Link to="/admin" className="text-gray-700 hover:text-[#FF7757]">
                      Dashboard
                    </Link>
                    <Link to="/category" className="text-gray-700 hover:text-[#FF7757]">
                      Category
                    </Link>
                    <Link to="/destination" className="text-gray-700 hover:text-[#FF7757]">
                      Destination
                    </Link>
                    <Link to="/admin/transactions" className="text-gray-700 hover:text-[#FF7757]">
                      Transactions
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/" className="text-gray-700 hover:text-[#FF7757]">
                      Home
                    </Link>
                    <Link to="/category" className="text-gray-700 hover:text-[#FF7757]">
                      Category
                    </Link>
                    <Link to="/destination" className="text-gray-700 hover:text-[#FF7757]">
                      Destination
                    </Link>
                    {user && (
                      <Link to="/admin/transactions" className="text-gray-700 hover:text-[#FF7757]">
                        Transactions
                      </Link>
                    )}
                  </>
                )}

                {!user && (
                  <div className="flex flex-col space-y-2 pt-2 border-t">
                    <Link
                      to="/login"
                      className="px-4 py-2 rounded-md text-center text-gray-700 border border-gray-300 hover:text-[#FF7757] hover:border-[#FF7757]"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="px-4 py-2 rounded-md text-center bg-[#FF7757] text-white hover:bg-[#ff6242]"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Breadcrumbs - Improved for all screen sizes */}
      <div className="container mx-auto px-4 pt-20 pb-2 md:pt-24">
        <div className="text-xs sm:text-sm text-gray-500 overflow-x-auto whitespace-nowrap pb-1 flex">
          {breadcrumbs.map((breadcrumb, index) => (
            <span key={index} className="flex-shrink-0">
              {index > 0 && <span className="mx-1"> / </span>}
              {index === breadcrumbs.length - 1 ? (
                <span className="text-[#FF7757]">{breadcrumb.name}</span>
              ) : (
                <Link to={breadcrumb.path} className="hover:text-[#FF7757]">
                  {breadcrumb.name}
                </Link>
              )}
            </span>
          ))}
        </div>
      </div>
    </>
  )
}

export default Navbar
