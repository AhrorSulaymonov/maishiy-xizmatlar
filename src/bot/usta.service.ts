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

@Injectable()
export class UstaService {
  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(WorkPlace) private readonly workPlaceModel: typeof WorkPlace,
    @InjectModel(JobType) private readonly jobTypeModel: typeof JobType,
    @InjectBot(BOT_NAME) private readonly bot: Telegraf<Context>
  ) {}

  async onCommandRegisterAsUsta(ctx: Context) {
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
          role: "usta",
        });
        user.status = true;
        await user.save();

        const jobTypes = await this.jobTypeModel.findAll();
        const buttons = jobTypes.map((job) => [
          Markup.button.callback(`${job.name}`, `jobtype_${job.id}`),
        ]);

        await ctx.reply("Iltimos, tegishli bo'limni tanlang", {
          parse_mode: "HTML",
          reply_markup: { inline_keyboard: buttons }, // ✅ To‘g‘ri format
        });
      } else if (!user.status) {
        user.status = true;
        await user.save();
        const jobTypes = await this.jobTypeModel.findAll();
        const buttons = jobTypes.map((job) => [
          Markup.button.callback(`${job.name}`, `jobtype_${job.id}`),
        ]);

        await ctx.reply("Iltimos, tegishli bo'limni tanlang", {
          parse_mode: "HTML",
          reply_markup: { inline_keyboard: buttons }, // ✅ To‘g‘ri format
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

  async onClickLocation(ctx: Context) {
    try {
      const contextAction = ctx.callbackQuery!["data"];
      const contextMessage = ctx.callbackQuery!["message"];
      console.log(contextMessage);

      const address_id = contextAction.split("_")[1];
      const address = await this.workPlaceModel.findByPk(address_id);
      await ctx.deleteMessage(contextMessage?.message_id);
      await ctx.deleteMessage(contextMessage?.message_id! - 1);
      // await ctx.deleteMessage(contextMessage?.message_id! - 2);
      // await ctx.deleteMessage(contextMessage?.message_id! - 3);
      //tekshir lokatsiyani
      await ctx.replyWithLocation(
        Number(address?.location?.split(",")[0]),
        Number(address?.location?.split(",")[1])
      );
    } catch (error) {
      console.log("onAddress err", error);
    }
  }

  async onClickDelete(ctx: Context) {
    try {
      const contextAction = ctx.callbackQuery!["data"];
      const address_id = contextAction.split("_")[1];
      const address = await this.workPlaceModel.destroy({
        where: { id: address_id },
      });
      //tekshir lokatsiyani
      await ctx.editMessageText("Address o'chirildi");
    } catch (error) {
      console.log("onAddress err", error);
    }
  }

  async onCommandSkipRegistrItem(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.userModel.findByPk(user_id);
      if (!user || !user.status) {
        await ctx.reply("Iltimos <b>Start</b> tugmasini bosing", {
          parse_mode: "HTML",
          ...Markup.keyboard(["/start"]).resize().oneTime(),
        });
      } else if (user.role == "usta") {
        const workPlace = await this.workPlaceModel.findOne({
          where: { user_id },
          order: [["id", "DESC"]],
        });
        if (workPlace && workPlace.last_state == "name") {
          workPlace.last_state = "address";
          await workPlace.save();
          await ctx.reply("Ustaxona manzilingizni kiriting", {
            parse_mode: "HTML",
            ...Markup.inlineKeyboard([
              [
                Markup.button.callback(
                  "O‘tkazib yuborish",
                  "skip_registr_item"
                ),
              ],
            ]),
          });
        } else if (workPlace && workPlace.last_state == "address") {
          workPlace.last_state = "target";
          await workPlace.save();
          await ctx.reply("Mo'ljalni kiriting", {
            parse_mode: "HTML",
            ...Markup.inlineKeyboard([
              [
                Markup.button.callback(
                  "O‘tkazib yuborish",
                  "skip_registr_item"
                ),
              ],
            ]),
          });
        } else if (workPlace && workPlace.last_state == "target") {
          workPlace.last_state = "location";
          await workPlace.save();
          await ctx.reply(`Ustaxona manzilining locatsiyasini yuboring`, {
            ...Markup.keyboard([
              [Markup.button.locationRequest("📍 Locatsiyani yuboring")],
            ])
              .resize()
              .oneTime(),
          });
        }
      }
    } catch (error) {
      console.log("onJobTypeSelect error:", error);
    }
  }
}
