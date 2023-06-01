namespace MathMovie {
function* rep(tex_nodes : TexBlock[], args : TexNode[]){
    console.assert(args.length == 2);
    const arg1 = args[0];
    const arg2 = args[1];

    const node = tex_nodes[tex_nodes.length - 1].clone();
    tex_nodes.push(node);

    const nodes : TexNode[] = [];
    allNodes(node, nodes);
    
    const eq_nodes = nodes.filter(x => x.equals(arg1));

    eq_nodes.forEach(x => replace(x, arg2.clone()));

    const div = document.createElement("div");
    document.body.appendChild(div);
    for(const s of node.genTex()){
        render(div, s);
        scrollToBottom();
        yield;
    }

    addHR();
    yield;
}

export function* parseCommand(tex_nodes : TexBlock[], command: string){
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
        yield* rep(tex_nodes, args);
    }

    yield;
}
}