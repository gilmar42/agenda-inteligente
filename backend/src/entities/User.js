import { EntitySchema } from 'typeorm'

export const User = new EntitySchema({
  name: 'User',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid'
    },
    name: {
      type: 'varchar',
      nullable: true
    },
    email: {
      type: 'varchar',
      unique: true,
      nullable: true
    },
    phone: {
      type: 'varchar',
      unique: true,
      nullable: true
    },
    passwordHash: {
      type: 'varchar'
    },
    plan: {
      type: 'varchar',
      default: 'free'
    },
    createdAt: {
      type: 'timestamp',
      createDate: true
    },
    updatedAt: {
      type: 'timestamp',
      updateDate: true
    }
  }
})
