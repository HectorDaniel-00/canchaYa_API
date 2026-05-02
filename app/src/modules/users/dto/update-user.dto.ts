import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsString, IsEmail, IsEnum } from 'class-validator';
import { Role } from 'src/common/enums/role.enum';

/**
 * ?  Actualiza la información de un usuario existente, excluyendo el campo de la contraseña por seguridad.
 */
export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'The name field only accepts text' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'The phone number field only accepts text' })
  phone?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}

/**
 * ? Actualiza únicamente la contraseña del usuario, manejando este proceso de forma segura.
 */
export class UpdateUserPassword extends PartialType(CreateUserDto) {}
