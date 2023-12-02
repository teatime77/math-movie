var katex : any;
var getUserMacros;

const macros = {
    "\\RR": "\\mathbb{R}",
    "\\pdv": "\\frac{\\partial #1}{\\partial #2}",
    "\\rep": "#1 \\rArr #2"
};

namespace MathMovie {
export function msg(txt : string){
    console.log(txt);
}

export function element(id) : HTMLElement{
    return document.getElementById(id);
}

export class SyntaxException extends Error {
}

export function render(ele: HTMLElement, tex_text: string){
    try{
        katex.render(tex_text, ele, {
            throwOnError: false,
            displayMode : true,
            // newLineInDisplayMode : "ignore",
            macros : getUserMacros()
        });    
    }
    catch(e){
    }
    if(true) return;

    const bases = ele.getElementsByClassName("base");
    if(bases.length == 1){
    
        const rc : DOMRect = bases[0].getBoundingClientRect();
        msg(`w:${rc.width} h:${rc.height} ${tex_text}`);
    }
}

export function addHR(div : HTMLDivElement){
    const hr = document.createElement("hr");
    div.appendChild(hr);
}

export function scrollToBottom(){
    var element = document.documentElement;
    var bottom = element.scrollHeight - element.clientHeight;
    window.scroll(0, bottom);    
}

}

