this is epic 4, we need to look at migrating from browser local storage to server side storage like some simple sql database. This require to:
- investigate all usage of local storage or any browser db storage and identify them
- them for each module create separate story (E.g. contnet types, content items, ...) and migrate them
- make sure to implement proper server side api to read data and expose the data to client and allow to update as well (full CRUD method)
- need to investigate to find best way to write data easily and modern mechanism for data managemement (e.g. good ORM that support CRUD in easy way), so we avoid implement lots of API's - you can consunlt with zen on any of these items
- we don't need to worry about security, rate calls, performance at this stage