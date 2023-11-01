
namespace MathMovie {

var interval : number;
var iterator;
var timerId : number;
let svgRoot : SVGSVGElement;

function onDataChanged(data_id: string){
    console.log(`button:[${data_id}]`);

    if(data_id == ""){
        return;
    }

    const path = `../data/${data_id}.md`;

    msg(`click ${path}`);

    fetchText(path, (src_text: string)=>{

        msg(`fetch : ${src_text}`);

        iterator = generator(src_text);

        interval = parseInt((element("interval") as HTMLInputElement).value);
        timerId = setInterval(timerFnc, interval);
    });
}


export function bodyOnLoad(){
    initSVG();
    
    const data_select = document.getElementById("data-select") as HTMLSelectElement;

    data_select.addEventListener("change", (ev:Event)=>{
        onDataChanged(data_select.value);
    });
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

    const parent = document.getElementById("math-div") as HTMLDivElement;
    parent.innerHTML = "";

    mathView.clear();

    const mode_select = document.getElementById("mode-select") as HTMLSelectElement;
    if(mode_select.value == "tree"){

        makeBlockTree(parent, lines);
    }
    else{

        yield* readBlock(parent, lines);
    }
}

function markdown(block : Block, line : string){
    line = line.trim();

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

    block.div.appendChild( ele );
}

function makeTD(tr : HTMLTableRowElement){
    const td = tr.insertCell()

    td.style.borderStyle= "solid";
    td.style.borderWidth = "1px";
    td.style.borderColor = "pink";

    return td;
}


export function makeBlockTree(parent_div : HTMLDivElement, lines : string[]){
    let blocks : Block[] = [];

    const tbl = document.createElement("table");
    let block : Block = null;

    let tr : HTMLTableRowElement;

    parent_div.appendChild(tbl);

    const tex_nodes : TexBlock[] = [];
    let in_tex = false;
    let tex_lines = "";
    while (lines.length != 0) {
        const line = lines.shift().trim();

        if(! in_tex){

            const tokens = line.split(/\s+/);
            if(tokens.length != 0){
                if(tokens[0] == "block"){
                    if(block != null){
                        console.log(`block w:${block.div.clientWidth} h:${block.div.clientHeight} ins:${block.ins}`)
                    }

                    let ins : Block[] = [];
                    if(tokens.length == 4){
                        console.assert(tokens[2] == "from");

                        const ins_str = tokens[3].split(",").map(x => x.trim());
                        ins = ins_str.map(id => blocks.find(x => x.blockId == id));
                        console.assert(ins.every(x => x != undefined));
                    }

                    const block_id = tokens[1];
                    block = new Block(block_id, ins);
                    blocks.push(block);

                    tr = tbl.insertRow();
                    const td = makeTD(tr);
                    td.appendChild(block.div);

                    continue;
                }
            }
        }

        if(line == "$$"){
            in_tex = ! in_tex;

            if(! in_tex && tex_lines != ""){

                msg("----------- tex lines");
                msg(tex_lines);
                msg("-----------");

                const tokens = lexicalAnalysis(tex_lines);

                const parser = new Parser(tokens);

                const root = new TexBlock('');
                block.nodes.push(root);

                while(! parser.isEoT()){
                    const node = parser.parse();
                    root.children.push(node);
                }

                tex_nodes.push(root);
                
                const root2 = root.clone();
                root.div = document.createElement("div");
                root.div.style.display = "inline-block";
                root.div.style.borderStyle= "solid";
                root.div.style.borderWidth = "1px";
                root.div.style.borderColor = "green";
            
                block.div.appendChild(root.div);
                for(const s of root2.genTex()){
                    render(root.div, s);
                    scrollToBottom();
                }

                addHR(block.div);
            }
            tex_lines = "";
        }
        else{

            if(in_tex){
                if(! line.startsWith("\\gdef")){

                    tex_lines += line;
                }
            }
            else{
            
                const commands = [ "rep", "cancel" ]
                if(commands.some(x => line.startsWith(x))){
                    console.log(`!!!!!!!!!! ${line} !!!!!!!!!!`);
                    // yield* parseCommand(parent_td, tex_nodes, line);
                }
                else if(line == ""){
                    continue;
                }
                else{
                    markdown(block, line);
                }
                msg(`text ${line}`);
            }
        }
    }

    const roots = blocks.filter(x => x.outs.length == 0);
    for(const blc of roots){
        blc.calcBottom(null);
    }

    lanes = [];
    for(const blc of roots){
        blc.calcLane(0);
    }

    const total_height = Math.max(... blocks.map(x => x.top));

    const lane_widths = lanes.map(v => Math.max(... v.map(x => x.width)));
    console.log(`total-height:${total_height}  lane width: ${lane_widths}`);

    const lane_lefts = Array(lane_widths.length).fill(0);
    let left : number = 0;
    for(const [idx, width] of lane_widths.entries()){
        if(0 < idx){
            left += lane_widths[idx - 1] + padding;
        }

        for(const blc of lanes[idx]){
            blc.left = left;
        }
    }

    const diagDiv = document.createElement("div");
    parent_div.appendChild(diagDiv);
    diagDiv.style.position = "absolute";
    diagDiv.style.left = "0px";
    diagDiv.style.top  = "0px";
    diagDiv.style.borderStyle= "solid";
    diagDiv.style.borderWidth = "1px";
    diagDiv.style.borderColor = "orange";

    for(const blc of blocks){
        const top = blc.top;

        blc.div.parentElement.removeChild(blc.div);

        blc.div.style.position = "absolute";
        blc.div.style.left = `${blc.left}px`;
        blc.div.style.top  = `${total_height - top}px`;
        diagDiv.appendChild(blc.div);

        for(const in_blc of blc.ins){
            const rc = mathView.svg.getBoundingClientRect();
            const rc1 = in_blc.div.getBoundingClientRect();
            const rc2 = blc.div.getBoundingClientRect();

            const x1 = (rc1.left - rc.left) + rc1.width / 2;
            const y1 = (rc1.bottom - rc.top);

            const x2 = (rc2.left - rc.left) + rc2.width / 2;
            const y2 = (rc2.top - rc.top);

            mathView.makeLine(x1, y1, x2, y2, "blue");

            drawCircle(x1, y1, 5, "red");
            drawCircle(x2, y2, 5, "blue");

            console.log(`id:${in_blc.blockId}=>${blc.blockId} (${x1},${y1}) => (${x2},${y2}`)
        }
    }

    parent_div.removeChild(tbl);

}


function* readBlock(parent : HTMLDivElement, lines : string[]){

    const tex_nodes : TexBlock[] = [];
    let in_tex = false;
    let tex_lines = "";
    while (lines.length != 0) {
        const line = lines.shift().trim();

        if(! in_tex){

            const tokens = line.split(/\s+/);
            if(tokens.length != 0){
                if(tokens[0] == "block"){

                    const sub_block : HTMLDivElement = document.createElement("div");
                    sub_block.style.display = "flex";
                    sub_block.style.flexDirection = "column";
                    sub_block.style.flexBasis = "auto";
                    sub_block.style.borderStyle= "solid";
                    sub_block.style.borderWidth = "1px";
                    sub_block.style.borderColor = "red";
                    sub_block.style.justifyContent = "center";

                    parent.appendChild(sub_block);

                    yield* readBlock(sub_block, lines);
                    continue;
                }
            }
        }

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
                div2.style.display = "inline-block";
                div2.style.borderStyle= "solid";
                div2.style.borderWidth = "1px";
                div2.style.borderColor = "green";

                parent.appendChild(div2);
                for(const s of root2.genTex()){
                    render(div2, s);
                    scrollToBottom();
                    yield;
                }

                addHR(parent);
            }
            tex_lines = "";
        }
        else{

            if(in_tex){
                if(! line.startsWith("\\gdef")){

                    tex_lines += line;
                }
            }
            else{

                const commands = [ "rep", "cancel" ]
                if(commands.some(x => line.startsWith(x))){
                    yield* parseCommand(parent, tex_nodes, line);
                }
                else{
                    // markdown(parent, line);
                }
                msg(`text ${line}`);
            }
        }

        yield;
    }
}

}
