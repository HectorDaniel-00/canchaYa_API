import { Exclude, Expose } from 'class-transformer';

/**
 * ? Define la entidad utilizada para estructurar la respuesta del usuario
 * ? incluyendo únicamente los campos especificados (ej: id, name, email, etc.).
 */
export class ResponseUserDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  email: string;

  @Expose()
  phone: string;

  @Exclude()
  password: string;

  @Expose()
  role: string;

  @Expose()
  isActive: boolean;
}
