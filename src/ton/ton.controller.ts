import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { TonService } from './ton.service';
import TonWalletDto from '../common/dto/out.post.Wallet.dto';
import TransfersToDto from 'src/common/dto/in.get.TransfersTo.dto';

@Controller('ton')
export class TonController {
    constructor(private tonService: TonService) { }

    @Post('createAccount')
    async createAccount(): Promise<TonWalletDto> {
        return await this.tonService.createAccount();
    }

    @Get('tonTransfersTo')
    async getTonTransfersTo(@Query() dto: TransfersToDto) {
        return await this.tonService.getTonTransfersTo(dto.walletAddress);
    }

    @Get('jettonTransfersTo')
    async getJettonTransfersTo(@Query() dto: TransfersToDto) {
        return await this.tonService.getJettonTransfersTo(dto.walletAddress);
    }

    @Get('specificJettonTransfersTo')
    async getSpecificJettonTransfersTo(@Query() dto: TransfersToDto) {
        return await this.tonService.getSpecificJettonTransfersTo(dto.walletAddress, dto.contract);
    }
}
