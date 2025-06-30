// src/components/PropertyDetail.js
import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function PropertyDetail({ property, escrow, account, onBack }) {
  const [processing, setProcessing] = useState(false);
  const isSeller = account.toLowerCase() === property.owner.toLowerCase();
  const isReserved = Boolean(property.buyer);

  const handleBuy = async () => {
    if (isSeller) {
      return alert("You can’t buy your own listing");
    }
    setProcessing(true);
    try {
      const requiredWei = await escrow.escrowAmount(property.listingID);
      const tx = await escrow.depositEarnest(
        property.listingID,
        account,
        { value: requiredWei }
      );
      await tx.wait();

      // Only set buyer in Firestore; leave status as VERIFIED
      await updateDoc(doc(db, 'listings', property.id), {
        buyer: account,
      });

      alert('🎉 Reserved! Waiting for lender approval.');
    } catch (err) {
      console.error('Buy failed:', err);
      alert(err.reason || err.message);
    } finally {
      setProcessing(false);
    }
  };

  // Show reserved message if already bought
  if (isReserved) {
    return (
      <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">
        <button onClick={onBack} className="text-blue-600 mb-4">
          ← Back
        </button>
        <h2 className="text-2xl font-bold mb-2">{property.title}</h2>
        <p className="text-yellow-700 font-semibold">
          🚧 Reserved by {property.buyer}
        </p>
        <p className="mt-4 text-gray-700">{property.address}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">
      <button onClick={onBack} className="text-blue-600 mb-4">
        ← Back
      </button>
      <img
        src={property.tokenURI}
        alt={property.title}
        className="h-64 w-full object-cover rounded mb-4"
      />
      <h2 className="text-2xl font-bold">{property.title}</h2>
      <p className="text-gray-700 mb-2">{property.address}</p>
      <p className="prose mb-4">{property.description}</p>
      <div className="text-green-700 font-bold mb-4">{property.price} ETH</div>

      {isSeller ? (
        <p className="text-red-600">You own this listing.</p>
      ) : (
        <button
          onClick={handleBuy}
          disabled={processing}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
        >
          {processing ? 'Processing…' : 'Buy Now'}
        </button>
      )}
    </div>
  );
}