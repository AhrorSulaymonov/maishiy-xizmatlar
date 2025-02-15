import { Column, DataType, HasMany, Model, Table } from "sequelize-typescript";
import { User } from "./User.model";

interface IJobTypeCreationAttr {
  name: string | undefined;
}

@Table({ tableName: "job-type", timestamps: false })
export class JobType extends Model<JobType, IJobTypeCreationAttr> {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number | undefined;

  @Column({
    type: DataType.STRING,
  })
  name: string | undefined;

  @HasMany(() => User)
  users: User[];
}
