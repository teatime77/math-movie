namespace MathMovie {
const oprTex = { "*":"\\cdot", "=":"=" , "!=":"\\neq" , "<":"\\lt", "<=":"\\leqq", ">":"\\gt" , ">=":"\\geqq" };

export abstract class Node {
    html : HTMLElement;

    hide(){
        if(this.html == undefined){
            msg("");
        }
        this.html.style.visibility = "hidden";
    }

    show(){
        this.html.style.visibility = "visible";
    }
}

export class HtmlNode extends Node {
    line : string;

    constructor(block : Block, line : string){
        super();

        line = line.trim();
        this.line = line;
        block.nodes.push(this);

        let ele : HTMLElement;
    
        if(line.startsWith("#")){
            ele = document.createElement("h1");
            ele.innerText = line.substring(1);
        }
        else if(line == "---"){
            ele = document.createElement("hr");
        }
        else{
            ele = document.createElement("div");
            ele.innerHTML = line;

            this.html = ele;
            block.div.appendChild( ele );
    
            if(line.includes("$")){
                (window as any).renderMathInElement(ele, {
                    // customised options
                    // • auto-render specific keys, e.g.:
                    delimiters: [
                        {left: '$$', right: '$$', display: true},
                        {left: '$', right: '$', display: false},
                        {left: '\\(', right: '\\)', display: false},
                        {left: '\\[', right: '\\]', display: true}
                    ],
                    // • rendering keys, e.g.:
                    throwOnError : false
                  });
                console.log(`-------------------------- ${line} ------------------------------`)
            }
            return;
        }
    
        this.html = ele;
        block.div.appendChild( ele );
    }
}

export abstract class TexNode extends Node {
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

    cloneSubSup(node: TexNode){
        if(node.sub != null){
            this.sub = node.sub.clone();
        }

        if(node.sup != null){
            this.sup = node.sup.clone();
        }
    }

    addSubSup(text: string) : string {
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

    replace(src_str:string, dst:TexNode){
        const arg1 = nodeFromString(src_str);
    
        const eq_nodes = allNodes(this).filter(x => x.equals(arg1));
        for(const nd of eq_nodes){
            replace(nd, dst.clone());
        }
    }
}

export let targetNode : TexNode = null;

export class PartialTex {
    genNode : IterableIterator<string> = null;
    genNext : IteratorResult<string> = null;
    genValue : string = null;

    constructor(nd : TexNode){
        targetNode = nd;
        this.genNode = nd.genTex();
    }

    partTex() : string {
        this.genNext = this.genNode.next();
        if(! this.genNext.done){
            this.genValue = this.genNext.value;
        }
        return `\\textcolor{red}{${this.genValue}}`;
    }

    done() : boolean {
        return this.genNext == null || this.genNext.done
    }
}

export let genPart : PartialTex;

export class TexSeq extends TexNode {
    children : TexNode[] = [];
    opening_parenthesis : string;
    closing_parenthesis : string;

    public constructor(text : string){
        super();
        this.opening_parenthesis = text;
        this.closing_parenthesis = closingParenthesis(this.opening_parenthesis);
    }

    clone() : TexSeq {
        const node = new TexSeq(this.opening_parenthesis);

        node.cloneSubSup(this);
        node.children = this.children.map(x => x.clone());
        node.closing_parenthesis = this.closing_parenthesis;

        return node;
    }

    parseLines(block : Block, tex_lines : string){
        const tokens = lexicalAnalysis(tex_lines);

        const parser = new Parser(tokens);

        block.nodes.push(this);

        while(! parser.isEoT()){
            const node = parser.parse();
            this.children.push(node);
        }

    }

    initString() : string {
        return `${this.opening_parenthesis}${this.closing_parenthesis}`;
    }

    texString() : string {
        if(this == targetNode){

            return genPart.partTex();
        }

        if(this.entireText == null){

            const str = this.children.map(x => x.texString()).join(' ');
            this.entireText = this.addSubSup( `${this.opening_parenthesis}${str}${this.closing_parenthesis}` );
        }

        return this.entireText;
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
    args : TexSeq[] = [];

    public constructor(text : string){
        super(text);
    }

    clone() : TexMacro {
        const node = new TexMacro(this.text);

        node.cloneSubSup(this);
        node.args = this.args.map(x => x.clone());

        return node;
    }

    texString() : string {
        if(this == targetNode){

            return genPart.partTex();
        }

        if(this.entireText == null){

            let str = this.text;

            for(let blc of this.args){
                str += blc.texString();
            }

            this.entireText = this.addSubSup(str);
        }

        return this.entireText;
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

        node.cloneSubSup(this);

        return node;
    }

    texString() : string {
        if(this == targetNode){

            return genPart.partTex();
        }

        if(this.entireText == null){

            this.entireText = this.addSubSup(this.text);
        }

        return this.entireText;
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

        node.cloneSubSup(this);
        node.begin = this.begin.clone();
        node.children = this.children.map(x => x.clone());
        node.end   = this.end.clone();

        return node;
    }

    texString() : string{
        if(this == targetNode){

            return genPart.partTex();
        }

        if(this.entireText == null){

            const begin_str = this.begin.texString();
            const children_str = this.children.map(x => x.texString()).join(' ');
            const end_str = this.end.texString();
            
            this.entireText = `${begin_str}\n ${children_str} \n${end_str}`;
        }

        return this.entireText;
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

export function allNodes(node : TexNode, nodes : TexNode[] = []) : TexNode[] {
    nodes.push(node);

    if(node.sub != null){

        node.sub.parent = node;
        allNodes(node.sub, nodes);
    }

    if(node.sup != null){

        node.sup.parent = node;
        allNodes(node.sup, nodes);
    }

    if(node instanceof TexSeq){
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

    return nodes;
}

export function replace(node : TexNode, target : TexNode){
    const parent = node.parent;
    console.assert(parent != null);

    if(parent.sub == node){
        parent.sub = target;
    }
    else if(parent.sup == node){
        parent.sup = target;
    }
    else if(parent instanceof TexSeq || parent instanceof TexEnv){
        const idx = parent.children.indexOf(node);
        if(idx == -1){
            throw new Error();
        }

        parent.children[idx] = target;
    }
    else if(parent instanceof TexMacro){
        const idx = parent.args.indexOf(node as TexSeq);
        if(idx == -1){
            throw new Error();
        }

        parent.args[idx] = target as TexSeq;
    }
    else{

        throw new Error();
    }

    parent.invalidate();
    target.parent = parent;
}

}

