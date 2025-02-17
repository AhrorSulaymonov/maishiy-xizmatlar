import { Context, Markup } from "telegraf";
import {
  Action,
  Command,
  Ctx,
  Hears,
  On,
  Start,
  Update,
} from "nestjs-telegraf";
import { callback } from "telegraf/typings/button";
import { inlineKeyboard } from "telegraf/typings/markup";
import { BotService } from "./bot.service";
import { UstaService } from "./usta.service";

@Update()
export class UstaUpdate {
  constructor(
    private readonly botService: BotService,
    private readonly ustaService: UstaService
  ) {}

  // @On("contact")
  // async onContact(@Ctx() ctx: Context) {
  //   await this.botService.onContact(ctx);
  // }
  @Action("role_usta")
  async onCommandRegisterAsUsta(ctx) {
    await this.ustaService.onCommandRegisterAsUsta(ctx);
  }

  @Action("skip_registr_item")
  async onCommandSkipRegistrItem(ctx) {
    await this.ustaService.onCommandSkipRegistrItem(ctx);
  }

  @Action(/loc_+\d+/)
  async onClickLocation(@Ctx() ctx: Context) {
    await this.ustaService.onClickLocation(ctx);
  }

  @Action(/deleteMasterForm_+\d+/)
  async onClickDeleteMasterForm(@Ctx() ctx: Context) {
    await this.ustaService.onClickDeleteMasterForm(ctx);
  }

  @Action(/confirmMasterForm_+\d+/)
  async onClickConfirmMasterForm(@Ctx() ctx: Context) {
    await this.ustaService.onClickConfirmMasterForm(ctx);
  }

  @Action(/checkAsMaster_+\d+/)
  async onClickCheckAsMaster(@Ctx() ctx: Context) {
    await this.ustaService.onClickCheckAsMaster(ctx);
  }

  @Action(/jobtype_\d+/)
  async onJobTypeSelect(@Ctx() ctx: Context) {
    await this.ustaService.onJobTypeSelect(ctx);
  }

  // @On("location")
  // async onLocation(@Ctx() ctx: Context) {
  //   await this.botService.onLocation(ctx);
  // }

  // @On("text")
  // async onText(@Ctx() ctx: Context) {
  //   console.log(ctx.from);
  //   await this.botService.onText(ctx);
  // }

  // @On("message")
  // async onMessage(@Ctx() ctx: Context) {
  //   await this.botService.deleteUnCoutchedMessage(ctx);
  //   console.log(ctx.botInfo);
  //   console.log(ctx.chat);
  //   console.log(ctx.from);
  //   console.log("tutilmay qolgan xabar");
  // }

  // @On("photo")
  // async onPhoto(@Ctx() ctx: Context) {
  //   if ("photo" in ctx.message!) {
  //     console.log(ctx.message!.photo);
  //     await ctx.replyWithPhoto(
  //       String(ctx.message.photo[ctx.message.photo.length - 1].file_id)
  //     );
  //   }
  // }

  // @On("video")
  // async onVideo(@Ctx() ctx: Context) {
  //   if ("video" in ctx.message!) {
  //     console.log(ctx.message!.video);
  //     await ctx.replyWithHTML(
  //       String(ctx.message.video[ctx.message.video.duration])
  //     );
  //   }
  // }

  // @On("sticker")
  // async onSticker(@Ctx() ctx: Context) {
  //   if ("sticker" in ctx.message!) {
  //     console.log(ctx.message!.sticker);
  //     await ctx.replyWithHTML(String(ctx.message.sticker.emoji));
  //     await ctx.replyWithHTML(String(ctx.message.sticker.premium_animation));
  //   }
  // }

  // @On("animation")
  // async onAnimation(@Ctx() ctx: Context) {
  //   if ("animation" in ctx.message!) {
  //     console.log(ctx.message!.animation);
  //     await ctx.replyWithHTML(String(ctx.message.animation));
  //     await ctx.replyWithHTML(String(ctx.message.animation.duration));
  //   }
  // }

  // @On("contact")
  // async onContact(@Ctx() ctx: Context) {
  //   if ("contact" in ctx.message!) {
  //     console.log(ctx.message!.contact);
  //     await ctx.replyWithHTML(String(ctx.message.contact.first_name));
  //     await ctx.replyWithHTML(String(ctx.message.contact.last_name));
  //     await ctx.replyWithHTML(String(ctx.message.contact.vcard));
  //   }
  // }

  // @On("location")
  // async onLocation(@Ctx() ctx: Context) {
  //   if ("location" in ctx.message!) {
  //     console.log(ctx.message!.location);
  //     await ctx.replyWithHTML(String(ctx.message.location.latitude));
  //     await ctx.replyWithHTML(String(ctx.message.location.longitude));
  //     await ctx.replyWithHTML(String(ctx.message.location.horizontal_accuracy));
  //   }
  // }

