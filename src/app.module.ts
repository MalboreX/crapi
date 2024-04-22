import { Module } from '@nestjs/common';
import { TronModule } from './tron/tron.module';
import { ConfigModule } from '@nestjs/config';
import { TonModule } from './ton/ton.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [ConfigModule.forRoot(), CacheModule.register({ isGlobal: true }), TronModule, TonModule],
})
export class AppModule { }
