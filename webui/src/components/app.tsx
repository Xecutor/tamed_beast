import * as React from "react";
import * as ReactDOM from "react-dom";

import { WsHandler, jsonrpcInit, jsonrpcCall } from '../utils/jsonrpc'

import { BaseTilesTab } from './base-tiles-tab'
import { TilesTab } from './tiles-tab'
import { TablesTab } from './tables-tab'

import { Tab, Loader } from 'semantic-ui-react'
import 'semantic-ui-css/semantic.min.css';

import { loadTiles } from '../utils/tiles-loader'

interface TamedBeastAppState {
    tableList:Array<any>
    wsStatus: string
    tilesLoaded: boolean
    loadStage:string
    progress:number
}

export class TamedBeastApp extends React.Component<any, TamedBeastAppState> implements WsHandler {
    constructor(prop: any) {
        super(prop)
        this.state = {
            tableList:[],
            wsStatus: '',
            loadStage:'',
            progress:0,
            tilesLoaded: false
        }
    }

    componentDidMount() {
        console.log('mount')
        jsonrpcInit(this)
    }

    onWsConnect() {
        this.setState({ wsStatus: 'open' });
        jsonrpcCall("get_db_list").then(dblist => this.fillDbList(dblist))
    }
    onWsError() {
        this.setState({ wsStatus: 'error' });
    }
    onWsDisconnect() {
        this.setState({ wsStatus: 'closed' });
    }

    fillDbList(dbList: any) {
        let tableList = []
        let imgList = []
        for (let tbl of dbList) {
            let tableName = tbl.TableName as string
            tableList.push(tableName)
            if (tableName == "BaseSprites") {
                for (let imgFile of tbl.JSON) {
                    imgList.push(imgFile)
                }
            }
        }
        loadTiles(imgList, (stage, progress, done) => this.onTileLoadProgress(stage, progress, done))
        this.setState({ tableList })
    }

    onTileLoadProgress(stage: string, progress: number, done: boolean) {
        this.setState({loadStage:stage, progress, tilesLoaded:done})
    }

    render() {
        const panes = [
            {
                menuItem: 'Base tiles',
                render: () => <BaseTilesTab />
            },
            {
                menuItem: 'Tiles',
                render: () => <TilesTab />
            },
            {
                menuItem: 'Tables',
                render: () => <TablesTab tableList={this.state.tableList}/>
            },
        ]

        let mainComponent = this.state.tilesLoaded ? <Tab panes={panes}></Tab> : <Loader active={true}>{`${this.state.loadStage} [${this.state.progress}]`}</Loader>;

        return <div>
            <div>WS status:{this.state.wsStatus}</div>
            {mainComponent}
        </div>
    }
}
