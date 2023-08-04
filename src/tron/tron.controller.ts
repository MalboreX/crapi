import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import {
  TronWalletDto,
  GetTransfersToDto,
  PostTransferTrc20Dto,
  GetBalanceDto,
} from './dto';
import { TronService } from './tron.service';

@Controller('tron')
export class TronController {
  constructor(private tronService: TronService) {}

  @Get('transfersTo')
  async getTransfersTo(@Query() dto: GetTransfersToDto) {
    return await this.tronService.getTransfersTo(dto.walletAddress);
  }

  @Get('balance')
  async balance(@Query() dto: GetBalanceDto) {
    return await this.tronService.getBalance(dto.walletAddress, dto.contract);
  }

  @Post('createAccount')
  async createAccount(): Promise<TronWalletDto> {
    return await this.tronService.createAccount();
  }

  @Post('transferTrc20')
  async transferTrc20(@Body() dto: PostTransferTrc20Dto) {
    return await this.tronService.transferTrc20(
      dto.contract,
      dto.amount,
      dto.from,
      dto.to,
      dto.privateKey,
    );
  }
}
