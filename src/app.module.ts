import { Module } from '@nestjs/common';
import { TronModule } from './tron/tron.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot(), TronModule],
})
export class AppModule {}
