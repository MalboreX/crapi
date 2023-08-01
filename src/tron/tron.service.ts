import { Injectable } from '@nestjs/common';
import { TronTransferDto, TronWalletDto } from './dto';
import TronWeb from 'tronweb';
import TronGrid from 'trongrid';

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
    //const contractAddress = 'TC7SaRHMzh3A86GJ6EjH8su3ngxmYtYS1F'; // если вы хотите получать только определенную монету

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

    const decimalsTrx = 6;
    trxTransactions.data?.forEach((trxTransaction) => {
      trxTransaction?.raw_data?.contract?.forEach((data) => {
        const to = this.tronWeb.address.fromHex(
          data.parameter?.value?.to_address,
        );

        if (data.type === 'TransferContract' && to === walletAddress) {
          const amount = data.parameter?.value?.amount / 10 ** decimalsTrx;
          const txID = trxTransaction.txID;
          const from = this.tronWeb.address.fromHex(
            data.parameter?.value?.owner_address,
          );

          transfers.push({
            amount,
            txID,
            symbol: 'TRX',
            from,
          });
        }
      });
    });

    const trc20Transactions = await this.tronGrid.account.getTrc20Transactions(
      walletAddress,
      options,
    );

    trc20Transactions.data?.forEach((trc20Transaction) => {
      if (
        trc20Transaction.type == 'Transfer' &&
        trc20Transaction.to == walletAddress
      ) {
        const amount =
          trc20Transaction.value / 10 ** trc20Transaction.token_info?.decimals;
        const txID = trc20Transaction.transaction_id;
        const from = trc20Transaction.from;
        const symbol = trc20Transaction.token_info?.symbol;

        transfers.push({
          amount,
          txID,
          symbol,
          from,
          contract: trc20Transaction.token_info?.address,
        });
      }
    });

    return transfers;
  }
}
