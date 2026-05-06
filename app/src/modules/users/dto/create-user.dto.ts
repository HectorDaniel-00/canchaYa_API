import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsLowercase,
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  Matches,
} from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

/**
 * ? Crea una nueva instancia de usuario utilizando los campos obligatorios definidos por el sistema.
 */
export class CreateUserDto {
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'The name field only accepts text' })
  name!: string;

  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email format' })
  @Transform(({ value }) => value.toLowerCase().trim())
  @IsLowercase({ message: 'The email address must be all lowercase' })
  email!: string;

  @IsNotEmpty({ message: 'Phone is required' })
  @IsString({ message: 'The phone number field only accepts text' })
  phone!: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'The password field only accepts text' })
  @Matches(/^(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'La contraseña debe tener al menos una mayúscula y un número',
  })
  password!: string;

  @IsOptional()
  @IsEnum(Role, { message: 'Invalid role. Allowed: ADMIN, OWNER, PLAYER' })
  role?: Role;
}
