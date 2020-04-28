import {Metaphone} from 'natural';
import {WordTokenizer} from 'natural';
import {SentimentAnalyzer} from 'natural';
import {PorterStemmer} from 'natural';

Metaphone.attach();
var tokenizer = new WordTokenizer();
var analyzer = new SentimentAnalyzer("English", PorterStemmer, "afinn");

export async function get(req, res, next) {
    const { slug } = req.params;
    var text = slug;

    var sentiment = analyzer.getSentiment(tokenizer.tokenize(text));

    var data = { 
        text: text.tokenizeAndPhoneticize(), 
        sentiment: sentiment 
    };

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
}