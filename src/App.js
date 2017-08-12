import React, { Component } from 'react';
import request from 'superagent'
import logo from './logo.svg';
import './App.css';
import storage from 'simple-storage'

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      shouldShowBar: false,
      shouldShowThanks: false
    };
  }
  componentDidMount() {
    const didUserAlreadySubmit = storage.get('user-already-submitted')
    if(!didUserAlreadySubmit) this.setState({ shouldShowBar: true })
  }
  onClose() {
    this.setState({
      shouldShowBar: false
    })
    // store in localstorage
    storage.set('user-already-submitted', true)
  }
  sendReason(reason) {
    request.post('/api/user/visit-dialog')
      .send({ reason})
      .end((err, response) => {
        console.log(err, response)
        if(err) console.error(err, response.body)
        this.setState({
          shouldShowThanks: true
        })
        window.setTimeout(()=> {
          this.onClose()
        }, 3000)
      })
  }
  onPurchaseClick() {
    return this.sendReason('purchase')
  }
  onOtherClick() {
    return this.sendReason('other')
  }
  render() {
    return (
      <nav className={`App${this.state.shouldShowBar ? ' visible' : ''}`}>
        <div className={`reason-for-visiting-select${this.state.shouldShowThanks ? ' hidden' : ''}`}>
          <h3>What brings you to SpaceX?</h3>
          <div className="btn-group">
            <button className="option" onClick={(event) => this.onPurchaseClick()}>I'm considering a purchase</button>
            <button className="option" onClick={(event) => this.onOtherClick()}>I'm here for another reason</button>
          </div>
          <button className="close" onClick={(event) => this.onClose()}>x</button>
        </div>
        <div className={`reason-for-visiting-thanks${this.state.shouldShowThanks ? '' : ' hidden'}`}>
          <h3>Thanks!</h3>
        </div>
      </nav>
    );
  }
}

export default App;
