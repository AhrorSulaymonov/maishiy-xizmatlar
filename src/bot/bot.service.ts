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
import { AdminService } from "./admin.service";

@Injectable()
export class BotService {
  constructor(
    @InjectModel(JobType) private readonly jobTypeModel: typeof JobType,
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(WorkPlace) private readonly workPlaceModel: typeof WorkPlace,
    @InjectModel(Customer) private readonly customerModel: typeof Customer,
    @InjectBot(BOT_NAME) private readonly bot: Telegraf<Context>,
    private readonly adminService: AdminService
  ) {}
  async start(ctx: Context) {
    const user_id = ctx.from?.id;
    const user = await this.userModel.findByPk(user_id);
    if (!user) {
      await ctx.reply(
        `Iltimos, <b>😶‍🌫️ Botdan ro'yxatdan o'tish</b> tugmasini bosing`,
        {
          parse_mode: "HTML",
          ...Markup.keyboard(["😶‍🌫️ Botdan ro'yxatdan o'tish"])
            .resize()
            .oneTime(),
        }
      );
    } else if (!user?.status) {
      await ctx.reply(
        `Iltimos, <b>😶‍🌫️ Botdan ro'yxatdan o'tish</b> tugmasini bosing`,
        {
          parse_mode: "HTML",
          ...Markup.keyboard(["😶‍🌫️ Botdan ro'yxatdan o'tish"])
            .resize()
            .oneTime(),
        }
      );
    } else {
      await this.bot.telegram.sendChatAction(user_id!, "record_video");
      await ctx.reply(`Ushbu bot maishiy xizmatlar uchun`, {
        parse_mode: "HTML",
        ...Markup.removeKeyboard(),
      });
    }
  }

  async onCommandRegister(ctx: Context) {
    try {
      await ctx.reply("Roleni tanlang", {
        parse_mode: "HTML",
        reply_markup: Markup.inlineKeyboard([
          [
            Markup.button.callback("Usta", "role_usta"),
            Markup.button.callback("Mijoz", "role_mijoz"),
          ],
        ]).reply_markup, // ✅ `reply_markup` ni to‘g‘ri chaqiramiz
      });
    } catch (error) {
      console.log("onCommandRegister error:", error);
    }
  }

