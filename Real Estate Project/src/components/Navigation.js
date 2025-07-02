// src/components/Navigation.js

import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  FiHome,
  FiSearch,
  FiPlusCircle,
  FiList,
  FiCheckCircle,
  FiUser
} from 'react-icons/fi'

// truncate 0x1234…9AbC
const truncate = addr =>
  addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : ''

export default function Navigation({ account, inspector, lender }) {
  const lc    = s => (s || '').toLowerCase()
  const isIns = lc(account) === lc(inspector)
  const isLen = lc(account) === lc(lender)

  // shared classes for nav links
  const baseLink     = 'flex items-center space-x-1 px-4 py-2 rounded-full transition'
  const activeLink   = 'bg-white text-indigo-600 shadow'
  const inactiveLink = 'text-gray-200 hover:bg-indigo-50 hover:text-indigo-200'

  return (
    <header className="relative">
      {/* Full-bleed background */}
      <img
        src="/your-bg.jpg"
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60"></div>

      {/* Nav content */}
      <div className="relative z-10 container mx-auto flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <NavLink to="/" className="flex items-center space-x-2">
          <img src="/logo.png" alt="Logo" className="h-8 w-8" />
          <span className="text-white text-xl font-bold">RealEstate</span>
        </NavLink>

        {/* Links */}
        <nav className="flex items-center space-x-3">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `${baseLink} ${isActive ? activeLink : inactiveLink}`
            }
          >
            <FiHome /> <span>Home</span>
          </NavLink>

          <NavLink
            to="/search"
            className={({ isActive }) =>
              `${baseLink} ${isActive ? activeLink : inactiveLink}`
            }
          >
            <FiSearch /> <span>Search</span>
          </NavLink>

          <NavLink
            to="/list"
            className={({ isActive }) =>
              `${baseLink} ${isActive ? activeLink : inactiveLink}`
            }
          >
            <FiPlusCircle /> <span>List Property</span>
          </NavLink>

          <NavLink
            to="/my-listings"
            className={({ isActive }) =>
              `${baseLink} ${isActive ? activeLink : inactiveLink}`
            }
          >
            <FiList /> <span>My Listings</span>
          </NavLink>

          {isIns && (
            <NavLink
              to="/inspect"
              className={({ isActive }) =>
                `${baseLink} ${isActive ? activeLink : inactiveLink}`
              }
            >
              <FiCheckCircle /> <span>Inspector</span>
            </NavLink>
          )}

          <NavLink
            to="/earnest"
            className={({ isActive }) =>
              `${baseLink} ${isActive ? activeLink : inactiveLink}`
            }
          >
            <FiUser /> <span>Buyer</span>
          </NavLink>

          {isLen && (
            <NavLink
              to="/approve"
              className={({ isActive }) =>
                `${baseLink} ${isActive ? activeLink : inactiveLink}`
              }
            >
              <FiCheckCircle /> <span>Lender</span>
            </NavLink>
          )}
        </nav>

        {/* Wallet connect / address */}
        {account ? (
          <button
            disabled
            className="px-4 py-2 bg-white text-indigo-600 rounded-full text-sm font-medium shadow"
          >
            {truncate(account)}
          </button>
        ) : (
          <button
            onClick={() =>
              window.ethereum.request({ method: 'eth_requestAccounts' })
            }
            className="px-4 py-2 bg-white text-indigo-600 rounded-full text-sm font-medium shadow hover:bg-indigo-50 transition"
          >
            Connect Wallet
          </button>
        )}
      </div>
    </header>
  )
}