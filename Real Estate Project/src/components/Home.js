import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { motion } from "framer-motion";

import close from '../assets/close.svg';

const Home = ({ home, provider, account, escrow, togglePop }) => {
    const [hasBought, setHasBought] = useState(false)
    const [hasLended, setHasLended] = useState(false)
    const [hasInspected, setHasInspected] = useState(false)
    const [hasSold, setHasSold] = useState(false)

    const [buyer, setBuyer] = useState(null)
    const [lender, setLender] = useState(null)
    const [inspector, setInspector] = useState(null)
    const [seller, setSeller] = useState(null)

    const [owner, setOwner] = useState(null)

    const fetchDetails = async () => {
        // -- Buyer

        const buyer = await escrow.buyer(home.id)
        setBuyer(buyer)

        const hasBought = await escrow.approval(home.id, buyer)
        setHasBought(hasBought)

        // -- Seller

        const seller = await escrow.seller()
        setSeller(seller)

        const hasSold = await escrow.approval(home.id, seller)
        setHasSold(hasSold)

        // -- Lender

        const lender = await escrow.lender()
        setLender(lender)

        const hasLended = await escrow.approval(home.id, lender)
        setHasLended(hasLended)

        // -- Inspector

        const inspector = await escrow.inspector()
        setInspector(inspector)

        const hasInspected = await escrow.inspectionPassed(home.id)
        setHasInspected(hasInspected)
    }

    const fetchOwner = async () => {
        if (await escrow.isListed(home.id)) return

        const owner = await escrow.buyer(home.id)
        setOwner(owner)
    }

    const buyHandler = async () => {
        const escrowAmount = await escrow.escrowAmount(home.id)
        const signer = await provider.getSigner()

        // Buyer deposit earnest
        let transaction = await escrow.connect(signer).depositEarnest(home.id, { value: escrowAmount })
        await transaction.wait()

        // Buyer approves...
        transaction = await escrow.connect(signer).approveSale(home.id)
        await transaction.wait()

        setHasBought(true)
    }

    const inspectHandler = async () => {
        const signer = await provider.getSigner()

        // Inspector updates status
        const transaction = await escrow.connect(signer).updateInspectionStatus(home.id, true)
        await transaction.wait()

        setHasInspected(true)
    }

    const lendHandler = async () => {
        const signer = await provider.getSigner()

        // Lender approves...
        const transaction = await escrow.connect(signer).approveSale(home.id)
        await transaction.wait()

        // Lender sends funds to contract...
        const lendAmount = (await escrow.purchasePrice(home.id) - await escrow.escrowAmount(home.id))
        await signer.sendTransaction({ to: escrow.address, value: lendAmount.toString(), gasLimit: 60000 })

        setHasLended(true)
    }

    const sellHandler = async () => {
        const signer = await provider.getSigner()

        // Seller approves...
        let transaction = await escrow.connect(signer).approveSale(home.id)
        await transaction.wait()

        // Seller finalize...
        transaction = await escrow.connect(signer).finalizeSale(home.id)
        await transaction.wait()

        setHasSold(true)
    }

    useEffect(() => {
        fetchDetails()
        fetchOwner()
    }, [hasSold])

    return (
        <motion.div 
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <Card className="w-full max-w-4xl flex flex-col md:flex-row overflow-hidden shadow-2xl rounded-3xl border-0 bg-white/95">
                <div className="md:w-1/2 flex flex-col items-center justify-center bg-gradient-to-br from-primary/80 to-secondary/80 p-8">
                    <img src={home.image} alt="Home" className="rounded-2xl shadow-xl w-full object-cover aspect-square" />
                </div>
                <CardContent className="md:w-1/2 p-8 flex flex-col gap-4">
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold text-dark mb-2">{home.name}</CardTitle>
                        <div className="flex gap-3 mb-2">
                            <Badge className="bg-accent/90 text-white text-base px-3 py-1 rounded-lg">{home.attributes[2].value} bds</Badge>
                            <Badge className="bg-accent/90 text-white text-base px-3 py-1 rounded-lg">{home.attributes[3].value} ba</Badge>
                            <Badge className="bg-accent/90 text-white text-base px-3 py-1 rounded-lg">{home.attributes[4].value} sqft</Badge>
                        </div>
                        <div className="text-gray text-lg mb-2">{home.address}</div>
                        <div className="text-2xl font-semibold text-primary mb-4">{home.attributes[0].value} ETH</div>
                        {owner ? (
                            <div className="text-accent font-medium mb-2">
                                Owned by {owner.slice(0, 6) + '...' + owner.slice(38, 42)}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3 mb-4">
                                {(account === inspector) ? (
                                    <Button onClick={inspectHandler} disabled={hasInspected} className="w-full">
                                        Approve Inspection
                                    </Button>
                                ) : (account === lender) ? (
                                    <Button onClick={lendHandler} disabled={hasLended} className="w-full">
                                        Approve & Lend
                                    </Button>
                                ) : (account === seller) ? (
                                    <Button onClick={sellHandler} disabled={hasSold} className="w-full">
                                        Approve & Sell
                                    </Button>
                                ) : (
                                    <Button onClick={buyHandler} disabled={hasBought} className="w-full">
                                        Buy
                                    </Button>
                                )}
                                <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/10">
                                    Contact agent
                                </Button>
                            </div>
                        )}
                    </CardHeader>
                    <hr className="my-2" />
                    <div>
                        <h2 className="text-xl font-semibold mb-2 text-dark">Overview</h2>
                        <p className="text-gray mb-4">{home.description}</p>
                    </div>
                    <hr className="my-2" />
                    <div>
                        <h2 className="text-xl font-semibold mb-2 text-dark">Facts and features</h2>
                        <ul className="grid grid-cols-2 gap-2">
                            {home.attributes.map((attribute, index) => (
                                <li key={index} className="text-gray"><strong>{attribute.trait_type}</strong>: {attribute.value}</li>
                            ))}
                        </ul>
                    </div>
                </CardContent>
                <Button onClick={togglePop} className="absolute top-4 right-4 bg-white/80 hover:bg-white p-2 rounded-full shadow-md">
                    <img src={close} alt="Close" className="w-5 h-5" />
                </Button>
            </Card>
        </motion.div>
    );
}

export default Home;