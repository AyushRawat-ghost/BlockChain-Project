// src/components/App.js

import React, { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

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

    // Load contract + roles from config.json
    provider.getNetwork().then(({ chainId }) => {
      const cfg = config[chainId]
      if (!cfg) throw new Error(`No config for chain ${chainId}`)
      setInspector(cfg.inspector)
      setLender(cfg.lender)

      const abi      = Array.isArray(EscrowJson) ? EscrowJson : EscrowJson.abi
      const contract = new ethers.Contract(cfg.escrow.address, abi, signer)
      setEscrow(contract)
    })
  }, [])

  return { escrow, account, inspector, lender }
}

export default function App() {
  const { escrow, account, inspector, lender } = useContractsInline()

  return (
    <BrowserRouter>
      <Navigation
        account={account}
        inspector={inspector}
        lender={lender}
      />

      <main className="container mx-auto py-6">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route
            path="/list"
            element={<ListPropertyForm escrow={escrow} account={account} />}
          />

          {/* Inspector-only */}
          <Route
            path="/inspect"
            element={
              inspector.toLowerCase() === account.toLowerCase() ? (
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

          {/* Buyer panel */}
          <Route
            path="/earnest"
            element={<BuyerPanel escrow={escrow} account={account} />}
          />

          {/* Lender approves & finalizes → SOLD */}
          <Route
            path="/approve"
            element={
              lender.toLowerCase() === account.toLowerCase() ? (
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

          {/* Property detail and buy */}
          <Route
            path="/property/:listingID"
            element={<PropertyDetail escrow={escrow} account={account} />}
          />
        </Routes>
      </main>
    </BrowserRouter>
  )
}