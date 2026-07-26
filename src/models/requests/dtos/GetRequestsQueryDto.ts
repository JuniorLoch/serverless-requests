import { IsString, IsOptional, IsIn } from 'class-validator';

export class GetRequestsQueryDto {
  @IsString()
  @IsOptional()
  createdBy?: string;

  @IsIn(['pending', 'in_progress', 'completed'])
  @IsOptional()
  status?: 'pending' | 'in_progress' | 'completed';
}
