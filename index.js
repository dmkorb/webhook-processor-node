const express = require('express');
const bodyParser = require('body-parser')
const port = process.env.PORT || '7000';
const { v4: uuidv4 } = require('uuid');
const axios = require("axios");
const app = express();
const util = require('util')

/*
 * I'm considering we'll have a database with user IDs, and one destination endpoint
 * for every kind of message/notification - i.e: message, warning, new-subscription, etc.
 */
const db = [
	{ user_id: "1", type: "message", endpoint: "https://postman-echo.com/post?type=message&user_id=1" },
	{ user_id: "1", type: "warning", endpoint: "https://postman-echo.com/post?type=warning&user_id=1" },
	{ user_id: "2", type: "message", endpoint: "https://postman-echo.com/post?type=warning&user_id=2" },
]

/*
 * Simple "I'm alive" message on main endpoint '/'
 */
const mainHandler = async (req, res) => {
    console.log("I'm running")
    sendJSONResponse(res, 200, `I'm running! \nTo test me, send a POST request to /webhook/message with body { "user_id": "1", "data": "<any message here>"}`)
}

/*
 * Handle incoming request to send a webhook of type 'message' to 'user_id' containing 'data'.
 * It'll search the database for the corresponding endpoint, and start a goroutine
 * to POST the data to the endpoint.
 */
const messageHandler = async (req, res) => {
    if (!req.body) {
        console.error("Missing body")
        return sendJSONResponse(res, 400, `Invalid body`)
    }

    console.log('Handling message webhook!')

    try {
        let { user_id, data } = req.body;

        if (!user_id || !data) {
            console.error("Missing body data", req.body)
            return sendJSONResponse(res, 400, `Missing data`)
        }

        for (ep of db) {
            if (ep.user_id == user_id && ep.type === 'message') {
                sendJSONResponse(res, 200, `Message sent to ${ep.endpoint}`)
                return sendHTTPPost(ep.endpoint, data)
            }
        }

        sendJSONResponse(res, 404, `User not found!`)
    } catch (e) {
        sendJSONResponse(res, 500, `Error: ${e.message}`)
    }
}

/*
 * Basic JSON response to incoming requests
 */
const sendJSONResponse = (res, status, message) => {
    res.status(status).send({ message });
}

/*
 * Function to send an HTTP POST request to the corresponding endpoint.
 * Will be called from a goroutine to execute in parallel with the main thread.
 */
const sendHTTPPost = async (endpoint, data) => {
    let uuid = uuidv4();
    let start = new Date();

    console.log(`${uuid} | HTTP request to ${endpoint} containing ${data}`);

    let res = await axios.post(endpoint).then(r => r.data)

    console.log(`${uuid} | HTTP response: ${util.inspect(res, {showHidden: false, depth: null})}, took ${(new Date() - start) / 1000} s`)
}


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

//routes
app.post('/webhooks/message', messageHandler);
app.get('*', mainHandler);

app.set('port', port);
app.listen(port, () => console.log(`Starting Node.js application on port ${port}`))

module.exports = app;
