import { Injectable } from '@nestjs/common';
import { TronTransferDto, TronWalletDto, TronTransactionHash } from './dto';
import TronWeb from 'tronweb';
import TronGrid from 'trongrid';
import { GetTransfersFromTrc20, GetTransfersFromTrx } from './tron.helper';

@Injectable()
export class TronService {
  private tronWeb: TronWeb;
  private tronGrid: TronGrid;

  constructor() {
    this.tronWeb = new TronWeb({
      fullHost: process.env.TRONGRID_API,
    });
    this.tronGrid = new TronGrid(this.tronWeb);
  }

  async createAccount(): Promise<TronWalletDto> {
    const account = await this.tronWeb.createAccount();

    return {
      address: account.address.base58,
      publicKey: account.publicKey,
      privateKey: account.privateKey,
    };
  }

  async getTransfersTo(walletAddress: string): Promise<TronTransferDto[]> {
    const options = {
      onlyTo: true,
      onlyConfirmed: true,
      limit: 100,
      orderBy: 'timestamp,desc',
    };

    const transfers: TronTransferDto[] = [];

    const trxTransactions = await this.tronGrid.account.getTransactions(
      walletAddress,
      options,
    );

    const trc20Transactions = await this.tronGrid.account.getTrc20Transactions(
      walletAddress,
      options,
    );

    const trxTransfers = await GetTransfersFromTrx(
      this.tronWeb,
      trxTransactions,
      walletAddress,
    );

    const trc20Transfers = await GetTransfersFromTrc20(
      trc20Transactions,
      walletAddress,
    );

    transfers.push(...trxTransfers, ...trc20Transfers);

    return transfers;
  }

  async transferTrc20(
    contractAddress: string,
    amount: string,
    from: string,
    to: string,
    privateKey: string,
  ): Promise<TronTransactionHash> {
    this.tronWeb.setAddress(from);
    this.tronWeb.setPrivateKey(privateKey);

    const contract = await this.tronWeb.contract().at(contractAddress);
    const decimals = await contract.decimals().call();
    const tokenAmount = parseFloat(amount) * 10 ** decimals;
    const hash = await contract.transfer(to, tokenAmount).send();

    return {
      hash,
    };
  }

  async getBalance(walletAddress: string, contractAddress?: string) {
    await this.tronWeb.setAddress(walletAddress);

    const trxBalance = await this.tronWeb.trx.getBalance(walletAddress);

    const result: any = {
      trx: trxBalance,
    };

    if (contractAddress) {
      const contractInstance = await this.tronWeb
        .contract()
        .at(contractAddress);

      const decimals = await contractInstance.decimals().call();

      const trc20Balance = await contractInstance
        .balanceOf(walletAddress)
        .call();

      result.trc20 = trc20Balance.toNumber() / 10 ** decimals;
    }

    return result;
  }
}
