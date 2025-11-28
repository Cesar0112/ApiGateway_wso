import { Module } from '@nestjs/common';
import { CasdoorBaseService } from './casdoorbase.service';
import { ConfigModule } from '../config/config.module';

@Module({
    imports: [ConfigModule],
    providers: [CasdoorBaseService],
    exports: [CasdoorBaseService],
})
export class CommonModule { }
