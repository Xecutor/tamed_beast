
import {JSONRPCClient, JSONRPCResponse, JSONRPCRequest} from 'json-rpc-2.0';

let webSocket:WebSocket;
let client:JSONRPCClient;

interface PromiseReq<T>{
    resolve:(value:T)=>void
    reject:(value:T)=>void
}
  
let reqPromiseMap:{[idx:string]:PromiseReq<void>}

export interface WsHandler{
    onWsConnect():void
    onWsDisconnect():void
    onWsError():void
}

function onWsMessage(msg:MessageEvent) {
    //console.log("received:"+msg.data)
    let resp : JSONRPCResponse = JSON.parse(msg.data)
    client.receive(resp);
    reqPromiseMap[resp.id].resolve(undefined)
    delete reqPromiseMap[resp.id]
}

function sendRequest(req:JSONRPCRequest) {
    let promise = new Promise<void>((resolve, reject)=>{
        reqPromiseMap[req.id.toString()]={resolve, reject}
    })
    let reqString = JSON.stringify(req)
    //console.log(`sending:${reqString}`)
    webSocket.send(reqString)
    return promise
}

export function jsonrpcInit(wshandler:WsHandler)
{
    client = new JSONRPCClient(
        (req) => sendRequest(req)
    )
    let wsurl = "ws"
    if (document.location.protocol == "https") {
        wsurl += "s"
    }
    wsurl+="://"
    wsurl+=document.location.host
    wsurl+="/json_ws"
    webSocket=new WebSocket(wsurl)
    webSocket.onopen=()=>wshandler.onWsConnect()
    webSocket.onerror=()=>wshandler.onWsError()
    webSocket.onclose=()=>wshandler.onWsDisconnect()
    webSocket.onmessage=onWsMessage
    reqPromiseMap={}
}

export function jsonrpcCall(method:string, params:any={})
{
    return client.request(method, params)
}
