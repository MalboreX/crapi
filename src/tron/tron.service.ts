import { Injectable } from '@nestjs/common';
import { TronWalletDto } from './dto';
import TronWeb from 'tronweb';

@Injectable()
export class TronService {
  private tronWeb: TronWeb;

  constructor() {
    this.tronWeb = new TronWeb({
      fullHost: 'https://api.trongrid.io',
    });
  }

  async createAccount(): Promise<TronWalletDto> {
    const account = await this.tronWeb.createAccount();

    return {
      address: account.address.base58,
      publicKey: account.publicKey,
      privateKey: account.privateKey,
    };
  }
}
