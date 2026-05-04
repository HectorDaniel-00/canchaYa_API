import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class UpdateUserPasswordDto {
  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'The password field only accepts text' })
  @Matches(/^(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'La contraseña debe tener al menos una mayúscula y un número',
  })
  password: string;
}
