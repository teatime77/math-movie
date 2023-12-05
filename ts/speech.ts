namespace MathMovie　{
let voiceList:  {[key: string]: SpeechSynthesisVoice } = {};
let uttrVoice : SpeechSynthesisVoice|null = null;
const voiceLang = "en-US";              // "ja-JP"
const voiceName = "Microsoft Ana Online (Natural) - English (United States)"; // "Google US English";    // "Google 日本語";
let prevCharIndex = 0;

export function speakTest(){
    const area = document.getElementById("text-data") as HTMLTextAreaElement;
    // speak("大阪ベイエリア・咲洲にあるATCでは店舗・オフィス・物流センター・イベントなどあらゆるサービスの現場が揃っています。");
    speak(area.value.trim());
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

function onSpeechBoundary(ev: SpeechSynthesisEvent){
    msg(`speech bdr: idx:${ev.charIndex} name:${ev.name} type:${ev.type} text:${ev.utterance.text.substring(prevCharIndex, ev.charIndex)}`);
    prevCharIndex = ev.charIndex;
}

function onSpeechEnd(ev: SpeechSynthesisEvent){
    msg(`speech end: idx:${ev.charIndex} name:${ev.name} type:${ev.type} text:${ev.utterance.text.substring(prevCharIndex, ev.charIndex)}`);
}

function onMark(ev: SpeechSynthesisEvent){
    msg(`speech mark: idx:${ev.charIndex} name:${ev.name} type:${ev.type} text:${ev.utterance.text.substring(prevCharIndex, ev.charIndex)}`);
}
    
}