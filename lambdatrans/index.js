exports.handler = function (event, context, callback) {

// All these libraries need to be in package.json
var google = require('googleapis');
var translate = google.translate('v2');
var os = require("os");
var Intercom = require('intercom-client');
var crypto = require('crypto');
const secret = '<WEBHOOK SECRET>';

// process.env accesses environment variables defined in Lambda function
var client = new Intercom.Client({ token:  process.env.intercom_at});
var API_KEY =  process.env.google_api; 
var admin = process.env.admin_id;
var lang = 'none';
var target = 'en';
var result = 'NOT TRANSLATED';
var expected = JSON.stringify(event.params.header["X-Hub-Signature"]);
if (event['body-json'].data.item.conversation_parts.total_count>0){
    var text =  JSON.stringify(event['body-json'].data.item.conversation_parts.conversation_parts[0].body);
} else {
    var text =  JSON.stringify(event['body-json'].data.item.conversation_message.body);
}
var convo_id = JSON.stringify(event['body-json'].data.item.id);

/* API gateway seems to slightly change the format of the body when it adds it to the JSON object structure
to pass through to the lambda function. While the data is the same the layout is different causing the HASHs
to be different. I am not sure we can use the signing in this case. You can use a different setup in the lambda
service to simply proxy the payload directly so if signing is needed then that could be used instead of currest method
where payload is parsed into a JS object */
console.log("PAYLOAD: "+ JSON.stringify(event['body-json'].data));
var calculated = 'sha1=' + crypto.createHmac('sha1', secret).update((event['body-json'].data).toString()).digest('hex');
console.log("SHA: "+ calculated);
console.log("EXPECTED: "+ expected);

/* We can return a HTTP 200 now since the translate calls will cause the webhook to timeout and resend the notificaiton
IF it does not work then it simply will not populate the conversation with the note. This is better than getting
duplicates each time */
callback(null, response);

    /* First detect the language. If it is non english then we want to translate it
     * Otherwise do nothing. No need to write any note to the conversation
     */
translate.detections.list({
    auth: API_KEY,
    q: text,
    }, (err, data) => {
    lang = data.data.detections[0][0].language;

    /* If its not the target language then we need to translate the 
    * text and write that as a note to the conversation
    */
    console.log("DETECT: " + lang);
    if (lang != target) {
      set_lang(lang)
      console.log("Language detected as: " + lang);
    }
  }
);

/* Translate the message via google translate 
 * and write the result to the Intercom conversation */
function set_lang(convo_lang) {
    lang = convo_lang;
    translate.translations.list({
        auth: API_KEY,
        q: text,
        target: target,
    }, function (err, data) {
        console.log('Translated text: ' + (err ? err.message : data.data.translations[0].translatedText));
	result = data.data.translations[0].translatedText;
    	write_note(result, convo_id);
    });
}

/* Write note to Intercom conversations */
function write_note(text, convo_id) {
console.log("Writing Intercom note to conversation: " + convo_id);
var note = {
    id: convo_id.replace(/^"(.*)"$/, '$1'),
    type: "admin",
    message_type: "note",
    admin_id: admin,
    body:"Language: " + lang + "\nTranslation:" + text.replace(/.*<p>(.*)<\/p>.*$/, '$1')
}; 

client.conversations.reply(note, function (rsp){
    console.log(rsp.body)
});
}
var responseBody = {
    message: "Intercom Translation",
    input: event
};
var response = {
    statusCode: "200",
    headers: {
        "x-custom-header" : "Intercom Translation"
    },
    body: JSON.stringify(responseBody)
};
console.log("response: " + JSON.stringify(response))

}
