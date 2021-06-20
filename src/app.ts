import * as restify from "restify";
import * as path from "path";
import {config} from "dotenv";
import {BotFrameworkAdapter} from "botbuilder";
import {DinnerBot} from "./DinnerBot";

const NODE_ENV = process.env.NODE_ENV || "development";

switch (NODE_ENV) {
  case "development":
    console.log("Environment is 'development'");
    config({
      path: path.join(__dirname, "..", ".env.development"),
    });
    break;
  case "production":
    config({
      path: path.join(__dirname, "..", ".env.production"),
    });
    break;
  default:
    throw new Error(`'NODE_ENV' ${process.env.NODE_ENV} is not handled!`);
}

export const adapter = new BotFrameworkAdapter({
  appId: process.env.APP_ID,
  appPassword: process.env.APP_PASSWORD,
});

const bot = new DinnerBot();

const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
  console.log(`\n${server.name} listening to ${server.url}`);
});

server.use(require("restify-plugins").bodyParser());

server.get("/", (req, res, next) => {
  res.send("Hi, this is Brainy!");
  next();
});

server.post("/api/messages", async (req, res) => {
  await adapter.processActivity(req, res, async turnContext => {
    await bot.run(turnContext);
  });
});
