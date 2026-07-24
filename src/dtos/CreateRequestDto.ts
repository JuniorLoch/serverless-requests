import { IsString, IsNotEmpty, IsIn, MinLength } from 'class-validator';

export class CreateRequestDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  description!: string;

  @IsIn(['low', 'medium', 'high'])
  priority!: 'low' | 'medium' | 'high';

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  createdBy!: string;
}
