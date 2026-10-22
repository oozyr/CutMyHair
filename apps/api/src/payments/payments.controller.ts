import { Controller, Get } from '@nestjs/common';

@Controller('payments')
export class PaymentsController {
  @Get('status')
  status() {
    return { status: 'Payments stub. Pay at shop only for the demo.' };
  }
}
