// src/components/LenderPanel.js

import React, { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db }     from '../firebase';
import { ethers } from 'ethers';
import config     from '../config.json';

const CHAIN      = '31337';
const LENDER     = config[CHAIN].lender.toLowerCase();

export default function LenderPanel({ escrow, account }) {
  const [listings, setListings] = useState([]);
  const [busyId, setBusyId]     = useState(null);

  // 1) Subscribe to Firestore listings that are VERIFIED & have a buyer
  useEffect(() => {
    if (account?.toLowerCase() !== LENDER) return;
    const unsub = onSnapshot(collection(db, 'listings'), snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setListings(
        docs.filter(l => l.status === 'VERIFIED' && Boolean(l.buyer))
      );
    });
    return () => unsub();
  }, [account]);

  // 2) Lock out non-lender
  if (account?.toLowerCase() !== LENDER) {
    return (
      <p className="text-center mt-20 text-red-600">
        🚫 Only the lender can finalize sales.
      </p>
    );
  }

  // 3) Approve & finalize flow
  const handleFinalize = async (listingID, docId) => {
    setBusyId(listingID);

    try {
      // a) fetch on-chain state
      const [ps, passed, priceBn] = await Promise.all([
        escrow.propertyStatus(listingID),
        escrow.inspectionPassed(listingID),
        escrow.purchasePrice(listingID)
      ]);
      const status = ps.toNumber ? ps.toNumber() : Number(ps);

      if (status !== 2) throw new Error('Listing not VERIFIED');
      if (!passed)     throw new Error('Inspection not passed');

      console.log(
        `✅ on-chain OK – price = ${ethers.utils.formatEther(priceBn)} ETH`
      );

      // b) lender approves itself
      console.log('⏳ approveSale()');
      const txA = await escrow.approveSale(
        listingID,
        account,
        { gasLimit: 200_000 }
      );
      await txA.wait();
      console.log('✅ approveSale mined');

      // c) lender finalizes the sale
      console.log('⏳ finalizeSale()');
      const txF = await escrow.finalizeSale(
        listingID,
        { gasLimit: 500_000 }
      );
      await txF.wait();
      console.log('✅ finalizeSale mined');

      // d) update Firestore → SOLD
      await updateDoc(doc(db, 'listings', docId), { status: 'SOLD' });
      alert(`🏁 Sale finalized – ${ethers.utils.formatEther(priceBn)} ETH sent.`);
    } catch (err) {
      console.error('❌ FULL ERROR OBJECT:', err);

      // peel out the real revert reason
      const reason =
        err.error?.data?.message    ||
        err.data?.message           ||
        err.error?.message          ||
        err.reason                  ||
        err.message                 ||
        'Unknown error';

      console.error('Revert reason:', reason);
      alert(`🚨 finalizeSale failed: ${reason}`);
    } finally {
      setBusyId(null);
    }
  };

  // 4) Render
  if (listings.length === 0) {
    return (
      <p className="text-gray-600 p-6 text-center">
        No properties pending finalization.
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
            <p className="text-green-700 font-bold mb-2">
              {ethers.utils.formatEther(ethers.BigNumber.from(l.price))} ETH
            </p>
            <p className="text-sm mb-4">
              Buyer: <code>{l.buyer}</code>
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
            {busyId === l.listingID ? 'Finalizing…' : '✔️ Finalize Sale'}
          </button>
        </div>
      ))}
    </div>
  );
}