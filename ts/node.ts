namespace MathMovie {
const oprTex = { "*":"\\cdot", "=":"=" , "!=":"\\neq" , "<":"\\lt", "<=":"\\leqq", ">":"\\gt" , ">=":"\\geqq" };

export abstract class TexNode {
    text : string;
    sub : TexNode = null;
    sup : TexNode = null;

    public constructor(text : string){
        this.text = text;
    }

    addSubSup(text: string){
        if(this.sub != null){
            text += `_${this.sub.texString()}`;
        }

        if(this.sup != null){
            text += `^${this.sup.texString()}`;
        }

        return text;
    }

    abstract texString() : string;
    abstract listTex() : string[];

    abstract genTex() : IterableIterator<string[]>;
}


export var targetNode : TexNode = null;
export var genNode = null;
export var genNext;
var genValue;

export class TexBlock extends TexNode {
    children : TexNode[] = [];

    public constructor(text : string){
        super(text);
    }

    texString() : string {
        const closing_parenthesis = closingParenthesis(this.text);

        const str = this.children.map(x => x.texString()).join(' ');
        return this.addSubSup( `${this.text}${str}${closing_parenthesis}` );
    }

    listTex() : string[] {
        if(this == targetNode){
            genNext = genNode.next();
            if(! genNext.done){
                genValue = genNext.value;
            }
            return ["\\textcolor{red}{"].concat(genValue, ["}"]);
        }
        var v = this.children.map(x => x.listTex());
        return v.flat();
    }

    *genTex() : IterableIterator<string[]> {
        const arg_strs = new Array<Array<string>>(this.children.length).fill([]);

        for(var i = 0; i < this.children.length; i++){
            for(const seq of this.children[i].genTex()){
                arg_strs[i] = seq;
    
                yield arg_strs.flat();
            }       
        }
    
        yield arg_strs.flat();
    }
}

export class TexMacro extends TexNode {
    args : TexBlock[] = [];

    public constructor(text : string){
        super(text);
    }

    texString() : string {
        let str = this.text;

        for(let blc of this.args){
            str += blc.texString();
        }

        return this.addSubSup(str);
    }

    listTex() : string[] {
        return [ this.text ];
    }

    *genTex() : IterableIterator<string[]> {
        yield [ this.text ];
    }
    
}

export class TexLeaf extends TexNode {
    public constructor(text : string){
        super(text);
    }

    texString() : string {
        return this.addSubSup(this.text);
    }

    listTex() : string[] {
        return [ this.text ];
    }

    *genTex() : IterableIterator<string[]> {
        yield [ this.text ];
    }
}









}

