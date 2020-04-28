import dialogflow from 'dialogflow';

var sessionClient = new dialogflow.SessionsClient();
var sessionPath = sessionClient.sessionPath('jokes-rtleed', '123456789');

export async function get(req, res, next) {
    const { slug } = req.params;
    var text = slug;

    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: text,
                languageCode: 'en-US',
            },
        },
        queryParams: {
            sentimentAnalysisRequestConfig: {
              analyzeQueryTextSentiment: true,
            },
        },
        outputAudioConfig: {
            audioEncoding: 'OUTPUT_AUDIO_ENCODING_LINEAR_16',
        },
    };

    const responses = await sessionClient.detectIntent(request);
    const result = responses[0].queryResult;

    const audioFile = responses[0].outputAudio;

    var body = {
        text: result.fulfillmentText,
        sentiment: result.sentimentAnalysisResult,
        audio: Buffer.from(audioFile).toString('base64')
    };

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(body));
}