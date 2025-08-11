import { BitcoinWallet } from '@/wallet-adapter/core';
import { base64ToHex } from '@/wallet-adapter/src/utils';
import { PubkeyUtil, RpcConnection } from '@saturnbtcio/arch-sdk';

// Helper function to wait for a specified time
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function createAndFundAccount(wallet: BitcoinWallet) {
    const connection = new RpcConnection('http://localhost:9002');

    try {
        console.log('🔌 Connecting to Arch node...\n');

        // Check the current block height
        const initialBlockCount = await connection.getBlockCount();
        console.log('📊 Current block height:', initialBlockCount);


        // Create signer pubkey
        const rawSignerHex = wallet.getSignerAddress().publicKey;
        console.log("rawSignerHex", rawSignerHex);
        // if wallet provider is unisat slice 2 otherwise dont
        const normalizedSignerHex = wallet.walletName === 'unisat' ? rawSignerHex.slice(2) : rawSignerHex;
        const pubkey = PubkeyUtil.fromHex(normalizedSignerHex);
        console.log("pubkey in createAccount", pubkey);

        // Create account with faucet
        console.log('\n💰 Step 1: Creating account with faucet...');
        await connection.createAccountWithFaucet(pubkey);
        console.log('✅ Faucet account creation initiated');

        // Get the Arch address
        const archAddress = await connection.getAccountAddress(pubkey);
        console.log('📍 Arch address:', archAddress);

        // Request airdrop to fund the account
        console.log('\n💰 Step 2: Requesting airdrop...');
        await connection.requestAirdrop(pubkey);
        console.log('✅ Airdrop requested');

        // Wait for account to be created and funded
        console.log('\n⏳ Waiting for account to be confirmed on chain...');
        console.log('   (This may take 5-10 seconds)');

        let accountFound = false;
        const maxAttempts = 6;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            const waitTime = attempt * 2000; // Increase wait time each attempt
            console.log(`\n🔄 Attempt ${attempt}/${maxAttempts}: Waiting ${waitTime / 1000} seconds...`);
            await wait(waitTime);

            // Check block progress
            const currentBlockCount = await connection.getBlockCount();
            console.log(`📈 Blocks produced: ${currentBlockCount - initialBlockCount}`);

            try {
                const accountInfo = await connection.readAccountInfo(pubkey);
                console.log('\n✅ Account successfully created and funded!');
                console.log('\n📊 Account Details:');
                console.log('   Address:', archAddress);
                console.log('   Full info:', JSON.stringify(accountInfo, null, 2));

                // Access properties safely
                const info = accountInfo as any;
                if (info.lamports !== undefined) {
                    console.log('   Balance:', info.lamports, 'lamports');
                }
                if (info.owner) {
                    console.log('   Owner:', Buffer.from(Object.values(info.owner)).toString('hex'));
                }
                if (info.utxo) {
                    console.log('   UTXO:', info.utxo);
                }
                if (info.is_executable !== undefined) {
                    console.log('   Executable:', info.is_executable);
                }

                accountFound = true;
                break;
            } catch (error) {
                if (attempt === maxAttempts) {
                    console.log('❌ Account not found after maximum attempts');
                } else {
                    console.log('⏳ Account not ready yet, continuing to wait...');
                }
            }
        }

        if (accountFound) {
            console.log('\n🎉 Success! Your Arch account is ready to use.');
            console.log('💡 You can now:');
            console.log('   - Send transactions from this account');
            console.log('   - Interact with Arch programs');
            console.log('   - Deploy smart contracts');
            console.log('\n📝 Save these for future reference:');
            console.log('   Pubkey:', pubkey);
            console.log('   Address:', archAddress);
        }

    } catch (error) {
        console.error('❌ Error:', error);
        console.log('\n💡 Troubleshooting:');
        console.log('   - Make sure your Arch node is running at http://localhost:9002');
        console.log('   - Ensure the node has faucet functionality enabled');
        console.log('   - Check that the node is syncing and producing blocks');
    }
}
