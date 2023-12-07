namespace MathMovie　{
let voiceList:  {[key: string]: SpeechSynthesisVoice } = {};
let uttrVoice : SpeechSynthesisVoice|null = null;
const voiceLang = "en-US";              // "ja-JP"
const voiceName = "Microsoft Ana Online (Natural) - English (United States)"; // "Google US English";    // "Google 日本語";
let prevCharIndex = 0;
let Phrases : [TexNode, string[]][] = [];
let phraseIdx : number = 0;
let wordIdx : number = 0;

export let speakingNode : Node | null = null;

export function getSpeakingNode() : string {
    return speakingNode == null ? "" : Phrases[phraseIdx][1][0];
}

export function speakTest(){
    const text_area = document.getElementById("text-data") as HTMLTextAreaElement;
    speak(text_area.value.trim());
}

export function pronunciation(word: string){
    if(word[0] == '\\'){
        const tbl : {[key:string]:string} = {
            "dif" : "diff",
            "Delta" : "delta",
            "lim" : "limit",
            "frac" : "fraction",
            "sqrt" : "square root",
            "ne" : "not equals",
            "lt" : "is less than",
            "gt" : "is greater than",
            "le" : "is less than or equals",
            "ge" : "is greater than or equals",
        };

        const name = word.substring(1);
        if(name in tbl){
            return tbl[name];
        }
        else{
            return name;
        }
    }
    
    return word;
}

function setVoice(){
    const voice_lang_select = document.getElementById("voice-lang-select") as HTMLSelectElement;
    const voice_name_select = document.getElementById("voice-name-select") as HTMLSelectElement;

    for(const voice of speechSynthesis.getVoices()){
        if(voice.lang == voiceLang){

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
        
    speechSynthesis.speak(uttr);
}

export function speakNode(phrases : [TexNode, string[]][]){
    console.assert(phrases.length != 0);

    const text = phrases.map(x => x[1].join(" ")).join(" ");
    msg(`speech ${text}`);

    Phrases = phrases.slice();
    phraseIdx = 0;
    wordIdx   = 0;
    speakingNode = Phrases[phraseIdx][0];

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
            const words : string[] = Phrases[phraseIdx][1];
            if(words[wordIdx] != text){
    
                msg(`bdr [${words[wordIdx]}] <> [${text}]`)
            }
            console.assert(words[wordIdx] == text);
    
            wordIdx++;
            if(wordIdx < words.length){
                msg(`next word ${words[wordIdx]}`);
            }
            else{
                phraseIdx++;
                wordIdx = 0;
                if(phraseIdx < Phrases.length){
    
                    speakingNode = Phrases[phraseIdx][0];
    
                    msg(`next phrase ${Phrases[phraseIdx][1][0]}`);
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
}

function onMark(ev: SpeechSynthesisEvent){
    msg(`speech mark: idx:${ev.charIndex} name:${ev.name} type:${ev.type} text:${ev.utterance.text.substring(prevCharIndex, ev.charIndex)}`);
}
    
}