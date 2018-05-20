import * as React from "react";
import * as ReactDOM from "react-dom";

import {Button} from 'semantic-ui-react'
import { jsonrpcCall } from "../utils/jsonrpc";
import {dbScheme, TypeDef, FieldDef, validateScheme} from '../database/scheme'

interface OtherTabState{
    currentTable:string
    errorMessages:string[]
    validateIdx:number
}

interface OtherTabProps{
    tableList:string[]
}

export class OtherTab extends React.Component<OtherTabProps, OtherTabState>{
    constructor(props:OtherTabProps) {
        super(props)
        this.state={
            currentTable:'',
            validateIdx:-1,
            errorMessages:[]
        }
    }

    validateTable(table:any[]) {
        let scheme = dbScheme[this.state.currentTable]
        if(!scheme) {
            console.log(`"Scheme for ${this.state.currentTable} not found, skipping`)
            this.validateNext(this.state.validateIdx + 1)
            return;
        }

        try{
            validateScheme(table, scheme);
        }catch(e) {
            let msgs = [...this.state.errorMessages]
            msgs.push(`${e.message}, table ${this.state.currentTable}`)
            this.setState({errorMessages:msgs})
            return
        }

        this.validateNext(this.state.validateIdx + 1)
    }

    validateNext(idx:number) {
        if (idx > this.props.tableList.length) {
            return;
        }
        this.setState({currentTable:this.props.tableList[idx], validateIdx:idx, errorMessages:[]})
        jsonrpcCall('select', {table:this.props.tableList[idx]}).then((table)=>this.validateTable(table))
    }

    validate() {
        this.validateNext(0)
    }

    render() {
        return <div>
            <Button onClick={()=>this.validate()}>Validate</Button><br/>
            <div>CurrentTable:{this.state.currentTable}</div>
            {
                this.state.errorMessages.map(msg=><div>{msg}</div>)
            }
        </div>
    }
}