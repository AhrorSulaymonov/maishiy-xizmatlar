import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { JobType } from "./bot/models/JobType.model";

async function bootstrap() {
  try {
    const PORT = process.env.PORT ?? 3003;
    const app = await NestFactory.create(AppModule);
    await app.listen(PORT, () => {
      console.log(`server started at : http://localhost:${PORT}`);
    });
  } catch (error) {
    console.log(error);
  }
}
bootstrap();

