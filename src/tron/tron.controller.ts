import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import {
  PostTransferTrc20Dto,
  GetBalanceDto,
} from './dto';
import { TronService } from './tron.service';
import WalletDto from 'src/common/dto/out.post.Wallet.dto';
import TransfersToDto from 'src/common/dto/in.get.TransfersTo.dto';

@Controller('tron')
export class TronController {
  constructor(private tronService: TronService) { }

  @Get('transfersTo')
  async getTransfersTo(@Query() dto: TransfersToDto) {
    return await this.tronService.getTransfersTo(dto.walletAddress);
  }

  @Get('balance')
  async balance(@Query() dto: GetBalanceDto) {
    return await this.tronService.getBalance(dto.walletAddress, dto.contract);
  }

  @Post('createAccount')
  async createAccount(): Promise<WalletDto> {
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
