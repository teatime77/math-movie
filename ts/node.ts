namespace MathMovie {
const oprTex = { "*":"\\cdot", "=":"=" , "!=":"\\neq" , "<":"\\lt", "<=":"\\leqq", ">":"\\gt" , ">=":"\\geqq" };

export abstract class TexNode {
    parent : TexNode = null;
    sub : TexNode = null;
    sup : TexNode = null;
    entireText : string = null;

    equals(node: TexNode) : boolean {
        return this.texString() == node.texString();
    }

    invalidate(){
        for(let nd : TexNode = this; nd != null; nd = nd.parent){
            nd.entireText = null;
        }
    }

    cloneSubSub(node: TexNode){
        if(node.sub != null){
            this.sub = node.sub.clone();
        }

        if(node.sup != null){
            this.sup = node.sup.clone();
        }
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

    abstract clone() : TexNode;
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
    opening_parenthesis : string;
    closing_parenthesis : string;

    public constructor(text : string){
        super();
        this.opening_parenthesis = text;
        this.closing_parenthesis = closingParenthesis(this.opening_parenthesis);
    }

    clone() : TexBlock {
        const node = new TexBlock(this.opening_parenthesis);

        node.cloneSubSub(this);
        node.children = this.children.map(x => x.clone());
        node.closing_parenthesis = this.closing_parenthesis;

        return node;
    }

    initString() : string {
        return `${this.opening_parenthesis}${this.closing_parenthesis}`;
    }

    texString() : string {
        if(this.entireText == null){

            const str = this.children.map(x => x.texString()).join(' ');
            this.entireText = this.addSubSup( `${this.opening_parenthesis}${str}${this.closing_parenthesis}` );
        }

        return this.entireText;
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
    
                yield `${this.opening_parenthesis} ${arg_strs.join(" ")} ${this.closing_parenthesis}`;
            }       
        }

        yield `${this.opening_parenthesis} ${arg_strs.join(" ")} ${this.closing_parenthesis}`;
    }
}

export abstract class TexText extends TexNode {
    text : string;

    public constructor(text : string){
        super();
        this.text = text;
    }
}

export class TexMacro extends TexText {
    args : TexBlock[] = [];

    public constructor(text : string){
        super(text);
    }

    clone() : TexMacro {
        const node = new TexMacro(this.text);

        node.cloneSubSub(this);
        node.args = this.args.map(x => x.clone());

        return node;
    }

    texString() : string {
        if(this.entireText == null){

            let str = this.text;

            for(let blc of this.args){
                str += blc.texString();
            }

            this.entireText = this.addSubSup(str);
        }

        return this.entireText;
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

export class TexLeaf extends TexText {
    public constructor(text : string){
        super(text);
    }

    clone() : TexLeaf {
        const node = new TexLeaf(this.text);

        node.cloneSubSub(this);

        return node;
    }

    texString() : string {
        if(this.entireText == null){

            this.entireText = this.addSubSup(this.text);
        }

        return this.entireText;
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

    clone() : TexEnv {
        const node = new TexEnv();

        node.cloneSubSub(this);
        node.begin = this.begin.clone();
        node.children = this.children.map(x => x.clone());
        node.end   = this.end.clone();

        return node;
    }

    texString() : string{
        if(this.entireText == null){

            const begin_str = this.begin.texString();
            const children_str = this.children.map(x => x.texString()).join(' ');
            const end_str = this.end.texString();
            
            this.entireText = `${begin_str}\n ${children_str} \n${end_str}`;
        }

        return this.entireText;
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

export function allNodes(node : TexNode, nodes : TexNode[]){
    nodes.push(node);

    if(node.sub != null){

        node.sub.parent = node;
        allNodes(node.sub, nodes);
    }

    if(node.sup != null){

        node.sup.parent = node;
        allNodes(node.sup, nodes);
    }

    if(node instanceof TexBlock){
        for(const nd of node.children){
            nd.parent = node;
            allNodes(nd, nodes);
        }
    }
    else if(node instanceof TexMacro){
        for(const nd of node.args){
            nd.parent = node;
            allNodes(nd, nodes);
        }
    }
    else if(node instanceof TexEnv){
        for(const nd of node.children){
            nd.parent = node;
            allNodes(nd, nodes);
        }
    }
}

export function replace(node : TexNode, target : TexNode){
    console.assert(node.parent != null);

    if(node.parent.sub == node){
        node.parent.sub = target;
    }
    else if(node.parent.sup == node){
        node.parent.sup = target;
    }
    else if(node.parent instanceof TexBlock || node.parent instanceof TexEnv){
        const idx = node.parent.children.indexOf(node);
        if(idx == -1){
            throw new Error();
        }

        node.parent.children[idx] = target;
    }
    else if(node.parent instanceof TexMacro){
        const idx = node.parent.args.indexOf(node as TexBlock);
        if(idx == -1){
            throw new Error();
        }

        node.parent.args[idx] = target as TexBlock;
    }
    else{

        throw new Error();
    }

    node.parent.invalidate();
    target.parent = node.parent;
}

}

