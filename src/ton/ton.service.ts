import { HttpCode, Inject, Injectable } from '@nestjs/common';

import WalletDto from 'src/common/dto/out.post.Wallet.dto';
import axios, { HttpStatusCode } from 'axios';
import TransferDto from 'src/common/dto/out.get.Transfer.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import TonWeb from 'tonweb';
import { mnemonicNew, mnemonicToPrivateKey, keyPairFromSeed } from '@ton/crypto';
import { mnemonicToSeed } from 'tonweb-mnemonic';

@Injectable()
export class TonService {
    private client: TonWeb;
    private toncenterUrl: String;
    private apiKey: string;
    private isMainnet: boolean;

    private version: string;

    constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
        this.version = 'v3R2';
        this.isMainnet = false;
        this.apiKey = '66fe14ce0086b9728239edcc5e95538865bcbf503089ca18bf0ff926df150d05';
        this.toncenterUrl = this.isMainnet ? 'https://toncenter.com/api/v3' : 'https://testnet.toncenter.com/api/v3';
        this.client = new TonWeb(new TonWeb.HttpProvider(this.isMainnet ? 'https://toncenter.com/api/v2/jsonRPC' : 'https://testnet.toncenter.com/api/v2/jsonRPC', { apiKey: this.apiKey }));
    }

    async createAccount(): Promise<WalletDto> {

        const mnemonics = await mnemonicNew();
        const keyPair = await mnemonicToPrivateKey(mnemonics);

        const WalletClass = this.client.wallet.all[this.version];
        const wallet = new WalletClass(this.client.provider, { publicKey: keyPair.publicKey });
        const walletAddress = await wallet.getAddress();

        return {
            privateKey: keyPair.secretKey.toString("base64"),
            publicKey: keyPair.publicKey.toString("base64"),
            mnemonics: mnemonics.join(' '),
            address: walletAddress.toString(true, true, true, !this.isMainnet)
        }
    }

    async getTonTransfersTo(walletAddress: string, limit: number = 100, offset: number = 0, sort: String = 'desc'): Promise<TransferDto[]> {
        const response = await axios.get(`${this.toncenterUrl}/transactions?account=${walletAddress}&limit=${limit}&offset=${offset}&sort=${sort}&api_key=${this.apiKey}`);
        const transactions = response.data?.transactions;

        const transfers: TransferDto[] = [];

        for (let i = 0; i < transactions.length; i++) {
            const transaction = transactions[i];

            const incomeDecimals = transaction.in_msg?.value;
            if (incomeDecimals) {
                const tonDecimals = 9;
                const incomeTon = incomeDecimals / 10 ** tonDecimals;

                transfers.push({
                    amount: incomeTon.toFixed(tonDecimals) as any,
                    symbol: 'TON',
                    from: transaction.in_msg?.source,
                    txID: transaction.hash
                });
            }
        }

        return transfers;
    }

    async getJettonTransfersTo(walletAddress: string, limit: number = 10, offset: number = 0, sort: string = 'desc'): Promise<TransferDto[]> {
        const netTransactions = await axios.get(`${this.toncenterUrl}/jetton/transfers?address=${walletAddress}&limit=${limit}&offset=${offset}&sort=${sort}&direction=in&api_key=${this.apiKey}`);
        const transactions = netTransactions.data?.jetton_transfers;

        let transfers: TransferDto[] = [];

        for (let i = 0; i < transactions.length; i++) {
            const transaction = transactions[i];
            const netJettonMaster = await axios.get(`${this.toncenterUrl}/jetton/masters?address=${transaction.jetton_master}&limit=1&offset=0&api_key=${this.apiKey}`);
            const jetton = netJettonMaster.data.jetton_masters[0];

            const incomeValue = transaction.amount / 10 ** jetton.jetton_content?.decimals;

            transfers.push({
                amount: incomeValue.toFixed(jetton.jetton_content?.decimals) as any,
                symbol: jetton.jetton_content?.symbol,
                from: transaction.source_wallet,
                txID: transaction.transaction_hash,
                contract: transaction.jetton_master,
            });
        }

        return transfers;
    }

    async getSpecificJettonTransfersTo(walletAddress: string, jettonAddress: string, limit: number = 100, offset: number = 0, sort: string = 'desc'): Promise<TransferDto[]> {
        const netTransactions = await axios.get(`${this.toncenterUrl}/jetton/transfers?address=${walletAddress}&jetton_master=${jettonAddress}&limit=${limit}&offset=${offset}&sort=${sort}&direction=in&api_key=${this.apiKey}`);
        const netJettonMaster = await this.GetJettonMasterFromCache(jettonAddress);

        const transactions = netTransactions.data?.jetton_transfers;

        let transfers: TransferDto[] = [];

        for (let i = 0; i < transactions.length; i++) {
            const transaction = transactions[i];

            const jetton = netJettonMaster.jetton_masters[0];
            const incomeValue = transaction.amount / 10 ** jetton.jetton_content?.decimals;

            transfers.push({
                amount: incomeValue.toFixed(jetton.jetton_content?.decimals) as any,
                symbol: jetton.jetton_content?.symbol,
                from: transaction.source_wallet,
                txID: transaction.transaction_hash,
                contract: transaction.jetton_master,
            });
        }

        return transfers;
    }

    private async GetJettonMasterFromCache(jettonAddress: string): Promise<any> {
        const jetton = await this.cacheManager.get(`TON_JETTON_${jettonAddress}`);
        if (jetton == null) {
            const netJettonMaster = await axios.get(`${this.toncenterUrl}/jetton/masters?address=${jettonAddress}&limit=1&offset=0&api_key=${this.apiKey}`);
            if (netJettonMaster.status === HttpStatusCode.Ok)
                await this.cacheManager.set(`TON_JETTON_${jettonAddress}`, netJettonMaster.data);

            return netJettonMaster.data;
        }

        return jetton;
    }

    async sendTon(mnemonic: string, toAddress: string, amount: string) {
        const keyPair = await mnemonicToPrivateKey(mnemonic.split(' '));

        const WalletClass = this.client.wallet.all[this.version];
        const wallet = new WalletClass(this.client.provider, {
            publicKey: keyPair.publicKey
        });

        const seqno = await wallet.methods.seqno().call() || 0;

        const transfer = wallet.methods.transfer({
            secretKey: keyPair.secretKey,
            toAddress: toAddress,
            amount: TonWeb.utils.toNano(amount), // 0.01 TON
            seqno: seqno,
            sendMode: 3,
        });

        const result = await transfer.send();

        return result['@type'] === 'ok';

    }

    async sendJetton(mnemonic: string, contract: string, toAddress: string, amount: string) {
        const keyPair = await mnemonicToPrivateKey(mnemonic.split(' '));

        const WalletClass = this.client.wallet.all[this.version];
        const wallet = new WalletClass(this.client.provider, {
            publicKey: keyPair.publicKey
        });

        let hotWalletAddress = await wallet.getAddress();

        const jettonMinter = new TonWeb.token.jetton.JettonMinter(this.client.provider, {
            address: contract
        } as any);

        const jettonWalletAddress = await jettonMinter.getJettonWalletAddress(hotWalletAddress);
        const jettonWallet = new TonWeb.token.jetton.JettonWallet(this.client.provider, {
            address: jettonWalletAddress
        });

        const seqno = await wallet.methods.seqno().call() || 0;

        const toncoinAmount = TonWeb.utils.toNano('0.05');

        const netJettonMaster = await this.GetJettonMasterFromCache(contract);
        const jetton = netJettonMaster.jetton_masters[0];
        const jettonAmountToSent = parseFloat(amount) / 10 ** jetton.jetton_content?.decimals;

        const transfer = wallet.methods.transfer({
            secretKey: keyPair.secretKey,
            toAddress: jettonWalletAddress,
            amount: toncoinAmount,
            seqno: seqno,
            payload: await jettonWallet.createTransferBody({
                queryId: seqno, // any number
                jettonAmount: jettonAmountToSent, // jetton amount in units
                toAddress: new TonWeb.utils.Address(toAddress),
                responseAddress: hotWalletAddress
            } as any)
        });

        const result = await transfer.send();

        return result['@type'] === 'ok';
    }
}
