import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { SolService } from './sol.service';

@Controller('sol')
export class SolController {
    constructor(private solService: SolService) { }

    @Post('createAccount')
    async createAccount() {
        return await this.solService.createAccount();
    }
}
