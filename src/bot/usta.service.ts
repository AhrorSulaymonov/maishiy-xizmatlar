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
        user.role = "usta";
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

  async onClickSetTime(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.userModel.findByPk(user_id);
      const contextAction = ctx.callbackQuery!["data"]; // callback_data ni olish
      const selectedTime = contextAction.split("_")[1]; // "setTime_6:00" → ["set", "time", "6:00"]

      const workPlace = await this.workPlaceModel.findOne({
        where: { user_id },
        order: [["id", "DESC"]],
      });

      if (!selectedTime) {
        await ctx.reply("Xatolik: Vaqt tanlanmadi ❌");
        return;
      }

      workPlace!.start_time = selectedTime;
      workPlace!.last_state = `end_time`;
      workPlace?.save();

      const times = [
        "16:00",
        "16:30",
        "17:00",
        "17:30",
        "18:00",
        "18:30",
        "19:00",
        "19:30",
        "20:00",
      ];

      // Har bir qatorda 2 ta bo‘lishi uchun massivni shakllantirish
      const buttons = times.map((time) =>
        Markup.button.callback(time, `endTime_${time}`)
      );

      // Har bir qatorda ikkita bo‘lishi uchun tugmalarni guruhlash
      const keyboard = Markup.inlineKeyboard(
        buttons.reduce((rows, button, index) => {
          if (index % 2 === 0) rows.push([button]);
          else rows[rows.length - 1].push(button);
          return rows;
        }, [] as any[])
      );

      // Inline buttonlari bilan xabar yuborish
      await ctx.reply("Ish tugatish vaqtingizni kiriting", keyboard);
    } catch (error) {
      console.log("onClickSetTime err", error);
    }
  }

  async onClickEndTime(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.userModel.findByPk(user_id);
      const contextAction = ctx.callbackQuery!["data"]; // callback_data ni olish
      const selectedTime = contextAction.split("_")[1]; // "endTime_16:00" → ["set", "time", "6:00"]

      const workPlace = await this.workPlaceModel.findOne({
        where: { user_id },
        order: [["id", "DESC"]],
      });

      if (!selectedTime) {
        await ctx.reply("Xatolik: Vaqt tanlanmadi ❌");
        return;
      }

      workPlace!.end_time = selectedTime;
      workPlace!.last_state = `avg_time_per_customer`;
      workPlace?.save();

      const times = ["15", "20", "30", "45", "60", "90"];

      // Har bir qatorda 2 ta bo‘lishi uchun massivni shakllantirish
      const buttons = times.map((time) =>
        Markup.button.callback(time, `avgTimePerCustomer_${time}`)
      );

      // Har bir qatorda ikkita bo‘lishi uchun tugmalarni guruhlash
      const keyboard = Markup.inlineKeyboard(
        buttons.reduce((rows, button, index) => {
          if (index % 2 === 0) rows.push([button]);
          else rows[rows.length - 1].push(button);
          return rows;
        }, [] as any[])
      );

      // Inline buttonlari bilan xabar yuborish
      await ctx.reply(
        "har bir odamga o'rtacha necha minut sarflashizni kiriting",
        keyboard
      );
    } catch (error) {
      console.log("onClickEndTime err", error);
    }
  }

  async onClickAvgTimePerCustomer(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.userModel.findByPk(user_id);
      const contextAction = ctx.callbackQuery!["data"]; // callback_data ni olish
      const selectedTime = contextAction.split("_")[1]; // "endTime_16:00" → ["set", "time", "6:00"]

      const workPlace = await this.workPlaceModel.findOne({
        where: { user_id },
        order: [["id", "DESC"]],
      });

      if (!selectedTime) {
        await ctx.reply("Xatolik: Vaqt tanlanmadi ❌");
        return;
      }

      workPlace!.avg_time_per_customer = selectedTime;
      workPlace!.last_state = `finish`;
      workPlace?.save();

      await ctx.replyWithHTML(
        `<b>Usta ismi:</b> ${user!.name} \n` +
          `<b>Telefon raqami:</b> ${user!.phone_number} \n` +
          `<b>Ustaxona nomi:</b> ${workPlace!.name || "none"} \n` +
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
                  text: "Lokatsiyani ko'rish 📍",
                  callback_data: `loc_${workPlace!.id}`,
                },
                {
                  text: "BEKOR QILISH ❌",
                  callback_data: `deleteMasterForm_${workPlace!.id}`,
                },
                {
                  text: "Tasdiqlash ✅",
                  callback_data: `confirmMasterForm_${workPlace!.id}`,
                },
              ],
            ],
          },
        }
      );
    } catch (error) {
      console.log("onClickEndTime err", error);
    }
  }

  async onClickDeleteMasterForm(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.userModel.findByPk(user_id);
      const contextAction = ctx.callbackQuery!["data"];
      const contextMessage = ctx.callbackQuery!["message"];
      console.log(contextMessage);

      const workPlace_id = contextAction.split("_")[1];
      const workPlace = await this.workPlaceModel.destroy({
        where: { id: workPlace_id },
      });
      user!.phone_number = "";
      user!.status = false;
      await user!.save();

      await ctx.deleteMessage(contextMessage?.message_id);
      await ctx.reply("Iltimos <b>Start</b> tugmasini bosing", {
        parse_mode: "HTML",
        ...Markup.keyboard(["/start"]).resize().oneTime(),
      });
    } catch (error) {
      console.log("onAddress err", error);
    }
  }

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
            `<b>Usta ismi:</b> ${user!.name} \n` +
            `<b>Telefon raqami:</b> ${user!.phone_number} \n` +
            `<b>Ustaxona nomi:</b> ${workPlace!.name || "none"} \n` +
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
        `<b>Usta ismi:</b> ${user!.name} \n` +
          `<b>Telefon raqami:</b> ${user!.phone_number} \n` +
          `<b>Ustaxona nomi:</b> ${workPlace!.name || "none"} \n` +
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
