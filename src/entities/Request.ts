import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('requests')
export class Request {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('text')
  title!: string;

  @Column('text')
  description!: string;

  @Column('text')
  priority!: 'low' | 'medium' | 'high';

  @Column('text', { name: 'created_by' })
  createdBy!: string;

  @Column('text', { default: 'pending' })
  status!: 'pending' | 'in_progress' | 'completed';

  @Column('text', { name: 'created_at' })
  createdAt!: string;
}
