import { Exclude, Expose } from 'class-transformer';

export class ResponseCourtDto {
  @Exclude()
  id!: string;

  @Expose()
  name!: string;

  @Expose()
  description!: string;

  @Expose()
  price!: number;

  @Expose()
  location!: string;

  @Expose()
  lat!: number;

  @Expose()
  lng!: number;

  @Expose()
  surface!: string;

  @Expose()
  isActive!: boolean;

  @Expose()
  ownerId!: string;
}
