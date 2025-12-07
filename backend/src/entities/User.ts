import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ nullable: true })
  name?: string

  @Column({ unique: true, nullable: true })
  email?: string

  @Column({ unique: true, nullable: true })
  phone?: string

  @Column()
  password: string

  @Column({ default: 'free' })
  plan: 'free' | 'essencial' | 'premium'

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
