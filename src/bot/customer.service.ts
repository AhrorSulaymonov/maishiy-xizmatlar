import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { CreateBotDto } from "./dto/create-bot.dto";
import { UpdateBotDto } from "./dto/update-bot.dto";
import { Context, Markup, Telegraf } from "telegraf";
import { InjectBot } from "nestjs-telegraf";
import { BOT_NAME } from "../app.constants";
import { JobType } from "./models/JobType.model";
import { User } from "./models/User.model";
import { WorkPlace } from "./models/workplace.model";
import { Customer } from "./models/customer.model";

@Injectable()
export class CustomerService {
  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(Customer) private readonly customerModel: typeof Customer,
    @InjectModel(JobType) private readonly jobTypeModel: typeof JobType,
    @InjectBot(BOT_NAME) private readonly bot: Telegraf<Context>
  ) {}

  async onCommandRegisterAsCustomer(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.userModel.findByPk(user_id);
      await ctx.answerCbQuery(); // ✅ Tugma bosilganda yuklanish indikatorini yopish
      if (!user) {
        const user = await this.userModel.create({
          user_id,
          username: ctx.from?.username,
          first_name: ctx.from?.first_name,
          last_name: ctx.from?.last_name,
          lang: ctx.from?.language_code,
          role: "mijoz",
        });
        user.status = true;
        await user.save();

        await this.customerModel.create({
          user_id,
          last_state: "name",
        });
        await ctx.reply(`ismingizni kiriting`, {
          parse_mode: "HTML",
          ...Markup.removeKeyboard(),
        });
      } else if (!user.status) {
        user.status = true;
        await user.save();
        await this.customerModel.create({
          user_id,
          last_state: "name",
        });

        await ctx.reply(`ismingizni kiriting`, {
          parse_mode: "HTML",
          ...Markup.removeKeyboard(),
        });
      } else {
        await this.bot.telegram.sendChatAction(user_id!, "record_video");
        await ctx.reply(
          `Ushbu bot Skidkachi foydalanuvchilarini faollashtirish uchun`,
          {
            parse_mode: "HTML",
            ...Markup.removeKeyboard(),
          }
        );
      }
    } catch (error) {
      console.log("onCommandRegisterAsUser error:", error);
    }
  }

  async onJobTypeSelect(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.userModel.findByPk(user_id);
      if (!user || !user.status) {
        await ctx.reply("Iltimos <b>Start</b> tugmasini bosing", {
          parse_mode: "HTML",
          ...Markup.keyboard(["/start"]).resize().oneTime(),
        });
      } else {
        if (!ctx.callbackQuery || !("data" in ctx.callbackQuery)) return; // ✅ Callbackni tekshirish

        const callbackData = ctx.callbackQuery.data; // ✅ Ma’lumotni olish
        const jobTypeId = callbackData.split("_")[1]; // ✅ ID ajratish
        user.jobtypeId = +jobTypeId;
        await user.save();

        await ctx.answerCbQuery(); // ✅ Tugma bosilganda yuklanish indikatorini yopish
        await ctx.reply(
          `Iltimos, <b>📞 Telefon raqamini yuborish</b> tugmasini bosing`,
          {
            parse_mode: "HTML",
            ...Markup.keyboard([
              [Markup.button.contactRequest("📞 Telefon raqamini yuborish")],
            ])
              .resize()
              .oneTime(),
          }
        );
      }
    } catch (error) {
      console.log("onJobTypeSelect error:", error);
    }
  }

  async onClickDelete(ctx: Context) {
    try {
      const contextAction = ctx.callbackQuery!["data"];
      const address_id = contextAction.split("_")[1];
      const address = await this.customerModel.destroy({
        where: { id: address_id },
      });
      //tekshir lokatsiyani
      await ctx.editMessageText("Address o'chirildi");
    } catch (error) {
      console.log("onAddress err", error);
    }
  }
}
