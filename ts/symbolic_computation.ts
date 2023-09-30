namespace MathMovie {
function* rep(parent : HTMLDivElement, tex_nodes : TexBlock[], args : TexNode[]){
    console.assert(args.length == 2);
    const arg1 = args[0];
    const arg2 = args[1];

    const root = tex_nodes[tex_nodes.length - 1].clone();
    tex_nodes.push(root);

    const nodes = allNodes(root);
    
    const eq_nodes = nodes.filter(x => x.equals(arg1));

    const div = document.createElement("div");
    // div.style.display = "inline-block";
    div.style.borderStyle= "solid";
    div.style.borderWidth = "1px";
    div.style.borderColor = "red";

    parent.appendChild(div);

    for(const nd of eq_nodes){
        const target = arg2.clone();
        replace(nd, target);

        genPart = new PartialTex(target);
        while(true){
            allNodes(root).forEach(x => x.entireText = null);
            var str = root.texString();
            msg(str);
            render(div, str);
            scrollToBottom();

            if(genPart.done()){
                break;
            }
            yield;
        }

        genPart = null;
        targetNode = null;
    }

    addHR(parent);
    yield;
}

function* cancel(parent : HTMLDivElement, tex_nodes : TexBlock[], args : TexNode[]){

    const root = tex_nodes[tex_nodes.length - 1].clone();
    tex_nodes.push(root);

    const nodes = allNodes(root);
    

    const div = document.createElement("div");
    // div.style.display = "inline-block";
    div.style.borderStyle= "solid";
    div.style.borderWidth = "1px";
    div.style.borderColor = "blue";

    parent.appendChild(div);

    for(const arg of args){
        const eq_nodes = nodes.filter(x => x.equals(arg));

        for(const nd of eq_nodes){
            // const mac = nodeFromString("\\textcolor{red}{\\cancel{@}}");
            // const mac = nodeFromString("\\cancel{\\textcolor{red}{@}}");
            const mac = nodeFromString("\\cancel{@}");

            mac.replace("@", nd);
        
            replace(nd, mac);

            genPart = new PartialTex(mac);
            while(true){
                allNodes(root).forEach(x => x.entireText = null);
                var str = root.texString();
                msg(str);
                render(div, str);
                scrollToBottom();

                if(genPart.done()){
                    break;
                }
                yield;
            }

            genPart = null;
            targetNode = null;
        }
    }

    addHR(parent);
    yield;
}


export function* parseCommand(parent : HTMLDivElement, tex_nodes : TexBlock[], command: string){
    const tokens = lexicalAnalysis(command);

    let in_math = false;
    let start_math : number;

    const args : TexNode[] = [];
    for(let [idx, word] of tokens.entries()){
        if(word.text == "$"){
            if(! in_math){
                start_math = idx;
            }
            else{

                const parser = new Parser(tokens.slice(start_math + 1, idx));

                const node = parser.parse();
                args.push(node);
            }

            in_math = ! in_math;
        }
    }

    if(tokens[0].text == "rep"){
        yield* rep(parent, tex_nodes, args);
    }
    else if(tokens[0].text == "cancel"){
        yield* cancel(parent, tex_nodes, args);
    }

    yield;
}
}