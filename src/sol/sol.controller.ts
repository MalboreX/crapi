import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { SolService } from './sol.service';

@Controller('sol')
export class SolController {
    constructor(private solService: SolService) { }

    @Post('createAccount')
    async createAccount() {
        return await this.solService.createAccount();
    }

    @Get('incomingSol')
    async getIncomingSol(@Query() query) {
        return await this.solService.getIncomingSolTransactions(query.wallet);
    }

    @Get('incomingSpl')
    async getIncomingSpl(@Query() query) {
        return await this.solService.getIncomingSplTransactions(query.wallet, query.programId, query.mint);
    }

    @Get('balanceInSol')
    async balanceInSol(@Query() query) {
        return await this.solService.getBalanceInSol(query.wallet);
    }

    @Get('balanceInSpl')
    async balanceInSpl(@Query() query) {
        return await this.solService.getBalanceInSpl(query.wallet, query.mint, query.programId);
    }

    @Post('sendSol')
    async sendSol(@Body() query) {
        return await this.solService.transferSol(query.key, query.receipent, query.amount);
    }

    @Post('sendSpl')
    async sendSpl(@Body() query) {
        return await this.solService.transferSplToken(query.key, query.receipent, query.mint, query.programId, query.amount);
    }
}
