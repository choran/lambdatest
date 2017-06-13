exports.handler = function (event, context, callback) {

// All these libraries need to be in package.json
    var os = require("os");
    var Intercom = require('intercom-client');

// process.env accesses environment variables defined in Lambda function
    var client = new Intercom.Client({ token:  process.env.intercom_at});
    var admin_id = process.env.admin_id;
    console.log(JSON.stringify(event.data))
    var customer = event.data.item.user.id
    if (event.data.item.conversation_parts.total_count>0){
        var text =  JSON.stringify(event.data.item.conversation_parts.conversation_parts[0].body);
    } else {
        var text =  JSON.stringify(event.data.item.conversation_message.body);
    }
    var convo_id = JSON.stringify(event.data.item.id);

    /* We can return a HTTP 200 now since the translate calls will cause the webhook to timeout and resend the notificaiton
     If it does not work then it simply will not populate the conversation with the note. This is better than getting
     duplicates each time */
    callback(null, response);

    /* First we need to check text in body to see what stage of the tutorial
    the user is currently executing
     */
    if (text.indexOf("CONVO_INIT:")>=0){
        /* This is start of quickstart so lets create a new conversation */
        var myRegEx = /(CONVO_INIT:).\s*(.*)/g;
        var match = myRegEx.exec(text);
        var name = match[2];
        if (match[2].length > 0){
            msg = `Hello ${name}, Copy and paste this into a terminal:, `;
        } else {
            msg = `Hey, Copy and paste this into a terminal:`;
        }
    }

    /* Create the text to be used in the curl command */
    var curl_text = '\`\`\`curl https://api.intercom.io/messages \
-XPOST \
-H \'Authorization:Bearer YOURACCESSTOKEN\' \
-H \'Accept: application/json\' \
-H \'Content-Type: application/json\' -d\' \
    { \
        \"message_type\": \"email\", \
        \"subject\": \"Hey\",\
        \"body\": \"This is to create a new conversation\",\
        \"template\": \"plain\",\
        \"from\": {\
        \"type\": \"admin\",\
        \"id\": ' + admin_id  + '\
    }, \
        \"to\": {\
        \"type\": \"user\",\
        \"id\": ' + customer  + '\
    }\
    }\`\`\`'


    var message = {
        message_type: "inapp",
        body: msg + "\n" + curl_text ,
        from: {
            type: "admin",
            id: admin_id
        },
        to: {
            type: "user",
            id: customer
        }
    };

    client.messages.create(message, function (rsp){
        console.log(rsp.body)
    });
    var responseBody = {
        message: "Intercom Conversation Quickstart",
        input: event
    };
    var response = {
        statusCode: "200",
        headers: {
            "x-custom-header" : "Intercom Quickstart"
        },
        body: JSON.stringify(responseBody)
    };
    console.log("response: " + JSON.stringify(response))

}
/**
 * Created by cathalhoran on 13/06/2017.
 */
