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

    const tex_nodes : TexBlock[] = [];
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

                const tokens = lexicalAnalysis(tex_lines);

                const parser = new Parser(tokens);

                const root = new TexBlock('');
                while(! parser.isEoT()){
                    const node = parser.parse();
                    root.children.push(node);
                }

                tex_nodes.push(root);
                
                const root2 = root.clone();
                const div2 = document.createElement("div");
                document.body.appendChild(div2);
                for(const s of root2.genTex()){
                    render(div2, s);
                    scrollToBottom();
                    yield;
                }

                addHR();
                yield;

            }
            tex_lines = "";
            yield;
            continue;
        }

        if(! in_tex){
            if(line.startsWith("rep")){
                yield* parseCommand(tex_nodes, line);
            }
            msg(`text ${line}`);
            yield;
            continue;
        }

        tex_lines += line;
    }
}


}