import { EntitySchema } from 'typeorm'

export const Appointment = new EntitySchema({
  name: 'Appointment',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid'
    },
    clientName: {
      type: 'varchar'
    },
    clientPhone: {
      type: 'varchar',
      nullable: true
    },
    service: {
      type: 'varchar'
    },
    dateTime: {
      type: 'timestamp'
    },
    status: {
      type: 'varchar',
      default: 'pending'
    },
    whatsappSent: {
      type: 'boolean',
      default: false
    },
    pixPaid: {
      type: 'boolean',
      default: false
    },
    createdAt: {
      type: 'timestamp',
      createDate: true
    }
  },
  relations: {
    professional: {
      type: 'many-to-one',
      target: 'User',
      nullable: false
    }
  }
})
