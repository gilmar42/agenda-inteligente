import { EntitySchema } from 'typeorm'

export const FeeLedger = new EntitySchema({
  name: 'FeeLedger',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid'
    },
    appointmentId: {
      type: 'uuid',
      nullable: false
    },
    userId: {
      type: 'uuid',
      nullable: false
    },
    feeAmount: {
      type: 'decimal',
      precision: 10,
      scale: 2,
      default: 0
    },
    status: {
      type: 'varchar',
      default: 'pending' // 'pending' | 'charged' | 'failed'
    },
    createdAt: {
      type: 'timestamp',
      createDate: true
    },
    paidAt: {
      type: 'timestamp',
      nullable: true
    }
  }
})
