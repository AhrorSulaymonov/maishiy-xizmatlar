import {
  AutoIncrement,
  Column,
  DataType,
  Model,
  Table,
} from "sequelize-typescript";

interface IWorkPlaceCreationAttr {
  user_id: number | undefined;
  last_state: string | undefined;
}

@Table({ tableName: "work-place" })
export class WorkPlace extends Model<WorkPlace, IWorkPlaceCreationAttr> {
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
  address: string | undefined;

  @Column({
    type: DataType.STRING,
  })
  target: string | undefined;

  @Column({
    type: DataType.STRING,
  })
  location: string | undefined;

  @Column({
    type: DataType.STRING,
  })
  last_state: string | undefined;

  @Column({
    type: DataType.TIME, // Ish boshlash vaqti
  })
  start_time: string | undefined;

  @Column({
    type: DataType.TIME, // Ish tugash vaqti
  })
  end_time: string | undefined;

  @Column({
    type: DataType.INTEGER, // Har bir mijoz uchun o‘rtacha vaqt (daqiqa)
  })
  avg_time_per_customer: number | undefined;
}
