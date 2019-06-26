import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import Picker from '../../src'

import './style.less'

class Index extends Component {
  $refs = {}

  setRefs = (key) => (value) => {
    this.$refs[key] = value
  }

  componentDidMount() {
    const { $picker } = this.$refs
    this.picker = new Picker($picker)
  }

  render() {
    return (
      <div className="pop-picker">
        <div className="vanilla-picker" ref={this.setRefs('$picker')}>
          <div className="picker-inner">
            <div className="picker-rule" />
            <ul className="picker-ul-wrapper">
              { [...new Array(10)].map((_, k) => <li key={k}>{k}</li>) }
            </ul>
          </div>
        </div>
      </div>
    )
  }
}
ReactDOM.render(<Index />, document.querySelector('main'))
