import React, { Component } from 'react';
import classNames from 'classnames'

class Banner extends Component {
  constructor (props) {
    super(props)
    this.state = {
      visible: true,
    }

    this.handlePurchaseClick = this.handlePurchaseClick.bind(this)
    this.handleOtherClick = this.handleCloseClick.bind(this)
    this.handleCloseClick = this.handleCloseClick.bind(this)
    this.hideBanner = this.hideBanner.bind(this)
  }

  handlePurchaseClick (e) {
    console.log('purchase click')
  }

  handleOtherClick (e) {
    console.log('other click')
  }

  handleCloseClick (e) {
    e.preventDefault()
    console.log('close click')
    console.log('this', this)
    this.hideBanner()
  }

  hideBanner () {
    this.setState({
      visible: false
    })
  }

  render() {
    const classes = classNames("Banner", {
      'is-visible': this.state.visible
    })

    return (
      <div className={classes}>
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
    );
  }
}

export default Banner;
