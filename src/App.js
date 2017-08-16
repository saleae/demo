import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

class App extends Component {
  state = {
    visible: false,
    savingIntent: false,
    error: false,
    success: false,
    slideOut: false,
  }

  selectIntent = (intent) => {
    this.setState({ savingIntent: true });

    fetch('/api/v1/customer_intent', {
      method: 'POST',
      body: JSON.stringify({ intent }),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    }).then((res) => {
      if (res.status === 200) {
        localStorage.setItem('customer-intent:show', true);
      }

      this.setState({
        savingIntent: false,
        success: true,
      }, () => {
        setTimeout(() => {
          this.setState({
            visible: false,
          })
        }, 3000);
      });
    }).catch((err) => {
      this.setState({
        error: true,
        savingIntent: false,
      });
    })
  }

  hideIntentBar = () => {
    this.slideOutIntentBar();
    localStorage.setItem('customer-intent:show', true);
  }

  slideOutIntentBar = () => {
    this.setState({
      slideOut: true,
    }, () => {
      setTimeout(() => {
        this.setState({
          visible: false
        });
      }, 1000);
    })
  }

  componentWillMount() {
    this.setState({
      visible: !localStorage.getItem('customer-intent:show')
    });
  }

  renderContent() {
    const {
      slideOut,
      success,
    } = this.state;

    return success ? (
      <div className={`intentBar ${ slideOut ? 'intentBar--slide-out' : ''}`}>
        Thanks! for your response
      </div>
    ) : (
      <div className={`intentBar ${ slideOut ? 'intentBar--slide-out' : ''}`}>
        <div onClick={() => this.selectIntent('purchase')} className={'intentBar__option'}>I'm interested in purchasing.</div>
        <div onClick={() => this.selectIntent('other')} className={'intentBar__option'}>I'm interested in other things.</div>
        <div onClick={this.hideIntentBar} className={'intentBar__close'}>x</div>
      </div>
    );
  }

  render() {
    const {
      visible,
    } = this.state;

    return visible ? this.renderContent() : null;
  }
}

export default App;
