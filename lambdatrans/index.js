exports.handler = function (event, context, callback) {
console.log('value1 =', event.key1);
console.log('value2 =', event.key2);

var google = require('googleapis');
var translate = google.translate('v2');
var os = require("os");
var Intercom = require('intercom-client');

// process.env accesses environment variables defined in Lambda function
var client = new Intercom.Client({ token:  process.env.intercom_at});
var API_KEY =  process.env.google_api; // specify your API key here

var lang = 'none';
var result = 'NOT TRANSLATED';
var text =  event.key1;
console.log(event.key1)

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
    	  write_note(result, event.key2);
    	  console.log(event.key1 + "<=>" + event.key2)
	}
    });
}

//if (lang != "en") {
//    write_note(result, event.key2);
//    console.log(event.key1 + "<=>" + event.key2)
//}

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
callback(null, 'COMPLETED: '  + text);
}
