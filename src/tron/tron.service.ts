import { Injectable } from '@nestjs/common';
import { TronTransferDto, TronWalletDto } from './dto';
import TronWeb from 'tronweb';
import TronGrid from 'trongrid';
import { GetTransfersFromTrc20, GetTransfersFromTrx } from './tron.helper';

@Injectable()
export class TronService {
  private tronWeb: TronWeb;
  private tronGrid: TronGrid;

  constructor() {
    this.tronWeb = new TronWeb({
      fullHost: 'https://api.trongrid.io',
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
}
