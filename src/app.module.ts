import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { BotModule } from "./bot/bot.module";
import { TelegrafModule } from "nestjs-telegraf";
import { BOT_NAME } from "./app.constants";
import { ConfigModule } from "@nestjs/config";
import { SequelizeModule } from "@nestjs/sequelize";
import { JobType } from "./bot/models/JobType.model";
import { User } from "./bot/models/User.model";
import { WorkPlace } from "./bot/models/workplace.model";
import { Customer } from "./bot/models/customer.model";

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      botName: BOT_NAME,
      useFactory: () => ({
        token: process.env.BOT_TOKEN || "12345",
        middlewares: [],
        include: [BotModule],
      }),
    }),
    ConfigModule.forRoot({ envFilePath: ".env", isGlobal: true }),
    SequelizeModule.forRoot({
      dialect: `postgres`,
      host: process.env.POSTGRES_HOST,
      username: process.env.POSTGRES_USER,
      port: Number(process.env.POSTGRES_PORT),
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      models: [User, JobType, WorkPlace, Customer],
      autoLoadModels: true,
      sync: { alter: true },
      logging: false,
    }),
    BotModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
