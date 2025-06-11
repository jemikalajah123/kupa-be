import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { OrderService } from '../services';
import { CreateOrderDto } from '../dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IApiResponse } from '../../../shared/types';
import { JwtAccessTokenGuard, RolesGuard } from '../../../shared/guards';
import { Roles } from '../../../shared/decorators';
import { USER_ROLE } from '../../../shared/constants';

@UseGuards(JwtAccessTokenGuard, RolesGuard)
@ApiTags('Orders')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  async createOrder(
    @Body() createOrderDTO: CreateOrderDto,
  ): Promise<IApiResponse> {
    return this.orderService.createOrder(createOrderDTO);
  }

  @Get()
  @Roles([USER_ROLE.ADMIN])
  @ApiOperation({ summary: 'Get all orders' })
  async getAllOrders(): Promise<IApiResponse> {
    return this.orderService.getAllOrders();
  }

  @Get(':id')
  @Roles([USER_ROLE.ADMIN])
  @ApiOperation({ summary: 'Get order by ID' })
  async getOrderById(@Param('id') id: string): Promise<IApiResponse> {
    return this.orderService.getOrderById(id);
  }
}
