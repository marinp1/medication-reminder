# Medication reminder

Just a small utility to remind me to take my medication twice a day as I seem to always forget.

```
Q: Why not just a calendar reminder?
A: Good question

Q: Why BPMN and not just an app?
A: More fun this way
```

## How it works?
This is overly complex way to do this, but the process is two-fold: Camunda handles most of the business logic, and a Telegram bot handles interaction between me and the app.

[NeDB](https://github.com/louischatriot/nedb/) is used because lightweight db is plenty enough.

![Business process diagram](./resources/process-diagram.png?raw=true "Business process diagram")

### Process
1. Twice a day (7.30 & 19.30) the process starts.
2. Telegram bot sends me an message asking if I've taken my medication. 
3. If nothing is done, after 8 hours the process is saved as **NO** to the database (medication skipped) and the process quits.
4. If **YES / NO** are pressed, the response is saved to database and the process quits.
5. If **WAIT** is pressed, the process waits 30 minutes before reminding again. If during this time either **YES** or **NO** are pressed again, the response is saved and the process quits.

If exceptions occur, those are gracefully handled and logged to app logs.

![Telegram reminder](./resources/telegram-message.png?raw=true "Telegram reminder")

## Deployment
Both Camunda and Telegram bot run locally on my Raspberry Pi.

See `scripts` folder for deployment and update scripts used to simplify deployment.

## Todo
* Remove useless inline keyboard buttons after message has been answered
* Create deployment scripts / watch for GitHub releases for updates + autoupdate
* Dashboard view for the app to read database
* Telegram commands for simple metrics
  
