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
            text += `^{${this.sup.texString()}}`;
        }

        return text;
    }

    *genSubSup(){
        let texts = [ "", "" ];
        let operators  = [ "_", "^"];

        for(let [idx, sub_sup] of [this.sub, this.sup].entries()){
            if(sub_sup != null){
                const operator = operators[idx];

                for(let s of sub_sup.genTex()){                    
                    texts[idx] = `${operator}${s}`

                    yield texts.join("");
                }
            }
        }

        yield texts.join("");
    }

    // abstract initString() : string;
    abstract texString() : string;
    abstract listTex() : string[];
    abstract genTexSub() : IterableIterator<string>;

    * genTex() : IterableIterator<string>{
        let txt : string;

        for(let s of this.genTexSub()){
            txt = s;
            yield txt;
        }
    
        for(let s of this.genSubSup()){
            yield `${txt}${s}`;
        }
    }
}


export var targetNode : TexNode = null;
export var genNode = null;
export var genNext;
var genValue;

export class TexBlock extends TexNode {
    children : TexNode[] = [];
    closing_parenthesis : string;

    public constructor(text : string){
        super(text);
        this.closing_parenthesis = closingParenthesis(this.text);
    }

    initString() : string {
        return `${this.text}${this.closing_parenthesis}`;
    }

    texString() : string {

        const str = this.children.map(x => x.texString()).join(' ');
        return this.addSubSup( `${this.text}${str}${this.closing_parenthesis}` );
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

    *genTexSub() : IterableIterator<string> {
        const arg_strs = Array<string>(this.children.length).fill("");

        for(var i = 0; i < this.children.length; i++){
            for(const seq of this.children[i].genTex()){
                arg_strs[i] = seq;
    
                yield `${this.text} ${arg_strs.join(" ")} ${this.closing_parenthesis}`;
            }       
        }
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

    *genTexSub() : IterableIterator<string> {
        const arg_strs = this.args.map(x => x.initString());

        for(let [idx, blc] of this.args.entries()){
            for(const s of blc.genTex()){
                arg_strs[idx] = s;

                yield `${this.text}${arg_strs.join("")}`;
            }
        }

        yield `${this.text}${arg_strs.join("")}`;
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

    *genTexSub() : IterableIterator<string> {
        yield this.text;
    }
}

export class TexEnv extends TexNode {
    begin : TexMacro;
    children : TexNode[] = [];
    end : TexMacro;

    public constructor(){
        super("");
    }

    texString() : string{
        const begin_str = this.begin.texString();
        const children_str = this.children.map(x => x.texString()).join(' ');
        const end_str = this.end.texString();
        
        return `${begin_str}\n ${children_str} \n${end_str}`;
    }

    listTex() : string[]{
        return [];
    }

    *genTexSub() : IterableIterator<string> {
        const begin_str = this.begin.texString();
        const end_str = this.end.texString();

        const children_str = Array<string>(this.children.length).fill("");

        for(var i = 0; i < this.children.length; i++){
            for(const seq of this.children[i].genTex()){
                children_str[i] = seq;
    
                yield `${begin_str}\n ${children_str.join(" ")} \n${end_str}`;
            }       
        }
        
        yield `${begin_str}\n ${children_str.join(" ")} \n${end_str}`;
    }

}









}

