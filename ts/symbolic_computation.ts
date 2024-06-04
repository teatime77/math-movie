namespace MathMovie {

export class CommandNode extends TexSeq {
    prevTexSeq : TexSeq;
    args : TexNode[] = [];

    constructor(block : Block, command: string, prev_tex_seq : TexSeq){
        super("");

        this.prevTexSeq = prev_tex_seq.clone();
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
    constructor(block : Block, command: string, prev_tex_seq : TexSeq){
        super(block, command, prev_tex_seq);

        this.copy(prev_tex_seq);
    
        console.assert(this.args.length == 2);
    }

    rep(){
        const eq_nodes = allNodes(this).filter(x => x.equals(this.args[0]));

        for(const nd of eq_nodes){
            const target = this.args[1].clone();
            replace(nd, target);
        }
    }


    * genRep(){
        const eq_nodes = allNodes(this).filter(x => x.equals(this.args[0]));

        for(const nd of eq_nodes){
            const target = this.args[1].clone();
            replace(nd, target);

            allNodes(this).forEach(x => x.entireText = null);

            targetNode = target;

            let str = this.texString();

            for(const s of target.genTex()){
                const target_str = `\\textcolor{red}{${s}}`;
                const render_str = str.replace(replaceMarker, target_str)
                render(this.html, render_str);
            }

            const msec = performance.now();
            while(performance.now() - msec < 1000){
                yield;
            }

            targetNode = null;
        }
    }
}

}