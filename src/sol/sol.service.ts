import { Injectable } from '@nestjs/common';
import { PublicKey } from '@solana/web3.js';
const { Connection, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL, sendAndConfirmTransaction } = require('@solana/web3.js');
const bip39 = require('bip39');
const { derivePath } = require('ed25519-hd-key');
import { getAssociatedTokenAddress, getAccount, getMint, getOrCreateAssociatedTokenAccount, createTransferInstruction } from '@solana/spl-token';
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

        const walletAddress = new PublicKey(wallet);

        const signatures = await this.connection.getSignaturesForAddress(walletAddress, { limit: 10 });
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

        return transactions;
    }

    async getIncomingSplTransactions(wallet: string, programId: string, mint: string) {
        const transactions = [];


        const associatedAccount = await getAssociatedTokenAddress(
            new PublicKey(mint),
            new PublicKey(wallet),
            false,
            new PublicKey(programId)
        );

        const signatures = await this.connection.getSignaturesForAddress(associatedAccount, { limit: 10 });
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

        return transactions;
    }

    async getBalanceInSol(wallet: string) {
        const publicKey = new PublicKey(wallet);
        const balanceInLamports = await this.connection.getBalance(publicKey);
        const balanceInSOL = balanceInLamports / 1_000_000_000;

        return {
            balance: balanceInSOL
        };
    }

    async getBalanceInSpl(wallet: string, mint: string, programId: string) {
        const walletPublicKey = new PublicKey(wallet);
        const mintPublicKey = new PublicKey(mint);
        const tokenProgramPublicKey = new PublicKey(programId);

        const associatedTokenAddress = await getAssociatedTokenAddress(
            mintPublicKey,
            walletPublicKey,
            false,
            tokenProgramPublicKey
        );

        const mintInfo = await getMint(this.connection, mintPublicKey, 'confirmed', tokenProgramPublicKey);
        const decimals = mintInfo.decimals;

        const tokenAccount = await getAccount(this.connection, associatedTokenAddress, 'confirmed', tokenProgramPublicKey);

        const balanceBigInt = tokenAccount.amount;
        const divisor = BigInt(10 ** decimals);
        const humanReadableBalance = Number(balanceBigInt / divisor);

        return {
            balance: humanReadableBalance
        };
    }

    async transferSol(secretKeyBase58: string, recipientPublicKey: string, amountInSol: number) {

        const secretKey = bs58.decode(secretKeyBase58);
        const wallet = Keypair.fromSecretKey(secretKey);

        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: wallet.publicKey,
                toPubkey: recipientPublicKey,
                lamports: amountInSol * LAMPORTS_PER_SOL,
            })
        );

        await sendAndConfirmTransaction(this.connection, transaction, [wallet]);

        return {
            status: 'SUCCESS'
        }
    }

    async transferSplToken(secretKeyBase58: string, recipientPublicKey: string, tokenMintAddress: string, programId: string, amount: number) {
        const secretKey = bs58.decode(secretKeyBase58);
        const wallet = Keypair.fromSecretKey(secretKey);
        const programIdKey = new PublicKey(programId);

        const mintInfo = await getMint(this.connection, new PublicKey(tokenMintAddress), 'confirmed', programIdKey);
        const decimals = mintInfo.decimals;

        const senderTokenAccount = await getOrCreateAssociatedTokenAccount(
            this.connection,
            wallet,
            new PublicKey(tokenMintAddress),
            wallet.publicKey,
            false,
            'confirmed',
            null,
            programIdKey
        );


        const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
            this.connection,
            wallet,
            new PublicKey(tokenMintAddress),
            new PublicKey(recipientPublicKey),
            false,
            'confirmed',
            null,
            programIdKey
        );


        const transferInstruction = createTransferInstruction(
            senderTokenAccount.address,
            recipientTokenAccount.address,
            wallet.publicKey,
            amount * (10 ** decimals),
            [],
            programIdKey
        );

        const transaction = new Transaction().add(transferInstruction);
        await sendAndConfirmTransaction(this.connection, transaction, [wallet]);

        return {
            status: 'SUCCESS'
        };
    }
}