  // @On("voice")
  // async onVoice(@Ctx() ctx: Context) {
  //   if ("voice" in ctx.message!) {
  //     console.log(ctx.message!.voice);
  //     await ctx.replyWithHTML(String(ctx.message.voice.duration));
  //     await ctx.replyWithAudio(String(ctx.message.voice.file_id));
  //   }
  // }

  // @On("invoice")
  // async onInVoice(@Ctx() ctx: Context) {
  //   if ("invoice" in ctx.message!) {
  //     console.log(ctx.message!.invoice);
  //     await ctx.replyWithHTML(String(ctx.message.invoice));
  //   }
  // }

  // @On("document")
  // async onDocument(@Ctx() ctx: Context) {
  //   if ("document" in ctx.message!) {
  //     console.log(ctx.message!.document);
  //     await ctx.replyWithHTML(String(ctx.message.document.file_name));
  //   }
  // }

  // @Hears("hi")
  // async onHear(@Ctx() ctx: Context) {
  //   await ctx.replyWithHTML("salom");
  // }

  // @Command("help")
  // async onHelpCommand(@Ctx() ctx: Context) {
  //   await ctx.replyWithHTML("Kutib tur");
  // }

  // @Command("inline")
  // async onInlineCommand(@Ctx() ctx: Context) {
  //   const inlineCommand = [
  //     [
  //       {
  //         text: "Tugma 1",
  //         callback_data: "button_1",
  //       },
  //       {
  //         text: "Tugma 2",
  //         callback_data: "button_2",
  //       },
  //       {
  //         text: "Tugma 3",
  //         callback_data: "button_3",
  //       },
  //     ],
  //     [
  //       {
  //         text: "Tugma 4",
  //         callback_data: "button_4",
  //       },
  //       {
  //         text: "Tugma 5",
  //         callback_data: "button_5",
  //       },
  //     ],
  //     [
  //       {
  //         text: "Tugma 6",
  //         callback_data: "button_6",
  //       },
  //     ],
  //   ];
  //   await ctx.reply("Inline Keyboard: kerakli tugmani bosing", {
  //     reply_markup: {
  //       inline_keyboard: inlineCommand,
  //     },
  //   });
  // }

  // @Action("button_1")
  // async onButton1Action(@Ctx() ctx: Context) {
  //   await ctx.replyWithHTML("Button 1 bosildi");
  // }
  // @Action("button_2")
  // async onButton2Action(@Ctx() ctx: Context) {
  //   await ctx.replyWithHTML("Button 2 bosildi");
  // }

  // @Action(/^button_+[1-9]/)
  // async onButtonAction(@Ctx() ctx: Context) {
  //   const callbackData = ctx.callbackQuery?.["data"];
  //   const buttonId = callbackData.split("_")[1];
  //   if (callbackData) {
  //     await ctx.replyWithHTML(`<b>${buttonId} - button</b> bosildi`); // Bosilgan tugma ma'lumotini chiqarish
  //   }
  // }

  // @Command("main")
  // async onMainButton(@Ctx() ctx: Context) {
  //   await ctx.reply("Kerakli dorini tanlang:", {
  //     ...Markup.keyboard([
  //       [Markup.button.contactRequest("📞 Telefon raqamingizni yuboring")],
  //       [Markup.button.locationRequest("🕷️ Turgan manzilingizni yuboring")],
  //       ["dori1"],
  //       ["dori2", "dori3"],
  //       ["dori4", "dori5", "dori6"],
  //     ]),
  //   });
  // }

  // @Hears(/^dori+\d+$/)
  // async onButtonHear(@Ctx() ctx: Context) {
  //   if ("text" in ctx.message!) {
  //     const messageText = ctx.message.text;
  //     if (messageText) {
  //       const buttonId = messageText.split("dori")[1];
  //       await ctx.replyWithHTML(`<b>Dori ${buttonId}</b> bosildi`);
  //     }
  //   }
  // }

  // @On("text")
  // async onText(@Ctx() ctx: Context) {
  //   console.log(ctx.from);
  //   console.log(ctx.chat);
  //   if ("text" in ctx.message!) {
  //     if (ctx.message.text === "salom") {
  //       await ctx.replyWithHTML("<b>Vaalaykum assalom</b>");
  //     } else {
  //       await ctx.reply(ctx.message.text);
  //     }
  //   }
  // }

  // @On("message")
  // async onMessage(@Ctx() ctx: Context) {
  //   console.log(ctx.botInfo);
  // }
}
