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
export class AdminService {
  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(WorkPlace) private readonly workPlaceModel: typeof WorkPlace,
    @InjectModel(JobType) private readonly jobTypeModel: typeof JobType,
    @InjectBot(BOT_NAME) private readonly bot: Telegraf<Context>
  ) {}

  async onClickCheckAsMaster(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.userModel.findByPk(user_id);
      const contextAction = ctx.callbackQuery!["data"];
      const contextMessage = ctx.callbackQuery!["message"];
      console.log(contextMessage);

      const workPlace_id = contextAction.split("_")[1];
      const workPlace = await this.workPlaceModel.findByPk(workPlace_id);

      await ctx.deleteMessage(contextMessage?.message_id);
      if (workPlace!.is_approved) {
        await ctx.reply("Admin sizni qabul qildi", {
          parse_mode: "HTML",
          ...Markup.removeKeyboard(),
        });
      } else {
        await ctx.replyWithHTML(
          `<b>Uzr admin hali sizni qabul qilmadi</b>\n` +
            `<b>Admin ismi:</b> ${user!.name} \n` +
            `<b>Telefon raqami:</b> ${user!.phone_number} \n` +
            `<b>Adminxona nomi:</b> ${workPlace!.name || "none"} \n` +
            `<b>Manzili:</b> ${workPlace!.address || "none"} \n` +
            `<b>Mo'ljal:</b> ${workPlace!.target || "none"} \n` +
            `<b>Ish boshlanish vaqti:</b> ${workPlace!.start_time} \n` +
            `<b>Ish tugash vaqti:</b> ${workPlace!.end_time} \n` +
            `<b>Har bir mijoz uchun o'rtacha ketadigan vaqt:</b> ${workPlace!.avg_time_per_customer} \n`,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "Tekshirish",
                    callback_data: `checkAsMaster_${workPlace!.id}`,
                  },
                  {
                    text: "BEKOR QILISH ❌",
                    callback_data: `deleteMasterForm_${workPlace!.id}`,
                  },
                  {
                    text: "ADMIN BILAN BOG’LANISH ✅",
                    callback_data: `confirmMasterForm_${workPlace!.id}`,
                  },
                ],
              ],
            },
          }
        );
      }
    } catch (error) {
      console.log("onAddress err", error);
    }
  }

  async onClickConfirmMasterForm(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.userModel.findByPk(user_id);
      const contextAction = ctx.callbackQuery!["data"];
      const contextMessage = ctx.callbackQuery!["message"];
      console.log(contextMessage);

      const workPlace_id = contextAction.split("_")[1];
      const workPlace = await this.workPlaceModel.findByPk(workPlace_id);
      workPlace!.is_shared = true;
      workPlace!.save();
      await ctx.deleteMessage(contextMessage?.message_id);
      await ctx.replyWithHTML(
        `<b>Admin ismi:</b> ${user!.name} \n` +
          `<b>Telefon raqami:</b> ${user!.phone_number} \n` +
          `<b>Adminxona nomi:</b> ${workPlace!.name || "none"} \n` +
          `<b>Manzili:</b> ${workPlace!.address || "none"} \n` +
          `<b>Mo'ljal:</b> ${workPlace!.target || "none"} \n` +
          `<b>Ish boshlanish vaqti:</b> ${workPlace!.start_time} \n` +
          `<b>Ish tugash vaqti:</b> ${workPlace!.end_time} \n` +
          `<b>Har bir mijoz uchun o'rtacha ketadigan vaqt:</b> ${workPlace!.avg_time_per_customer} \n`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "Tekshirish",
                  callback_data: `checkAsMaster_${workPlace!.id}`,
                },
                {
                  text: "BEKOR QILISH ❌",
                  callback_data: `deleteMasterForm_${workPlace!.id}`,
                },
                {
                  text: "ADMIN BILAN BOG’LANISH ✅",
                  callback_data: `confirmMasterForm_${workPlace!.id}`,
                },
              ],
            ],
          },
        }
      );
    } catch (error) {
      console.log("onAddress err", error);
    }
  }

  async onClickJobType(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.userModel.findByPk(user_id);
      const contextAction = ctx.callbackQuery!["data"];
      const contextMessage = ctx.callbackQuery!["message"];

      const jobtype_id = contextAction.split("_")[1];
      const jobtype = await this.jobTypeModel.findByPk(jobtype_id);

      await ctx.replyWithHTML(
        `Siz <i>${jobtype?.name}</i> xizmatini tahrirlayapsiz, yangi nomini kiriting`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🗑 Xizmatni o‘chirish",
                  callback_data: `deleteJobtype_${jobtype?.id}`,
                },
              ],
            ],
          },
        }
      );

      jobtype!.last_state = "updateName";
      await jobtype!.save();
    } catch (error) {
      console.log("onCommandXizmatlar err", error);
    }
  }

  async onCommandDeleteJobtype(ctx: Context) {
    try {
      const jobTypes = await this.jobTypeModel.findAll();
      const buttons = jobTypes.map((job) => [
        Markup.button.callback(`${job.name}`, `jobtypeToAdmin_${job.id}`),
      ]);

      buttons.push([
        Markup.button.callback("Yangi Xizmat qo'shish", "addNewJobType"),
      ]);

      await ctx.reply("Xizmat turlarini tahrirlash uchun ustiga bosing", {
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: buttons }, // ✅ To‘g‘ri format
      });
    } catch (error) {
      console.log("onCommandXizmatlar err", error);
    }
  }

  async onClickDeleteJobtype(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.userModel.findByPk(user_id);
      const contextAction = ctx.callbackQuery!["data"];
      const contextMessage = ctx.callbackQuery!["message"];

      const jobtype_id = contextAction.split("_")[1];
      const jobtype = await this.jobTypeModel.destroy({
        where: { id: jobtype_id },
      });

      const jobTypes = await this.jobTypeModel.findAll();
      const buttons = jobTypes.map((job) => [
        Markup.button.callback(`${job.name}`, `jobtypeToAdmin_${job.id}`),
      ]);

      buttons.push([
        Markup.button.callback("Yangi Xizmat qo'shish", "addNewJobType"),
      ]);

      await ctx.reply("Xizmat turlarini tahrirlash uchun ustiga bosing", {
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: buttons }, // ✅ To‘g‘ri format
      });
    } catch (error) {
      console.log("onCommandXizmatlar err", error);
    }
  }

  async onCommandXizmatlar(ctx: Context) {
    try {
      const jobTypes = await this.jobTypeModel.findAll();
      const buttons = jobTypes.map((job) => [
        Markup.button.callback(`${job.name}`, `jobtypeToAdmin_${job.id}`),
      ]);

      buttons.push([
        Markup.button.callback("Yangi Xizmat qo'shish", "addNewJobType"),
      ]);

      await ctx.reply("Xizmat turlarini tahrirlash uchun ustiga bosing", {
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: buttons }, // ✅ To‘g‘ri format
      });
    } catch (error) {
      console.log("onCommandXizmatlar err", error);
    }
  }
}
