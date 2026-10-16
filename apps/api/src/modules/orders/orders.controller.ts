import { BadRequestException, Body, Controller, Inject, Post } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  createOrderRequestSchema,
  type CreateOrderRequest,
  type CreateOrderResponse
} from '@brasa-viva/contracts';
import { OrdersService } from './application/orders.service';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(@Inject(OrdersService) private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Valida, persiste y confirma un pedido antes de WhatsApp.' })
  @ApiBody({ description: 'Sucursal, contacto y productos solicitados sin importes confiables.' })
  @ApiCreatedResponse({ description: 'Pedido persistido con resumen calculado por el servidor.' })
  create(@Body() body: unknown): Promise<CreateOrderResponse> {
    const parsedRequest = createOrderRequestSchema.safeParse(body);

    if (!parsedRequest.success) {
      throw new BadRequestException({
        code: 'INVALID_ORDER_REQUEST',
        message: 'Los datos del pedido no son válidos.',
        details: parsedRequest.error.flatten()
      });
    }

    return this.ordersService.create(parsedRequest.data as CreateOrderRequest);
  }
}
