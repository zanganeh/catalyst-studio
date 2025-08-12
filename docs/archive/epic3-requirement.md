we need to support multiple websites. That means currently we see panel for one website. Now we need to support multiple websites. To achieve this we need a dasbhaodrd to show all websites like "C:\Users\Admin\Pictures\Screenshots\Screenshot 2025-08-12 094809.png" and then when user selects the app it goes into the current http://localhost:3001/studio (obisouly with some id so it loads details for that app). This way we can support multiple apps. So what needs to be done:
- new page to show list of apps
- we can read from localdb or such
- allow user to create new app or click on exisitng app that shows the studio
- in studio we pass id which allows to load details for that specific app