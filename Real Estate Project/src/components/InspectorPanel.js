// src/components/InspectorPanel.js
import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import config from '../config.json';

const CHAIN     = '31337';
const INSPECTOR = config[CHAIN].inspector.toLowerCase();
const STATUS_NAMES = {
  0: 'PROPOSED',
  1: 'PENDING_INSPECTION',
  2: 'VERIFIED',
  3: 'REJECTED',
  4: 'SOLD',
};

export default function InspectorPanel({ escrow, account }) {
  const [listings, setListings] = useState([]);

  const toNumber = raw => {
    if (!raw) return NaN;
    if (typeof raw.toNumber === 'function') return raw.toNumber();
    if (typeof raw === 'bigint') return Number(raw);
    return Number(raw);
  };

  // Load both PENDING_INSPECTION and VERIFIED docs, then read on-chain
  const loadListings = async () => {
    const snap = await getDocs(collection(db, 'listings'));
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const candidates = docs.filter(l =>
      ['PENDING_INSPECTION', 'VERIFIED'].includes(l.status)
    );

    const withOnChain = await Promise.all(
      candidates.map(async l => {
        let chainStatus = 'ERR';
        let passed      = false;
        try {
          chainStatus = toNumber(await escrow.propertyStatus(l.listingID));
          passed      = await escrow.inspectionPassed(l.listingID);
        } catch {}
        return { ...l, chainStatus, passed };
      })
    );
    setListings(withOnChain);
  };

  useEffect(() => {
    loadListings();
  }, [escrow, account]);

  if (account?.toLowerCase() !== INSPECTOR) {
    return (
      <p className="p-6 text-center text-red-600">
        🚫 Access denied. Only inspector ({INSPECTOR}) may inspect.
      </p>
    );
  }

  // Handlers
  const handleVerify = async (listingID, docId) => {
    try {
      await (await escrow.verifyListing(listingID)).wait();
      await updateDoc(doc(db, 'listings', docId), { status: 'VERIFIED' });
      loadListings();
    } catch (e) {
      console.error(e);
      alert(e.reason || e.message);
    }
  };

  const handlePass = async (listingID) => {
    try {
      await (await escrow.updateInspectionStatus(listingID, true)).wait();
      loadListings();
    } catch (e) {
      console.error(e);
      alert(e.reason || e.message);
    }
  };

  const handleReject = async (docId) => {
    if (!window.confirm('Reject this listing?')) return;
    try {
      await updateDoc(doc(db, 'listings', docId), { status: 'REJECTED' });
      loadListings();
    } catch (e) {
      console.error(e);
      alert(e.reason || e.message);
    }
  };

  // Split into two lists
  const pendingVerify = listings.filter(l => l.status === 'PENDING_INSPECTION');
  const pendingPass   = listings.filter(
    l => l.status === 'VERIFIED' && !l.passed
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Section 1: Verify */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Pending Verification</h2>
        {pendingVerify.length === 0 && (
          <p className="text-gray-600">No listings to verify.</p>
        )}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pendingVerify.map(l => (
            <div key={l.id} className="bg-white rounded shadow p-4 flex flex-col">
              <img src={l.tokenURI} className="h-32 w-full object-cover mb-2" />
              <h3 className="font-semibold">{l.title}</h3>
              <p className="text-sm mb-2">{l.address}</p>
              <button
                onClick={() => handleVerify(l.listingID, l.id)}
                className="mt-auto bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
              >
                ✅ Verify
              </button>
              <button
                onClick={() => handleReject(l.id)}
                className="mt-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded"
              >
                ❌ Reject
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Pass Inspection */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Pending Pass Inspection</h2>
        {pendingPass.length === 0 && (
          <p className="text-gray-600">No listings awaiting inspection pass.</p>
        )}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pendingPass.map(l => (
            <div key={l.id} className="bg-white rounded shadow p-4 flex flex-col">
              <img src={l.tokenURI} className="h-32 w-full object-cover mb-2" />
              <h3 className="font-semibold">{l.title}</h3>
              <p className="text-sm mb-2">{l.address}</p>
              <p className="text-sm mb-4">
                On-chain status: {l.chainStatus} ({STATUS_NAMES[l.chainStatus]})
              </p>
              <button
                onClick={() => handlePass(l.listingID)}
                className="mt-auto bg-green-600 hover:bg-green-700 text-white py-2 rounded"
              >
                🛠️ Pass Inspection
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}