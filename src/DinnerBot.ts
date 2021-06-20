import {CardFactory, TeamsActivityHandler, TurnContext} from "botbuilder";
import {
  AdaptiveCardInvokeResponse,
  AdaptiveCardInvokeValue,
} from "botframework-schema";
import * as lunchCardJsonUniversal from "./cards/universal/LunchOptions.json"; // All cards are JSON, no strict typing and it is difficult to implement functions
import * as reviewOrderJsonUniversal from "./cards/universal/ReviewOrder.json";
import * as confirmationJsonUniversal from "./cards/universal/Confirmation.json";
import * as lunchCardJsonOld from "./cards/old/LunchOptions.json";
import * as reviewOrderJsonOld from "./cards/old/ReviewOrder.json";
import * as confirmationJsonOld from "./cards/old/Confirmation.json";
import * as introJsonOld from "./cards/old/Intro.json";
import * as introJsonUniversal from "./cards/universal/Intro.json";
import * as ACData from "adaptivecards-templating";
import cloneDeep from "lodash.clonedeep";
const reviewOrderCardUniversal = new ACData.Template(reviewOrderJsonUniversal);
const reviewOrderCardOld = new ACData.Template(reviewOrderJsonOld);
const confirmationCardUniversal = new ACData.Template(
  confirmationJsonUniversal
);
const confirmationCardOld = new ACData.Template(confirmationJsonOld);
const useUniversalModel = false;
const vegan = "c2bd77d0-33d2-40cf-8fc4-d434996d8b83";

export class DinnerBot extends TeamsActivityHandler {
  constructor() {
    super();

    this.onMessage(async (context, next) => {
      console.log(context.activity);
      if (useUniversalModel) {
        await context.sendActivity({
          attachments: [CardFactory.adaptiveCard(introJsonUniversal)],
        });

        return;
      }

      const activityValue = context.activity.value;
      switch (activityValue?.nextCardToSend) {
        case 1: {
          const card = cloneDeep(lunchCardJsonOld);
          if (context.activity.from.aadObjectId === vegan) {
            card.body[2]!.actions!.splice(0, 2);
          }
          await context.updateActivity({
            attachments: [CardFactory.adaptiveCard(card)],
            id: context.activity.replyToId,
            type: "message",
          });
          return;
        }
        case 2:
          await context.updateActivity({
            attachments: [
              CardFactory.adaptiveCard(
                reviewOrderCardOld.expand({
                  $root: {
                    lunch: activityValue.option,
                  },
                })
              ),
            ],
            id: context.activity.replyToId,
            type: "message",
          });
          return;
        case 3:
          await context.updateActivity({
            attachments: [
              CardFactory.adaptiveCard(
                confirmationCardOld.expand({
                  $root: {
                    lunch: activityValue.option,
                    name: context.activity.from.name,
                    status: "Cooking",
                  },
                })
              ),
            ],
            id: context.activity.replyToId,
            type: "message",
          });
          return;
      }

      await context.sendActivity({
        attachments: [CardFactory.adaptiveCard(introJsonOld)],
      });
      return;
    });
  }

  async onAdaptiveCardInvoke(
    context: TurnContext,
    invokeValue: AdaptiveCardInvokeValue
  ): Promise<AdaptiveCardInvokeResponse> {
    console.log(invokeValue);
    switch (invokeValue.action.data.nextCardToSend) {
      case 0:
        return createInvokeResponse(introJsonUniversal);
      case 1: {
        const card = cloneDeep(lunchCardJsonUniversal);
        if (context.activity.from.aadObjectId === vegan) {
          card.body[2]!.actions!.splice(0, 2);
        }
        return createInvokeResponse(card);
      }
      case 2:
        return createInvokeResponse(
          reviewOrderCardUniversal.expand({
            $root: {
              lunch: invokeValue.action.data.option,
            },
          })
        );
      case 3:
        if (invokeValue.action.data.refresh) {
          return createInvokeResponse(
            confirmationCardUniversal.expand({
              $root: {
                lunch: invokeValue.action.data.option,
                name: context.activity.from.name,
                status: "Ready for pickup",
              },
            })
          );
        }
        return createInvokeResponse(
          confirmationCardUniversal.expand({
            $root: {
              lunch: invokeValue.action.data.option,
              name: context.activity.from.name,
              status: "Cooking",
            },
          })
        );
    }

    function createInvokeResponse(adaptiveCard: any) {
      return {
        statusCode: 200,
        type: "application/vnd.microsoft.card.adaptive",
        value: {
          statusCode: 200,
          type: "application/vnd.microsoft.card.adaptive",
          value: adaptiveCard,
        },
      };
    }

    return {statusCode: 500, type: "", value: {message: "unrecognized"}};
  }
}
