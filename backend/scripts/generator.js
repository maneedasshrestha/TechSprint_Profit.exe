const ethers = require('ethers');
const wallet = ethers.Wallet.createRandom();
console.log('\n=== YOUR WALLET INFO ===');
console.log('Address:', wallet.address);
console.log('Private Key:', wallet.privateKey);
console.log('Mnemonic:', wallet.mnemonic.phrase);
console.log('\n⚠️ SAVE THESE SECURELY! ⚠️\n');