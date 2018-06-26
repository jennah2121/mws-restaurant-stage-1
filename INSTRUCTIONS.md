## Instructions for running the Project

1.  git clone the project to your local machine
2.  cd into the project folder and run `npm install` to install the required dependencies
3.  run `grunt` to create the build (i.e. production) version of the project
4.  install the npm serve package by running `npm install -g serve` and cd into the build folder. Then launch the server by running `serve -p 8000` (this starts the server on port 8000, this is the **preferred method** for running the project)

    OR

    cd into the build folder and start a python server by running `python -m SimpleHTTPServer`

5)  open chrome and navigate to `localhost:8000` or whichever port the server is running on to view the project

#### Important

This project depends on a server from another repo. To use this project you will need to clone the server found [here](https://github.com/udacity/mws-restaurant-stage-2) and follow the set up instructions on that repo which are in sum:

1.  `npm i` to install the required dependencies
2.  `npm run start` - this loads the server which contains the data set for this project
