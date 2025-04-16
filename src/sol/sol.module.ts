import { Module } from '@nestjs/common';
import { SolService } from './sol.service';
import { SolController } from './sol.controller';

@Module({
    providers: [SolService],
    controllers: [SolController],
})
export class SolModule { }
