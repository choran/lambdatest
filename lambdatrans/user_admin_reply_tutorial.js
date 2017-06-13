// Constants (might need to loaded from ENV vars)
var intercomAccessToken = process.env.API_ONBOARDING_INTERCOM_ACCESS_TOKEN;
var replyAdminId = process.env.API_ONBOARDING_REPLY_ADMIN_ID;

// Initialising the Intercom API client
var IntercomLib = require('intercom-client');
var intercomClient = new IntercomLib.Client({token: intercomAccessToken});

exports.handler = function (event, context, callback) {
    // Fire response to inform lambda that we've received the event
    if (context.run_env != "local") {
        var response = {
            statusCode: 200,
            body: JSON.stringify({
                message: "success"
            })
        };
        callback(null, response);
    }

    // Parse message body to decide what action to take
    switch (nextStep(event)) {
        case "user_reply_tutorial":
            console.log("user reply tutorial");
            sendUserReplyTutorial(event);
            break;
        case "admin_reply_tutorial":
            console.log("admin reply tutorial");
            sendAdminReplyTutorial(event);
            break;
        default:
            console.log("Do nothing");
            return;
    }
};

nextStep = function(payload) {
    // Check the author type of the latest reply
    latest_convo_part = payload.data.item.conversation_parts.conversation_parts[0];
    author = latest_convo_part.author;

    // Do nothing if the reply is not from an end user
    if (author.type != "user") {
        return null;
    }

    // Parse the message text to decide the next step
    messageBody = extractText(latest_convo_part.body);
    if (!messageBody) {
        return null;
    } else {
        messageBody = messageBody.toLowerCase().trim();
    }

    if (messageBody.includes("user reply")) {
        return "user_reply_tutorial";
    } else if (messageBody.includes("admin reply")) {
        return "admin_reply_tutorial";
    } else {
        return null;
    }
};

extractText = function(text) {
    try {
        if (text.startsWith("<p>")) {
            return text.substring(3, text.length - 4);
        } else {
            return text;
        }
    } catch (e) {
        console.log("Failed to parse text: " + text);
        console.log(e);
        return null;
    }
};

sendAdminReplyTutorial = function(payload) {
    var conversationId = payload.data.item.id;

    // Prepare the curl command
    var curlCommandTemplate = `curl https://api.intercom.io/conversations/${conversationId}/reply \
                    -X POST \
                    -H 'Authorization:Bearer ${intercomAccessToken}' \
                    -H 'Accept:application/json' \
                    -H 'Content-Type:application/json' -d'
                    {
                      "admin_id": "${replyAdminId}",
                      "body": "Hello! This is an admin reply via the API",
                      "type": "admin",
                      "message_type": "comment"
                    }'`;

    firstReply = "Okay! Now let's send a reply from the admin via our API. Copy the curl command below and run it in your Terminal:";
    var replies = [firstReply, curlCommandTemplate];

    replies.forEach(function(reply) {
        sendReply(conversationId, reply);
    });
}

sendUserReplyTutorial = function(payload) {
    var conversationId = payload.data.item.id;
    var intercomUserId = payload.data.item.user.id;

    // Prepare the curl command
    var curlCommandTemplate = `curl https://api.intercom.io/conversations/${conversationId}/reply \
                    -X POST \
                    -H 'Authorization:Bearer ${intercomAccessToken}' \
                    -H 'Accept:application/json' \
                    -H 'Content-Type:application/json' -d'
                    {
                      "intercom_user_id": "${intercomUserId}",
                      "body": "Hello! This is a user reply via the API",
                      "type": "user",
                      "message_type": "comment"
                    }'`;

    firstReply = "Okay! Now let's send a reply from the user via our API. Copy the curl command below and run it in your Terminal:";
    var replies = [firstReply, curlCommandTemplate];

    replies.forEach(function(reply) {
        sendReply(conversationId, reply);
    });
}

// Helper methods for interacting with the Intercom API
sendReply = function(conversationId, text) {
    var reply = {
        id: conversationId,
        message_type: "comment",
        admin_id: replyAdminId,
        body: text
    }

    intercomClient.conversations.reply(reply, null);
}
