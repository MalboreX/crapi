import { Module } from '@nestjs/common';
import { TronModule } from './tron/tron.module';
import { ConfigModule } from '@nestjs/config';
import { TonModule } from './ton/ton.module';
import { CacheModule } from '@nestjs/cache-manager';
import { SolModule } from './sol/sol.module';

@Module({
  imports: [ConfigModule.forRoot(), CacheModule.register({ isGlobal: true }), TronModule, TonModule, SolModule],
})
export class AppModule { }
