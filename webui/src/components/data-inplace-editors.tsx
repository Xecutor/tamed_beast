import * as React from "react";

import {Input, InputOnChangeData, Button} from 'semantic-ui-react'

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

export class InplaceNumberEditor extends React.Component<InplaceEditorProps<number|string>,InplaceEditorState<number|string>> {
    constructor(props:InplaceEditorProps<number|string>) {
        super(props)
        this.state = {
            value : this.props.value
        }
    }
    onChange(event:React.SyntheticEvent<HTMLInputElement>, data: InputOnChangeData) {
        let value : number|string = data.value
        value = parseFloat(value)
        if(!isNaN(value) && value.toString() == data.value) {
            this.setState({value:value})
        }
        else {
            this.setState({value:data.value})
        }
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

export class InplaceBooleanEditor extends React.Component<InplaceEditorProps<boolean|undefined>,InplaceEditorState<boolean|undefined>> {
    constructor(props:InplaceEditorProps<boolean|undefined>) {
        super(props)
        this.state = {
            value : this.props.value
        }
    }
    onClick() {
        let value : boolean|undefined = this.state.value
        if(typeof(value) ==='undefined') {
            this.setState({value:true})
        }
        else if(value) {
            this.setState({value:false})
        }
        else {
            this.setState({value:undefined})
        }
    }
    onClickBound = this.onClick.bind(this)

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
    }
    onKeyDownBound = this.onKeyDown.bind(this)

    getValue() {
        return typeof(this.state.value) === 'undefined' ? 'undefined' : this.state.value.toString()
    }

    render() {
        return <Button focus autoFocus compact onKeyDown={this.onKeyDownBound} onClick={this.onClickBound} onBlur={this.onBlurBound}>
        {this.getValue()}
        </Button>
    }

}