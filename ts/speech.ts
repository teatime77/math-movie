namespace MathMovie　{
let voiceList:  {[key: string]: SpeechSynthesisVoice } = {};
let uttrVoice : SpeechSynthesisVoice|null = null;
const voiceLang = "en-US";              // "ja-JP"
const voiceName = "Microsoft Ana Online (Natural) - English (United States)"; // "Google US English";    // "Google 日本語";
let prevCharIndex = 0;
let Phrases : Phrase[] = [];
let phraseIdx : number = 0;
let wordIdx : number = 0;
let speechRrate : HTMLInputElement;

export let speakingNode : Node | null = null;

export class Phrase {
    texNode : TexNode;
    words   : string[];

    constructor(tex_node : TexNode, words : string[]){
        this.texNode = tex_node;
        this.words   = words;
    }
}

export function speakTest(){
    const text_area = document.getElementById("text-data") as HTMLTextAreaElement;
    speak(text_area.value.trim());
}

export function pronunciation(word: string) : string[]{
    if(word[0] == '\\'){
        const tbl : {[key:string]:string[]} = {
            "dif" : ["diff"],
            "Delta" : ["delta"],
            "lim" : ["limit"],
            "frac" : ["fraction"],
            "sqrt" : "square root".split(" "),
            "ne" : "not equals".split(" "),
            "lt" : "is less than".split(" "),
            "gt" : "is greater than".split(" "),
            "le" : "is less than or equals".split(" "),
            "ge" : "is greater than or equals".split(" "),
        };

        const name = word.substring(1);
        if(name in tbl){
            return tbl[name];
        }
        else{
            return [name];
        }
    }
    
    return [word];
}

function setVoice(){
    const voice_lang_select = document.getElementById("voice-lang-select") as HTMLSelectElement;
    const voice_name_select = document.getElementById("voice-name-select") as HTMLSelectElement;

    for(const voice of speechSynthesis.getVoices()){
        if(voice.lang == voiceLang || voice.lang == "ja-JP"){

            msg(`${voice.lang} [${voice.name}] ${voice.default} ${voice.localService} ${voice.voiceURI}`);

            if(voice.name == voiceName){
                msg(`set voice by name[${voice.name}]`);
                uttrVoice = voice;
            }

            if(uttrVoice == null){
                msg(`set voice by lang[${voice.name}]`);
                uttrVoice = voice;
            }


            voiceList[voice.name] = voice;

            const opt = document.createElement("option");
            opt.text = voice.name;
            opt.value = voice.name;
            voice_name_select.add(opt);
        }
    }

    voice_name_select.addEventListener("change", (ev:Event)=>{
        uttrVoice = voiceList[voice_name_select.value];
        msg(`set voice by name[${uttrVoice.name}]`);
    });

}

export function initSpeech(){
    speechRrate = document.getElementById("speech-rate") as HTMLInputElement;

    if ('speechSynthesis' in window) {
        msg("このブラウザは音声合成に対応しています。🎉");
    }
    else {
        msg("このブラウザは音声合成に対応していません。😭");
    }    

    speechSynthesis.onvoiceschanged = function(){
        msg("voices changed");
        setVoice();
    };
}


export function speak(text : string){
    msg(`speak ${text}`);

    const uttr = new SpeechSynthesisUtterance(text);

    if(uttrVoice != null){
        uttr.voice = uttrVoice;
    }

    // スピーチ 終了
    uttr.onend = onSpeechEnd;

    // スピーチ 境界
    uttr.onboundary = onSpeechBoundary;

    uttr.onmark = onMark;

    uttr.rate = parseFloat(speechRrate.value);
        
    speechSynthesis.speak(uttr);
}

export function cancelSpeech(){
    speechSynthesis.cancel();
}

export function speakNode(phrases : Phrase[]){
    console.assert(phrases.length != 0);

    const text = phrases.map(x => x.words.join(" ")).join(" ");
    msg(`speech ${text}`);

    Phrases = phrases.slice();
    phraseIdx = 0;
    wordIdx   = 0;
    speakingNode = Phrases[phraseIdx].texNode;

    speak(text);
}

function onSpeechBoundary(ev: SpeechSynthesisEvent){
    const text = ev.utterance.text.substring(prevCharIndex, ev.charIndex).trim();

    if(ev.charIndex == 0){

        msg(`speech start name:${ev.name} text:[${text}]`)
    }
    else{

        msg(`speech bdr: idx:${ev.charIndex} name:${ev.name} type:${ev.type} text:[${text}]`);

        if(phraseIdx < Phrases.length){
            const phrase = Phrases[phraseIdx];
            if(phrase.words[wordIdx] != text){
    
                msg(`bdr [${phrase.words[wordIdx]}] <> [${text}]`)
            }
            console.assert(phrase.words[wordIdx] == text);
    
            wordIdx++;
            if(wordIdx < phrase.words.length){
                msg(`next word ${phrase.words[wordIdx]}`);
            }
            else{
                phraseIdx++;
                wordIdx = 0;
                if(phraseIdx < Phrases.length){
    
                    speakingNode = Phrases[phraseIdx].texNode;
    
                    msg(`next phrase :${Phrases[phraseIdx].words.join(" ")}`);
                }
                else{
    
                    msg(`End of speak node`);
                    speakingNode = null;
                }
            }
        }
    }
    prevCharIndex = ev.charIndex;
}

function onSpeechEnd(ev: SpeechSynthesisEvent){
    msg(`speech end: idx:${ev.charIndex} name:${ev.name} type:${ev.type} text:${ev.utterance.text.substring(prevCharIndex, ev.charIndex)}`);
    speakingNode = null;
}

function onMark(ev: SpeechSynthesisEvent){
    msg(`speech mark: idx:${ev.charIndex} name:${ev.name} type:${ev.type} text:${ev.utterance.text.substring(prevCharIndex, ev.charIndex)}`);
}
    
}