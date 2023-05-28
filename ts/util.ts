var katex : any;
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
            macros
        });    
    }
    catch(e){
    }
}

export function addHR(){
    const hr = document.createElement("hr");
    document.body.appendChild(hr);
}

export function scrollToBottom(){
    var element = document.documentElement;
    var bottom = element.scrollHeight - element.clientHeight;
    window.scroll(0, bottom);    
}

}

