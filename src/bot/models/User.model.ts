import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { JobType } from "./JobType.model";

interface IUserCreationAttr {
  user_id: number | undefined;
  username: string | undefined;
  first_name: string | undefined;
  last_name: string | undefined;
  lang: string | undefined;
  role: "usta" | "mijoz";
}

@Table({ tableName: "user" })
export class User extends Model<User, IUserCreationAttr> {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
  })
  user_id: number | undefined;

  @Column({
    type: DataType.STRING,
  })
  username: string | undefined;

  @Column({
    type: DataType.STRING,
  })
  name: string | undefined;

  @Column({
    type: DataType.STRING,
  })
  first_name: string | undefined;

  @Column({
    type: DataType.STRING,
  })
  last_name: string | undefined;

  @Column({
    type: DataType.STRING,
  })
  phone_number: string | undefined;

  @Column({
    type: DataType.STRING,
  })
  lang: string | undefined;

  @Column({
    type: DataType.ENUM("usta", "mijoz"),
    allowNull: false,
    defaultValue: "mijoz", // Agar foydalanuvchi rolini ko'rsatmasa, mijoz bo'ladi
  })
  role: "usta" | "mijoz";

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  status: boolean | undefined;

  @ForeignKey(() => JobType)
  @Column({ type: DataType.INTEGER })
  jobtypeId: number;

  @BelongsTo(() => JobType)
  jobType: JobType;
}
