// src/components/PropertyDetail.js

import React, { useState, useEffect } from 'react';
import { ethers }                    from 'ethers';
import { doc, updateDoc }            from 'firebase/firestore';
import { db }                        from '../firebase';

export default function PropertyDetail({ property, escrow, account, onBack }) {
  const [loading, setLoading]         = useState(false);
  const [chainPrice, setChainPrice]   = useState(null);
  const [chainStatus, setChainStatus] = useState(null);
  const [inspectionPassed, setInspectionPassed] = useState(false);

  // Load on-chain price, status, inspection flag
  useEffect(() => {
    if (!escrow || property?.listingID == null) return;
    (async () => {
      try {
        const [p, s, passed] = await Promise.all([
          escrow.purchasePrice(property.listingID),
          escrow.propertyStatus(property.listingID),
          escrow.inspectionPassed(property.listingID)
        ]);
        setChainPrice(p);
        setChainStatus(typeof s.toNumber === 'function' ? s.toNumber() : Number(s));
        setInspectionPassed(passed);
      } catch (err) {
        console.error('On-chain load error:', err);
      }
    })();
  }, [escrow, property]);

  // Format price for display
  const displayPrice = chainPrice
    ? ethers.utils.formatEther(chainPrice)
    : property.price
      ? ethers.utils.formatEther(ethers.BigNumber.from(property.price))
      : '0';

  // Handle the full-price purchase
  const handleBuy = async () => {
    if (account.toLowerCase() === property.owner.toLowerCase()) {
      return alert("You’re the seller of this listing");
    }
    if (!chainPrice) {
      return alert("Loading on-chain price…");
    }

    setLoading(true);
    try {
      // Send the full purchasePrice as msg.value
      const tx = await escrow.depositEarnest(
        property.listingID,
        account,
        { value: chainPrice, gasLimit: 300_000 }
      );
      await tx.wait();

      // Update Firestore with the buyer
      await updateDoc(doc(db, 'listings', property.id), { buyer: account });
      alert(`🎉 Reserved & paid ${displayPrice} ETH`);
    } catch (err) {
      console.error('Buy error:', err);
      const reason =
        err.data?.message ||
        err.error?.message ||
        err.reason ||
        err.message ||
        'Transaction failed';
      alert(`🚨 ${reason}`);
    } finally {
      setLoading(false);
    }
  };

  // Pre-conditions
  if (chainStatus !== 2) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded shadow">
        <button onClick={onBack} className="text-blue-600 mb-4">← Back</button>
        <p className="text-yellow-600">⏳ Listing not yet verified on-chain</p>
      </div>
    );
  }
  if (!inspectionPassed) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded shadow">
        <button onClick={onBack} className="text-blue-600 mb-4">← Back</button>
        <p className="text-yellow-600">⏳ Waiting for inspection to pass</p>
      </div>
    );
  }

  // Main UI
  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">
      <button onClick={onBack} className="text-blue-600 mb-4">← Back</button>

      <h2 className="text-2xl font-bold mb-2">{property.title}</h2>
      <p className="text-gray-700 mb-1">{property.address}</p>
      <p className="text-gray-600 mb-4">{property.description}</p>

      <div className="flex space-x-4 text-sm mb-4">
        <span>🛏️ {property.bedrooms} bed{property.bedrooms>1?'s':''}</span>
        <span>🛁 {property.bathrooms} bath{property.bathrooms>1?'s':''}</span>
        <span>ID: {property.listingID}</span>
      </div>

      <img
        src={property.tokenURI}
        alt={property.title}
        className="h-64 w-full object-cover rounded mb-4"
      />

      <div className="flex justify-between items-center mb-6">
        <span className="text-green-700 font-bold">
          {displayPrice} ETH
        </span>
        <span className="text-sm text-gray-500">
          Verified & Inspection Passed
        </span>
      </div>

      <button
        onClick={handleBuy}
        disabled={loading || Boolean(property.buyer)}
        className={`w-full py-2 rounded text-white ${
          loading
            ? 'bg-gray-400'
            : property.buyer
              ? 'bg-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {property.buyer
          ? 'Already Reserved'
          : loading
            ? 'Processing…'
            : `Reserve & Pay ${displayPrice} ETH`}
      </button>
    </div>
  );
}