// CryptoKitties contract address
const CK_CONTRACT_ADDRESS = '0x06012c8cf97BEaD5deAe237070F9587f8E7A266d';

// Contract ABI - we only need the transfer function
const CK_ABI = [{
    "constant": false,
    "inputs": [{
        "name": "_to",
        "type": "address"
    }, {
        "name": "_tokenId",
        "type": "uint256"
    }],
    "name": "transfer",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
}];

let web3;
let contract;
let userAddress;

// DOM Elements
const connectWalletBtn = document.getElementById('connect-wallet');
const transferBtn = document.getElementById('transfer');
const walletStatus = document.getElementById('wallet-status');
const kittyIdsInput = document.getElementById('kitty-ids');
const recipientInput = document.getElementById('recipient');
const statusDiv = document.getElementById('status');

// Initialize Web3 and contract
async function init() {
    const provider = window.ethereum || window.web3?.currentProvider;
    
    if (provider) {
        try {
            web3 = new Web3(provider);
            
            if (window.ethereum) {
                await window.ethereum.enable();
            }
            
            const accounts = await web3.eth.getAccounts();
            userAddress = accounts[0];
            
            if (!userAddress) {
                throw new Error('No accounts found');
            }
            
            contract = new web3.eth.Contract(CK_ABI, CK_CONTRACT_ADDRESS);
            
            walletStatus.textContent = `Connected: ${userAddress.substring(0, 6)}...${userAddress.substring(38)}`;
            connectWalletBtn.textContent = 'Wallet Connected';
            connectWalletBtn.disabled = true;
            transferBtn.disabled = false;
            
            if (window.ethereum) {
                window.ethereum.on('accountsChanged', function (accounts) {
                    userAddress = accounts[0];
                    walletStatus.textContent = `Connected: ${userAddress.substring(0, 6)}...${userAddress.substring(38)}`;
                });
            }
        } catch (error) {
            showStatus('Error connecting to wallet: ' + error.message, 'error');
        }
    } else {
        showStatus('Please install Dapper wallet to use this application', 'error');
    }
}

// Transfer kitties
async function transferKitties() {
    // Split by both commas and newlines, then clean up the results
    const kittyIds = kittyIdsInput.value
        .split(/[,\n]/)  // Split by both commas and newlines
        .map(id => id.trim())  // Remove whitespace
        .filter(id => id);  // Remove empty entries
    
    const recipient = recipientInput.value.trim();
    
    if (!kittyIds.length) {
        showStatus('Please enter at least one kitty ID', 'error');
        return;
    }
    
    if (!web3.utils.isAddress(recipient)) {
        showStatus('Please enter a valid recipient address', 'error');
        return;
    }
    
    transferBtn.disabled = true;
    showStatus(`Starting transfers for ${kittyIds.length} kitties...`, 'success');
    
    let successCount = 0;
    let failCount = 0;
    let failedKitties = [];
    
    // Send all transactions immediately
    kittyIds.forEach(kittyId => {
        const txData = contract.methods.transfer(recipient, kittyId).encodeABI();
        
        // Send transaction without waiting
        web3.eth.sendTransaction({
            from: userAddress,
            to: CK_CONTRACT_ADDRESS,
            data: txData
        }).then(tx => {
            successCount++;
            showStatus(`Successfully transferred kitty #${kittyId}`, 'success');
            updateFinalStatus();
        }).catch(error => {
            failCount++;
            failedKitties.push(kittyId);
            showStatus(`Error transferring kitty #${kittyId}: ${error.message}`, 'error');
            updateFinalStatus();
        });
    });
    
    function updateFinalStatus() {
        const totalProcessed = successCount + failCount;
        if (totalProcessed === kittyIds.length) {
            if (successCount > 0) {
                showStatus(`Transfer complete. ${successCount} successful, ${failCount} failed.`, 'success');
            } else {
                showStatus(`All transfers failed. Please try again.`, 'error');
            }
            
            // Update failed kitties section if there are any failures
            if (failedKitties.length > 0) {
                const failedKittiesInput = document.getElementById('failed-kitties');
                failedKittiesInput.value = failedKitties.join(', ');
                document.getElementById('failed-transfers').style.display = 'block';
            }
            
            transferBtn.disabled = false;
        }
    }
}

// Helper function to show status messages
function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = type;
}

// Event listeners
connectWalletBtn.addEventListener('click', init);
transferBtn.addEventListener('click', transferKitties);
document.getElementById('retry-failed').addEventListener('click', () => {
    const failedKittiesInput = document.getElementById('failed-kitties');
    kittyIdsInput.value = failedKittiesInput.value;
    failedKittiesInput.value = '';
    document.getElementById('failed-transfers').style.display = 'none';
    transferKitties();
}); 