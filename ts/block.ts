namespace MathMovie {

export const padding = 50;

export let lanes : Block[][];

export function last<T>(v : T[]) : T {
    console.assert(v.length != 0);

    return v[v.length - 1];
}

function max(v : number[]){
    return v.reduce((x, y, i)=> Math.max(x, y) );
}

export class Block {
    div : HTMLDivElement;
    blockId : number;
    bottom : number = 0;
    ins : Block[];
    outs : Block[] = [];
    lane : number = NaN;
    left : number;

    constructor(block_id : number, ins : Block[]){
        this.blockId = block_id;
        this.ins = ins;

        for(const blc of ins){
            blc.outs.push(this);
        }


        this.div = document.createElement("div");
        this.div.style.display = "inline-block";
        this.div.style.borderStyle= "solid";
        this.div.style.borderWidth = "3px";
        this.div.style.borderColor = "green";
    }

    get width() : number{
        return this.div.clientWidth;
    }

    get height() : number {
        return this.div.clientHeight;
    }


    get top() : number {
        return this.bottom + this.height;
    }

    calcBottom(parent : Block) : void {
        if(parent == null){

            this.bottom = 0;
        }
        else{

            const bottom = parent.top + padding;

            if(this.bottom < bottom){
                this.bottom = bottom;
            }
        }

        for(let blc of this.ins){
            blc.calcBottom(this);
        }
    }

    adjustLane(lane : number){
        for( ; ; lane++){
            while(lanes.length <= lane){
                lanes.push([]);
            }    

            if(lanes[lane].length == 0){
                break;
            }

            const blc = last(lanes[lane]);
            if(this.top < blc.bottom){
                break;
            }
        }

        return lane;
    }

    calcLane(lane : number){
        if(! isNaN(this.lane)){
            // レーンを計算済みの場合

            return;
        }


        lane = this.adjustLane(lane);

        if(this.ins.length != 0){
            // 入力がある場合

            for(const [idx, blc] of this.ins.entries()){
                if(idx == 0){
    
                    blc.calcLane(lane);
                }
                else{
    
                    blc.calcLane(this.ins[idx - 1].lane);
                }
            }

            // 出力が複数のブロックがある場合は、交差しないようにレーンを調整する。
            lane = this.adjustLane(this.ins[0].lane);
        }

        this.lane = lane;

        while(lanes.length <= this.lane){
            lanes.push([]);
        }
        lanes[this.lane].push(this);
    }
}



}