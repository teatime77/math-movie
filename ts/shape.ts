namespace MathMovie {
const fgColor = "white";
const strokeWidth = 4;
export let mathView : View;

export class View {
    svg : SVGSVGElement;
    G1 : SVGGElement;

    constructor(){
        this.svg = document.getElementById("math-svg") as unknown as SVGSVGElement;

        this.G1 = document.createElementNS("http://www.w3.org/2000/svg","g");
        this.svg.appendChild(this.G1);
    }

    clear(){
        this.G1.innerHTML = "";
    }


    makeLine(x1: number, y1: number, x2: number, y2: number, color: string) : SVGLineElement{
        const line = document.createElementNS("http://www.w3.org/2000/svg","line");
        line.setAttribute("stroke", color);
        line.setAttribute("stroke-width", `${this.scale(strokeWidth)}`);
        line.setAttribute("x1", `${x1}`);
        line.setAttribute("y1", `${y1}`);
        line.setAttribute("x2", `${x2}`);
        line.setAttribute("y2", `${y2}`);
    
        this.G1.insertBefore(line, this.G1.firstElementChild);
    
        return line;
    }

    scale(n : number) : number {
        return n;
    }
    
}

export function initSVG(){
    mathView = new View();

    mathView.makeLine(10, 10, 200, 200, "red");
}

export class Circle {
    color: string = "red";
    circle: SVGCircleElement;

    constructor(cx : number, cy : number, r : number, color : string){
        this.color = color;

        this.circle = document.createElementNS("http://www.w3.org/2000/svg","circle");
        this.circle.setAttribute("fill", "none");// "transparent");
        this.circle.setAttribute("stroke", this.color);
        this.circle.setAttribute("fill-opacity", "0");
        this.circle.style.cursor = "move";

        this.circle.setAttribute("cx", `${cx}`);
        this.circle.setAttribute("cy", `${cy}`);
        this.circle.setAttribute("r", `${r}`);

        mathView.G1.appendChild(this.circle);    
    }

}
export function drawCircle(cx : number, cy : number, r : number, color : string){
    return new Circle(cx, cy, r, color);
}

}