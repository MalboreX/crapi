import { Module } from '@nestjs/common';
import { TronModule } from './tron/tron.module';

@Module({
  imports: [TronModule],
})
export class AppModule {}
