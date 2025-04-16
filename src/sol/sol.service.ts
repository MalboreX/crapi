import { Injectable } from '@nestjs/common';
const { Keypair } = require('@solana/web3.js');
const bip39 = require('bip39');
const { derivePath } = require('ed25519-hd-key');

@Injectable()
export class SolService {
    constructor() {

    }

    async createAccount() {
        const mnemonic = bip39.generateMnemonic();
        const derivationPath = "m/44'/501'/0'/0'";
        const seed = bip39.mnemonicToSeedSync(mnemonic);
        const { key } = derivePath(derivationPath, seed.toString('hex'));
        const keypair = Keypair.fromSeed(key.slice(0, 32)); // Используем первые 32 байта
        const publicKey = keypair.publicKey.toString();
        const privateKey = keypair.secretKey;

        return {
            address: publicKey,
            publicKey: publicKey,
            privateKey: privateKey,
            mnemonic: mnemonic
        };
    }
}
