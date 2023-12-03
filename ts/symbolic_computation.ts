namespace MathMovie {

export class CommandNode extends TexSeq {
    args : TexNode[] = [];

    constructor(block : Block, command: string){
        super("");

        block.nodes.push(this);

        const tokens = lexicalAnalysis(command);

        let in_math = false;
        let start_math : number;

        for(let [idx, word] of tokens.entries()){
            if(word.text == "$"){
                if(! in_math){
                    start_math = idx;
                }
                else{

                    const parser = new Parser(tokens.slice(start_math + 1, idx));

                    const node = parser.parse();
                    this.args.push(node);
                }

                in_math = ! in_math;
            }
        }
    }
}

export class ReplaceNode extends CommandNode {
    constructor(block : Block, command: string, last_tex_seq : TexSeq){
        super(block, command);

        this.copy(last_tex_seq);
    
        console.assert(this.args.length == 2);
    }


    * rep(parent : HTMLDivElement, root : TexSeq, arg1 : TexNode, arg2 : TexNode){
        
        const eq_nodes = allNodes(root).filter(x => x.equals(arg1));


        for(const nd of eq_nodes){
            const target = arg2.clone();
            replace(nd, target);

            genPart = new PartialTex(target);
            while(true){
                allNodes(root).forEach(x => x.entireText = null);
                var str = root.texString();
                msg(`rep ${str}`);
                render(this.html, str);
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

}