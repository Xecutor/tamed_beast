import * as React from "react";

import {Input, InputOnChangeData} from 'semantic-ui-react'

interface InplaceEditorProps<T> {
    value:T
    onChange:(newValue:T)=>void
}

interface InplaceEditorState<T> {
    value: T
}

export class InplaceStringEditor extends React.Component<InplaceEditorProps<string>,InplaceEditorState<string>> {
    constructor(props:InplaceEditorProps<string>) {
        super(props)
        this.state = {
            value : this.props.value
        }
    }
    onChange(event:React.SyntheticEvent<HTMLInputElement>, data: InputOnChangeData) {
        this.setState({value:data.value})
    }
    onChangeBound = this.onChange.bind(this)

    onBlur() {
        this.props.onChange(this.state.value)
    }
    onBlurBound = this.onBlur.bind(this)

    onKeyDown(event:React.KeyboardEvent<HTMLInputElement>) {
        console.log(event.key, event.keyCode)
        if (event.keyCode == 0x1b) {
            console.log('escape')
            this.props.onChange(this.props.value)
        }
        else if(event.keyCode == 0x0d) {
            console.log('enter')
            this.props.onChange(this.state.value)
        }
    }
    onKeyDownBound = this.onKeyDown.bind(this)

    render() {
        return <Input focus autoFocus onKeyDown={this.onKeyDownBound} value={this.state.value} onChange={this.onChangeBound} onBlur={this.onBlurBound}/>
    }
}
