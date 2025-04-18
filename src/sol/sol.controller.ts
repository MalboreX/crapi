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
}
