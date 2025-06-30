// src/components/InspectorPanel.js

import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import config from '../config.json';

const CHAIN     = '31337';
const INSPECTOR = config[CHAIN].inspector.toLowerCase();

// Mirror your Solidity enum order
const STATUS_NAMES = {
  0: 'PROPOSED',
  1: 'PENDING_INSPECTION',
  2: 'VERIFIED',
  3: 'REJECTED',
  4: 'SOLD',
};

export default function InspectorPanel({ escrow, account }) {
  const [listings, setListings] = useState([]);

  // Universal converter: BigNumber, bigint, string, or number → JS number
  const toNumber = (raw) => {
    if (raw == null) return NaN;
    if (typeof raw.toNumber === 'function') return raw.toNumber();
    if (typeof raw === 'bigint') return Number(raw);
    return Number(raw);
  };

  // Load Firestore “PENDING_INSPECTION” docs + read on-chain status & inspectionPassed
  const loadListings = async () => {
    const snap = await getDocs(collection(db, 'listings'));
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const pending = docs.filter(l => l.status === 'PENDING_INSPECTION');

    const withChain = await Promise.all(
      pending.map(async (l) => {
        let chainStatus = 'ERR', passed = false;
        try {
          const raw = await escrow.propertyStatus(l.listingID);
          chainStatus = toNumber(raw);
          passed = await escrow.inspectionPassed(l.listingID);
        } catch {
          chainStatus = 'ERR';
          passed = false;
        }
        return { ...l, chainStatus, passed };
      })
    );

    setListings(withChain);
  };

  // Initial load & whenever escrow/account changes
  useEffect(() => {
    loadListings();
  }, [escrow, account]);

  // Block non-inspectors
  if (account?.toLowerCase() !== INSPECTOR) {
    return (
      <div className="p-6 text-center text-red-600">
        🚫 Access denied. Only the on-chain inspector ({INSPECTOR}) may inspect.
      </div>
    );
  }

  // 1) Mint & set VERIFIED on-chain, then update Firestore
  const handleVerify = async (listingID, docId) => {
    try {
      const tx = await escrow.verifyListing(listingID);
      await tx.wait();

      const raw = await escrow.propertyStatus(listingID);
      const onChain = toNumber(raw);
      if (onChain !== 2) {
        throw new Error(`Expected VERIFIED (2), got ${onChain}`);
      }

      await updateDoc(doc(db, 'listings', docId), { status: 'VERIFIED' });
      loadListings();
    } catch (err) {
      console.error('verifyListing failed:', err);
      alert(err.reason || err.message);
    }
  };

  // 2) Mark inspectionPassed = true on-chain
  const handlePass = async (listingID) => {
    try {
      const tx = await escrow.updateInspectionStatus(listingID, true);
      await tx.wait();
      loadListings();
    } catch (err) {
      console.error('updateInspectionStatus failed:', err);
      alert(err.reason || err.message);
    }
  };

  // 3) Reject purely in Firestore
  const handleReject = async (docId) => {
    if (!window.confirm('Reject this listing?')) return;
    try {
      await updateDoc(doc(db, 'listings', docId), { status: 'REJECTED' });
      loadListings();
    } catch (err) {
      console.error('rejectListing failed:', err);
      alert(err.reason || err.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">🧑‍⚖️ Inspector Panel</h2>

      {listings.length === 0 ? (
        <p className="text-gray-600">No properties pending inspection.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => (
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
                <p className="text-sm mb-2">
                  On-chain status: {l.chainStatus}{' '}
                  {STATUS_NAMES[l.chainStatus]}
                </p>
                <p className="text-sm mb-4">
                  Inspection passed: {l.passed ? '✅ Yes' : '❌ No'}
                </p>
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => handleVerify(l.listingID, l.id)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
                  >
                    ✅ Verify
                  </button>
                  <button
                    onClick={() => handlePass(l.listingID)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded"
                  >
                    🛠️ Pass Inspection
                  </button>
                  <button
                    onClick={() => handleReject(l.id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded"
                  >
                    ❌ Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}