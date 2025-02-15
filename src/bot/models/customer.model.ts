import {
  AutoIncrement,
  Column,
  DataType,
  Model,
  Table,
} from "sequelize-typescript";

interface ICustomerCreationAttr {
  user_id: number | undefined;
  last_state: string | undefined;
}

@Table({ tableName: "customer" })
export class Customer extends Model<Customer, ICustomerCreationAttr> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number | undefined;

  @Column({
    type: DataType.BIGINT,
  })
  user_id: number | undefined;

  @Column({
    type: DataType.STRING,
  })
  phone_number: string | undefined;

  @Column({
    type: DataType.STRING,
  })
  name: string | undefined;

  @Column({
    type: DataType.STRING,
  })
  last_state: string | undefined;
}
