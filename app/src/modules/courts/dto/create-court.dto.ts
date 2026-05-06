import {
  IsDecimal,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { SurfaceType } from '../../../common/enums/surface.enum';

export class CreateCourtDto {
  @IsNotEmpty({ message: '' })
  @MinLength(3, { message: '' })
  @IsString({ message: '' })
  name!: string;

  @IsOptional({ message: '' })
  @IsString({ message: '' })
  description?: string;

  @IsNotEmpty({ message: '' })
  @IsDecimal({ decimal_digits: '1,3' }, { message: '' })
  price!: string;

  @IsNotEmpty({ message: '' })
  @IsString({ message: '' })
  location!: string;

  @IsNotEmpty({ message: '' })
  @IsDecimal({ decimal_digits: '1,2' }, { message: '' })
  lat!: string;

  @IsNotEmpty()
  @IsDecimal({ decimal_digits: '1,2' }, { message: '' })
  lng!: string;

  @IsEnum(SurfaceType, { message: '' })
  surface!: SurfaceType;

  @IsNotEmpty()
  ownerId!: string;
}
