import { Module } from "@nestjs/common";
import { BotService } from "./bot.service";
import { SequelizeModule } from "@nestjs/sequelize";
import { JobType } from "./models/JobType.model";
import { BotUpdate } from "./bot.update";
import { UstaService } from "./usta.service";
import { UstaUpdate } from "./usta.update";
import { User } from "./models/User.model";
import { WorkPlace } from "./models/workplace.model";
import { Customer } from "./models/customer.model";
import { CustomerService } from "./customer.service";
import { CustomerUpdate } from "./customer.update";
import { Time } from "./models/Time.model";

@Module({
  imports: [
    SequelizeModule.forFeature([User, JobType, WorkPlace, Customer, Time]),
  ],
  providers: [
    CustomerService,
    CustomerUpdate,
    UstaService,
    UstaUpdate,
    BotService,
    BotUpdate,
  ],
  exports: [BotService],
})
export class BotModule {}
