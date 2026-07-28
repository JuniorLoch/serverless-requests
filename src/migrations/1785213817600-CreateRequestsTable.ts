import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateRequestsTable1785213817600 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'requests',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'title',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'priority',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'created_by',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'text',
            default: "'pending'",
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'text',
            isNullable: false,
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('requests');
  }
}
