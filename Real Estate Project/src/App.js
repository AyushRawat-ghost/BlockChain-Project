// src/components/App.js

import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ethers } from 'ethers'

// in App.js or any component inside src/components/
import EscrowJson from './abi/Escrow.json'
import config     from './config.json'

import Navigation       from './components/Navigation'
import Home             from './components/Home'
import Search           from './components/Search'
import ListPropertyForm from './components/ListPropertyForm'
import InspectorPanel   from './components/InspectorPanel'
import BuyerPanel       from './components/BuyerPanel'
import LenderPanel      from './components/LenderPanel'
import SellerPanel      from './components/SellerPanel'
import PropertyDetail   from './components/PropertyDetail'
import MyListings   from './components/MyListings'

function useContractsInline() {
  const [escrow, setEscrow]       = useState(null)
  const [account, setAccount]     = useState('')
  const [inspector, setInspector] = useState('')
  const [lender, setLender]       = useState('')

  useEffect(() => {
    if (!window.ethereum) return

    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer   = provider.getSigner()

    // Track connected account
    signer.getAddress().then(a => setAccount(a)).catch(() => {})
    window.ethereum.on('accountsChanged', as => setAccount(as[0] || ''))
    window.ethereum.on('chainChanged', () => window.location.reload())

    // Load contract & roles from config
    provider.getNetwork().then(({ chainId }) => {
      const cfg = config[chainId]
      if (!cfg) throw new Error(`No config for chain ${chainId}`)

      setInspector(cfg.inspector)
      setLender(cfg.lender)

      const abi       = Array.isArray(EscrowJson) ? EscrowJson : EscrowJson.abi
      const contract  = new ethers.Contract(cfg.escrow.address, abi, signer)
      setEscrow(contract)
    })
  }, [])

  return { escrow, account, inspector, lender }
}

export default function App() {
  const { escrow, account, inspector, lender } = useContractsInline()

  // helper to lowercase safely
  const lc = s => (s || '').toLowerCase()

  return (
    <BrowserRouter>
      <Navigation
        account={account}
        inspector={inspector}
        lender={lender}
      />

      <main className="container mx-auto py-6">
        <Routes>
          {/* Home: show available properties + buy/reserve */}
          <Route
            path="/"
            element={<Home escrow={escrow} account={account} />}
          />

          {/* Search */}
          <Route path="/search" element={<Search />} />

          {/* List a new property */}
          <Route
            path="/list"
            element={<ListPropertyForm escrow={escrow} account={account} />}
          />

          {/* My Listings: properties you own */}
          <Route
            path="/my-listings"
            element={<MyListings account={account} />}
          />

          {/* Inspector panel */}
          <Route
            path="/inspect"
            element={
              lc(account) === lc(inspector) ? (
                <InspectorPanel
                  escrow={escrow}
                  account={account}
                  inspector={inspector}
                />
              ) : (
                <p className="p-6 text-center text-red-600">
                  🚫 You are not authorized to inspect.
                </p>
              )
            }
          />

          {/* Buyer panel (earnest deposits) */}
          <Route
            path="/earnest"
            element={<BuyerPanel escrow={escrow} account={account} />}
          />

          {/* Lender panel (approve & finalize sale) */}
          <Route
            path="/approve"
            element={
              lc(account) === lc(lender) ? (
                <LenderPanel
                  escrow={escrow}
                  account={account}
                  lender={lender}
                />
              ) : (
                <p className="p-6 text-center text-red-600">
                  🚫 You are not the lender.
                </p>
              )
            }
          />

          {/* Property Detail page with Buy/Reserved/Sold button */}
          <Route
            path="/property/:listingID"
            element={<PropertyDetail escrow={escrow} account={account} />}
          />
        </Routes>
      </main>
    </BrowserRouter>
  )
}