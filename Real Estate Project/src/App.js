// src/App.js
import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { auth } from './firebase';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';

import Navigation       from './components/Navigation';
import Search           from './components/Search';
import ListPropertyForm from './components/ListPropertyForm';
import Home             from './components/Home';
import PropertyDetail   from './components/PropertyDetail';
import InspectorPanel   from './components/InspectorPanel';
import LenderPanel      from './components/LenderPanel';

import EscrowABI from './abis/Escrow.json';
import config    from './config.json';

const NETWORK   = '31337';
const INSPECTOR = config[NETWORK].inspector.toLowerCase();
const LENDER    = config[NETWORK].lender.toLowerCase();

export default function App() {
  const [account, setAccount]         = useState(null);
  const [escrow, setEscrow]           = useState(null);
  const [view, setView]               = useState('home');  // 'home' | 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProperty, setSelectedProperty] = useState(null);

  // 1) Firebase anonymous auth
  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (!user) signInAnonymously(auth).catch(console.error);
    });
  }, []);

  // 2) Web3 init + enforce network
  useEffect(() => {
    if (!window.ethereum) {
      console.error('MetaMask not found');
      return;
    }

    const init = async () => {
      const provider = new ethers.providers.Web3Provider(window.ethereum, 'any');
      const { chainId } = await provider.getNetwork();

      if (chainId !== Number(NETWORK)) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: ethers.utils.hexValue(Number(NETWORK)) }],
          });
        } catch {
          alert('⚠️ Please switch MetaMask to Localhost:31337');
          return;
        }
      }

      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      const addr   = await signer.getAddress();
      setAccount(addr.toLowerCase());

      const esc = new ethers.Contract(
        config[NETWORK].escrow.address,
        EscrowABI.abi,
        signer
      );
      setEscrow(esc);

      // reload on network/account change
      window.ethereum.on('chainChanged', () => window.location.reload());
      window.ethereum.on('accountsChanged', () => window.location.reload());
    };

    init().catch(console.error);
  }, []);

  // 3) Loading state
  if (!escrow) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-gray-600">⏳ Connecting to blockchain…</p>
      </div>
    );
  }

  const role       = account;
  const handleBack = () => {
    setSelectedProperty(null);
    setView('home');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        account={account}
        onSellClick={() => { setView('list'); setSelectedProperty(null); }}
        selectedProperty={selectedProperty}
        onBack={handleBack}
      />

      <Search
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
      />

      <main className="p-6 max-w-6xl mx-auto">
        {view === 'list' && (
          <ListPropertyForm escrow={escrow} account={account} />
        )}

        {view === 'home' && !selectedProperty && role === INSPECTOR && (
          <InspectorPanel escrow={escrow} account={account} />
        )}

        {view === 'home' && !selectedProperty && role === LENDER && (
          <LenderPanel escrow={escrow} account={account} />
        )}

        {view === 'home' && !selectedProperty && role !== INSPECTOR && role !== LENDER && (
          <Home
            escrow={escrow}
            account={account}
            searchQuery={searchQuery}
            onSelect={(property) => {
              setSelectedProperty(property);
              setView('home');
            }}
          />
        )}

        {view === 'home' && selectedProperty && (
          <PropertyDetail
            property={selectedProperty}
            escrow={escrow}
            account={account}
            onBack={handleBack}
          />
        )}
      </main>
    </div>
  );
}