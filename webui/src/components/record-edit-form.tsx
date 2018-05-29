import * as React from "react";
import * as ReactDOM from "react-dom";

import {Form, Segment, Button} from 'semantic-ui-react'
import { FieldDef, copyRecord } from "../database/scheme";

interface RecordEditFormState{
    editedRecord:any
}

interface RecordEditFormProps{
    inputRecord:any
    tableDef:FieldDef[]
    fileList?:string[]
    onSave:(record:any)=>void
}

export class RecordEditForm extends React.Component<RecordEditFormProps, RecordEditFormState>{
    constructor(props:RecordEditFormProps) {
        super(props)
        let editedRecord = copyRecord(this.props.inputRecord, this.props.tableDef)
        if (this.props.fileList && this.props.fileList.length == 1) {
            editedRecord._filename = this.props.fileList[0]
        }
        this.state = {
            editedRecord
        }
    }

    onFieldChange(name:string, value:any) {
        let editedRecord = {...this.state.editedRecord}
        editedRecord[name] = value
        this.setState({editedRecord})
    }

    renderField(value:any, def:FieldDef) {
        return def.type.renderEditor(def.name, value, (newValue:any)=>this.onFieldChange(def.name, newValue))
    }

    onFileChanged(value:string) {
        let editedRecord = {...this.state.editedRecord}
        editedRecord._filename = value
        this.setState({editedRecord})
    }

    makeFileChoice() {
        if(this.props.fileList.length==1) {
            return undefined
        }
        let options = this.props.fileList.map(file=>({
            key:file,
            text:file,
            value:file
        }))

        return <Form.Dropdown selection options={options} label='File' onChange={(e,{value})=>this.onFileChanged(value as string)}/>
    }

    render() {
        return (
            <Form>
                {
                    this.props.fileList && this.makeFileChoice()
                }
                {
                    this.props.tableDef.map(
                        def=>def.type.renderEditor(
                            def.name,
                            this.state.editedRecord[def.name], 
                            (newValue:any)=>this.onFieldChange(def.name, newValue))
                    )
                }
                <Form.Button type='button' icon='save' content='Save' onClick={()=>this.props.onSave(this.state.editedRecord)}/>
            </Form>
        )
    }
}