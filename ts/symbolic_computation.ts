namespace MathMovie {

export class CommandNode extends Node {
    constructor(parent : HTMLDivElement, command: string){
        super();

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
            const root = lastTexSeq.clone();
            lastTexSeq = root;
        
            console.assert(args.length == 2);
            yield* rep(parent, root, args[0], args[1]);
        }

        yield;
    }

    * rep(parent : HTMLDivElement, root : TexSeq, arg1 : TexNode, arg2 : TexNode){
        
        const eq_nodes = allNodes(root).filter(x => x.equals(arg1));

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
                // scrollToBottom();

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

}

export class ReplaceNode extends CommandNode {

}

}