import { ethers } from 'ethers';

const Navigation = ({ account, setAccount, onSellClick }) => {
    // Function to handle wallet connection
    const connectHandler = async () => {
        // Check if MetaMask or a similar Web3 provider is available
        if (!window.ethereum) {
            console.error("MetaMask or compatible wallet is not detected.");
            alert("Please install MetaMask or a compatible Ethereum wallet to connect.");
            return;
        }

        try {
            // Request accounts from the Ethereum provider (MetaMask)
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            if (accounts.length === 0) {
                console.warn("No accounts found or connected.");
                alert("No Ethereum accounts found. Please unlock your wallet and select an account.");
                return;
            }
            
            // Get the first connected account and update the `account` state in App.js
            const connectedAccount = ethers.utils.getAddress(accounts[0]);
            setAccount(connectedAccount);
            console.log("Wallet Connected:", connectedAccount);

        } catch (error) {
            console.error("Failed to connect wallet:", error);
            if (error.code === 4001) { // User rejected the connection request
                alert("Wallet connection rejected by the user. Please approve the connection in MetaMask.");
            } else {
                alert(`Wallet connection failed: ${error.message || "An unknown error occurred."}`);
            }
        }
    }

    return (
        <nav className="w-full bg-white shadow-md py-4 px-6 flex justify-between items-center rounded-b-lg">
            <ul className="flex space-x-6">
                {/* Navigation links - can be expanded for routing later */}
                <li><a href="#" className="text-blue-600 hover:text-blue-800 font-semibold text-lg">Buy</a></li>
                <li><a href="#" className="text-gray-700 hover:text-gray-900 font-semibold text-lg">Rent</a></li>
                {/* "Sell" as a conceptual link, the "List Property" button handles its functionality */}
                <li><a href="#" className="text-gray-700 hover:text-gray-900 font-semibold text-lg">Sell</a></li> 
            </ul>

            <div className="flex items-center space-x-4">
                {account ? (
                    // Display connected account address
                    <button
                        type="button"
                        className='bg-blue-600 text-white py-2 px-4 rounded-md shadow-md hover:bg-blue-700 transition duration-300 text-sm'
                    >
                        {account.slice(0, 6) + '...' + account.slice(38, 42)}
                    </button>
                ) : (
                    // Button to connect wallet
                    <button
                        type="button"
                        className='bg-blue-600 text-white py-2 px-4 rounded-md shadow-md hover:bg-blue-700 transition duration-300 text-sm'
                        onClick={connectHandler}
                    >
                        Connect Wallet
                    </button>
                )}

                {/* 'List Property' button - only visible when a wallet is connected */}
                {account && ( 
                    <button
                        type="button"
                        className='bg-green-500 text-white py-2 px-4 rounded-md shadow-md hover:bg-green-600 transition duration-300 text-sm'
                        onClick={onSellClick} // Calls the function passed from App.js to show the property form
                    >
                        List Property
                    </button>
                )}
            </div>
        </nav>
    );
}

export default Navigation;
