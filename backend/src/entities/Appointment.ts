import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm'
import { User } from './User'

@Entity()
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => User, { nullable: false })
  professional: User

  @Column()
  clientName: string

  @Column({ nullable: true })
  clientPhone?: string

  @Column()
  service: string

  @Column()
  dateTime: Date

  @Column({ default: 'pending' })
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'

  @Column({ default: false })
  whatsappSent: boolean

  @Column({ default: false })
  pixPaid: boolean

  @CreateDateColumn()
  createdAt: Date
}
