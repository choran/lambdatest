exports.handler = function (event, context, callback) {
console.log('value2 =', JSON.stringify(event.data.item.id));
console.log('value1 =', JSON.stringify(event.data.item.conversation_message.body));

var google = require('googleapis');
var translate = google.translate('v2');
var os = require("os");
var Intercom = require('intercom-client');

// process.env accesses environment variables defined in Lambda function
var client = new Intercom.Client({ token:  process.env.intercom_at});
var API_KEY =  process.env.google_api; // specify your API key here

var lang = 'none';
var result = 'NOT TRANSLATED';
var text =  JSON.stringify(event.data.item.conversation_message.body);
console.log(text)

translate.detections.list({
    auth: API_KEY,
    q: text,
    model: 'nmt',
    }, (err, data) => {
    lang = data.data.detections[0][0].language;
    set_lang(data.data.detections[0][0].language)
}
);

function set_lang(convo_lang) {
    lang = convo_lang;
    translate.translations.list({
        auth: API_KEY,
        q: text,
        target: 'en',
        model: 'nmt',
    }, function (err, data) {
        console.log('Result: ' + (err ? err.message : data.data.translations[0].translatedText));
	result = data.data.translations[0].translatedText;
	if (lang != "en") {
    	  write_note(result, JSON.stringify(event.data.item.id));
    	  console.log(result + "<=>" + JSON.stringify(event.data.item.id));
	}
    });
}

function write_note(text, convo_id) {
console.log("ID " + convo_id.replace(/^"(.*)"$/, '$1'));
console.log("TEXT " + text.replace(/.*<p>(.*)<\/p>.*$/, '$1'))
var note = {
    id: convo_id.replace(/^"(.*)"$/, '$1'),
    type: "admin",
    message_type: "note",
    admin_id: "370627",
    body:"Translation:" + text.replace(/.*<p>(.*)<\/p>.*$/, '$1')
}; 

client.conversations.reply(note, function (rsp){
    console.log(rsp.body)
});
}
var responseBody = {
    message: "Hello ",
    input: event
};
var response = {
    statusCode: "500",
    headers: {
        "x-custom-header" : "my custom header value"
    },
    body: JSON.stringify(responseBody)
};
console.log("response: " + JSON.stringify(response))
callback(null, response);
//callback(null, 'COMPLETED: '  + text);
}
