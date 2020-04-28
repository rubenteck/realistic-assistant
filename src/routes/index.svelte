<script context="module">
  export async function preload({ params, query }) {
    var getIntent = async text => {
      const res = await this.fetch(`dialogflow/${text}`);
      const data = await res.json();

      if (res.status === 200) {
        return data;
      } else {
        this.error(res.status, data.message);
      }
    };

    var getPhonetics = async text => {
      const res = await this.fetch(`natural/${text}`);
      const data = await res.json();

      if (res.status === 200) {
        return data;
      } else {
        this.error(res.status, data.message);
      }
    };

    return { getIntent, getPhonetics };
  }
</script>

<script>
  export let getIntent;
  export let getPhonetics;

  var text = "";
  var messages = [];

  var phonetics = [
    ["p", "b", "m"], // Bilabials (lips together) => closed mouth
    ["f", "v"], // Labiodentals (bottom lip+upper teeth) => bottom lip
    ["θ", "ð"], // Interdentals (tip tongue between teeth) => small circle
    ["t", "d", "n", "s", "z", "l", "r"], // Alveolars (tongue raised to front mouth) => small circle
    ["ʃ", "ʒ", "ʧ", "ʤ", "ʝ"], // Palatals (raised front tongue to middle mouth) => normal size circle
    ["k", "g", "ŋ"], // Velars (raised back tongue to back mouth) => normal mouth
    ["R", "q", "G"], // Uvulars (raised back tongue far back mouth) => open mouth
    ["h", "Ɂ"] // Glo5als (restrict airflow) => normal mouth
  ];
  var imagePicker = [0, 1, 2, 2, 3, 4, 5];

  var mouths = [
    "mouth closed.png",
    "mouth bottom.png",
    "mouth circle small.png",
    "mouth circle normal.png",
    "mouth normal.png",
    "mouth open.png"
  ];
  var mouth = mouths[0];

  var allEyes = ["eyes open.png", "eyes closed.png"];
  var eyes = allEyes[0];

  (function loop() {
    var random = Math.floor(Math.random() * 2001) + 3000;
    setTimeout(() => {
      blink(300);
      loop();
    }, random);
  })();

  var emotions = [
    "eyebrows angry.png",
    "eyebrows neutral.png",
    "eyebrows happy.png"
  ];
  var eyebrows;
  setEmotion(0);

  function setMouth(index) {
    mouth = mouths[imagePicker[index]];
  }

  function setEmotion(index) {
    eyebrows = emotions[Math.round(index) + 1];
  }

  function blink(milliseconds) {
    eyes = allEyes[1];
    setTimeout(() => (eyes = allEyes[0]), milliseconds);
  }

  function addMessage(message) {
    messages.push(message);
    messages = messages;
  }

  function checkEnter() {
    if (event.key === "Enter") {
      send(text);
      text = "";
    }
  }

  function send(text) {
    var message = {
      isUser: true,
      text: text
    };

    addMessage(message);

    detectIntent(text);
  }

  async function detectIntent(text) {
    var intent = await getIntent(text);

    addMessage({ text: intent.text });
    speak(intent);
  }

  async function speak(intent) {
    var utterances = await utterText(intent.text);

    var emotion = intent.sentiment; // needs enterprise edition
    // console.log(emotion);

    var audio = new Audio("data:audio/wav;base64," + intent.audio);

    audio.onloadedmetadata = function() {
      startUttering(utterances, audio.duration * 1000);
    };

    audio.play();
  }

  async function startUttering(utterances, duration) {
    var timePerUtterance = duration / utterances.length;

    if(timePerUtterance > 500){
      utterances = doubleArray(utterances);
    }

    for (let i = 0; i < utterances.length; i++) {
      const utterance = utterances[i];
      await moveMouth(utterance, timePerUtterance);
    }
  }

  function doubleArray(array) {
    var out = [];

    for (let index = 0; index < array.length; index++) {
      const item = array[index];
      var i = index * 2;
      out[i] = item;
      out[i - 1] = item;
    }

    return out;
  }

  function moveMouth(utterance, duration) {
    return new Promise(function(resolve, reject) {
      var timing = duration / 2;

      setTimeout(async function() {
        setMouth(utterance);

        await transitionMouth(timing);

        resolve();
      }, timing);
    });
  }

  function transitionMouth(timing) {
    return new Promise(function(resolve, reject) {
      setTimeout(() => {
        setMouth(0);
        resolve();
      }, timing);
    });
  }

  async function utterText(text) {
    var data = await getPhonetics(text);

    setEmotion(data.sentiment);

    var utterances = data.text;
    var chars = [];

    utterances.forEach(utterance => {
      var utteranceLower = utterance.toLowerCase();
      var utterancesLower = utteranceLower.split("");
      utterancesLower.forEach(char => chars.push(char));
    });

    var utteranceNrs = [];
    chars.forEach(char => utteranceNrs.push(getUtteranceNr(char)));

    for (let i = 0; i < utteranceNrs.length; i++) {
      const nr = utteranceNrs[i];
      if (nr == undefined) {
        utteranceNrs.splice(i, 1);
        i--;
      }
    }

    return utteranceNrs;
  }

  function getUtteranceNr(char) {
    for (const [i, sounds] of phonetics.entries()) {
      if (isMatch(sounds, char)) {
        return i;
      }
    }
  }

  function isMatch(sounds, char) {
    for (const sound of sounds) {
      if (sound == char) {
        return true;
      }
    }
    return false;
  }
</script>

<style>
  img {
    position: absolute;
  }

  img.face {
    width: 100%;
    top: 0;
  }

  img.eyebrows {
    width: 60%;
    left: 20%;
    top: 0;
  }

  img.eyes {
    width: 60%;
    left: 20%;
    top: 30px;
  }

  img.mouth {
    width: 60%;
    left: 20%;
    top: 100px;
  }

  div.chat {
    position: fixed;
    overflow-y: scroll;
    overflow-x: hidden;
    float: left;
    width: 30%;
    height: 90%;
    border: 2px solid black;
    padding: 10px;
  }

  div.bot {
    position: relative;
    float: right;
    width: 65%;
    height: 100%;
  }

  div.chat > div {
    border-radius: 5px;
    padding: 10px;
    margin: 10px 0;
    width: 80%;
  }

  div.messageUser {
    float: right;
    border: 2px solid #dedede;
    background-color: #f1f1f1;
  }

  div.messageBot {
    float: left;
    border: 2px solid #ccc;
    background-color: #ddd;
  }

  input.chatInput {
    width: 100%;
    position: absolute;
    bottom: 0;
    left: 0;
  }
</style>

<svelte:head>
  <title>Sapper project template</title>
</svelte:head>

<div class="chat">
  {#each messages as message}
    {#if message.isUser}
      <div class="messageUser">{message.text}</div>
    {:else}
      <div class="messageBot">{message.text}</div>
    {/if}
  {/each}

  <input
    class="chatInput"
    type="text"
    bind:value={text}
    on:keyup={checkEnter} />
</div>

<div class="bot">
  <img class="face" src="face.png" alt="face" />
  <img class="eyebrows" src={eyebrows} alt="eyebrows" />
  <img class="eyes" src={eyes} alt="eyes" />
  <img class="mouth" src={mouth} alt="mouth" />
</div>
