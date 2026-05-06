import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email format' })
  @Transform(({ value }) => value.toLowerCase().trim())
  email!: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'The password field only accepts text' })
  password!: string;
}
