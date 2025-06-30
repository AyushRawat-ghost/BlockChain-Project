// src/components/LenderPanel.js

import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import config from '../config.json';

const NETWORK = '31337';
const LENDER_ADDR = config[NETWORK].lender.toLowerCase();

export default function LenderPanel({ escrow, account }) {
  const [listings, setListings] = useState([]);
  const [busyId, setBusyId] = useState(null);

  // Subscribe to Firestore listings that the lender needs to close
  useEffect(() => {
    if (account?.toLowerCase() !== LENDER_ADDR) return;

    const unsub = onSnapshot(collection(db, 'listings'), snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Show only VERIFIED listings with an earnest-deposit (buyer set)
      const pending = docs.filter(
        l => l.status === 'VERIFIED' && Boolean(l.buyer)
      );
      setListings(pending);
    });

    return () => unsub();
  }, [account]);

  // Block non-lender wallets
  if (account?.toLowerCase() !== LENDER_ADDR) {
    return (
      <p className="text-center mt-20 text-red-600">
        🚫 Access denied. Only the lender can finalize sales.
      </p>
    );
  }

  // Finalize sale on-chain, then mark as SOLD in Firestore
  const handleFinalize = async (listingID, docId) => {
    setBusyId(listingID);
    try {
      // 1) call finalizeSale(listingID)
      const tx = await escrow.finalizeSale(listingID);
      await tx.wait();

      // 2) Update Firestore status to SOLD
      await updateDoc(doc(db, 'listings', docId), {
        status: 'SOLD',
      });
    } catch (err) {
      console.error('finalizeSale failed:', err);
      alert(err.reason || err.message || 'Failed to finalize sale');
    } finally {
      setBusyId(null);
    }
  };

  if (listings.length === 0) {
    return (
      <p className="text-center mt-20 text-gray-600">
        No properties pending your approval.
      </p>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map(l => (
        <div
          key={l.id}
          className="bg-white rounded-lg shadow flex flex-col overflow-hidden"
        >
          <img
            src={l.tokenURI}
            alt={l.title}
            className="h-48 w-full object-cover"
          />
          <div className="p-4 flex-1">
            <h3 className="text-xl font-semibold mb-1">{l.title}</h3>
            <p className="text-gray-700 mb-2">{l.address}</p>
            <p className="text-green-700 font-bold mb-4">{l.price} ETH</p>
            <p className="text-sm mb-2">
              Buyer: <span className="font-mono">{l.buyer}</span>
            </p>
          </div>
          <button
            onClick={() => handleFinalize(l.listingID, l.id)}
            disabled={busyId === l.listingID}
            className={`m-4 py-2 rounded text-white ${
              busyId === l.listingID
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {busyId === l.listingID ? 'Finalizing…' : 'Finalize Sale'}
          </button>
        </div>
      ))}
    </div>
  );
}