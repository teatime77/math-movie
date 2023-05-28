namespace MathMovie {

var interval : number;
var iterator;
var timerId : number;

export function bodyOnLoad(){

    const data_links = Array.from(document.getElementsByClassName("data-link"));
    msg(`links ${data_links.length}`);
    for(const link of data_links){
        msg(`link ${link.innerHTML}`);
        link.addEventListener("click", (ev:TouchEvent)=>{
            const data_id = (ev.target as HTMLElement).innerText;
            const path = `../data/${data_id}.md`;

            msg(`click ${path}`);

            fetchText(path, (src_text: string)=>{

                msg(`fetch : ${src_text}`);

                iterator = generator(src_text);
    
                interval = parseInt((element("interval") as HTMLInputElement).value);
                timerId = setInterval(timerFnc, interval);
            });
        });
    }
}    

function timerFnc(){
    // speech.speak(sss);
    if(iterator.next().done){
        // ジェネレータが終了した場合

        clearInterval(timerId);
        console.log("ジェネレータ 終了");
    }
}


function* generator(src_text: string){
    const lines = src_text.split('\n');

    let in_tex = false;
    let tex_lines = "";
    for (let line of lines) {

        line = line.trim();

        if(line == "$$"){
            in_tex = ! in_tex;

            if(! in_tex && tex_lines != ""){

                msg("----------- tex lines");
                msg(tex_lines);
                msg("-----------");

                const div1 = document.createElement("div");
                document.body.appendChild(div1);
                render(div1, tex_lines);        
            }
            tex_lines = "";
            yield;
            continue;
        }

        if(! in_tex){
            msg(`text ${line}`);
            yield;
            continue;
        }

        if(line == ""){

            yield;
            continue;
        }

        const tokens = lexicalAnalysis(line);

        const parser = new Parser(tokens);

        const nodes : TexNode[] = [];
        while(! parser.isEoT()){
            const node = parser.parse();
            nodes.push(node);
        }

        const nodes_str = nodes.map(x => x.texString()).join(' ');

        tex_lines += `${nodes_str} \n`;
    }
}


}