# Computer setup
- Your favorite IDE for javascript/web development
- Your favorite browser (to debug/run web apps)
- Node.js, NPM
- Your favorite database for use with javascript (Mongo, etc)
- The zoom meeting client (https://zoom.us/download)
- Ideally, your PC microphone/headphones/speakers set up to work well with an online meeting

# Joining the call
- Please join the meeting using the zoom URL in the calender invite.  
- If your PC audio is NOT set up, please call us at the number in the invite.
- Once the call starts, please share your screen with us. 

# What to expect
- getting data from a file into a database, and indexing the table for text search
- using react/angular to search and display results from the table
- drawing to HTML canvas
- using mouse input to scale/move the drawing


# Fast database search
Please download and extract this zip file: https://www.dropbox.com/s/7oxf6xmnp9xtye4/jtag_10E6_rows.zip?dl=0

It contains a text dump of some decoded protocol data. It's ~350MB in size. Here's what it looks like:

```
Time [s];TAP state;TDI;TDO
0.000000000000000;Run-Test/Idle;;
0.000303400000000;Select-DR-Scan;;
0.000305800000000;Select-IR-Scan;;
0.000308200000000;Test-Logic-Reset;;
0.000315400000000;Run-Test/Idle;;
0.000317800000000;Select-DR-Scan;;
0.000320200000000;Select-IR-Scan;;
0.000322600000000;Capture-IR;;
0.000325000000000;Shift-IR;0x01;0x50
etc
```

We want to search this data with a simple search bar, and have the results populate below as we type, instantly.

### import.js (run as 'node import')
First, let's get this csv file pulled into a database so that we can text search it quickly. Any database you like. Single column of data (ignore the csv delimiter, we'll just treat it as lines of regular text).  Index the column so that it'll be fast to do text searches. Save the resulting database to a file so we can load it later.

### search.html, search.js (run from the browser)
Using react or angular, make a page that has a search field, and a large text box for the results.

- Start so what you type in the the search bar shows up in the results box in real time, to check that things are working.
- Now, make it so that each time the search field is updated in any way, the first 25 results which contain the exact search string, are populated in the results box. (previous results are cleared).

## Interactive display
In the data folder, the file analog_data.csv contains analog waveform data.  Let's draw this on the browser screen.

### draw.html, draw.js (run from the browser)
- Create a canvas element that's 800x600. (or something else)
- Draw a little circle on the canvas, 3x3 px and green (or whatever you like).
- import, and draw all the points in the analog_data.csv file, such that the entire set fits perfectly into the canvas.
- remap the points so that the data set now spans 3x wider than canvas width.  Keep the height the same.
- use the mouse to drag the graph left and right.
- use the mouse scroll wheel to adjust the horizontal "zoom" between x1 and x10 (multiples of the canvas width)
- make sure that position of the waveform doesn't move around while zooming.  The zooming should be centered on the mouse pointer.
- Bonus: The zooming should animate so it's not jumpy;
- Bonus: When releasing the mouse after a click-and-drag, the graph should have momentum.
