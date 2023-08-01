import { Controller, Get, Post } from '@nestjs/common';
import { TronWalletDto } from './dto';
import { TronService } from './tron.service';

@Controller('tron')
export class TronController {
  constructor(private tronService: TronService) {}

  @Post('createAccount')
  async createAccount(): Promise<TronWalletDto> {
    return await this.tronService.createAccount();
  }

  @Get('transfersTo')
  async getTransfersTo() {
    return await this.tronService.getTransfersTo(
      'TFgSXzq7uD5YXuSvQmDdm5Ne1xYRkRrkaY',
    );
  }
}
