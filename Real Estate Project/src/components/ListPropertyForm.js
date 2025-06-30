import React, { useState } from 'react';
import { ethers } from 'ethers';
import { db } from '../firebase';
import { addDoc, collection } from 'firebase/firestore';

export default function ListPropertyForm({ escrow, account }) {
  const [form, setForm] = useState({
    title:'', address:'', bedrooms:1, bathrooms:1,
    area:'', price:'', tokenURI:'', description:''
  });
  const [loading, setLoading] = useState(false);

  const handle = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const priceWei = ethers.utils.parseEther(form.price.toString());
      const tx1 = await escrow.proposeListing(form.tokenURI, priceWei);
      const r1  = await tx1.wait();
      const listingID = r1.events[0].args.listingID.toString();

      const earnest = priceWei.mul(10).div(100);
      await (await escrow.setPurchasePriceAndEscrow(
        listingID, priceWei, earnest
      )).wait();

      await addDoc(collection(db,'listings'), {
        ...form,
        bedrooms: Number(form.bedrooms),
        bathrooms:Number(form.bathrooms),
        price:Number(form.price),
        listingID,
        owner:account,
        status:'PENDING_INSPECTION',
        timestamp:Date.now(),
      });

      alert('✅ Listed for inspection');
      setForm({
        title:'', address:'', bedrooms:1, bathrooms:1,
        area:'', price:'', tokenURI:'', description:''
      });
    } catch(err) {
      console.error(err);
      alert(err.reason || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-xl mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">List Your Property</h2>

      {['title','address','area','price','tokenURI'].map(f => (
        <label key={f} className="block mb-2">
          {f.charAt(0).toUpperCase()+f.slice(1)}
          <input
            name={f}
            required
            value={form[f]}
            onChange={handle}
            className="w-full mt-1 p-2 border rounded"
          />
        </label>
      ))}

      <div className="grid grid-cols-2 gap-4 mb-4">
        {['bedrooms','bathrooms'].map(f => (
          <label key={f}>
            {f.charAt(0).toUpperCase()+f.slice(1)}
            <input
              name={f}
              type="number"
              min="1"
              required
              value={form[f]}
              onChange={handle}
              className="w-full mt-1 p-2 border rounded"
            />
          </label>
        ))}
      </div>

      <label className="block mb-4">
        Description
        <textarea
          name="description"
          rows="3"
          required
          value={form.description}
          onChange={handle}
          className="w-full mt-1 p-2 border rounded resize-y"
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        {loading ? 'Listing…' : 'List Property'}
      </button>
    </form>
  );
}