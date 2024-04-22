import { Module } from '@nestjs/common';
import { TonService } from './ton.service';
import { TonController } from './ton.controller';

@Module({
    providers: [TonService],
    controllers: [TonController],
})
export class TonModule { }
