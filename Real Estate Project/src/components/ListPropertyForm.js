// src/components/ListPropertyForm.js

import React, { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { db } from '../firebase'                   // your initialized Firestore
import { addDoc, collection } from 'firebase/firestore'

export default function ListPropertyForm({ escrow, account }) {
  // 1) form state
  const [form, setForm] = useState({
    title:       '',
    address:     '',
    area:        '',
    price:       '',
    tokenURI:    '',
    bedrooms:    1,
    bathrooms:   1,
    description: ''
  })
  const [loading, setLoading] = useState(false)

  // 2) debug on mount
  useEffect(() => {
    console.log('▶ ListPropertyForm mounted', { escrow, account })
  }, [escrow, account])

  // 3) handle input updates
  const handleChange = e => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  // 4) form submission
  const handleSubmit = async e => {
    e.preventDefault()
    console.log('🖱️ handleSubmit fired', { form, escrow, account })

    if (!escrow || !account) {
      return alert('⚠️ Connect your wallet and ensure contract is loaded.')
    }

    setLoading(true)
    try {
      // parse ETH → Wei
      const priceWei = ethers.utils.parseEther(form.price.toString())

      // 1) on-chain proposeListing
      const tx = await escrow
        .connect(escrow.signer)
        .proposeListing(form.tokenURI, priceWei)
      console.log('⏳ proposeListing tx sent:', tx.hash)
      const receipt = await tx.wait()
      console.log('✅ proposeListing mined:', receipt.transactionHash)

      // extract listingID from event
      const ev = receipt.events.find(e => e.event === 'ProposedListing')
      if (!ev) throw new Error('No ProposedListing event found')
      const listingID = ev.args.listingID.toString()
      console.log('🏷 Got listingID:', listingID)

      // 2) write to Firestore
      const docRef = await addDoc(collection(db, 'listings'), {
        title:       form.title,
        address:     form.address,
        area:        form.area,
        price:       Number(form.price),
        tokenURI:    form.tokenURI,
        bedrooms:    Number(form.bedrooms),
        bathrooms:   Number(form.bathrooms),
        description: form.description,
        listingID,
        owner:       account,
        status:      'PROPOSED',
        timestamp:   Date.now()
      })
      console.log('📄 Firestore doc created:', docRef.id)

      alert(`🎉 Listed! Your listing ID is ${listingID}`)

      // reset form
      setForm({
        title:       '',
        address:     '',
        area:        '',
        price:       '',
        tokenURI:    '',
        bedrooms:    1,
        bathrooms:   1,
        description: ''
      })
    } catch (err) {
      console.error('❌ Listing failed:', err)
      const msg = err.error?.data?.message || err.message || 'Unknown error'
      alert(`Failed to list: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-lg mx-auto p-6 bg-white rounded shadow space-y-4"
    >
      <h2 className="text-2xl font-bold text-center">🏡 List Your Property</h2>

      {/* Text fields */}
      {[
        { name: 'title',    label: 'Title' },
        { name: 'address',  label: 'Address' },
        { name: 'area',     label: 'Area (sq ft)' },
        { name: 'price',    label: 'Price (ETH)', type: 'number' },
        { name: 'tokenURI', label: 'Token URI (IPFS)' }
      ].map(f => (
        <label key={f.name} className="block">
          {f.label}
          <input
            name={f.name}
            type={f.type || 'text'}
            step={f.name === 'price' ? '0.001' : undefined}
            required
            value={form[f.name]}
            onChange={handleChange}
            className="w-full mt-1 p-2 border rounded"
            placeholder={f.label}
          />
        </label>
      ))}

      {/* Number fields */}
      <div className="grid grid-cols-2 gap-4">
        {['bedrooms', 'bathrooms'].map(name => (
          <label key={name} className="block">
            {name.charAt(0).toUpperCase() + name.slice(1)}
            <input
              name={name}
              type="number"
              min="1"
              required
              value={form[name]}
              onChange={handleChange}
              className="w-full mt-1 p-2 border rounded"
            />
          </label>
        ))}
      </div>

      {/* Description */}
      <label className="block">
        Description
        <textarea
          name="description"
          rows="3"
          required
          value={form.description}
          onChange={handleChange}
          className="w-full mt-1 p-2 border rounded resize-y"
          placeholder="Describe your property"
        />
      </label>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className={`w-full py-2 text-white rounded ${
          loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {loading ? '⏳ Listing…' : '✅ List Property'}
      </button>
    </form>
  )
}