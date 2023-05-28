namespace MathMovie {

export function fetchText(path: string, fnc){
    let url: string;

    if(path.startsWith("http")){

        url = path;
    }
    else{

        let k = window.location.href.lastIndexOf("/");

        url = `${window.location.href.substring(0, k)}/${path}`;
    }
    const url2 = encodeURI(url);
    msg(`url:${url2}`)

    fetch(url2, { cache : "no-store" })
    .then((res: Response) => {
        if(res.status == 404){

            throw new Error("ファイルがありません。");
        }
        else{

            return res.text();
        }
    })
    .then(text => {
        msg(`text:${text}`);
        fnc(text);
    })
    .catch(error => {
        msg(`fetch error ${error}`);
    });
}

}