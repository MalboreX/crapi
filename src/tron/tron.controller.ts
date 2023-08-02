import { Controller, Get, Post, Body } from '@nestjs/common';
import { TronWalletDto, GetTransfersToDto, PostTransferTrc20Dto } from './dto';
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
    return await this.tronService.getTransfersTo(dto.walletAddress);
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
