import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from "sequelize-typescript";
import { User } from "./User.model";
import { WorkPlace } from "./workplace.model";
import { Customer } from "./customer.model";

interface ITimeCreationAttr {
  time: string | undefined;
  workPlaceId: number | undefined;
  day: Date | undefined;
}

@Table({ tableName: "time", timestamps: false })
export class Time extends Model<Time, ITimeCreationAttr> {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number | undefined;

  @Column({
    type: DataType.STRING,
  })
  time: string | undefined;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  is_free: boolean | undefined;

  @Column({
    type: DataType.DATE,
  })
  day: Date | undefined;

  @ForeignKey(() => WorkPlace)
  @Column({ type: DataType.INTEGER })
  workPlaceId: number;

  @BelongsTo(() => WorkPlace)
  workPlace: WorkPlace;

  @ForeignKey(() => Customer)
  @Column({ type: DataType.INTEGER })
  customerId: number;

  @BelongsTo(() => Customer)
  customer: Customer;
}
