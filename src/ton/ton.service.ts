import { HttpCode, Inject, Injectable } from '@nestjs/common';

import { TonClient, WalletContractV4 } from "@ton/ton";
import { mnemonicNew, mnemonicToPrivateKey } from "@ton/crypto";
import WalletDto from 'src/common/dto/out.post.Wallet.dto';
import axios, { HttpStatusCode } from 'axios';
import TransferDto from 'src/common/dto/out.get.Transfer.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class TonService {
    private client: TonClient;
    private toncenterUrl: String;
    private apiKey: String;

    constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
        this.client = new TonClient({
            endpoint: 'https://toncenter.com/api/v2/jsonRPC',
        });
        this.toncenterUrl = 'https://toncenter.com/api/v3';
        this.apiKey = '7c06d152596254440162ebfb5f2347ce5c85a146c489b317343220ef41238a36';
    }

    async createAccount(): Promise<WalletDto> {
        const mnemonics = await mnemonicNew();
        const keyPair = await mnemonicToPrivateKey(mnemonics);

        const workchain = 0;
        const wallet = WalletContractV4.create({ workchain, publicKey: keyPair.publicKey });

        return {
            privateKey: keyPair.secretKey.toString("base64"),
            publicKey: keyPair.publicKey.toString("base64"),
            mnemonics: mnemonics.join(' '),
            address: wallet.address.toString(),
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
}
