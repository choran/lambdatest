// Constants (might need to loaded from ENV vars)
var intercomAccessToken = process.env.API_ONBOARDING_INTERCOM_ACCESS_TOKEN;
var replyAdminId = process.env.API_ONBOARDING_REPLY_ADMIN_ID;

// Initialising the Intercom API client
var IntercomLib = require('intercom-client');
var intercomClient = new IntercomLib.Client({token: intercomAccessToken});

exports.handler = function (event, context, callback) {
    var leadId = getIntercomUserId(event);
    intercomClient.conversations.list({type: "user", intercom_user_id: leadId}, handleConversationsForLead);
};

getIntercomUserId = function(payload) {
    return payload.data.item.intercom_user_id;
}

handleConversationsForLead = function(res) {
    conversations = res.body.conversations;
    latestConversation = conversations[0];
    sendAdminReplyTutorial(latestConversation.id, latestConversation.user.id);
}

sendAdminReplyTutorial = function(conversationId, leadId) {
    // Prepare the curl command
    var curlCommandTemplate = `curl https://api.intercom.io/conversations/${conversationId}/reply \
                    -X POST \
                    -H 'Authorization: Bearer ${intercomAccessToken}' \
                    -H 'Accept: application/json' \
                    -H 'Content-Type: application/json' -d'
                    {
                      "intercom_user_id": "${leadId}",
                      "body": "Hello! This is an admin reply via the API",
                      "type": "admin",
                      "admin_id": "${replyAdminId}",
                      "message_type": "comment"
                    }'`;

    firstReply = "Okay! Now let's send a reply from the admin via our API. Copy the curl command below and run it in your Terminal:";
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
