import { Controller, Get, Post, Body } from '@nestjs/common';
import { TronWalletDto, GetTransfersToDto } from './dto';
import { TronService } from './tron.service';

@Controller('tron')
export class TronController {
  constructor(private tronService: TronService) {}

  @Post('createAccount')
  async createAccount(): Promise<TronWalletDto> {
    return await this.tronService.createAccount();
  }

  @Get('transfersTo')
  async getTransfersTo(@Body() dto: GetTransfersToDto) {
    console.log(dto);
    return await this.tronService.getTransfersTo(dto.walletAddress);
  }
}
