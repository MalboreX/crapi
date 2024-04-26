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

    @Post('sendJetton')
    async sendJetton(@Body() dto: SendJettonDto) {
        return {
            'status': await this.tonService.sendJetton(dto.mnemonic, dto.contract, dto.toAddress, dto.amount)
        }
    }

    @Post('sendTon')
    async sendTon(@Body() dto: SendTonDto) {
        return {
            'status': await this.tonService.sendTon(dto.mnemonic, dto.toAddress, dto.amount)
        }
    }

    @Get('balanceInTon')
    async getTonBalance(@Query() dto) {
        return {
            balance: await this.tonService.getTonBalance(dto.walletAddress)
        };
    }

    @Get('balanceInJetton')
    async getJettonBalance(@Query() dto) {
        return {
            balance: await this.tonService.getJettonBalance(dto.walletAddress, dto.contract)
        };
    }
}
