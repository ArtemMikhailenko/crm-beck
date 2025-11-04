import { Module } from '@nestjs/common'
import { VacationsService } from './vacations.service'

@Module({
  providers: [VacationsService],
  exports: [VacationsService]
})
export class VacationsModule {}
