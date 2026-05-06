import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  ParseFloatPipe,
} from '@nestjs/common';
import { CourtsService } from './courts.service';
import { CreateCourtDto } from './dto/create-court.dto';
import { UpdateCourtDto } from './dto/update-court.dto';
import { SurfaceType } from '../../common/enums/surface.enum';

@Controller('courts')
export class CourtsController {
  constructor(private readonly courtsService: CourtsService) {}

  @Post()
  create(@Body() createCourtDto: CreateCourtDto) {
    return this.courtsService.create(createCourtDto);
  }

  @Get()
  findAll(
    @Query('page', ParseIntPipe) page?: number,
    @Query('limit', ParseIntPipe) limit?: number,
    @Query('isActive') isActive?: string,
    @Query('surface') surface?: SurfaceType,
    @Query('minPrice', ParseFloatPipe) minPrice?: number,
    @Query('maxPrice', ParseFloatPipe) maxPrice?: number,
    @Query('ownerId') ownerId?: string,
    @Query('location') location?: string,
  ) {
    return this.courtsService.findAll({
      page,
      limit,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      surface,
      minPrice: minPrice ? minPrice : undefined,
      maxPrice: maxPrice ? maxPrice : undefined,
      ownerId,
      location,
    });
  }

  @Get('available')
  findWithAvailability() {
    return this.courtsService.findWithAvailability();
  }

  @Get('top-rated')
  findTopRated(@Query('limit', ParseIntPipe) limit?: number) {
    return this.courtsService.findTopRated(limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.courtsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCourtDto: UpdateCourtDto) {
    return this.courtsService.update(id, updateCourtDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.courtsService.remove(id);
  }
}
