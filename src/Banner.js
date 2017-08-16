import React, { Component } from 'react';
import classNames from 'classnames';
import createFeedback from './api/feedback';

class Banner extends Component {
  constructor (props) {
    super(props)
    this.state = {
      visible: true,
      thanks: false,
    }

    this.handlePurchaseClick = this.handlePurchaseClick.bind(this)
    this.handleOtherClick = this.handleOtherClick.bind(this)
    this.handleCloseClick = this.handleCloseClick.bind(this)
    this.sayThanks = this.sayThanks.bind(this)
  }

  handlePurchaseClick (e) {
    e.preventDefault()

    createFeedback('purchase')

    this.sayThanks()
  }

  handleOtherClick (e) {
    e.preventDefault()

    createFeedback('other')

    this.sayThanks()
  }

  handleCloseClick (e) {
    e.preventDefault()

    this.setState({
      visible: false
    })
  }

  sayThanks () {
    if (this.state.thanks) return

    this.setState({
      thanks: true,
    })

    setTimeout(function () {
      this.setState({
        visible: false,
      })
    }.bind(this), 1000)
  }

  render() {
    const classes = classNames("Banner", {
      'is-visible': this.state.visible
    })

    return (
      <div className={classes}>
        {this.state.thanks
          ? <div>Thanks</div>
          : <div>
            <button
              onClick={this.handlePurchaseClick}
            >
              {"I'm considering a purchase"}
            </button>

            <button
              onClick={this.handleOtherClick}
            >
              {"I'm here for another reason"}
            </button>
            <button
              onClick={this.handleCloseClick}
            >
              x
            </button>
          </div>
        }
      </div>
    );
  }
}

export default Banner;
