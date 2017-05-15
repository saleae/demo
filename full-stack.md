# Setup
## Computer setup
- Your favorite IDE/editor for javascript/web development
- Your favorite browser (to debug/run web apps)
- Git
- Node
- Mongo (or other)
- React
- Jasmine (or other)
- The zoom meeting client (https://zoom.us/download)
- Ideally, your PC microphone/headphones/speakers set up to work well with an online meeting

## Joining the call
- Please join the meeting using the zoom URL in the calender invite.  
- If your PC audio is NOT set up, please call us at the number in the invite.
- Once the call starts, please share your screen with us. 

## What to expect
- basic single-page application with react, node, and mongo;
- minimal/no starting boilerplate
- web search ok

# Growth Experiment Project

## The situation

We want to understand why people are visiting our website.  In particular, do they allready have our product - and are just there there for support -- or are they activly considering making a purchase.

We want to build a widget that will ask people, so we can get a better idea what's going on. 

## The starting point
We have a basic site on a Node/Express server.  Just a single page, for now. It's this page we want to add our widget to.

## Primary Requirements
- The widget should be a bar, stuck to the bottom of the screen as the user scrool.
- The widget should have a X at the right side that will collapse/hide the widget.
- There should be two options the user can chose:
  - I'm considering a purchase
  - I'm here for another reason
- After the user selects one of the two options, the bar should clear, and then display "Thanks!" for 3 seconds before collapsing/hiding.
- The user's selection should be saved in a database, preferably mongo, along with their session ID. and timestamp.

## Secondary Requirements
- The script/code for this widget should not download or execute entire until the existing page is complely done rendering for the user.
- The widget should remember if it has already been closed (for any reason) and so stay closed forever (or at least 60 days) for that user. 
- When collapsing/hiding the widget should animate down nicely.
