## Instructions for running the Project

1. git clone the project to your local machine 
2. obtain a google maps key from the [google maps API](https://developers.google.com/maps/documentation/javascript/get-api-key)
3. cd into the project folder and in the terminal type ```export GOOGLE_MAPS_KEY=paste-your-API-key-here```
3. cd into the project folder and run ```npm install``` to install the required dependencies  
4. run ```grunt``` to create a version of the project where your API key is included in the html, this will create a build folder
5. cd into the build folder and start a python server by running ```python -m SimpleHTTPServer``` 
OR 
install the npm serve package by running ```npm install -g serve``` and then launch the server by running ```serve -p 8000``` (this starts the server on port 8000)
6. open chrome and navigate to ```localhost:8000``` or whichever port the server is running on to view the project 
