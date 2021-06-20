import {CardFactory, TeamsActivityHandler, TurnContext} from "botbuilder";
import {
  AdaptiveCardInvokeResponse,
  AdaptiveCardInvokeValue,
} from "botframework-schema";
import * as lunchCardJson from "./cards/LunchOptions.json"; // All cards are JSON, no strict typing and it is difficult to implement functions
import * as reviewOrderJson from "./cards/ReviewOrder.json";
import * as confirmationJson from "./cards/Confirmation.json";
import * as ACData from "adaptivecards-templating";
import cloneDeep from "lodash.clonedeep";
const reviewOrderCard = new ACData.Template(reviewOrderJson);
const confirmationCard = new ACData.Template(confirmationJson);
const vegan = "c2bd77d0-33d2-40cf-8fc4-d434996d8b83";
export class DinnerBot extends TeamsActivityHandler {
  constructor() {
    super();

    this.onMessage(async (context, next) => {
      const card = cloneDeep(lunchCardJson);
      if (context.activity.from.aadObjectId === vegan) {
        card.body[2]!.actions!.splice(0, 2);
      }

      await context.sendActivity({
        attachments: [CardFactory.adaptiveCard(card)],
      });
    });
  }

  async onAdaptiveCardInvoke(
    context: TurnContext,
    invokeValue: AdaptiveCardInvokeValue
  ): Promise<AdaptiveCardInvokeResponse> {
    console.log(invokeValue);
    switch (invokeValue.action.data.nextCardToSend) {
      case 0: {
        const card = cloneDeep(lunchCardJson);
        if (context.activity.from.aadObjectId === vegan) {
          card.body[2]!.actions!.splice(0, 2);
        }
        return createInvokeResponse(card);
      }
      case 1:
        return createInvokeResponse(
          reviewOrderCard.expand({
            $root: {
              lunch: invokeValue.action.data.option,
            },
          })
        );
      case 2:
        return createInvokeResponse(
          confirmationCard.expand({
            $root: {
              lunch: invokeValue.action.data.option,
              name: context.activity.from.name,
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
