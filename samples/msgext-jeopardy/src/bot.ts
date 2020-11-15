// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ActivityHandler, MessageFactory, CardFactory } from 'botbuilder';
const card = require('../resources/InputFormCard.json');

export class JeopardyBot extends ActivityHandler {
    private jeoQuestion: string;
    private jeoAnswer: string;
    private retry: number;

    constructor() {
        super();

        this.jeoQuestion = '';
        this.retry = 0;
        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {
            //const replyText = `${context.activity.text}`;
            let message;
            if (!this.jeoQuestion) {
                const question = await this.fetchQuestion();
                this.jeoQuestion = question[0]["id"];
                this.jeoAnswer = question[0]["answer"];
                this.retry = 0;

                const inputCard = CardFactory.adaptiveCard({
                    "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                    "type": "AdaptiveCard",
                    "version": "1.0",
                    "body": [
                        {
                            "type": "TextBlock",
                            "text": question[0]["question"],
                            "wrap": true,
                            "id": question[0]["id"],
                            "answer": question[0]["answer"]
                        }
                    ],
                    "actions": []
                });

                message = MessageFactory.attachment(inputCard);
            }
            else {

                if (context.activity.text == this.jeoAnswer) {
                    //message = MessageFactory.text("You are correct");
                    /*const animationCard = CardFactory.animationCard(
                        'You are correct !',
                        [{ 
                            profile: "image/gif",
                            url: 'https://media.giphy.com/media/QBSi1K0yOp1WDGyUFZ/giphy.gif' 
                        }],
                        [],
                        {
                          //subtitle: `Answer: ${this.jeoAnswer}`
                        }
                      );

                    message = MessageFactory.attachment(animationCard);*/

                    const heroCard = CardFactory.heroCard(
                        'You are correct',
                        ['https://sec.ch9.ms/ch9/7ff5/e07cfef0-aa3b-40bb-9baa-7c9ef8ff7ff5/buildreactionbotframework_960.jpg'],
                        []
                   );
                    
                   message = MessageFactory.attachment(heroCard);
                    
                    this.resetGame();
                }

                else {
                    this.retry += 1;
                    if (this.retry > 2) {
                        message = MessageFactory.text(`The correct answer: ${this.jeoAnswer}`);
                        this.resetGame();
                    } else {
                        message = MessageFactory.text(`Try again`);
                    }
                }
            }
            await context.sendActivity(message);

            //await context.sendActivity(MessageFactory.text(replyText, replyText));
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            const welcomeText = 'Welcome to the quiz-bot';
            for (const member of membersAdded) {
                if (member.id !== context.activity.recipient.id) {
                    await context.sendActivity(MessageFactory.text(welcomeText, welcomeText));
                }
            }
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }


    private async fetchQuestion() {
        const response = await fetch('http://jservice.io/api/random');
        if (!response.ok) {
            const message = `An error has occured: ${response.status}`;
            throw new Error(message);
        }

        let question = await response.json();
        return question;
    }

    private resetGame(): void {
        this.retry = 0;
        this.jeoQuestion = '';
        this.jeoAnswer = '';
    }
}