  async onStop(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.userModel.findByPk(user_id);
      if (user && user.status) {
        user.status = false;
        user.phone_number = "";
        await user.save();
        if (user.role == "mijoz") {
          await this.customerModel.destroy({ where: { user_id } });
        } else if (user.role == "usta") {
          await this.workPlaceModel.destroy({ where: { user_id } });
        }
        await ctx.reply(`Sizni yana kutib qolamiz`, {
          parse_mode: "HTML",
          ...Markup.removeKeyboard(),
        });
      }
    } catch (error) {
      console.log("OnStop error:", error);
    }
  }

  async onContact(ctx: Context) {
    if ("contact" in ctx.message!) {
      const user_id = ctx.from?.id;
      const user = await this.userModel.findByPk(user_id);
      if (!user) {
        await ctx.reply("Iltimos <b>Start</b> tugmasini bosing", {
          parse_mode: "HTML",
          ...Markup.keyboard(["/start"]).resize().oneTime(),
        });
      } else if (ctx.message?.contact.user_id != user_id) {
        await ctx.reply(
          `Iltimos, <b>📞  o'zingizning telefon raqamingizni yuborish</b> tugmasini bosing`,
          {
            parse_mode: "HTML",
            ...Markup.keyboard([
              [Markup.button.contactRequest("📞 Telefon raqamini yuborish")],
            ])
              .resize()
              .oneTime(),
          }
        );
      } else {
        let phone = ctx.message.contact.phone_number;
        if (phone[0] != "+") {
          phone = "+" + phone;
        }
        user.phone_number = phone;
        user.status = true;
        await user.save();
        if (user.role == "usta") {
          await this.workPlaceModel.create({
            user_id,
            last_state: "usta_name",
          });
          await ctx.reply(`ismingizni kiriting`, {
            parse_mode: "HTML",
            ...Markup.removeKeyboard(),
          });
        } else if ((user.role = "mijoz")) {
          const customer = await this.customerModel.findOne({
            where: { user_id },
            order: [["id", "DESC"]],
          });
          if (customer) {
            customer.phone_number = phone;
            customer.last_state = "finish";
            await customer.save();
            await ctx.replyWithHTML(
              `<b>Ism:</b> ${customer.name} \n` +
                `<b>Telefon raqami:</b> ${customer.phone_number} \n`,
              {
                ...Markup.removeKeyboard(),
              }
            );
          }
        }
      }
    }
  }

  async onLocation(ctx: Context) {
    try {
      if ("location" in ctx.message!) {
        const user_id = ctx.from?.id;
        const user = await this.userModel.findByPk(user_id);

        if (!user || !user.status) {
          await ctx.reply(`Siz avval ro'yxatdan o'ting`, {
            parse_mode: "HTML",
            ...Markup.keyboard(["/start"]).resize(),
          });
        } else {
          const workPlace = await this.workPlaceModel.findOne({
            where: { user_id },
            order: [["id", "DESC"]],
          });

          if (user.role == "usta") {
            if (workPlace && workPlace.last_state == "location") {
              workPlace.location = `${ctx.message.location.latitude},${ctx.message.location.longitude}`;
              workPlace.last_state = `start_time`;
              await workPlace.save();

              // Asosiy klaviaturani olib tashlash
              await ctx.reply("Iltimos, ish boshlash vaqtini tanlang", {
                ...Markup.removeKeyboard(),
              });

              // Inline buttonlar uchun vaqt oralig‘i
              const times = [
                "6:00",
                "6:30",
                "7:00",
                "7:30",
                "8:00",
                "8:30",
                "9:00",
              ];

              // Har bir qatorda 2 ta bo‘lishi uchun massivni shakllantirish
              const buttons = times.map((time) =>
                Markup.button.callback(time, `setTime_${time}`)
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
              await ctx.reply("Ish boshlash vaqtingizni kiriting", keyboard);
            }
          }
        }
      }
    } catch (error) {
      console.log("onLocation error:", error);
    }
  }

  async admin_menu(ctx: Context, menu_text = `<b>Admin menyusi</b>`) {
    try {
      await ctx.reply(menu_text, {
        parse_mode: "HTML",
        ...Markup.keyboard([["Xizmatlar", "Ustalar", "Mijozlar"]])
          .oneTime()
          .resize(),
      });
    } catch (error) {
      console.log("Admin menyusida xatolik", error);
    }
  }

  async onText(ctx: Context) {
    try {
      if ("text" in ctx.message!) {
        const user_id = ctx.from?.id;
        const user = await this.userModel.findByPk(user_id);
        console.log("user_id", user_id, 5748326711, 5748326711 == user_id);

        const salom = "salom";
        if (user_id === 5748326711) {
          const jobtype = await this.jobTypeModel.findOne({
            where: { last_state: "updateName" },
            order: [["id", "DESC"]],
          });
          if (jobtype) {
            jobtype.name = ctx.message.text;
            jobtype.last_state = "finish";
            await jobtype.save();
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
          }
        } else if (!user || !user.status) {
          await ctx.reply(`Siz avval ro'yxatdan o'ting`, {
            parse_mode: "HTML",
            ...Markup.keyboard(["/start"]).resize(),
          });
        } else if (user_id == 14518578925) {
        } else if (user.role == "usta") {
          const workPlace = await this.workPlaceModel.findOne({
            where: { user_id },
            order: [["id", "DESC"]],
          });

          if (workPlace && workPlace.last_state !== "finish") {
            // usta_name
            if (workPlace.last_state == "usta_name") {
              console.log("user.name:", ctx.message.text);

              user.name = ctx.message.text;
              workPlace.last_state = "name";
              await workPlace.save();
              await user.save();
              await ctx.reply("Ustaxona nomini kiriting", {
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
            } else if (workPlace.last_state == "name") {
              workPlace.name = ctx.message.text;
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
            } else if (workPlace.last_state == "address") {
              workPlace.address = ctx.message.text;
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
            } else if (workPlace.last_state == "target") {
              workPlace.target = ctx.message.text;
              workPlace.last_state = "location";
              await workPlace.save();
              await ctx.reply(`Manzilingizni locatsiyasini yuboring`, {
                ...Markup.keyboard([
                  [Markup.button.locationRequest("📍 Locatsiyani yuboring")],
                ])
                  .resize()
                  .oneTime(),
              });
            } else if (workPlace.last_state == "end_time") {
              workPlace.end_time = ctx.message.text;
              workPlace.last_state = "avg_time_per_customer";
              await workPlace.save();
              await ctx.reply(
                "har bir odamga o'rtacha necha minut sarflashizni kiriting",
                {
                  parse_mode: "HTML",
                  ...Markup.removeKeyboard(),
                }
              );
            } else if (workPlace.last_state == "avg_time_per_customer") {
              workPlace.avg_time_per_customer = +ctx.message.text;
              workPlace.last_state = "finish";
              await workPlace.save();
              await ctx.replyWithHTML(
                `<b>Usta ismi:</b> ${user.name} \n` +
                  `<b>Telefon raqami:</b> ${user.phone_number} \n` +
                  `<b>Ustaxona nomi:</b> ${workPlace.name || "none"} \n` +
                  `<b>Manzili:</b> ${workPlace.address || "none"} \n` +
                  `<b>Mo'ljal:</b> ${workPlace.target || "none"} \n` +
                  `<b>Ish boshlanish vaqti:</b> ${workPlace.start_time} \n` +
                  `<b>Ish tugash vaqti:</b> ${workPlace.end_time} \n` +
                  `<b>Har bir mijoz uchun o'rtacha ketadigan vaqt:</b> ${workPlace.avg_time_per_customer} \n`,
                {
                  reply_markup: {
                    inline_keyboard: [
                      [
                        {
                          text: "Lokatsiyani ko'rish 📍",
                          callback_data: `loc_${workPlace.id}`,
                        },
                        {
                          text: "BEKOR QILISH ❌",
                          callback_data: `deleteMasterForm_${workPlace.id}`,
                        },
                        {
                          text: "Tasdiqlash ✅",
                          callback_data: `confirmMasterForm_${workPlace.id}`,
                        },
                      ],
                    ],
                  },
                }
              );
            }
          } else if (workPlace && workPlace.last_state == "finish") {
          }
        } else if (user.role == "mijoz") {
          const customer = await this.customerModel.findOne({
            where: { user_id },
            order: [["id", "DESC"]],
          });

          const workPlace = await this.workPlaceModel.findOne({
            where: { user_id },
            order: [["id", "DESC"]],
          });

          if (customer && customer.last_state !== "finish") {
            // usta_name
            if (customer.last_state == "name") {
              user.name = ctx.message.text;
              customer.name = ctx.message.text;
              customer.last_state = "phone_number";
              await customer.save();
              await user.save();
              await ctx.reply(
                `Iltimos, <b>📞 Telefon raqamini yuborish</b> tugmasini bosing`,
                {
                  parse_mode: "HTML",
                  ...Markup.keyboard([
                    [
                      Markup.button.contactRequest(
                        "📞 Telefon raqamini yuborish"
                      ),
                    ],
                  ])
                    .resize()
                    .oneTime(),
                }
              );
            }
          }
        }
      }
    } catch (error) {
      console.log("OnStop error:", error);
    }
  }
}
