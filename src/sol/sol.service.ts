import { Injectable } from '@nestjs/common';
import { PublicKey } from '@solana/web3.js';
const { Connection, Keypair } = require('@solana/web3.js');
const bip39 = require('bip39');
const { derivePath } = require('ed25519-hd-key');
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import bs58 from 'bs58';

@Injectable()
export class SolService {
    private connection;

    constructor() {
        this.connection = new Connection(process.env.SOLANA_NODE, 'confirmed');
    }

    async createAccount() {
        const mnemonic = bip39.generateMnemonic();
        const derivationPath = "m/44'/501'/0'/0'";
        const seed = bip39.mnemonicToSeedSync(mnemonic);
        const { key } = derivePath(derivationPath, seed.toString('hex'));
        const keypair = Keypair.fromSeed(key.slice(0, 32)); // Используем первые 32 байта
        const publicKey = keypair.publicKey.toString();
        const privateKey = bs58.encode(keypair.secretKey);

        return {
            address: publicKey,
            publicKey: publicKey,
            privateKey: privateKey,
            mnemonic: mnemonic
        };
    }

    async getIncomingSolTransactions(wallet: string) {
        const transactions = [];

        try {
            const walletAddress = new PublicKey(wallet);

            const signatures = await this.connection.getSignaturesForAddress(walletAddress, { limit: 1000 });
            const signatureList = signatures.map((transaction) => transaction.signature);
            const transactionDetails = await this.connection.getParsedTransactions(signatureList, { maxSupportedTransactionVersion: 0 });

            for (const tx of transactionDetails) {
                const { transaction, meta } = tx;
                const preBalances = meta.preBalances;
                const postBalances = meta.postBalances;

                const walletIndex = transaction.message.accountKeys.findIndex(
                    key => key.pubkey.toBase58() === walletAddress.toBase58()
                );

                if (walletIndex !== -1 && postBalances[walletIndex] > preBalances[walletIndex]) {
                    const amountReceived = (postBalances[walletIndex] - preBalances[walletIndex]) / 1e9;
                    transactions.push({
                        txId: transaction.signatures[0],
                        amount: amountReceived,
                        sender: transaction.message.accountKeys[0].pubkey.toBase58(),
                    });
                }
            }
        } catch (error) {
            console.error('Ошибка при получении транзакций:', error);
        }

        return transactions;
    }

    async getIncomingSplTransactions(wallet: string, programId: string, mint: string) {
        const transactions = [];

        try {
            const associatedAccount = await getAssociatedTokenAddress(
                new PublicKey(mint),
                new PublicKey(wallet),
                false,
                new PublicKey(programId)
            );

            const signatures = await this.connection.getSignaturesForAddress(associatedAccount, { limit: 1000 });
            const signatureList = signatures.map((transaction) => transaction.signature);
            const transactionDetails = await this.connection.getParsedTransactions(signatureList, { maxSupportedTransactionVersion: 0 });

            for (const tx of transactionDetails) {
                for (const instr of tx.transaction.message.instructions) {
                    if (instr.programId.toBase58() == programId) {
                        if (instr.parsed.info.destination == associatedAccount.toBase58() && instr.parsed.info.mint == mint) {
                            transactions.push({
                                txId: tx.transaction.signatures[0],
                                amount: instr.parsed.info.tokenAmount.uiAmount,
                                sender: tx.transaction.message.accountKeys[0].pubkey.toBase58(),
                            });
                        }
                    }
                }
            }

        } catch (error) {
            console.error('Ошибка при получении транзакций:', error);
        }

        return transactions;
    }


}
