import React from 'react'
import { Link } from 'react-router-dom'

// truncate e.g. 0x1234…9AbC
const truncate = addr =>
  addr ? `${addr.slice(0,6)}…${addr.slice(-4)}` : ''

export default function Navigation({ account, inspector, lender }) {
  const lc = s => (s||'').toLowerCase()
  const isInspector = lc(account) === lc(inspector)
  const isLender    = lc(account) === lc(lender)

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <img src="/logo.png" alt="Logo" className="h-8 w-8" />
          <span className="text-xl font-bold text-gray-800">RealEstate</span>
        </Link>

        {/* Links */}
        <nav className="flex space-x-4">
          <Link to="/"      className="text-gray-600 hover:text-gray-900">Home</Link>
          <Link to="/search" className="text-gray-600 hover:text-gray-900">Search</Link>
          <Link to="/list"   className="text-gray-600 hover:text-gray-900">List Property</Link>

          {isInspector && (
            <Link
              to="/inspect"
              className="text-yellow-600 hover:text-yellow-800"
            >
              Inspector
            </Link>
          )}

          <Link to="/earnest" className="text-green-600 hover:text-green-800">
            Buyer
          </Link>

          {isLender && (
            <Link
              to="/approve"
              className="text-purple-600 hover:text-purple-800"
            >
              Lender
            </Link>
          )}

          <Link to="/finalize" className="text-blue-600 hover:text-blue-800">
            Seller
          </Link>
        </nav>

        {/* Connect / Account */}
        {account ? (
          <button
            disabled
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            {truncate(account)}
          </button>
        ) : (
          <button
            onClick={() => window.ethereum.request({ method:'eth_requestAccounts' })}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Connect Wallet
          </button>
        )}
      </div>
    </header>
  )
}