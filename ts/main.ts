
namespace MathMovie {

export let lastTexSeq : TexSeq;

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
    }
    else{
    }

    let [blocks , tbl] = makeBlockTree(parent, lines);
    yield* showBlockTree(parent, blocks, tbl);
}

function makeTD(tr : HTMLTableRowElement){
    const td = tr.insertCell()

    td.style.borderStyle= "solid";
    td.style.borderWidth = "1px";
    td.style.borderColor = "pink";

    return td;
}


export function makeBlockTree(parent_div : HTMLDivElement, lines : string[]) : [Block[] , HTMLTableElement]{
    let blocks : Block[] = [];

    const tbl : HTMLTableElement = document.createElement("table");
    let block : Block = null;

    let tr : HTMLTableRowElement;

    parent_div.appendChild(tbl);

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

                const root = new TexSeq('');
                root.parseLines(block, tex_lines);

                lastTexSeq = root;
                
                const root2 = root.clone();
                root.html = document.createElement("div");
                root.html.style.display = "inline-block";
                root.html.style.borderStyle= "solid";
                root.html.style.borderWidth = "1px";
                root.html.style.borderColor = "green";
            
                block.div.appendChild(root.html);
                for(const s of root2.genTex()){
                    render(root.html, s);
                    // scrollToBottom();
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
            
                if(line.startsWith("rep")){
                    console.log(`!!!!!!!!!! ${line} !!!!!!!!!!`);
                    new ReplaceNode(parent_td, line);
                }
                else if(line == ""){
                    continue;
                }
                else{
                    new HtmlNode(block, line);
                }
                msg(`text ${line}`);
            }
        }
    }

    for(const blc of blocks){
        const rc2 = blc.div.getBoundingClientRect();

        blc.div.style.width  = `${rc2.width}px`;
        blc.div.style.height = `${rc2.height}px`;
    }

    return [blocks, tbl];
}


function* showBlockTree(parent_div : HTMLDivElement, blocks : Block[], tbl : HTMLTableElement){

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
        for(const node of blc.nodes){
            node.hide();
        }
    }
    for(const blc of blocks){
        const top = blc.top;

        blc.div.parentElement.removeChild(blc.div);

        blc.div.style.position = "absolute";
        blc.div.style.left = `${blc.left}px`;
        blc.div.style.top  = `${total_height - top}px`;
        diagDiv.appendChild(blc.div);
    }

    for(const blc of blocks){

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

        for(const root of blc.nodes){
            if(root instanceof TexSeq){

                root.html.innerHTML = "";
                root.show();

                const root2 = root.clone();
                for(const s of root2.genTex()){
                    render(root.html, s);
                    // scrollToBottom();
                    yield;
                }
            }
            else if(root instanceof HtmlNode){
                root.show();
            }
        }
    }

    parent_div.removeChild(tbl);

}

}
