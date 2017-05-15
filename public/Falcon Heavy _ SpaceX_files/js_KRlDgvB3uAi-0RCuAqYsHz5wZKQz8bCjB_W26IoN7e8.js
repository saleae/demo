// ------------ jodo ------------
// Module : Animated Sprite
// Version : 2.2
// Modified : 2012-09-06 by Christopher Mischler
// Dependencies : jQuery 1.7.1+
// ------------------------------

/*
 *	The comment structure is compatible with NaturalDocs for compiling Documentation. 
 *	Please keep this in mind if you make any updates.
*/


/*
	Class: AnimatedSprite
   		Animates an image spritesheet
*/ 

/*
	Group: AnimatedSprite
	> SlideControl( $target, sprite, opts )

	Dependencies:
    	 jQuery 1.7.1+

	Parameters:
    	$target - ($Object, Required): Img element to be animated.			
    	sprite - (String, Required): URL of sprite-sheet
    	opts - (Plain js Object, Default: {} ): Used to pass in custom options.

    opts:
    	Possible values to be passed in through the _opts_ parameter

    	fps - (Integer, Default: 30): Frames per second. Note that this will end up being approximate, thanks to weird JS timer issues
    	playing - (Boolean, Default: true): Should the animation begin playing as soon as the sprite is loaded?
    	loop - (Boolean or Integer, Default: true): Should the animation loop? The first play doesn't count as a loop, so if you pass in 1, the animation will play twice
    	startingFrame - (Boolean, Default: true): Which frame to start on
    	forward - (Boolean, Default: true): True if playing forward, false if playing backward
    	frameWidth - (Integer, Default: $target.width): If the width is anything other than the placeholder width, declare it here
    	frameHeight - (Integer, Default: $target.height): If the height is anything other than the placeholder height, declare it here
    	numFrames - (Integer or Boolean, Default: false): If false, numFrames will be auto-computed
    	orientation - (String, Default: "h"): How the frames are stacked in the sprite. "h" for horizontal, "v" for vertical ("b" for both, is not implemented yet)
    	blankImgPath - (String, Default: "xbaseURLx/img/blankForIE7.png"): Path to blank image for IE7
*/



function AnimatedSprite($target, sprite, opts) {
	var th=this, prevID, tempID;

	if(!$target.is("img") || !sprite) return false;

	var isJquery = $target instanceof jQuery;
	console.log("isJquery: " + isJquery);

	$target.on("load.animatedSprite", function() {
		// Unbind this loader so it doesn't trigger again farther down when the src is set to our 1x1 gif
		$(this).off("load.animatedSprite");
		
		$.extend(
			th,
			{
				"fps" : 30, // Frames per second. Note that this will end up being approximate, thanks to weird JS timer issues
				"playing" : true, // Should the animation begin playing as soon as the sprite is loaded?
				"loop" : true, // Can pass in a boolean or an integer. The first play doesn't count as a loop, so if you pass in 2, the animation will play 3 times
				"startingFrame" : 0, // Which frame to start on
				"forward" : true, // True if playing forward, false if playing backward
				"frameWidth" : $target.width(), // If the width is anything other than the placeholder width, declare it here
				"frameHeight" : $target.height(), // If the height is anything other than the placeholder height, declare it here
				"numFrames" : false, // If false, numFrames will be auto-computed
				"orientation" : "h", // How the frames are stacked in the sprite. "h" for horizontal, "v" for vertical, "b" for both
				"blankImgPath" : "xbaseURLx/img/blankForIE7.png" // path to blank image for IE7
			},
			opts,
			{
				$el : $target,
				// $loader : null,
				spriteLoaded : false,
				frame : {h:0,v:0},
				origSrc : $target.attr("src"), // Save this to set everything back if AnimatedSprite.destruct() is called
				sprite : sprite,
				timer : {h:null,v:null}
			}
		);
		
		function propToHVObj(prop) {
			var o;
			if($.isPlainObject(prop)) {
				o = {
					h : prop.h === undefined ? 0 : typeof prop.h == "number" ? parseInt(prop.h) : !!prop.h,
					v : prop.v === undefined ? 0 : typeof prop.v == "number" ? parseInt(prop.v) : !!prop.v
				};
			} else {
				switch(th.orientation) {
					case "b": o = {h:(typeof prop=="number")?parseInt(prop):!!prop, v:(typeof prop=="number")?parseInt(prop):!!prop}; break;
					case "h": o = {h:(typeof prop=="number")?parseInt(prop):!!prop, v:(typeof prop=="number")?0:false}; break;
					case "v": o = {h:(typeof prop=="number")?0:false, v:(typeof prop=="number")?parseInt(prop):!!prop}; break;
				}
			}
			return o;
		}
		
		th.orientation = (th.orientation==="b" || th.orientation==="h" || th.orientation==="v") ? th.orientation : "h";
		
		th.fps = propToHVObj(th.fps);
		th.fps.h = parseInt(th.fps.h) > 0 ? parseInt(th.fps.h) : 30; 
		th.fps.v = parseInt(th.fps.v) > 0 ? parseInt(th.fps.v) : 30;
		
		th.playing = propToHVObj(th.playing);
		th.loop = propToHVObj(th.loop);
		th.startingFrame = propToHVObj(th.startingFrame);
		th.forward = propToHVObj(th.forward);
		th.numFrames = propToHVObj(th.numFrames);
		th.speed = {h:(1000/th.fps.h), v:(1000/th.fps.v)};
		
		// Set up a dummy img to load the sprite asset in the background.
		th.$loader = $("<img/>", {
			//cache buster IE -
			src : sprite + "?" + new Date().getTime() ,
			load: function() {
				var wd, ht, maxFrames;
				
				th.$el.trigger("spriteLoad.animatedSprite");
				th.spriteLoaded = true;
				
				// Gotta put it in the DOM real quick so we can check the width and height of the sprite image
				$(this).appendTo("body");
				wd = $(this).width();
				ht = $(this).height();
				$(this).remove();
				
				// What's the maximum number of frames the sprite supports, given this.frameWidth and this.frameHeight
				maxFrames = {h : Math.floor(wd/th.frameWidth), v : Math.floor(ht/th.frameHeight)};
				
				// Use maxFrames to determine this.numFrames if necessary.
				th.numFrames.h = (th.numFrames.h === false || th.numFrames.h < 1 || th.numFrames.h > maxFrames.h) ? maxFrames.h : th.numFrames.h;
				th.numFrames.v = (th.numFrames.v === false || th.numFrames.v < 1 || th.numFrames.v > maxFrames.v) ? maxFrames.v : th.numFrames.v;
				
				// Make sure this.startingFrame is valid
				th.startingFrame.h = th.startingFrame.h < th.numFrames.h ? th.startingFrame.h : th.numFrames.h-1;
				th.startingFrame.v = th.startingFrame.v < th.numFrames.v ? th.startingFrame.v : th.numFrames.v-1;
				
				// Set the src of the $target image to our 1x1 transparent gif and save this AnimatedSprite object as jQ data.
				th.$el.bind("error.animatedSprite", function() {
					th.$el.unbind("error.animatedSprite");
					// 			prevID = th.$el.attr("id");
					// 			tempID = "jodotemp";
					// 			while($("#"+tempID).length) { tempID = "jodotemp"+Math.floor((Math.random()*1E4)).toString(16); }
					// 			th.$el.attr("id", tempID);
					// 			// Document.write
					// 			var docloc = document.location.href+"jodo.animatedsprite.2.0.js";
					// 			var scrpt = document.createElement("script");
					// 			scrpt.type = "text/javascript";
					// 			scrpt.text = 'document.getElementById("'+tempID+'").src = "mhtml:'+docloc+'!blank"; alert(document.getElementById("'+tempID+'").src);';
					// 			document.body.appendChild(scrpt);
					// 			
					// 			document.body.removeChild(scrpt);
					// 			!!prevID ? th.$el.attr("id", prevID) : th.$el.removeAttr("id");
					// 			//alert(document.location.href);
					// 			//th.$el.attr("src", "mhtml:"+document.location.href+"/jodo.animatedsprite.2.0.js!blank.gif");
					th.$el.attr("src", "about:blank");
				});
				

				if ($.browser.msie && $.browser.version < 8){
					th.$el.attr("src", th.blankImgPath).data("animatedSprite", th);
				} else {
					// Nasty string is the data URI for a 1x1 transparent gif
					th.$el.attr("src", "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==").data("animatedSprite", th);
				}

				// Explicitly set the $target image dimensions to this.frameHeight and this.frameWidth
				th.$el.width(th.frameWidth).height(th.frameHeight).css({
					// Set the sprite as the background image
					backgroundImage : "url('"+th.sprite+"')",
					backgroundRepeat : "no-repeat",
					backgroundPosition : "0px 0px"
				});
				
				th.goToFrame(th.startingFrame.h, "h");
				th.goToFrame(th.startingFrame.v, "v");
				
				// Auto-play if this.playing is true
				th.playing.h && !(th.playing.h = false) && th.play("h");
				th.playing.v && !(th.playing.v = false) && th.play("v");
			}
		});	
	});
	
	// If the image is already loaded by the time the Animated Sprite object is instantiated, this will fire and trigger the load function anyway
	//alert($target.width()); // Load isn't getting triggered in IE because it think the width() of the $target is 0 even after all this is run on $(window).load()!
	if ($target.get(0).complete && $target.width() > 0) {
		$target.trigger("load");
	}
};



/*
	Group: Methods
*/
/*
	Method: isPlaying
		Lets you check the status of either (or both) axes of sprite animations.

	Parameters: 
		direction - (String, Default: th.orientation ("h")): "h" for horizontal, "v" for vertical
				
	Returns: 
		Boolean - .
*/
AnimatedSprite.prototype.isPlaying = function(direction) {
	var th = this, dir = (direction==="b" || direction==="h" || direction==="v") ? direction : th.orientation;
	return dir === "b" ? (th.playing["h"] && th.playing["v"]) : th.playing[dir];
};


/*
	Method: play
		Starts the frameloop of the animation and handles all looping logic.

	Parameters: 
		direction - (String, Default: th.orientation ("h")): "h" for horizontal, "v" for vertical
				
	Returns: 
		AnimatedSprite - .
*/
AnimatedSprite.prototype.play = function(direction) {
	var th = this, dir;
	function fGo(g) {
		th.goToFrame(g, dir);
		th.timer[dir] = setTimeout(tick, th.speed[dir]);
	}
	function tick() {
		// Increment of decrement this.frame based on the value of this.forward
		var f = th.frame[dir] + (th.forward[dir] ? 1 : -1);
		
		// If f is in the middle of the sprite, we can handle this frame normally
		if(f >= 0 && f < th.numFrames[dir]) {
			fGo(f)
		// If f is not in the middle of the sprite, check to see if we should loop
		} else if(!!th.loop[dir]) {
			// If this.loop is a number, decrement it (since it'll act like a counter)
			th.loop[dir] !== true && th.loop[dir]--;
			
			// Normalize f to between 0 and this.numframes
			f = (f+th.numFrames[dir]) % th.numFrames[dir];
			
			var evt = jQuery.Event('loop.animatedSprite');
			evt.direction = dir;

			// Triggering custom event on image element throws error in IE
			if (!window.attachEvent) {
				th.$el.trigger(evt);
			} else {
				th.$el.parent().trigger(evt);
			}

			fGo(f);
		} else {
			// If f is less than 0 or greater than this.numFrames and this.loop is false, pause the animation
			th.playing[dir] = false;
			// If the opposite orientation (h or v) isn't playing either, remove the class
			th.playing[(dir === "h" ? "v" : "h")] || th.$el.removeClass("playing");
		}
	}
	
	dir = (direction==="b" || direction==="h" || direction==="v") ? direction : th.orientation;
	
	// If the direction is "b" for "both", play() for both orientations.
	if(dir === "b") { return th.play("h").play("v"); }
	
	if(th.spriteLoaded && !th.playing[dir]) {
		th.$el.trigger({type:"play.animatedSprite", direction:dir});
		th.playing[dir] = true;
		th.$el.addClass("playing");
		
		fGo(th.frame[dir]);
	}
	return this;
};

/*
	Method: pause
		Stops the frameloop of the animation and clears the timer.

	Parameters: 
		direction - (String, Default: th.orientation ("h")): "h" for horizontal, "v" for vertical
				
	Returns: 
		AnimatedSprite - .
*/
AnimatedSprite.prototype.pause = function(direction) {
	var th=this, dir;
	
	dir = (direction==="b" || direction==="h" || direction==="v") ? direction : th.orientation;
	
	// If the direction is "b" for "both", pause() for both orientations.
	if(dir === "b") { return th.pause("h").pause("v"); }
	
	if(th.spriteLoaded && th.playing[dir]) {
		clearTimeout(th.timer[dir]);
		th.playing[dir] = false;
		// If the opposite orientation (h or v) isn't playing either, remove the class
		th.playing[(dir === "h" ? "v" : "h")] || th.$el.removeClass("playing");
		th.$el.trigger({type:"pause.animatedSprite", direction:dir});
	}
	return this;
};

/*
	Method: goToFrame
		Handles the logic necessary to position the sprite and display a specific frame of the animation.

	Parameters: 
		i - (Integer, Required): frame number to jump to
		direction - (String, Default: th.orientation ("h")): "h" for horizontal, "v" for vertical
				
	Returns: 
		AnimatedSprite - .
*/
AnimatedSprite.prototype.goToFrame = function(i, direction) {
	var th=this, bp, dir;
	i = parseInt(i);
	
	dir = (direction==="b" || direction==="h" || direction==="v") ? direction : th.orientation;
	
	// If the direction is "b" for "both", goToFrame() for both orientations.
	if(dir === "b") { return th.goToFrame(i, "h").goToFrame(i, "v"); }
	
	if(th.spriteLoaded && i >= 0 && i < th.numFrames[dir]) {
		if(!!th.$el.css("backgroundPositionX")) {
			dir==="h" ? th.$el.css("backgroundPositionX", -1*i*th.frameWidth) : th.$el.css("backgroundPositionY", -1*i*th.frameHeight);
		} else {
			bp = parseInt(th.$el.css("backgroundPosition").split(" ")[dir==="h" ? 1 : 0]);
			th.$el.css({backgroundPosition : dir==="h" ? ("-"+(i*th.frameWidth)+"px "+bp+"px") : (bp+"px -"+(i*th.frameHeight)+"px")});
		}
		th.frame[dir] = i;
	}
	return this;
};

/*
	Method: reverse
		Flips the bit on the this.forward property.

	Parameters: 
		direction - (String, Default: th.orientation ("h")): "h" for horizontal, "v" for vertical
				
	Returns: 
		AnimatedSprite - .
*/
AnimatedSprite.prototype.reverse = function(direction) {
	var dir = (direction==="b" || direction==="h" || direction==="v") ? direction : this.orientation;

	// If the direction is "b" for "both", goToFrame() for both orientations.
	if(dir === "b") { return th.reverse("h").reverse("v"); }

	if(this.spriteLoaded) {
		this.forward[dir] = !this.forward[dir];
		this.$el.trigger({type:"reverse.animatedSprite", direction:dir});
	}
	return this;
};

/*
	Method: stop
		Pauses the animation, clears the timer, and jumps to this.startingFrame.

	Parameters: 
		direction - (String, Default: th.orientation ("h")): "h" for horizontal, "v" for vertical
				
	Returns: 
		AnimatedSprite - .
*/
AnimatedSprite.prototype.stop = function(direction) {
	var th=this, dir = (direction==="b" || direction==="h" || direction==="v") ? direction : this.orientation;

	// If the direction is "b" for "both", goToFrame() for both orientations.
	if(dir === "b") { return th.stop("h").stop("v"); }
	
	if(th.spriteLoaded) {
		clearTimeout(th.timer[dir]);
		th.playing[dir] = false;
		// If the opposite orientation (h or v) isn't playing either, remove the class
		th.playing[(dir === "h" ? "v" : "h")] || th.$el.removeClass("playing");
		
		th.goToFrame(th.startingFrame[dir], dir);
		th.$el.trigger({type:"stop.animatedSprite", direction:dir});
	}
	return this;
};

/*
	Method: destruct
		Removes all evidence that this object ever existed and returns the original $target
				
	Returns: 
		$target - .
*/
AnimatedSprite.prototype.destruct = function() {
	var th=this;
	clearTimeout(th.timer.h);
	clearTimeout(th.timer.v);
	th.playing = {h:false, v:false};
	th.$loader.remove();
	th.$el.removeClass("playing").css({
		backgroundImage : "inherit",
		backgroundRepeat : "inherit"
	}).attr("src", th.origSrc).removeData("animatedSprite").trigger("destruct.animatedSprite");
	th.$el.unbind("error.animatedSprite");
	return th.$el;
};

 
/*
	Group: jQuery Wrapper
*/
/*
	Method: $.fn.animatedSprite
   		jQuery Wrapper for AnimatedSprite

	Parameters:
    	sprite - (String, Default: "data-sprite" attribute): URL of sprite-sheet. If left out, the bootstrapper will look in the target element for an HTML5 data attribute called "sprite".
    	opts - (Plain js Object, Default: {} ): Used to pass in custom options.

    opts:
    	Possible values to be passed in through the _opts_ parameter

    	fps - (Integer, Default: 30): Frames per second. Note that this will end up being approximate, thanks to weird JS timer issues
    	playing - (Boolean, Default: true): Should the animation begin playing as soon as the sprite is loaded?
    	loop - (Boolean or Integer, Default: true): Should the animation loop? The first play doesn't count as a loop, so if you pass in 1, the animation will play twice
    	startingFrame - (Boolean, Default: true): Which frame to start on
    	forward - (Boolean, Default: true): True if playing forward, false if playing backward
    	frameWidth - (Integer, Default: $target.width): If the width is anything other than the placeholder width, declare it here
    	frameHeight - (Integer, Default: $target.height): If the height is anything other than the placeholder height, declare it here
    	numFrames - (Integer or Boolean, Default: false): If false, numFrames will be auto-computed
    	orientation - (String, Default: "h"): How the frames are stacked in the sprite. "h" for horizontal, "v" for vertical ("b" for both, is not implemented yet)
    	blankImgPath - (String, Default: "xbaseURLx/img/blankForIE7.png"): Path to blank image for IE7
    
	Returns: 
		new AnimatedSprite - (unless it already exists for this element, then returns the existing AnimatedSprite)
*/


(function($){
$.fn.animatedSprite = function(sprite, opts) {
	var $th = $(this).eq(0);
	if(!$th.is("img")) {
		return $(this);
	} else if($th.data("animatedSprite")) {
		return $th.data("animatedSprite");
	} else {
		return (sprite || typeof $th.data("sprite") === "string") ? (new AnimatedSprite($th, (sprite ? sprite : $th.data("sprite")), opts)) : false;
	}
}
})(jQuery);;
// ------------ JODO ------------
// Module: Carousel
// Version: 1.2
// Modified: 2012-10-16 by Glen Cheney
// Dependencies: jQuery 1.7+, Modernizr, jodo.timer.js
// Optional: jQuery throttle-debounce (only used on window resize)
// ------------------------------

/*global jQuery, Modernizr */

(function($, Modernizr, window, undefined) {

    "use strict"; // jshint ;_;

    var Carousel = function($el, opts) {
        $.extend(this, $.fn.carousel.defaults, opts, $.fn.carousel.settings);
    
        // Private methods: init, paginate, gestures, nav
        var init = function() {
            var t = this,
            transEndEventNames = {
                'WebkitTransition' : 'webkitTransitionEnd',
                'MozTransition'    : 'transitionend',
                'OTransition'      : 'oTransitionEnd',
                'msTransition'     : 'MSTransitionEnd',
                'transition'       : 'transitionend'
            };

            t.$el = $el;
            t.$parent = t.$el.parent();
            t.slides = t.childFilter === null ? t.$el.children() : t.$el.children(t.childFilter);

            // Get the right prefixed names e.g. WebkitTransitionDuration
            t.tapOrClick = t.hasTouch ? 'touchstart' : 'click';
            t.transformName = Modernizr.prefixed('transform'); // css version
            t.transitionName = Modernizr.prefixed('transition');
            t.transitionProperty = Modernizr.prefixed('transitionProperty');
            t.transitionDuration = Modernizr.prefixed('transitionDuration');
            t.transitionEasing = Modernizr.prefixed('transitionTimingFunction');
            t.transitionEnd = transEndEventNames[t.transitionName];
            
            // Set the slide width to the width of the first slide, if it's undefined
            setDimensions.call(t);

            // Gotta have 3d transforms to do 3d transforms yo.
            if (t.transition === 'convex' && !t.hasTransforms3d) {
                t.transition = 'slide';
                t.$el.css('overflow', 'hidden');
            }

            if (t.transition === 'slide' && t.loopAround === false) {
                t.transition = 'container';
            }

            // Set up CSS for different effects
            t.effects[t.transition].init.call(t);

            nav.call(t);
            
            // Add the index buttons
            if (t.showIndexBtns === true) {
                paginate.call(t);
            }
            
            // Set up gesture events
            gestures.call(t);

            // Update things when the window is resized. And now. Use throttle/debounce if it's available
            var resizeFunc = $.throttle ? $.throttle(200, $.proxy(t._onResize, t)) : $.proxy(t._onResize, t);
            $(window).on('resize', resizeFunc).on('load', function() {
                if (setDimensions.call(t)) {
                    t.effects[t.transition].init.call(t);
                }
                t._onResize(true);
            });
            t._onResize();

            // Now that we've resized the container, make the images variable width/height
            t.slides.find('img, video, embed, object').css({ maxWidth: '100%', height: 'auto'});
            

            if (t.timeout && t.pauseOnHover) {
                t.$el.hover(function() {
                    t.pause(true);
                }, function() {
                    t.resume(true);
                });
            }

            // Slide to starting slide
            if (t.slides.length > 1) {
                t.isCarousel = true;
                t.slideToIndex(t.start);
                t.canGoNext = true;
                t.canGoPrev = true;
            }
        },

        setDimensions = function() {
            var t = this,
                changed = false;

            if (t.slideWidth === undefined || t.slideWidth === 0) {
                t.slideWidth = t.slides.eq(t.currIndex).outerWidth(true);
                changed = true;
            }
            if (t.slideHeight === undefined || t.slideHeight === 0) {
                t.slideHeight = t.slides.eq(t.currIndex).outerHeight(true);
                changed = true;
            }
            t.$el.height(t.slideHeight);
            return changed;
        },

        paginate = function() {
            var t = this,
            numBtns = Math.ceil(t.slides.length / t.step),
            i = 0,
            $nav = $('<nav class="carousel-controls" />'),
            $parent = t.putControlsInside ? t.$el : t.$parent,
            navigate = function(e) {
                var btnIndex = $(e.target).data('index');
                if (btnIndex === t.currIndex) { return; }

                // if only moving 1, just go for it
                if (Math.abs(t.currIndex - btnIndex) < 2) {
                    t.slideToIndex(btnIndex * t.step);
                }

                // if moving more than 1, cycle through quickly to keep things in sync.
                else {
                    var dist = btnIndex - t.currIndex,
                    delayedStart;
                    i = t.currIndex;
                    
                    if (dist > 0) {
                        // going up
                        delayedStart = setInterval(function() {
                            i++;
                            if (i <= btnIndex) {
                                t.slideToIndex(i * t.step, i !== btnIndex);
                            } else {
                                clearInterval(delayedStart);
                            }
                        }, 50);

                    } else {
                        // going down
                        delayedStart = setInterval(function() {
                            i--;
                            if (i >= btnIndex) {
                                t.slideToIndex(i * t.step, i !== btnIndex);
                            } else {
                                clearInterval(delayedStart);
                            }
                        }, 50);
                    }

                }
            },
            $ol = $('<ol/>', {'class' : t.indexButtonClass, 'style' : 'padding: 0;'});
            t.indexBtns = [];
            
            // Loop through all the index buttons and add events to them
            for (; i < numBtns; i++) {
                var title,
                    btn = $('<li class="carousel-index-btn" />');

                // Insert the title into the button if that's cool.
                if (t.useTitles) {
                    title = t.slides.eq(i).data('title') || t.slides.eq(i).attr('title');
                    btn.text(title);
                }

                t.indexBtns.push(btn);
                btn.data('index', i)
                    .appendTo($ol)
                    .on(t.tapOrClick, navigate);
            }

            // Append the index buttons to the carousel controls
            $nav.append($ol);
            $parent.append($nav);

            // resize & center the btnList, so
            if (t.autoCenterIndexBtns) {
                var btnListWidth = 0;
                $ol.children().each(function() {
                    btnListWidth += $(this).outerWidth(true);
                });

                $ol.css({
                    width: btnListWidth + 'px',
                    margin: 'auto'
                });
            }
        },

        gestures = function() {
            var t = this,
            coords = {
                startX: null,
                startY: null,
                endX: null,
                endY: null
            },
            lastTouch = 0;

            t.$el.on('touchstart', function(e) {
                coords.startX = e.originalEvent.targetTouches[0].clientX;
                coords.startY = e.originalEvent.targetTouches[0].clientY;
                coords.endX = coords.startX;
                coords.endY = coords.startY;
            });

            t.$el.on('touchmove', function(e) {
                var newX = e.originalEvent.targetTouches[0].clientX,
                    newY = e.originalEvent.targetTouches[0].clientY,
                    absX = Math.abs(coords.endX - newX),
                    absY = Math.abs(coords.endY - newY);

                // If we've moved more Y than X, we're scrolling vertically
                if (absX < absY && t.swipe === 'horizontal') {
                    return;
                }

                // Prevents the page from scrolling left/right
                e.preventDefault();

                coords.endX = newX;
                coords.endY = newY;
            });

            t.$el.on('touchend', function(e) {
                var swipe = {},
                    deltaX = coords.startX - coords.endX,
                    deltaY = coords.startY - coords.endY,
                    absX = Math.abs(deltaX),
                    absY = Math.abs(deltaY),
                    now = new Date().getTime();

                swipe.distance = (absX > absY) ? absX : absY;
                swipe.direction = (absX < absY) ?
                    (deltaY < 0 ? 'down' : 'up') :
                    (deltaX < 0 ? 'right' : 'left');

                // If we have a swipe of > 50px, let's use it!
                if (swipe.distance > 50) {
                    if ((swipe.direction === 'left' && t.swipe === 'horizontal') || (swipe.direction === 'up' && t.swipe === 'vertical')) {
                        t.advance();
                    } else if ((swipe.direction === 'right' && t.swipe === 'horizontal') || (swipe.direction === 'down' && t.swipe === 'vertical')) {
                        t.retreat();
                    }
                }

                if (now - lastTouch < 350) {
                    t.trigger(t.doubleTapEvent, [e, t]);
                }
                lastTouch = now;

            });
        },

        nav = function() {
            var $nav,
            t = this,
            span = '<span/>',
            $parent = t.putControlsInside ? t.$el : t.$parent;

            if (t.slides.length < 2) {
                return;
            }

            // Add the buttons
            if (t.generateNav && t.showPrevNextBtns) {

                // Create and append the carousel controls
                $nav = $('<nav/>',{'class':'carousel-btns'});

                // Next button
                t.btnNext = $(span, {
                    'class' : t.genButtonClass + ' ' + t.nextButtonClass
                });

                // if there needs to be an innerButton create it; otherwise set btnNextInner as t.btnNext
                if (t.prevNextInnerButtonClass === '') {
                    t.btnNext.html('&rsaquo;');
                } else {
                    $(span, {'class' : t.prevNextInnerButtonClass}).html('&rsaquo;').appendTo(t.btnNext);
                }

                $nav.append(t.btnNext);

                // prev button
                t.btnPrev = $(span, {
                    'class' : t.genButtonClass + ' ' + t.prevButtonClass
                });

                // if there needs to be an innerButton create it; otherwise set btnNextInner as t.btnNext
                if (t.prevNextInnerButtonClass === '') {
                    t.btnPrev.html('&lsaquo;');
                } else {
                    $(span, {'class' : t.prevNextInnerButtonClass}).html('&lsaquo;').appendTo(t.btnPrev);
                }

                $nav.append(t.btnPrev);
                $parent.append($nav);
            }

            // They probably already made their own nav. Just add events to the buttons
            else if (!t.generateNav && t.showPrevNextBtns) {
                t.btnNext = $parent.find('.' + t.nextButtonClass);
                t.btnPrev = $parent.find('.' + t.prevButtonClass);
            }

            // Bind events
            if (t.showPrevNextBtns) {
                t.btnNext.on(t.tapOrClick, function() {
                    if (!t.btnNext.hasClass(t.disabledClass)) {
                        t.advance();
                    }
                });

                t.btnPrev.on(t.tapOrClick, function() {
                    if (!t.btnPrev.hasClass(t.disabledClass)) {
                        t.retreat();
                    }
                });
            }


            // Add slideCount text container
            if (t.showSlideCountTxt) {
                // See if it's on the page already in case they've made their own
                t.slideCountTxt = $parent.find('.' + t.slideCountTxtClass);
                var found = t.slideCountTxt.length > 0;
                
                // Generate span with slide count text in it if we didn't find it
                if (!found) {
                    t.slideCountTxt = $(span, {
                        'class' : t.slideCountTxtClass
                    });
                }

                t._setSlideCount(t.currIndex);

                if (!found) {
                    $parent.append(t.slideCountTxt);
                }
            }
            
            if (t.canClickElement === true) {
                t.slides.each(function(i) {
                    $(this).on(t.tapOrClick, function(e) {
                        e.preventDefault();
                        t.slideToIndex(i);
                    });
                });
            }
        };
        
        init.call(this);
    };

    Carousel.prototype.advance = function() {
        var t = this,
        prevIndex = t.currIndex;

        if (!t.canGoNext) {
            return;
        }

        t.currIndex += t.step;

        if (t.currIndex > t.slides.length - t.step) {
            t.currIndex = 0;
        }

        t.slide(t.currIndex, prevIndex, 'advance');
    };

    Carousel.prototype.retreat = function() {
        var t = this,
        prevIndex = t.currIndex;

        if (!t.canGoPrev) {
            return;
        }

        t.currIndex -= t.step;

        if (t.currIndex < 0) {
            t.currIndex = t.slides.length - 1;
        }

        t.slide(t.currIndex, prevIndex, 'retreat');
    };

    // isQuickSlide means the slide is being skipped/gone through quickly but still shown
    Carousel.prototype.slideToIndex = function(index, isQuickSlide) {
        var t = this,
        prevIndex = t.currIndex,
        direction;
        if (index === prevIndex) {
            prevIndex = t.slides.length - 1;
        }
        direction = index > prevIndex ? 'advance' : 'retreat';
        t.currIndex = index;
        t.slide(t.currIndex, prevIndex, direction, isQuickSlide);
    };

    Carousel.prototype.slide = function(index, prevIndex, direction, isQuickSlide) {
        var t = this,
            tx = -(index * t.slideWidth);

        // Trigger our slide start event for those interested
        t.trigger(t.slideStartEvent, [index, prevIndex, direction, t]);
        

        // if buttons are visible, and loop=false and loopAround=false, disable first or last button when you get to an end
        if (t.showPrevNextBtns && t.btnNext && t.btnPrev && !t.loopAround && !t.loop) {
            t.btnNext.add(t.btnPrev).filter('.' + t.disabledClass).removeClass(t.disabledClass);
            t.canGoNext = true;
            t.canGoPrev = true;

            if (index === 0) {
                t.btnPrev.addClass(t.disabledClass);
                t.canGoPrev = false;
            } else if (index === t.slides.length - 1) {
                t.canGoNext = false;
                t.btnNext.addClass(t.disabledClass);
            }
        }
            
        // Update text
        if (t.showSlideCountTxt) {
            t._setSlideCount(index + 1);
        }

        // Transition
        t._transition(tx, index, prevIndex, direction);
        
        // Add active class to current slide
        t.slides.removeClass(t.activeClass).eq(index).addClass(t.activeClass);
        
        // Add active class to current index button
        t._highlightIndexButton();

        // Adjust the container's height
        if (t.autoResize) {
            t._autoResizeHeight();
        }

        // Decide what to do with the timer
        if (t.timeout) {
            if (!t.isPaused && !isQuickSlide) {
                t._setTimer(index, prevIndex, direction);
            } else if (t.isPaused) {
                if (t.timer) {
                    t.timer.reset();
                }
            }
        }

    };

    Carousel.prototype._setTimer = function(index, prevIndex, direction) {
        var t = this;

        // If timeout > 0, set a timer to advance
        if (t.timer) {
            t.timer.reset();
        }
        t.isPaused = false;
        t.trigger('timerStart', [index, prevIndex, direction, t]);
        t.timer = $.timer(function() {
            t.advance();
        }, t.timeout);

        t.pausedManually = false;
    };

    // highlight the correct index button
    Carousel.prototype._highlightIndexButton = function() {
        var t = this,
            $btn;
        if (t.showIndexBtns === true && t.indexBtns.length > 0) {
            $btn = $(t.indexBtns[ Math.floor(t.currIndex / t.step) ]);
            $btn.addClass(t.activeClass).siblings().removeClass(t.activeClass);
        }
    };

    // Do the transition
    Carousel.prototype._transition = function(tx, index, prevIndex, direction) {
        var t = this,
            $nextSlide = t.slides.eq(index),
            $prevSlide = t.slides.eq(prevIndex),
            complete = function() {
                t.trigger(t.slideEndEvent, [index, prevIndex, direction, t]);
            };

        t.effects[t.transition].transition.call(t, $nextSlide, $prevSlide, direction, complete, tx);
    };

    // Sets the transition duratio to zero,
    // sets the property's value,
    // forces a reflow so that the browser doesn't cache our changes,
    // resets the transition duration
    Carousel.prototype._skipTransition = function(element, property, value) {
        var t = this,
            reflow,
            duration = element.style[this.transitionDuration];

        element.style[t.transitionDuration] = '0ms'; // ms needed for firefox!
        element.style[property] = value;
        reflow = element.offsetWidth; // Force reflow
        element.style[t.transitionDuration] = duration;
    };

    Carousel.prototype.pause = function(fromHover) {
        var t = this,
            remaining;

        if (t.pausedManually || t.timer === null) {
            return;
        }

        remaining = t.timer.pause();
        t.pausedManually = fromHover === undefined;
        t.isPaused = true;
        t.$el.addClass('paused');
        t.trigger('paused', [remaining, t]);
    };

    Carousel.prototype.resume = function(fromHover) {
        var t = this,
            remaining;

        if (fromHover === undefined || t.pausedManually === false) {
            t.pausedManually = false;
            remaining = t.timer.resume();
            t.$el.removeClass('paused');
            t.isPaused = false;
            t.trigger('resumed', [remaining, t]);
        }
    };

    // On window resize, update the width/height of the carousel container
    Carousel.prototype._onResize = function() {
        var t = this,
            tempHeight = 0,
            $slide = t.slides.eq(t.currIndex);

        t.slideWidth = t.$el.parent().outerWidth(true);

        if (t.transition === 'container') {
            t.slides.css('width', t.slideWidth);
            t.$el.width(t.slides.length * t.slideWidth);
        } else {
            t.$el.width(t.slideWidth);
        }

        tempHeight = $slide.outerHeight();
        if (tempHeight === 0) {
            // Don't make it smaller onload
            return;
        }
        t.slideHeight = tempHeight;
        t.$el.height(t.slideHeight);
    };

    // Animates the height of the previous slide to the next slide
    Carousel.prototype._autoResizeHeight = function() {
        var t = this,
            $slide = t.slides.eq(t.currIndex);
        t.$el.animate({height: $slide.outerHeight(true)}, t.duration / 2, t.jsEasing);
    };

    Carousel.prototype._setSlideCount = function(index) {
        var i, span, txt,
            t = this,
            frag = document.createDocumentFragment(),
            data = {
                'carousel-count-prefix': t.slideCountPrefix,
                'carousel-count-current': index,
                'carousel-count-separator': t.slideCountSeparator,
                'carousel-count-total': t.slides.length
            };

        // If we don't need a prefix, delete it from the object so it's not looped through
        if (!t.slideCountPrefix) {
            delete data['carousel-count-prefix'];
        }

        for (i in data) {
            span = document.createElement('span');
            txt = document.createTextNode(data[i]);
            span.className = i;
            span.appendChild(txt);
            frag.appendChild(span);
        }

        t.slideCountTxt.html(frag);
    };

    // Borrowed from Modernizr source :)
    // Gets something like webkitTransform and makes it -webkit-transform
    Carousel.prototype.getPrefixed = function(prop) {
        return this.prefix(Modernizr.prefixed(prop));
    };

    Carousel.prototype.prefix = function(prop) {
        return prop.replace(/([A-Z])/g, function(str,m1){ return '-' + m1.toLowerCase(); }).replace(/^ms-/,'-ms-');
    };

    Carousel.prototype.trigger = function(name, args) {
        this.$el.trigger(name + '.' + this.Carousel, args);
    };

    Carousel.prototype.effects = {};

    // Slide container
    Carousel.prototype.effects.container = {

        init: function() {
            var t = this;
            t.slides.css('float', 'left');
            t.$el.width(t.slideWidth * t.slides.length);
            if (t.isCSS && t.hasTransforms) {
                t.$el.css(t.transitionName, t.prefix(t.transformName) + ' ' + t.duration + 'ms ' + t.cssEasing);
                
            } else {
                t.$el.css('marginLeft', t.start * t.slideWidth);
            }
        },

        transition: function($nextSlide, $prevSlide, direction, complete, tx) {
            var t = this,
            whichProperty = t.hasTransforms ? t.transformName : 'marginLeft',
            value;
            
            if (t.isCSS) {
                if (t.hasTransforms3d) {
                    value = 'translate3d(' + tx + 'px, 0, 0)';
                } else if (t.hasTransforms) {
                    value = 'translate(' + tx + 'px, 0)';
                } else {
                    value = tx + 'px';
                }

                t.$el.css(whichProperty, value).one(t.transitionEnd, complete);
            }

            // jQuery animate fallback
            else {
                t.$el.animate({marginLeft: tx}, t.duration, t.jsEasing, complete);
            }
        }
    };

    // Slide Continuous
    Carousel.prototype.effects.slide = {

        init: function() {
            var t = this;
            t.slides.each(function(index) {
                var offset = (index - t.currIndex) * t.slideWidth,
                whichProperty = t.hasTransforms ? t.transformName : 'left',
                value;

                offset += 'px';

                this.style.position = 'absolute';
                this.style.top = 0;
                this.style.left = 0;
                this.style.zIndex = 1;

                if (t.isCSS) {
                    if (t.hasTransforms3d) {
                        value = 'translate3d(' + offset + ', 0, 0)';
                    } else if (t.hasTransforms) {
                        value = 'translate(' + offset + ', 0)';
                    } else {
                        value = offset;
                    }

                    // Set transform
                    this.style[whichProperty] = value;

                    // Set transition
                    this.style[t.transitionName] = t.prefix(whichProperty) + ' ' + t.duration + 'ms ' + t.cssEasing;
                } else {
                    this.style.left = offset;
                }
            });
        },

        transition: function($nextSlide, $prevSlide, direction, complete) {
            var t = this,
                whichProperty,
                next = $nextSlide[0],
                prev = $prevSlide[0],
                nextSlideStart = direction === 'advance' ? t.slideWidth : -t.slideWidth,
                prevSlideEnd = -1 * nextSlideStart;

            if (t.isCSS) {
                var nextStartValue, nextEndValue, prevEndValue;
                whichProperty = t.hasTransforms ? t.transformName : 'left';

                // Determine what we should be using... there's probably a better way. DRY!
                if (t.hasTransforms3d) {
                    nextStartValue = 'translate3d(' + nextSlideStart + 'px, 0, 0)';
                    nextEndValue = 'translate3d(0, 0, 0)';
                    prevEndValue = 'translate3d(' + prevSlideEnd + 'px, 0, 0)';
                } else if (t.hasTransforms) {
                    nextStartValue = 'translate(' + nextSlideStart + 'px, 0)';
                    nextEndValue = 'translate(0, 0)';
                    prevEndValue = 'translate(' + prevSlideEnd + 'px, 0)';
                } else {
                    nextStartValue = nextSlideStart + 'px';
                    nextEndValue = 0;
                    prevEndValue = prevSlideEnd + 'px';
                }

                // don't show transition when we're moving things around
                t._skipTransition(next, whichProperty, nextStartValue);
                
                // Trigger transitions
                if (prev) {
                    prev.style[whichProperty] = prevEndValue;
                    prev.style.zIndex = 1;
                }
                next.style[whichProperty] = nextEndValue;
                next.style.zIndex = 2;

                // Trigger slide end event on transition end
                $nextSlide.one(t.transitionEnd, complete);
            }

            else {
                $nextSlide.css('left', nextSlideStart + 'px');
                $nextSlide.animate({left: 0}, t.duration, t.jsEasing);
                $prevSlide.animate({left: prevSlideEnd + 'px'}, t.duration, t.jsEasing);
            }
        }
    };

    // Fade
    Carousel.prototype.effects.fade = {

        init: function() {
            var t = this;
            t.slides.each(function() {
                this.style.position = 'absolute';
                this.style.top = 0;
                this.style.left = 0;
                this.style.zIndex = 1;

                if (t.isCSS) {
                    this.style.opacity = 0;
                    this.style[t.transitionName] = 'opacity ' + t.duration + 'ms ' + t.cssEasing;
                } else {
                    $(this).fadeOut();
                }
            });
        },

        transition: function($nextSlide, $prevSlide, direction, complete) {
            var t = this;
            if (t.isCSS) {
                $prevSlide.css({
                    opacity: 0,
                    zIndex: 1
                });
                $nextSlide.css({
                    opacity: 1,
                    zIndex: 2
                }).one(t.transitionEnd, complete);
            } else {
                $prevSlide.css({
                    zIndex: 1
                }).fadeOut(t.duration);
                $nextSlide.css({
                    zIndex: 2
                }).fadeIn(t.duration, complete);
            }
        }
    };

    // 3D transforms!
    Carousel.prototype.effects.convex = {

        init: function() {
            var t = this;
            t.slides.each(function(index) {
                this.style.position = 'absolute';
                this.style.top = 0;
                this.style.left = 0;

                // We already checked to make sure transforms are available, no need for fallbacks.
                this.style[t.transitionName] = 'all ' + t.duration + 'ms ' + t.cssEasing;
                this.style[Modernizr.prefixed('transformStyle')] = 'preserve-3d';
                this.style.zIndex = 1;
                this.parentNode.style[Modernizr.prefixed('perspective')] = '600px';
                this.style[t.transformName] = 'translate3d(100%, 0, 0) rotateY(90deg) translate3d(100%, 0, 0)';
                this.style.opacity = 0;
            });
        },

        transition: function($nextSlide, $prevSlide, direction, complete) {
            var t = this,
                next = $nextSlide[0],
                prev = $prevSlide[0],
                future = 'translate3d(100%, 0, 0) rotateY(90deg) translate3d(100%, 0, 0)',
                past = 'translate3d(-100%, 0, 0) rotateY(-90deg) translate3d(-100%, 0, 0)',
                nextStartPosition, prevEndPosition;
            
            if (direction === 'advance') {
                nextStartPosition = future;
                prevEndPosition = past;
            } else {
                nextStartPosition = past;
                prevEndPosition = future;
            }

            t._skipTransition(next, t.transformName, nextStartPosition);

            if (prev) {
                prev.style[t.transformName] = prevEndPosition;
                prev.style.opacity = 0;
            }

            next.style[t.transformName] = '';
            next.style.opacity = 1;

            // Trigger slide end event on transition end
            $nextSlide.one(t.transitionEnd, complete);
        }
    };

    Carousel.prototype.effects.vertical = {

        init: function() {
            var t = this;
            t.slides.each(function(index) {
                var offset = (index - t.currIndex) * t.slideHeight,
                whichProperty = t.hasTransforms ? t.transformName : 'top',
                value;

                offset += 'px';

                this.style.position = 'absolute';
                this.style.top = 0;
                this.style.left = 0;
                this.style.zIndex = 1;

                if (t.isCSS) {
                    if (t.hasTransforms3d) {
                        value = 'translate3d(0, ' + offset + ', 0)';
                    } else if (t.hasTransforms) {
                        value = 'translate(0, ' + offset + ')';
                    } else {
                        value = offset;
                    }

                    // Set transform
                    this.style[whichProperty] = value;

                    // Set transition
                    this.style[t.transitionName] = t.prefix(whichProperty) + ' ' + t.duration + 'ms ' + t.cssEasing;
                } else {
                    this.style.top = offset;
                }
            });
        },

        transition: function($nextSlide, $prevSlide, direction, complete) {
            var t = this,
                whichProperty,
                next = $nextSlide[0],
                prev = $prevSlide[0],
                nextSlideStart = direction === 'advance' ? t.slideHeight : -t.slideHeight,
                prevSlideEnd = -1 * nextSlideStart;

            if (t.isCSS) {
                var nextStartValue, nextEndValue, prevEndValue;
                whichProperty = t.hasTransforms ? t.transformName : 'top';

                // Determine what we should be using... there's probably a better way. DRY!
                if (t.hasTransforms3d) {
                    nextStartValue = 'translate3d(0, ' + nextSlideStart + 'px, 0)';
                    nextEndValue = 'translate3d(0, 0, 0)';
                    prevEndValue = 'translate3d(0, ' + prevSlideEnd + 'px, 0)';
                } else if (t.hasTransforms) {
                    nextStartValue = 'translate(0, ' + nextSlideStart + 'px)';
                    nextEndValue = 'translate(0, 0)';
                    prevEndValue = 'translate(0, ' + prevSlideEnd + 'px)';
                } else {
                    nextStartValue = nextSlideStart + 'px';
                    nextEndValue = 0;
                    prevEndValue = prevSlideEnd + 'px';
                }

                // don't show transition when we're moving things around
                t._skipTransition(next, whichProperty, nextStartValue);
                
                // Trigger transitions
                if (prev) {
                    prev.style[whichProperty] = prevEndValue;
                    prev.style.zIndex = 1;
                }
                next.style[whichProperty] = nextEndValue;
                next.style.zIndex = 2;

                // Trigger slide end event on transition end
                $nextSlide.one(t.transitionEnd, complete);
            }

            else {
                $nextSlide.css('top', nextSlideStart + 'px');
                $nextSlide.animate({top: 0}, t.duration, t.jsEasing);
                $prevSlide.animate({top: prevSlideEnd + 'px'}, t.duration, t.jsEasing);
            }
        }

    };

    $.fn.carousel = function(opts) {
        return this.each(function() {
            var $this = $(this),
                carousel = $this.data('carousel');

            if (!carousel) {
                carousel = new Carousel($this, opts);
                $this.data('carousel', carousel);
            }

            // Execute a function
            if (typeof opts === 'string') {
                carousel[opts]();
            }
        });
    };

    $.fn.carousel.defaults = {
        childFilter: null, // slides are selected with children(), specifiy a selector to filter the results
        step: 1, // currently not working great
        start: 0, // starting slide index (zero based)
        swipe: 'horizontal',
        generateNav: true, // Will generate and append the neccessary html elements for navigation if true
        genButtonClass: 'carousel-btn',
        prevButtonClass: 'carousel-btn-prev',
        nextButtonClass: 'carousel-btn-next',
        prevNextInnerButtonClass: '', // Optionally puts another element inside the .carousel-btn element
        indexButtonClass: 'carousel-index-btns',
        slideCountTxtClass: 'carousel-slide-count-txt',
        activeClass: 'active',
        disabledClass: 'disabled',
        showPrevNextBtns: true, // if false, carousel won't generate or attach events to nav buttons
        putControlsInside: false, // if true, carousel-controls div will be inside the container ($el). Otherwise it'll be a sibling
        showSlideCountTxt: false, // shows a counter for your slides like "2 of 6"
        slideCountPrefix: '', // Prefix your slides with something. e.g. "slide 1 of 5"
        slideCountSeparator: ' of ', // e.g. "3 of 5"
        showIndexBtns: true, // Shows pagination buttons
        useTitles: false, // Use the title or data-title attribute on the slide and put it in the index button
        autoCenterIndexBtns: false, // if true, will center index button ul within its container
        autoResize: false, // if true, the container's height will be resized with each slide to fit it's height
        canClickElement: false, //if this is true, you can click the element to slide it into focus
        transition: 'slide', // slide, fade, convex
        duration: 300, // Length (in milliseconds) of the animation/transition
        cssEasing: 'ease-out', // for css transitions. One of default, 'linear', 'ease-in', 'ease-out', 'ease-in-out', or 'cubic-bezier'
        jsEasing: 'swing', // jQuery's easing functions. Built in ones are only 'swing' and 'linear'
        loop: true, // as in, should the 'next' button be enabled at the end, and slide all the way back to the start? (and 'prev' to the end)
        loopAround: null, // loopAround, as in the last slide will appear to be a next consecutive slide, and not visibly rewind all the way back to the start/end
        timeout: 0, // if greater than zero, the carousel will automatically advance every `timeout` milliseconds. Default is 0.
        pauseOnHover: false // setting this to true will pause the slideshow on mouseover. Default is false.
    };

    $.fn.carousel.settings = {
        isCSS: Modernizr.csstransitions,
        hasTransforms: Modernizr.csstransforms,
        hasTransforms3d: Modernizr.csstransforms3d,
        hasTouch: Modernizr.touch,
        Carousel: 'Carousel',
        slideEndEvent: 'slideEnd',
        slideStartEvent: 'slideStart',
        doubleTapEvent: 'doubleTap',
        indexBtns: [],
        isCarousel: false,
        currIndex: 0,
        timer: null
    };

})(jQuery, Modernizr, window);;
// ------------ JODO ------------
// Module: Timer
// Version: 1.0
// Created: 2012-09-07 by Glen Cheney
// Updated: 2012-10-16 by Glen Cheney
// Dependencies: jQuery 1.4+
// ------------------------------

/*global jQuery */

(function($, window, undefined) {

    "use strict"; // jshint ;_;

    var Timer = function(fn, delay) {
        this.timerId = null;
        this.start = null;
        this.delay = delay;
        this.remaining = delay;
        this.fn = fn;
        this.resume();
    };

    // Clears current timer and sets this.remaining
    Timer.prototype.pause = function() {
        this.clear();
        this.remaining -= new Date() - this.start;
        return this.remaining;
    };

    // Sets start time and a timeout of this.remaining
    Timer.prototype.resume = function() {
        this.start = new Date();
        this.timerId = window.setTimeout(this.fn, this.remaining);
        return this.remaining;
    };

    // Sets time remaining to initial delay and clears timer
    Timer.prototype.reset = function() {
        this.remaining = this.delay;
        this.clear();
    };

    // Clears timer
    Timer.prototype.clear = function() {
        window.clearTimeout(this.timerId);
    };

    $.timer = function(fn, delay) {
        return new Timer(fn, delay);
    };
})(jQuery, window);;
/*
 * jQuery throttle / debounce - v1.1 - 3/7/2010
 * http://benalman.com/projects/jquery-throttle-debounce-plugin/
 * 
 * Copyright (c) 2010 "Cowboy" Ben Alman
 * Dual licensed under the MIT and GPL licenses.
 * http://benalman.com/about/license/
 */
(function(b,c){var $=b.jQuery||b.Cowboy||(b.Cowboy={}),a;$.throttle=a=function(e,f,j,i){var h,d=0;if(typeof f!=="boolean"){i=j;j=f;f=c}function g(){var o=this,m=+new Date()-d,n=arguments;function l(){d=+new Date();j.apply(o,n)}function k(){h=c}if(i&&!h){l()}h&&clearTimeout(h);if(i===c&&m>e){l()}else{if(f!==true){h=setTimeout(i?k:l,i===c?e-m:e)}}}if($.guid){g.guid=j.guid=j.guid||$.guid++}return g};$.debounce=function(d,e,f){return f===c?a(d,e,false):a(d,f,e!==false)}})(this);;
/*
 * jQuery Easing v1.3 - http://gsgd.co.uk/sandbox/jquery/easing/
 *
 * Uses the built in easing capabilities added In jQuery 1.1
 * to offer multiple easing options
 *
 * TERMS OF USE - jQuery Easing
 * 
 * Open source under the BSD License. 
 * 
 * Copyright © 2008 George McGinley Smith
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without modification, 
 * are permitted provided that the following conditions are met:
 * 
 * Redistributions of source code must retain the above copyright notice, this list of 
 * conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list 
 * of conditions and the following disclaimer in the documentation and/or other materials 
 * provided with the distribution.
 * 
 * Neither the name of the author nor the names of contributors may be used to endorse 
 * or promote products derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY 
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 *  COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
 *  GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED 
 * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 *  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
 * OF THE POSSIBILITY OF SUCH DAMAGE. 
 *
*/

// t: current time, b: begInnIng value, c: change In value, d: duration
jQuery.easing['jswing'] = jQuery.easing['swing'];

jQuery.extend( jQuery.easing,
{
	def: 'easeOutQuad',
	swing: function (x, t, b, c, d) {
		//alert(jQuery.easing.default);
		return jQuery.easing[jQuery.easing.def](x, t, b, c, d);
	},
	easeInQuad: function (x, t, b, c, d) {
		return c*(t/=d)*t + b;
	},
	easeOutQuad: function (x, t, b, c, d) {
		return -c *(t/=d)*(t-2) + b;
	},
	easeInOutQuad: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t + b;
		return -c/2 * ((--t)*(t-2) - 1) + b;
	},
	easeInCubic: function (x, t, b, c, d) {
		return c*(t/=d)*t*t + b;
	},
	easeOutCubic: function (x, t, b, c, d) {
		return c*((t=t/d-1)*t*t + 1) + b;
	},
	easeInOutCubic: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t*t + b;
		return c/2*((t-=2)*t*t + 2) + b;
	},
	easeInQuart: function (x, t, b, c, d) {
		return c*(t/=d)*t*t*t + b;
	},
	easeOutQuart: function (x, t, b, c, d) {
		return -c * ((t=t/d-1)*t*t*t - 1) + b;
	},
	easeInOutQuart: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t*t*t + b;
		return -c/2 * ((t-=2)*t*t*t - 2) + b;
	},
	easeInQuint: function (x, t, b, c, d) {
		return c*(t/=d)*t*t*t*t + b;
	},
	easeOutQuint: function (x, t, b, c, d) {
		return c*((t=t/d-1)*t*t*t*t + 1) + b;
	},
	easeInOutQuint: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t*t*t*t + b;
		return c/2*((t-=2)*t*t*t*t + 2) + b;
	},
	easeInSine: function (x, t, b, c, d) {
		return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
	},
	easeOutSine: function (x, t, b, c, d) {
		return c * Math.sin(t/d * (Math.PI/2)) + b;
	},
	easeInOutSine: function (x, t, b, c, d) {
		return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
	},
	easeInExpo: function (x, t, b, c, d) {
		return (t==0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
	},
	easeOutExpo: function (x, t, b, c, d) {
		return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
	},
	easeInOutExpo: function (x, t, b, c, d) {
		if (t==0) return b;
		if (t==d) return b+c;
		if ((t/=d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1)) + b;
		return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
	},
	easeInCirc: function (x, t, b, c, d) {
		return -c * (Math.sqrt(1 - (t/=d)*t) - 1) + b;
	},
	easeOutCirc: function (x, t, b, c, d) {
		return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
	},
	easeInOutCirc: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
		return c/2 * (Math.sqrt(1 - (t-=2)*t) + 1) + b;
	},
	easeInElastic: function (x, t, b, c, d) {
		var s=1.70158;var p=0;var a=c;
		if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
		if (a < Math.abs(c)) { a=c; var s=p/4; }
		else var s = p/(2*Math.PI) * Math.asin (c/a);
		return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
	},
	easeOutElastic: function (x, t, b, c, d) {
		var s=1.70158;var p=0;var a=c;
		if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
		if (a < Math.abs(c)) { a=c; var s=p/4; }
		else var s = p/(2*Math.PI) * Math.asin (c/a);
		return a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b;
	},
	easeInOutElastic: function (x, t, b, c, d) {
		var s=1.70158;var p=0;var a=c;
		if (t==0) return b;  if ((t/=d/2)==2) return b+c;  if (!p) p=d*(.3*1.5);
		if (a < Math.abs(c)) { a=c; var s=p/4; }
		else var s = p/(2*Math.PI) * Math.asin (c/a);
		if (t < 1) return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
		return a*Math.pow(2,-10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )*.5 + c + b;
	},
	easeInBack: function (x, t, b, c, d, s) {
		if (s == undefined) s = 1.70158;
		return c*(t/=d)*t*((s+1)*t - s) + b;
	},
	easeOutBack: function (x, t, b, c, d, s) {
		if (s == undefined) s = 1.70158;
		return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
	},
	easeInOutBack: function (x, t, b, c, d, s) {
		if (s == undefined) s = 1.70158; 
		if ((t/=d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
		return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
	},
	easeInBounce: function (x, t, b, c, d) {
		return c - jQuery.easing.easeOutBounce (x, d-t, 0, c, d) + b;
	},
	easeOutBounce: function (x, t, b, c, d) {
		if ((t/=d) < (1/2.75)) {
			return c*(7.5625*t*t) + b;
		} else if (t < (2/2.75)) {
			return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
		} else if (t < (2.5/2.75)) {
			return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
		} else {
			return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
		}
	},
	easeInOutBounce: function (x, t, b, c, d) {
		if (t < d/2) return jQuery.easing.easeInBounce (x, t*2, 0, c, d) * .5 + b;
		return jQuery.easing.easeOutBounce (x, t*2-d, 0, c, d) * .5 + c*.5 + b;
	}
});

/*
 *
 * TERMS OF USE - EASING EQUATIONS
 * 
 * Open source under the BSD License. 
 * 
 * Copyright © 2001 Robert Penner
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without modification, 
 * are permitted provided that the following conditions are met:
 * 
 * Redistributions of source code must retain the above copyright notice, this list of 
 * conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list 
 * of conditions and the following disclaimer in the documentation and/or other materials 
 * provided with the distribution.
 * 
 * Neither the name of the author nor the names of contributors may be used to endorse 
 * or promote products derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY 
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 *  COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
 *  GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED 
 * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 *  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
 * OF THE POSSIBILITY OF SUCH DAMAGE. 
 *
 */;
/**
 * Smooth Scrolling plugin
 * @author  Glen Cheney
 * @date 9.28.12
 */
(function($, window) {
    'use strict';

    var defaults = {
        target: 'body',
        speed: 600,
        easing: $.easing.easeOutQuad ? 'easeOutQuad' : 'swing',
        showHash: true,
        callback: $.noop,
        offset: 0,
    },

    _animate = function(offset, speed, easing, complete) {
        var called = false;
        // Scroll!
        $('html,body').animate({
            scrollTop: offset
        }, speed, easing, function(evt) {
            if (!called) {
                complete(evt);
            }
            called = true;
        });
    },

    _showHash = function(hash, $target) {
        var $fake;

        hash = hash.replace(/^#/, '');

        if ( $target.length ) {
            $target.attr( 'id', '' );
            $fake = $( '<div/>' ).css({
                position: 'absolute',
                visibility: 'hidden',
                top: $(window).scrollTop() + 'px'
            })
            .attr( 'id', hash )
            .appendTo( document.body );
        }

        window.location.hash = hash;
        
        if ( $target.length ) {
            $fake.remove();
            $target.attr( 'id', hash );
        }

    },

    scroll = function(options, fn) {
        var opts = $.extend({}, defaults, options),
            $target = $(opts.target),
            offset = $target.offset().top - opts.offset,
            totalHeight = document.body.clientHeight,
            screenHeight = $(window).height();

        if (typeof fn === 'function') {
            opts.callback = fn;
        }

        // Make sure we have room to scroll - basically choose an offset that we'll scroll to and have the entire window.
        // This keeps timing correct.
        // If amount below offset is less than our screen height
        if (totalHeight - offset < screenHeight) {
            offset -= screenHeight - (totalHeight - offset);
        }

        if (opts.showHash) {
            _showHash(opts.target, $target);
        }

        _animate(offset, opts.speed, opts.easing, opts.callback);
        
    };
    
    $.simplescroll = scroll;

    // If we load the page with a hash, scroll to it
    $.simplescroll.initial = function(options, fn) {
        if (window.location.hash) {
            options = $.extend(options, {target: window.location.hash});
            $.simplescroll(options, fn);
        }
    };
})(jQuery, window);;
/** 
 * Html5 Placeholder Polyfill - v2.0.4 - 2012-09-21
 * web: * http://blog.ginader.de/dev/jquery/HTML5-placeholder-polyfill/
 * issues: * https://github.com/ginader/HTML5-placeholder-polyfill/issues
 * Copyright (c) 2012 Dirk Ginader; Licensed MIT, GPL 
*/
(function(e){function r(e,t){e.val()===""?e.data("placeholder").removeClass(t.hideClass):e.data("placeholder").addClass(t.hideClass)}function i(e,t){e.data("placeholder").addClass(t.hideClass)}function s(e,t){var n=t.is("textarea"),r=t.offset();if(t.css("padding")&&t.css("padding")!=="0px"){var i=t.css("padding").split(" ");r.top+=Number(i[0].replace("px","")),r.left+=Number(i[i.length-1].replace("px",""))}else t.css("padding-top")&&t.css("padding-top")!=="0px"&&(r.top+=Number(t.css("padding-top").replace("px",""))),t.css("padding-left")&&t.css("padding-left")!=="0px"&&(r.left+=Number(t.css("padding-left").replace("px","")));e.css({width:t.innerWidth()-(n?20:4),height:t.innerHeight()-6,lineHeight:t.css("line-height"),whiteSpace:n?"normal":"nowrap",overflow:"hidden"}).offset(r)}function o(e,t){var r=e.val();(function s(){n=requestAnimationFrame(s),e.val()!==r&&(i(e,t),a(),u(e,t))})()}function u(e,t){var i=e.val();(function s(){n=requestAnimationFrame(s),r(e,t)})()}function a(){cancelAnimationFrame(n)}function f(e){t&&window.console&&window.console.log&&window.console.log(e)}var t=!1,n;e.fn.placeHolder=function(t){f("init placeHolder");var n=this,u=e(this).length;return this.options=e.extend({className:"placeholder",visibleToScreenreaders:!0,visibleToScreenreadersHideClass:"placeholder-hide-except-screenreader",visibleToNoneHideClass:"placeholder-hide",hideOnFocus:!1,removeLabelClass:"visuallyhidden",hiddenOverrideClass:"visuallyhidden-with-placeholder",forceHiddenOverride:!0,forceApply:!1,autoInit:!0},t),this.options.hideClass=this.options.visibleToScreenreaders?this.options.visibleToScreenreadersHideClass:this.options.visibleToNoneHideClass,e(this).each(function(t){var c=e(this),h=c.attr("placeholder"),p=c.attr("id"),d,v,m,g;d=c.closest("label"),c.removeAttr("placeholder");if(!d.length&&!p){f("the input element with the placeholder needs an id!");return}d=d.length?d:e('label[for="'+p+'"]').first();if(!d.length){f("the input element with the placeholder needs a label!");return}g=e(d).find(".placeholder");if(g.length)return s(g,c),g.text(h),c;d.hasClass(n.options.removeLabelClass)&&d.removeClass(n.options.removeLabelClass).addClass(n.options.hiddenOverrideClass),v=e('<span class="'+n.options.className+'">'+h+"</span>").appendTo(d),m=v.width()>c.width(),m&&v.attr("title",h),s(v,c),c.data("placeholder",v),v.data("input",v),v.click(function(){e(this).data("input").focus()}),c.focusin(function(){!n.options.hideOnFocus&&window.requestAnimationFrame?o(c,n.options):i(c,n.options)}),c.focusout(function(){r(e(this),n.options),!n.options.hideOnFocus&&window.cancelAnimationFrame&&a()}),r(c,n.options),e(document).bind("fontresize resize",function(){s(v,c)}),e.event.special.resize?e("textarea").bind("resize",function(e){s(v,c)}):e("textarea").css("resize","none"),t>=u-1&&(e.attrHooks.placeholder={get:function(t){return t.nodeName.toLowerCase()==="input"||t.nodeName.toLowerCase()==="textarea"?e(t).data("placeholder")?e(e(t).data("placeholder")).text():e(t)[0].placeholder:undefined},set:function(t,n){return e(e(t).data("placeholder")).text(n)}})})},e(function(){var t=window.placeHolderConfig||{};if(t.autoInit===!1){f("placeholder:abort because autoInit is off");return}if("placeholder"in e("<input>")[0]&&!t.forceApply){f("placeholder:abort because browser has native support");return}e("input[placeholder], textarea[placeholder]").placeHolder(t)})})(jQuery);;
/*!
 * selectivizr v1.0.2 - (c) Keith Clark, freely distributable under the terms of the MIT license.
 * selectivizr.com
 */
(function(j){function A(a){return a.replace(B,h).replace(C,function(a,d,b){for(var a=b.split(","),b=0,e=a.length;b<e;b++){var s=D(a[b].replace(E,h).replace(F,h))+o,l=[];a[b]=s.replace(G,function(a,b,c,d,e){if(b){if(l.length>0){var a=l,f,e=s.substring(0,e).replace(H,i);if(e==i||e.charAt(e.length-1)==o)e+="*";try{f=t(e)}catch(k){}if(f){e=0;for(c=f.length;e<c;e++){for(var d=f[e],h=d.className,j=0,m=a.length;j<m;j++){var g=a[j];if(!RegExp("(^|\\s)"+g.className+"(\\s|$)").test(d.className)&&g.b&&(g.b===!0||g.b(d)===!0))h=u(h,g.className,!0)}d.className=h}}l=[]}return b}else{if(b=c?I(c):!v||v.test(d)?{className:w(d),b:!0}:null)return l.push(b),"."+b.className;return a}})}return d+a.join(",")})}function I(a){var c=!0,d=w(a.slice(1)),b=a.substring(0,5)==":not(",e,f;b&&(a=a.slice(5,-1));var l=a.indexOf("(");l>-1&&(a=a.substring(0,l));if(a.charAt(0)==":")switch(a.slice(1)){case "root":c=function(a){return b?a!=p:a==p};break;case "target":if(m==8){c=function(a){function c(){var d=location.hash,e=d.slice(1);return b?d==i||a.id!=e:d!=i&&a.id==e}k(j,"hashchange",function(){g(a,d,c())});return c()};break}return!1;case "checked":c=function(a){J.test(a.type)&&k(a,"propertychange",function(){event.propertyName=="checked"&&g(a,d,a.checked!==b)});return a.checked!==b};break;case "disabled":b=!b;case "enabled":c=function(c){if(K.test(c.tagName))return k(c,"propertychange",function(){event.propertyName=="$disabled"&&g(c,d,c.a===b)}),q.push(c),c.a=c.disabled,c.disabled===b;return a==":enabled"?b:!b};break;case "focus":e="focus",f="blur";case "hover":e||(e="mouseenter",f="mouseleave");c=function(a){k(a,b?f:e,function(){g(a,d,!0)});k(a,b?e:f,function(){g(a,d,!1)});return b};break;default:if(!L.test(a))return!1}return{className:d,b:c}}function w(a){return M+"-"+(m==6&&N?O++:a.replace(P,function(a){return a.charCodeAt(0)}))}function D(a){return a.replace(x,h).replace(Q,o)}function g(a,c,d){var b=a.className,c=u(b,c,d);if(c!=b)a.className=c,a.parentNode.className+=i}function u(a,c,d){var b=RegExp("(^|\\s)"+c+"(\\s|$)"),e=b.test(a);return d?e?a:a+o+c:e?a.replace(b,h).replace(x,h):a}function k(a,c,d){a.attachEvent("on"+c,d)}function r(a,c){if(/^https?:\/\//i.test(a))return c.substring(0,c.indexOf("/",8))==a.substring(0,a.indexOf("/",8))?a:null;if(a.charAt(0)=="/")return c.substring(0,c.indexOf("/",8))+a;var d=c.split(/[?#]/)[0];a.charAt(0)!="?"&&d.charAt(d.length-1)!="/"&&(d=d.substring(0,d.lastIndexOf("/")+1));return d+a}function y(a){if(a)return n.open("GET",a,!1),n.send(),(n.status==200?n.responseText:i).replace(R,i).replace(S,function(c,d,b,e,f){return y(r(b||f,a))}).replace(T,function(c,d,b){d=d||i;return" url("+d+r(b,a)+d+") "});return i}function U(){var a,c;a=f.getElementsByTagName("BASE");for(var d=a.length>0?a[0].href:f.location.href,b=0;b<f.styleSheets.length;b++)if(c=f.styleSheets[b],c.href!=i&&(a=r(c.href,d)))c.cssText=A(y(a));q.length>0&&setInterval(function(){for(var a=0,c=q.length;a<c;a++){var b=q[a];if(b.disabled!==b.a)b.disabled?(b.disabled=!1,b.a=!0,b.disabled=!0):b.a=b.disabled}},250)}if(!/*@cc_on!@*/true){var f=document,p=f.documentElement,n=function(){if(j.XMLHttpRequest)return new XMLHttpRequest;try{return new ActiveXObject("Microsoft.XMLHTTP")}catch(a){return null}}(),m=/MSIE (\d+)/.exec(navigator.userAgent)[1];if(!(f.compatMode!="CSS1Compat"||m<6||m>8||!n)){var z={NW:"*.Dom.select",MooTools:"$$",DOMAssistant:"*.$",Prototype:"$$",YAHOO:"*.util.Selector.query",Sizzle:"*",jQuery:"*",dojo:"*.query"},t,q=[],O=0,N=!0,M="slvzr",R=/(\/\*[^*]*\*+([^\/][^*]*\*+)*\/)\s*/g,S=/@import\s*(?:(?:(?:url\(\s*(['"]?)(.*)\1)\s*\))|(?:(['"])(.*)\3))[^;]*;/g,T=/\burl\(\s*(["']?)(?!data:)([^"')]+)\1\s*\)/g,L=/^:(empty|(first|last|only|nth(-last)?)-(child|of-type))$/,B=/:(:first-(?:line|letter))/g,C=/(^|})\s*([^\{]*?[\[:][^{]+)/g,G=/([ +~>])|(:[a-z-]+(?:\(.*?\)+)?)|(\[.*?\])/g,H=/(:not\()?:(hover|enabled|disabled|focus|checked|target|active|visited|first-line|first-letter)\)?/g,P=/[^\w-]/g,K=/^(INPUT|SELECT|TEXTAREA|BUTTON)$/,J=/^(checkbox|radio)$/,v=m>6?/[\$\^*]=(['"])\1/:null,E=/([(\[+~])\s+/g,F=/\s+([)\]+~])/g,Q=/\s+/g,x=/^\s*((?:[\S\s]*\S)?)\s*$/,i="",o=" ",h="$1";(function(a,c){function d(){try{p.doScroll("left")}catch(a){setTimeout(d,50);return}b("poll")}function b(d){if(!(d.type=="readystatechange"&&f.readyState!="complete")&&((d.type=="load"?a:f).detachEvent("on"+d.type,b,!1),!e&&(e=!0)))c.call(a,d.type||d)}var e=!1,g=!0;if(f.readyState=="complete")c.call(a,i);else{if(f.createEventObject&&p.doScroll){try{g=!a.frameElement}catch(h){}g&&d()}k(f,"readystatechange",b);k(a,"load",b)}})(j,function(){for(var a in z){var c,d,b=j;if(j[a]){for(c=z[a].replace("*",a).split(".");(d=c.shift())&&(b=b[d]););if(typeof b=="function"){t=b;U();break}}}})}}})(this);;
/*
 *
 * Find more about this plugin by visiting
 * http://alxgbsn.co.uk/
 *
 * Copyright (c) 2012 Alex Gibson
 * Released under MIT license
 *
 */

(function (window, document) {

	function Tap(el, threshold, timeout) {

		// Don't do anything for non-touch browsers.
		if (!this.hasTouch) {
			return;
		}
		this.element = typeof el === 'object' ? el : document.querySelector(el);
		this.moved = false; //flags if the finger has moved
		this.startX = 0; //starting x coordinate
		this.startY = 0; //starting y coordinate
		this.threshold = threshold || 10;
		this.timeout = timeout || 500;
		this.timerId = null;
		this.element.addEventListener('touchstart', this, false);
	}
	
	Tap.prototype.hasTouch = 'ontouchstart' in window || 'createTouch' in document;

	//start
	Tap.prototype.start = function (e) {
		var self = this;
		this.moved = false;
		this.startX = this.hasTouch ? e.touches[0].clientX : e.clientX;
		this.startY = this.hasTouch ? e.touches[0].clientY : e.clientY;
		this.element.addEventListener('touchmove', this, false);
		this.element.addEventListener('touchend', this, false);
		this.element.addEventListener('touchcancel', this, false);
		this.timerId = window.setTimeout(function() {
			self.cancel(e);
		}, this.timeout);
	};

	//move
	Tap.prototype.move = function (e) {
		var x = this.hasTouch ? e.touches[0].clientX : e.clientX,
			y = this.hasTouch ? e.touches[0].clientY : e.clientY;
		//if finger moves more than 10px flag to cancel
		if (Math.abs(x - this.startX) > this.threshold || Math.abs(y - this.startY) > this.threshold) {
			this.moved = true;
		}
	};

	//end
	Tap.prototype.end = function (e) {
		var event;
		window.clearTimeout(this.timerId);
		this.timerId = null;
		//only preventDefault on elements that are not form inputs
		if (e.target.tagName !== 'SELECT' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
			e.preventDefault();
		}
		if (!this.moved) {
			event = document.createEvent('Event');
			event.initEvent('tap', true, true);
			e.target.dispatchEvent(event);
		}
		this.element.removeEventListener('touchmove', this, false);
		this.element.removeEventListener('touchend', this, false);
		this.element.removeEventListener('touchcancel', this, false);
	};

	//touchcancel
	Tap.prototype.cancel = function (e) {
		//reset state
		this.moved = false;
		this.startX = 0;
		this.startY = 0;
		window.clearTimeout(this.timerId);
		this.timerId = null;
		this.element.removeEventListener('touchmove', this, false);
		this.element.removeEventListener('touchend', this, false);
		this.element.removeEventListener('touchcancel', this, false);
	};

	Tap.prototype.handleEvent = function (e) {
		switch (e.type) {
		case 'touchstart': this.start(e); break;
		case 'touchmove': this.move(e); break;
		case 'touchend': this.end(e); break;
		case 'touchcancel': this.cancel(e); break;
		}
	};

	//public function
	window.Tap = Tap;

}(window, document));;
/*!
 * jQuery Expander Plugin v1.4.5
 *
 * Date: Wed Dec 05 10:33:01 2012 EST
 * Requires: jQuery v1.3+
 *
 * Copyright 2012, Karl Swedberg
 * Licensed under the MIT License:
 * http://www.opensource.org/licenses/mit-license.php
 *
 *
 *
 *
 *
*/

(function($) {
  $.expander = {
    version: '1.4.5',
    defaults: {
      // the number of characters at which the contents will be sliced into two parts.
      slicePoint: 100,

      // whether to keep the last word of the summary whole (true) or let it slice in the middle of a word (false)
      preserveWords: true,

      // a threshold of sorts for whether to initially hide/collapse part of the element's contents.
      // If after slicing the contents in two there are fewer words in the second part than
      // the value set by widow, we won't bother hiding/collapsing anything.
      widow: 4,

      // text displayed in a link instead of the hidden part of the element.
      // clicking this will expand/show the hidden/collapsed text
      expandText: 'read more',
      expandPrefix: '&hellip; ',

      expandAfterSummary: false,

      // class names for summary element and detail element
      summaryClass: 'summary',
      detailClass: 'details',

      // class names for <span> around "read-more" link and "read-less" link
      moreClass: 'read-more',
      lessClass: 'read-less',

      // number of milliseconds after text has been expanded at which to collapse the text again.
      // when 0, no auto-collapsing
      collapseTimer: 0,

      // effects for expanding and collapsing
      expandEffect: 'slideDown',
      expandSpeed: 250,
      collapseEffect: 'slideUp',
      collapseSpeed: 200,

      // allow the user to re-collapse the expanded text.
      userCollapse: true,

      // text to use for the link to re-collapse the text
      userCollapseText: 'read less',
      userCollapsePrefix: ' ',


      // all callback functions have the this keyword mapped to the element in the jQuery set when .expander() is called

      onSlice: null, // function() {}
      beforeExpand: null, // function() {},
      afterExpand: null, // function() {},
      onCollapse: null, // function(byUser) {}
      afterCollapse: null // function() {}
    }
  };

  $.fn.expander = function(options) {
    var meth = 'init';

    if (typeof options == 'string') {
      meth = options;
      options = {};
    }

    var opts = $.extend({}, $.expander.defaults, options),
        rSelfClose = /^<(?:area|br|col|embed|hr|img|input|link|meta|param).*>$/i,
        rAmpWordEnd = opts.wordEnd || /(&(?:[^;]+;)?|[a-zA-Z\u00C0-\u0100]+)$/,
        rOpenCloseTag = /<\/?(\w+)[^>]*>/g,
        rOpenTag = /<(\w+)[^>]*>/g,
        rCloseTag = /<\/(\w+)>/g,
        rLastCloseTag = /(<\/[^>]+>)\s*$/,
        rTagPlus = /^<[^>]+>.?/,
        delayedCollapse;

    var methods = {
      init: function() {
        this.each(function() {
          var i, l, tmp, newChar, summTagless, summOpens, summCloses,
              lastCloseTag, detailText, detailTagless, html, expand,
              $thisDetails, $readMore,
              openTagsForDetails = [],
              closeTagsForsummaryText = [],
              defined = {},
              thisEl = this,
              $this = $(this),
              $summEl = $([]),
              o = $.extend({}, opts, $this.data('expander') || $.meta && $this.data() || {}),
              hasDetails = !!$this.find('.' + o.detailClass).length,
              hasBlocks = !!$this.find('*').filter(function() {
                var display = $(this).css('display');
                return (/^block|table|list/).test(display);
              }).length,
              el = hasBlocks ? 'div' : 'span',
              detailSelector = el + '.' + o.detailClass,
              moreClass = o.moreClass + '',
              lessClass = o.lessClass + '',
              expandSpeed = o.expandSpeed || 0,
              allHtml = $.trim( $this.html() ),
              allText = $.trim( $this.text() ),
              summaryText = allHtml.slice(0, o.slicePoint);

          // allow multiple classes for more/less links
          o.moreSelector = 'span.' + moreClass.split(' ').join('.');
          o.lessSelector = 'span.' + lessClass.split(' ').join('.');
          // bail out if we've already set up the expander on this element
          if ( $.data(this, 'expanderInit') ) {
            return;
          }

          $.data(this, 'expanderInit', true);
          $.data(this, 'expander', o);
          // determine which callback functions are defined
          $.each(['onSlice','beforeExpand', 'afterExpand', 'onCollapse', 'afterCollapse'], function(index, val) {
            defined[val] = $.isFunction(o[val]);
          });

          // back up if we're in the middle of a tag or word
          summaryText = backup(summaryText);

          // summary text sans tags length
          summTagless = summaryText.replace(rOpenCloseTag, '').length;

          // add more characters to the summary, one for each character in the tags
          while (summTagless < o.slicePoint) {
            newChar = allHtml.charAt(summaryText.length);
            if (newChar == '<') {
              newChar = allHtml.slice(summaryText.length).match(rTagPlus)[0];
            }
            summaryText += newChar;
            summTagless++;
          }

          summaryText = backup(summaryText, o.preserveWords);

          // separate open tags from close tags and clean up the lists
          summOpens = summaryText.match(rOpenTag) || [];
          summCloses = summaryText.match(rCloseTag) || [];

          // filter out self-closing tags
          tmp = [];
          $.each(summOpens, function(index, val) {
            if ( !rSelfClose.test(val) ) {
              tmp.push(val);
            }
          });
          summOpens = tmp;

          // strip close tags to just the tag name
          l = summCloses.length;
          for (i = 0; i < l; i++) {
            summCloses[i] = summCloses[i].replace(rCloseTag, '$1');
          }

          // tags that start in summary and end in detail need:
          // a). close tag at end of summary
          // b). open tag at beginning of detail
          $.each(summOpens, function(index, val) {
            var thisTagName = val.replace(rOpenTag, '$1');
            var closePosition = $.inArray(thisTagName, summCloses);
            if (closePosition === -1) {
              openTagsForDetails.push(val);
              closeTagsForsummaryText.push('</' + thisTagName + '>');

            } else {
              summCloses.splice(closePosition, 1);
            }
          });

          // reverse the order of the close tags for the summary so they line up right
          closeTagsForsummaryText.reverse();

          // create necessary summary and detail elements if they don't already exist
          if ( !hasDetails ) {

            // end script if there is no detail text or if detail has fewer words than widow option
            detailText = allHtml.slice(summaryText.length);
            detailTagless = $.trim( detailText.replace(rOpenCloseTag, '') );

            if ( detailTagless === '' || detailTagless.split(/\s+/).length < o.widow ) {
              return;
            }
            // otherwise, continue...
            lastCloseTag = closeTagsForsummaryText.pop() || '';
            summaryText += closeTagsForsummaryText.join('');
            detailText = openTagsForDetails.join('') + detailText;

          } else {
            // assume that even if there are details, we still need readMore/readLess/summary elements
            // (we already bailed out earlier when readMore el was found)
            // but we need to create els differently

            // remove the detail from the rest of the content
            detailText = $this.find(detailSelector).remove().html();

            // The summary is what's left
            summaryText = $this.html();

            // allHtml is the summary and detail combined (this is needed when content has block-level elements)
            allHtml = summaryText + detailText;

            lastCloseTag = '';
          }
          o.moreLabel = $this.find(o.moreSelector).length ? '' : buildMoreLabel(o);

          if (hasBlocks) {
            detailText = allHtml;
          }
          summaryText += lastCloseTag;

          // onSlice callback
          o.summary = summaryText;
          o.details = detailText;
          o.lastCloseTag = lastCloseTag;

          if (defined.onSlice) {
            // user can choose to return a modified options object
            // one last chance for user to change the options. sneaky, huh?
            // but could be tricky so use at your own risk.
            tmp = o.onSlice.call(thisEl, o);

          // so, if the returned value from the onSlice function is an object with a details property, we'll use that!
            o = tmp && tmp.details ? tmp : o;
          }

          // build the html with summary and detail and use it to replace old contents
          html = buildHTML(o, hasBlocks);

          $this.html( html );

          // set up details and summary for expanding/collapsing
          $thisDetails = $this.find(detailSelector);
          $readMore = $this.find(o.moreSelector);

          // Hide details span using collapseEffect unless
          // expandEffect is NOT slideDown and collapseEffect IS slideUp.
          // The slideUp effect sets span's "default" display to
          // inline-block. This is necessary for slideDown, but
          // problematic for other "showing" animations.
          // Fixes #46
          if (o.collapseEffect === 'slideUp' && o.expandEffect !== 'slideDown' || $this.is(':hidden')) {
            $thisDetails.css({display: 'none'});
          } else {
            $thisDetails[o.collapseEffect](0);
          }

          $summEl = $this.find('div.' + o.summaryClass);

          expand = function(event) {
            event.preventDefault();
            $readMore.hide();
            $summEl.hide();
            if (defined.beforeExpand) {
              o.beforeExpand.call(thisEl);
            }

            $thisDetails.stop(false, true)[o.expandEffect](expandSpeed, function() {
              $thisDetails.css({zoom: ''});
              if (defined.afterExpand) {o.afterExpand.call(thisEl);}
              delayCollapse(o, $thisDetails, thisEl);
            });
          };

          $readMore.find('a').unbind('click.expander').bind('click.expander', expand);

          if ( o.userCollapse && !$this.find(o.lessSelector).length ) {
            $this
            .find(detailSelector)
            .append('<span class="' + o.lessClass + '">' + o.userCollapsePrefix + '<a href="#">' + o.userCollapseText + '</a></span>');
          }

          $this
          .find(o.lessSelector + ' a')
          .unbind('click.expander')
          .bind('click.expander', function(event) {
            event.preventDefault();
            clearTimeout(delayedCollapse);
            var $detailsCollapsed = $(this).closest(detailSelector);
            reCollapse(o, $detailsCollapsed);
            if (defined.onCollapse) {
              o.onCollapse.call(thisEl, true);
            }
          });

        }); // this.each
      },
      destroy: function() {

        this.each(function() {
          var o, details,
              $this = $(this);

          if ( !$this.data('expanderInit') ) {
            return;
          }

          o = $.extend({}, $this.data('expander') || {}, opts),
          details = $this.find('.' + o.detailClass).contents();

          $this.removeData('expanderInit');
          $this.removeData('expander');

          $this.find(o.moreSelector).remove();
          $this.find('.' + o.summaryClass).remove();
          $this.find('.' + o.detailClass).after(details).remove();
          $this.find(o.lessSelector).remove();

        });
      }
    };

    // run the methods (almost always "init")
    if ( methods[meth] ) {
      methods[ meth ].call(this);
    }

    // utility functions
    function buildHTML(o, blocks) {
      var el = 'span',
          summary = o.summary;
      if ( blocks ) {
        el = 'div';
        // if summary ends with a close tag, tuck the moreLabel inside it
        if ( rLastCloseTag.test(summary) && !o.expandAfterSummary) {
          summary = summary.replace(rLastCloseTag, o.moreLabel + '$1');
        } else {
        // otherwise (e.g. if ends with self-closing tag) just add moreLabel after summary
        // fixes #19
          summary += o.moreLabel;
        }

        // and wrap it in a div
        summary = '<div class="' + o.summaryClass + '">' + summary + '</div>';
      } else {
        summary += o.moreLabel;
      }

      return [
        summary,
        '<',
          el + ' class="' + o.detailClass + '"',
        '>',
          o.details,
        '</' + el + '>'
        ].join('');
    }

    function buildMoreLabel(o) {
      var ret = '<span class="' + o.moreClass + '">' + o.expandPrefix;
      ret += '<a href="#">' + o.expandText + '</a></span>';
      return ret;
    }

    function backup(txt, preserveWords) {
      if ( txt.lastIndexOf('<') > txt.lastIndexOf('>') ) {
        txt = txt.slice( 0, txt.lastIndexOf('<') );
      }
      if (preserveWords) {
        txt = txt.replace(rAmpWordEnd,'');
      }

      return $.trim(txt);
    }

    function reCollapse(o, el) {
      el.stop(true, true)[o.collapseEffect](o.collapseSpeed, function() {
        var prevMore = el.prev('span.' + o.moreClass).show();
        if (!prevMore.length) {
          el.parent().children('div.' + o.summaryClass).show()
            .find('span.' + o.moreClass).show();
        }
        if (o.afterCollapse) {o.afterCollapse.call(el);}
      });
    }

    function delayCollapse(option, $collapseEl, thisEl) {
      if (option.collapseTimer) {
        delayedCollapse = setTimeout(function() {
          reCollapse(option, $collapseEl);
          if ( $.isFunction(option.onCollapse) ) {
            option.onCollapse.call(thisEl, false);
          }
        }, option.collapseTimer);
      }
    }

    return this;
  };

  // plugin defaults
  $.fn.expander.defaults = $.expander.defaults;
})(jQuery);
;
/*!
 * jaralax library
 * version: 0.2.1 public beta
 * http://jarallax.com/
 *
 * Copyright 2012, Jacko Hoogeveen
 * Dual licensed under the MIT or GPL Version 3 licenses.
 * http://jarallax.com/license.html
 * 
 * Date: 2/29/2012
 */

(function($){
function hasNumbers(a){return/\d/.test(a)}Jarallax=function(a){this.jarallaxObject=[];this.animations=[];this.defaultValues=[];this.progress=0;this.controllers=[];this.maxProgress=1;if(a===undefined){this.controllers.push(new ControllerScroll)}else{if(a.length){this.controllers=a}else if(typeof a==="object"){this.controllers.push(a)}else{throw new Error('wrong controller data type: "'+typeof a+'". Expected "object" or "array"')}}for(var b=0;b<this.controllers.length;b++){this.controllers[b].activate(this)}};Jarallax.prototype.setProgress=function(a){if(a>1){a=1}else if(a<0){a=0}else{this.progress=a}for(j=0;j<this.defaultValues.length;j++){this.defaultValues[j].activate(a)}for(k=0;k<this.animations.length;k++){this.animations[k].activate(a)}for(l=0;l<this.controllers.length;l++){this.controllers[l].update(a)}};Jarallax.prototype.setDefault=function(a,b){if(!a){throw new Error("no selector defined.")}if(Jarallax.isValues(b)){var c=new JarallaxDefault(a,b);c.activate();this.defaultValues.push(c)}};Jarallax.prototype.addStatic=function(a,b){if(!a){throw new Error("no selector defined.")}if(Jarallax.isValues(b)){var c=new JarallaxStatic(a,b[0],b[1]);this.defaultValues.push(c)}};Jarallax.prototype.addAnimation=function(a,b){if(!a){throw new Error("no selector defined.")}if(Jarallax.isValues(b)){for(var c=0;c<b.length-1;c++){if(b[c]&&b[c+1]){if(b[c]["progress"]&&b[c+1]["progress"]){if(b[c+1]["progress"].indexOf("%")==-1){if(this.maxProgress<b[c+1]["progress"]){this.maxProgress=b[c+1]["progress"]}}this.animations.push(new JarallaxAnimation(a,b[c],b[c+1],this))}else{throw new Error("no animation boundry found.")}}else{throw new Error("bad animation data.")}}}};JarallaxDefault=function(a,b){this.selector=a;this.values=b};JarallaxDefault.prototype.activate=function(a){for(i in this.values){$(this.selector).css(i,this.values[i])}};JarallaxStatic=function(a,b,c){this.selector=a;this.values=values};JarallaxStatic.prototype.activate=function(a){var b;var c;if(this.startValues["progress"].indexOf("%")>=0){b=parseInt(this.startValues["progress"],10)/100}else if(hasNumbers(this.startValues["progress"])){b=this.maxProgress/parseInt(this.startValues["progress"],10)}if(this.endValues["progress"].indexOf("%")>=0){c=parseInt(this.endValues["progress"],10)/100}else if(hasNumbers(this.endValues["progress"])){c=this.maxProgress/parseInt(this.endValues["progress"],10)}if(progress>b&&progress<c){for(i in this.startValues){if(i!="progress"){$(this.selector).css(i,this.startValues[i])}}}};Jarallax.isValues=function(a){if(!a){throw new Error("no values set.")}if(typeof a!="object"){throw new Error('wrong data type values. expected: "object", got: "'+typeof a+'"')}if(a.size===0){throw new Error("Got an empty values object")}return true};Jarallax.getUnits=function(a){return a.replace(/\d+/g,"")};Jarallax.EASING={linear:function(a,b,c,d,e){return a/d*c+b},easeOut:function(a,b,c,d,e){if(e==undefined){e=2}return(Math.pow((d-a)/d,e)*-1+1)*c+b},easeIn:function(a,b,c,d,e){if(e==undefined){e=2}return Math.pow(a/d,e)*c+b},easeInOut:function(a,b,c,d,e){if(e==undefined){e=2}c/=2;a*=2;if(a<d){return Math.pow(a/d,e)*c+b}else{a=a-d;return(Math.pow((d-a)/d,e)*-1+1)*c+b+c}return Math.pow(a/d,e)*c+b}};Jarallax.EASING["none"]=Jarallax.EASING["linear"];JarallaxAnimation=function(a,b,c,d){this.progress=0;this.selector=a;this.startValues=b;this.endValues=c;this.jarallax=d};JarallaxAnimation.prototype.activate=function(a){if(this.progress!=a){var b;var c;var d;if(this.startValues["style"]==undefined){d={easing:"linear"}}else{d=this.startValues["style"]}if(this.startValues["progress"].indexOf("%")>=0){b=parseInt(this.startValues["progress"],10)/100}else if(hasNumbers(this.startValues["progress"])){b=parseInt(this.startValues["progress"],10)/this.jarallax.maxProgress}if(this.endValues["progress"].indexOf("%")>=0){c=parseInt(this.endValues["progress"],10)/100}else if(hasNumbers(this.endValues["progress"])){c=parseInt(this.endValues["progress"],10)/this.jarallax.maxProgress}if(this.startValues["event"]){this.dispatchEvent(this.progress,a,b,c)}if(a>=b&&a<=c){for(i in this.startValues){if(i!="progress"&&i!="style"&&i!="event"){if(undefined!=this.endValues[i]&&i!="display"){var e=Jarallax.getUnits(this.startValues[i]+"");e=e.replace("-","");var f=parseFloat(this.startValues[i]);var g=parseFloat(this.endValues[i]);var h=c-b;var j=a-b;var k=g-f;var l=Jarallax.EASING[d["easing"]](j,f,k,h,d["easing"]["power"]);l+=e;$(this.selector).css(i,l)}else{$(this.selector).css(i,this.startValues[i])}}}}this.progress=a}};JarallaxAnimation.prototype.dispatchEvent=function(a,b,c,d){var e=this.startValues["event"];var f={};f.animation=this;f.selector=this.selector;if(b>=c&&b<=d){if(e.start&&a<c){f.type="start";e.start(f)}if(e.animating){f.type="animating";e.animating(f)}if(e.forward&&a<b){f.type="forward";e.forward(f)}if(e.reverse&&a>b){f.type="reverse";e.reverse(f)}}else{if(e.complete&&a<d&&b>d){f.type="complete";e.complete(f)}if(e.rewinded&&a>c&&b<c){f.type="rewinded";e.rewinded(f)}}};ControllerScroll=function(){this.height=parseInt(jQuery("body").css("height"),10);this.target=$(window);this.scrollSpace=this.height-this.target.height()};ControllerScroll.prototype.activate=function(a){this.jarallax=a;this.target.bind("scroll",{me:this},this.onScroll)};ControllerScroll.prototype.deactivate=function(a){};ControllerScroll.prototype.onScroll=function(a){var b=a.data.me;var c=b.target.scrollTop();var d=c/b.scrollSpace;b.jarallax.setProgress(d)};ControllerScroll.prototype.update=function(a){};ControllerTime=function(a,b){this.interval=b;this.speed=a;this.forward=true};ControllerTime.prototype.onInterval=function(){this.jarallax.setProgress(this.progress);$("body").scrollTop(parseInt(jQuery("body").css("height"),10)*this.progress);if(this.progress>=1){this.progress=1;this.forward=false}else if(this.progress<=0){this.progress=0;this.forward=true}if(this.forward){this.progress+=this.speed}else{this.progress-=this.speed}};ControllerTime.prototype.activate=function(a){this.jarallax=a;this.progress=0;this.interval=$.interval(this.onInterval.bind(this),this.interval)};ControllerTime.prototype.deactivate=function(a){};ControllerTime.prototype.update=function(a){};ControllerDrag=function(a,b,c){this.object=$(a);this.start=b;this.end=c;this.container="";this.width;this.startX=0;this.startY=0};ControllerDrag.prototype.activate=function(a){this.jarallax=a;this.container="#scrollbar";this.object.draggable({containment:this.container,axis:"x"});this.object.bind("drag",{me:this},this.onDrag);this.container=$(this.container);this.width=$(this.container).innerWidth()-this.object.outerWidth()};ControllerDrag.prototype.onDrag=function(a){var b=parseInt($(this).css("left"),10);var c=b/a.data.me.width;a.data.me.jarallax.setProgress(c)};ControllerDrag.prototype.deactivate=function(a){};ControllerDrag.prototype.update=function(a){this.object.css("left",a*this.width)};ControllerKeyboard=function(a,b,c){this.repetitiveInput=c;this.preventDefault=b||false;this.keys=a||{38:-.01,40:.01};this.keysState=new Object};ControllerKeyboard.prototype.activate=function(a){this.jarallax=a;$(document.documentElement).keydown({me:this},this.keyDown);$(document.documentElement).keyup({me:this},this.keyUp);for(key in this.keys){this.keysState[key]=false}};ControllerKeyboard.prototype.deactivate=function(a){};ControllerKeyboard.prototype.keyDown=function(a){var b=a.data.me;for(key in b.keys){if(key==a.keyCode){if(b.keysState[key]!==true||b.repetitiveInput){b.jarallax.setProgress(b.jarallax.progress+b.keys[key])}b.keysState[key]=true;if(b.preventDefault){a.preventDefault()}}}};ControllerKeyboard.prototype.keyUp=function(a){var b=a.data.me;for(key in b.keys){if(key==a.keyCode){b.keysState[key]=false}}};ControllerKeyboard.prototype.update=function(a){};ControllerMousewheel=function(a,b){this.sensitivity=-a;this.preventDefault=b||false};ControllerMousewheel.prototype.activate=function(a){this.jarallax=a;$("body").bind("mousewheel",{me:this},this.onScroll)};ControllerMousewheel.prototype.deactivate=function(a){this.jarallax=a};ControllerMousewheel.prototype.onScroll=function(a,b){controller=a.data.me;controller.jarallax.setProgress(controller.jarallax.progress+controller.sensitivity*b);if(controller.preventDefault){a.preventDefault()}};ControllerMousewheel.prototype.update=function(a){};ControllerIpadScroll=function(){this.x=0;this.previousX=-1;this.top=700;this.moveRight=false};ControllerIpadScroll.prototype.activate=function(a,b){this.jarallax=a;this.values=b;$("body").bind("touchmove",{me:this},this.onScroll)};ControllerIpadScroll.prototype.onScroll=function(a){a.preventDefault();var b=a.data.me;var c=a.originalEvent.touches.item(0);if(b.previousX==-1){b.previousX=c.clientX}else{if(c.clientX-b.previousX<100&&c.clientX-b.previousX>-100){if(b.moveRight){b.x-=c.clientX-b.previousX}else{b.x+=c.clientX-b.previousX}b.x=b.x<1e3?b.x:1e3;b.x=b.x>0?b.x:0}b.previousX=c.clientX;b.jarallax.setProgress(b.x/b.top)}};ControllerIpadScroll.prototype.deactivate=function(a){};ControllerIpadScroll.prototype.update=function(a){}
})(jQuery);;
/*!
 * jQuery Transit - CSS3 transitions and transformations
 * (c) 2011-2012 Rico Sta. Cruz <rico@ricostacruz.com>
 * MIT Licensed.
 *
 * http://ricostacruz.com/jquery.transit
 * http://github.com/rstacruz/jquery.transit
 */
(function(e){function r(e){if(e in t.style)return e;var n=["Moz","Webkit","O","ms"];var r=e.charAt(0).toUpperCase()+e.substr(1);if(e in t.style){return e}for(var i=0;i<n.length;++i){var s=n[i]+r;if(s in t.style){return s}}}function i(){t.style[n.transform]="";t.style[n.transform]="rotateY(90deg)";return t.style[n.transform]!==""}function a(e){if(typeof e==="string"){this.parse(e)}return this}function f(e,t,n){if(t===true){e.queue(n)}else if(t){e.queue(t,n)}else{n()}}function l(t){var n=[];e.each(t,function(t){t=e.camelCase(t);t=e.transit.propertyMap[t]||e.cssProps[t]||t;t=p(t);if(e.inArray(t,n)===-1){n.push(t)}});return n}function c(t,n,r,i){var s=l(t);if(e.cssEase[r]){r=e.cssEase[r]}var o=""+v(n)+" "+r;if(parseInt(i,10)>0){o+=" "+v(i)}var u=[];e.each(s,function(e,t){u.push(t+" "+o)});return u.join(", ")}function h(t,r){if(!r){e.cssNumber[t]=true}e.transit.propertyMap[t]=n.transform;e.cssHooks[t]={get:function(n){var r=e(n).css("transit:transform");return r.get(t)},set:function(n,r){var i=e(n).css("transit:transform");i.setFromString(t,r);e(n).css({"transit:transform":i})}}}function p(e){return e.replace(/([A-Z])/g,function(e){return"-"+e.toLowerCase()})}function d(e,t){if(typeof e==="string"&&!e.match(/^[\-0-9\.]+$/)){return e}else{return""+e+t}}function v(t){var n=t;if(typeof n==="string"&&!n.match(/^[\-0-9\.]+/)){n=e.fx.speeds[n]||e.fx.speeds._default}return d(n,"ms")}e.transit={version:"0.9.9",propertyMap:{marginLeft:"margin",marginRight:"margin",marginBottom:"margin",marginTop:"margin",paddingLeft:"padding",paddingRight:"padding",paddingBottom:"padding",paddingTop:"padding"},enabled:true,useTransitionEnd:false};var t=document.createElement("div");var n={};var s=navigator.userAgent.toLowerCase().indexOf("chrome")>-1;n.transition=r("transition");n.transitionDelay=r("transitionDelay");n.transform=r("transform");n.transformOrigin=r("transformOrigin");n.transform3d=i();var o=["transitionend","webkitTransitionEnd","otransitionend","oTransitionEnd"];for(var u in n){if(n.hasOwnProperty(u)&&typeof e.support[u]==="undefined"){e.support[u]=n[u]}}t=null;e.cssEase={_default:"ease","in":"ease-in",out:"ease-out","in-out":"ease-in-out",snap:"cubic-bezier(0,1,.5,1)",easeOutCubic:"cubic-bezier(.215,.61,.355,1)",easeInOutCubic:"cubic-bezier(.645,.045,.355,1)",easeInCirc:"cubic-bezier(.6,.04,.98,.335)",easeOutCirc:"cubic-bezier(.075,.82,.165,1)",easeInOutCirc:"cubic-bezier(.785,.135,.15,.86)",easeInExpo:"cubic-bezier(.95,.05,.795,.035)",easeOutExpo:"cubic-bezier(.19,1,.22,1)",easeInOutExpo:"cubic-bezier(1,0,0,1)",easeInQuad:"cubic-bezier(.55,.085,.68,.53)",easeOutQuad:"cubic-bezier(.25,.46,.45,.94)",easeInOutQuad:"cubic-bezier(.455,.03,.515,.955)",easeInQuart:"cubic-bezier(.895,.03,.685,.22)",easeOutQuart:"cubic-bezier(.165,.84,.44,1)",easeInOutQuart:"cubic-bezier(.77,0,.175,1)",easeInQuint:"cubic-bezier(.755,.05,.855,.06)",easeOutQuint:"cubic-bezier(.23,1,.32,1)",easeInOutQuint:"cubic-bezier(.86,0,.07,1)",easeInSine:"cubic-bezier(.47,0,.745,.715)",easeOutSine:"cubic-bezier(.39,.575,.565,1)",easeInOutSine:"cubic-bezier(.445,.05,.55,.95)",easeInBack:"cubic-bezier(.6,-.28,.735,.045)",easeOutBack:"cubic-bezier(.175, .885,.32,1.275)",easeInOutBack:"cubic-bezier(.68,-.55,.265,1.55)"};e.cssHooks["transit:transform"]={get:function(t){return e(t).data("transform")||new a},set:function(t,r){var i=r;if(!(i instanceof a)){i=new a(i)}if(n.transform==="WebkitTransform"&&!s){t.style[n.transform]=i.toString(true)}else{t.style[n.transform]=i.toString()}e(t).data("transform",i)}};e.cssHooks.transform={set:e.cssHooks["transit:transform"].set};if(e.fn.jquery<"1.8"){e.cssHooks.transformOrigin={get:function(e){return e.style[n.transformOrigin]},set:function(e,t){e.style[n.transformOrigin]=t}};e.cssHooks.transition={get:function(e){return e.style[n.transition]},set:function(e,t){e.style[n.transition]=t}}}h("scale");h("translate");h("rotate");h("rotateX");h("rotateY");h("rotate3d");h("perspective");h("skewX");h("skewY");h("x",true);h("y",true);a.prototype={setFromString:function(e,t){var n=typeof t==="string"?t.split(","):t.constructor===Array?t:[t];n.unshift(e);a.prototype.set.apply(this,n)},set:function(e){var t=Array.prototype.slice.apply(arguments,[1]);if(this.setter[e]){this.setter[e].apply(this,t)}else{this[e]=t.join(",")}},get:function(e){if(this.getter[e]){return this.getter[e].apply(this)}else{return this[e]||0}},setter:{rotate:function(e){this.rotate=d(e,"deg")},rotateX:function(e){this.rotateX=d(e,"deg")},rotateY:function(e){this.rotateY=d(e,"deg")},scale:function(e,t){if(t===undefined){t=e}this.scale=e+","+t},skewX:function(e){this.skewX=d(e,"deg")},skewY:function(e){this.skewY=d(e,"deg")},perspective:function(e){this.perspective=d(e,"px")},x:function(e){this.set("translate",e,null)},y:function(e){this.set("translate",null,e)},translate:function(e,t){if(this._translateX===undefined){this._translateX=0}if(this._translateY===undefined){this._translateY=0}if(e!==null&&e!==undefined){this._translateX=d(e,"px")}if(t!==null&&t!==undefined){this._translateY=d(t,"px")}this.translate=this._translateX+","+this._translateY}},getter:{x:function(){return this._translateX||0},y:function(){return this._translateY||0},scale:function(){var e=(this.scale||"1,1").split(",");if(e[0]){e[0]=parseFloat(e[0])}if(e[1]){e[1]=parseFloat(e[1])}return e[0]===e[1]?e[0]:e},rotate3d:function(){var e=(this.rotate3d||"0,0,0,0deg").split(",");for(var t=0;t<=3;++t){if(e[t]){e[t]=parseFloat(e[t])}}if(e[3]){e[3]=d(e[3],"deg")}return e}},parse:function(e){var t=this;e.replace(/([a-zA-Z0-9]+)\((.*?)\)/g,function(e,n,r){t.setFromString(n,r)})},toString:function(e){var t=[];for(var r in this){if(this.hasOwnProperty(r)){if(!n.transform3d&&(r==="rotateX"||r==="rotateY"||r==="perspective"||r==="transformOrigin")){continue}if(r[0]!=="_"){if(e&&r==="scale"){t.push(r+"3d("+this[r]+",1)")}else if(e&&r==="translate"){t.push(r+"3d("+this[r]+",0)")}else{t.push(r+"("+this[r]+")")}}}}return t.join(" ")}};e.fn.transition=e.fn.transit=function(t,r,i,s){var u=this;var a=0;var l=true;var h=jQuery.extend(true,{},t);if(typeof r==="function"){s=r;r=undefined}if(typeof r==="object"){i=r.easing;a=r.delay||0;l=r.queue||true;s=r.complete;r=r.duration}if(typeof i==="function"){s=i;i=undefined}if(typeof h.easing!=="undefined"){i=h.easing;delete h.easing}if(typeof h.duration!=="undefined"){r=h.duration;delete h.duration}if(typeof h.complete!=="undefined"){s=h.complete;delete h.complete}if(typeof h.queue!=="undefined"){l=h.queue;delete h.queue}if(typeof h.delay!=="undefined"){a=h.delay;delete h.delay}if(typeof r==="undefined"){r=e.fx.speeds._default}if(typeof i==="undefined"){i=e.cssEase._default}r=v(r);var p=c(h,r,i,a);var d=e.transit.enabled&&n.transition;var m=d?parseInt(r,10)+parseInt(a,10):0;if(m===0){var g=function(e){u.css(h);if(s){s.apply(u)}if(e){e()}};f(u,l,g);return u}var y={};var b=function(r){var i=false;var a=function(e){if(i){for(var t=i.length;t>0;--t){u.unbind(i[t],a);if(o.length>1&&i[t]!==e.type&&o.indexOf(i[t])!==-1){o.splice(o.indexOf(i[t]),1)}}}if(m>0){u.each(function(){this.style[n.transition]=y[this]||null})}if(typeof s==="function"){s.apply(u)}if(typeof r==="function"){r()}};if(m>0&&e.transit.useTransitionEnd){i=o;for(var f=0;f<o.length;++f){u.bind(o[f],a)}}else{window.setTimeout(a,m)}u.each(function(){if(m>0){this.style[n.transition]=p}e(this).css(t)})};var w=function(e){this.offsetWidth;b(e)};f(u,l,w);return this};e.transit.getTransitionValue=c})(jQuery)
;
/**
 * @file
 * A JavaScript file for the theme.
 *
 * In order for this JavaScript to be loaded on pages, see the instructions in
 * the README.txt next to this file.
 */

// JavaScript should be made compatible with libraries other than jQuery by
// wrapping it with an "anonymous closure". See:
// - http://drupal.org/node/1446420
// - http://www.adequatelygood.com/2010/3/JavaScript-Module-Pattern-In-Depth
(function ($, Drupal, window, document, undefined) {

  $(document).ready(function() {


    /*
      Flash Fallback image hide and show
    */
    jQuery('.ios-show').hide();
    if ((navigator.userAgent.match(/iPad/i) != null) || (navigator.userAgent.match(/iPhone/i) != null) || (navigator.userAgent.match(/iPod/i) != null)) {
        jQuery('.ios-show').show();
        jQuery('.ios-hide').hide();
    }


    var pathArray = window.location.pathname.split( '/' );
    var secondLevelLocation = pathArray[1];

    switch (secondLevelLocation) {
      case 'missions':
      case 'news':
      case 'media':
      case 'gallery':
      	$('.menu-424 a').addClass('active')
      	                .parent().addClass('active-trail');
      	break;

      case 'about':
      	$('.menu-427 a').addClass('active')
      	                .parent().addClass('active-trail');
      	break;

      case 'careers':
        $('.menu-428 a').addClass('active')
                        .parent().addClass('active-trail');
        break;

      default:
      	break;
	  }
    
    //
    // Multimedia Gallery landing page
    //
    // Duplicate the `alt` attribute to populate missing `title` attributes on video thumbnails.
    if (secondLevelLocation == "media") {
      spacex_media_gallery_video_thumbnail_missing_attrib();
    }
    // Hack: listen for "Load More" pager click and run the Video thumbnail logic again.
    $('.page-media .pager-load-more .pager-next a').click(function(e) {
      // Slight delay then scan for new video thumbnails.
      //setTimeout(function(){ spacex_media_gallery_video_thumbnail_missing_attrib(); }, 1000);
      setInterval(function(){ spacex_media_gallery_video_thumbnail_missing_attrib(); }, 2000);
      //return false;
      e.stopPropagation(); // Stops click event from firing.
    });
    

    // Missions - Launch Manifest (animated scroll)
    $('.mission-links .future-missions').click(function() {
      $(this).css('color', '#FFF').css('background-repeat', 'no-repeat').css('background-image', "url('/sites/all/themes/spacex2012/images/spacex/future-missions-bg.png')");
      $('.mission-links .completed-missions').css('color', '#3A3A3A').css('background-image', 'none');
      $('html, body').animate({
        scrollTop: $("#future-missions-header").offset().top
      }, 600);
    });
    $('.mission-links .completed-missions').click(function() {
      $(this).css('color', '#FFF').css('background-repeat', 'no-repeat').css('background-image', "url('/sites/all/themes/spacex2012/images/spacex/future-missions-bg.png')");
      $('.mission-links .future-missions').css('color', '#3A3A3A').css('background-image', 'none');
      $('html, body').animate({
        scrollTop: $("#completed-missions-header").offset().top
      }, 1500);
    });

    // Expand Text (Leadership Executive bios)
    $('.attachment .field-name-field-exec-profile p').expander({
      slicePoint:       300,
      expandPrefix:     '<br><div class="down-arrow"></div>',
      expandText:       'Expand Bio',
      userCollapseText: 'Collapse Bio<div class="up-arrow"></div><div class="close-button"></div>',
      userCollapsePrefix: '<br><br><br>',
      expandEffect: 'fadeIn',
      expandSpeed: 250,
      collapseEffect: 'fadeOut',
      collapseSpeed: 200
    });

    // Header Height
    // var headerHeight = 0;
    // var headerHeight = $('.header-text').parent().parent().height();
    // $('.header-text').height(headerHeight);
    // $(window).resize(function() {
    //   var headerHeight = 0;
    //   var headerHeight = $('.header-text').parent().parent().height();
    //   $('.header-text').height(headerHeight);
    // });

    $('.attachment .field-name-field-exec-profile span.read-more').click(function(){
      $(this).parent().parent().parent().addClass('box-active');
    });
    $('.attachment .field-name-field-exec-profile span.read-less').click(function(){
      $(this).parent().parent().parent().parent().removeClass('box-active');
    });

    //history timeline block
    (function ($, Drupal, window, document, undefined) {

      // add a style so it's content is there even if js is disabled.
      $('body').addClass('javascript');

      var years = [];
      var offsets = [];
      var currentYear;
      var currentOffset = 0;
      var $currentElement;
      var $yearElements = jQuery(".section-about #block-views-history-milestone-block .view-history-milestone .view-content h3");
      var $inlineBlocks = jQuery(".section-about #block-views-history-milestone-block .view-history-milestone .view-content div.views-row");
      var $absoluteWrapper = jQuery(".section-about #block-views-history-milestone-block .view-history-milestone .view-content .absolute-wrapper");
      var $firstRow = jQuery(".section-about #block-views-history-milestone-block .view-history-milestone .view-content .absolute-wrapper .views-row-first");
      var $bubbleTail = jQuery('<div class="bubbletail"></div>');

      // build top navigation & gather all year blocks
      var nav = '<ul class="history-milestone-nav-list">';
      jQuery.each($yearElements, function(i, v) {
        years.push($(v).text());
        nav += '<li class="center-hv-container ' + years[i] + '"><div class="center-hv">' + '20' + years[i] + '</li>';
      });
      nav += "</ul>";

      // set the current year.
      currentYear = years[0];

      // build the back and forward nav
      var controles = '<ul class="history-milestone-controler box">';
      controles += '  <li class="dial center-hv-container"> <div class="center-hv"> <sup>1</sup> <span class="divider highlight">/</span> <sub>1</sub> </div> </li>';
      controles += '  <li class="center-hv-container middle"><a class="center-hv icon-chevron-left">Previose</a></li>';
      controles += '  <li class="center-hv-container"><a class="center-hv icon-chevron-right">Next</a></li>';
      controles += '</ul>';

      // populate offsets
      jQuery.each($inlineBlocks, function(i, v) {
        offsets.push($(v));
      });

      // append dom elements
      $('#block-views-history-milestone-block').append($('<div class="history-milestone-nav"></div>').append(nav));
      $('#block-views-history-milestone-block').append(controles);
      $('#block-views-history-milestone-block').append($bubbleTail);

      // set the number of the counter
      $('.history-milestone-controler sub').text(offsets.length);

      $('.history-milestone-controler .icon-chevron-right').parent().click( _next );
      $('.history-milestone-controler .icon-chevron-left').parent().click( _prev );

      // bind click events
      $('.history-milestone-nav li').click(function() {
        $(this).addClass('active').siblings().removeClass('active');
        _offsetYear($(this));
      });

      function _offsetYear($thisElement) {
        // this check is so a year can just be passed.
        if(!$.isNumeric($thisElement)) {
          classes = $thisElement.attr('class').split(' ');
          thisClass = classes[1];
        }
        else {
          thisClass = $thisElement;
        }

        $year = $(".section-about #block-views-history-milestone-block .view-history-milestone .timeline-year[data-year=" + String(thisClass) + ']');
        offset = $year.position().left;
        newLeftMargin = $absoluteWrapper.css('margin-left') - offset;
        $absoluteWrapper.css('margin-left', "-=" + offset);

        currentYear = thisClass;
        $(".history-milestone-nav ." + currentYear).addClass('active');
        $currentElement = $year;
        _alignImages();

        for(var i = 0; i < offsets.length; i++) {
          var dataYear = offsets[i].closest('.timeline-year').attr('data-year');
          if(dataYear == currentYear) {
            currentOffset = i;
            break;
          }
        }

        _setDial();
      }

      function _setYear(currentYear) {
        _offsetYear(currentYear);
      }

      function _setDial() {
        $('.history-milestone-controler sup').text(currentOffset + 1);
      }

      function _next() {
        $current = $($inlineBlocks[currentOffset]);
        $next = $($inlineBlocks[currentOffset + 1]);
        if($next.length) {
          $current = $next;
          _animateBubbleTail();
        }

        position = $current.position();

        $absoluteWrapper.css('margin-left', "-=" + position.left);
        currentOffset ++;
        currentOffset = (currentOffset >= offsets.length) ? offsets.length - 1 : currentOffset;

        _setDial();
        $currentElement = $current;
        var newCurrentYear = $currentElement.closest('.timeline-year').attr('data-year');
        if($.isNumeric(newCurrentYear) && currentYear != newCurrentYear) {
          $(".history-milestone-nav ." + currentYear).removeClass('active');
          $(".history-milestone-nav ." + newCurrentYear).addClass('active');
          currentYear = newCurrentYear;
        }

        _alignImages();
      }

      function _prev() {
        $current = $($inlineBlocks[currentOffset]);
        $prev = $($inlineBlocks[currentOffset - 1]);
        if($prev.length) {
          $current = $prev;
          _animateBubbleTail();
        }
        position = $current.position();

        $absoluteWrapper.css('margin-left', "-=" + position.left);
        currentOffset --;
        currentOffset = (currentOffset < 0) ? 0 : currentOffset;

        _setDial();
        /*
        $currentElement = $current;
        // prev needs to look back at what year it is supposed to be.
        var $tmp = $current;
        i = 0;
        do {
          $tmp = $tmp.prev();
          i ++;
        } while(!$.isNumeric($tmp.attr('class')) && i < 10)
        if($.isNumeric($tmp.attr('class')) && $tmp.attr('class') != currentYear) {
          $(".history-milestone-nav ." + currentYear).removeClass('active');
          currentYear = $tmp.attr('class');
          $(".history-milestone-nav ." + currentYear).addClass('active');
        }

        // Shouldn't be necessary but there is no harm in leaving this in.
        // Checks to see if the current element is a year and sets the year
        // if true.
        if($.isNumeric($current.attr('class'))) {
          $(".history-milestone-nav ." + currentYear).removeClass('active');
          currentYear = $current.attr('class');
          $(".history-milestone-nav ." + currentYear).addClass('active');
        }
        */
        $currentElement = $current;
        var newCurrentYear = $currentElement.closest('.timeline-year').attr('data-year');
        if($.isNumeric(newCurrentYear) && currentYear != newCurrentYear) {
          $(".history-milestone-nav ." + currentYear).removeClass('active');
          $(".history-milestone-nav ." + newCurrentYear).addClass('active');
          currentYear = newCurrentYear;
        }

        _alignImages();
      }

      function _alignImages() {
        var $activeElement;
        if($.isNumeric($currentElement.attr('class'))) {
          $activeElement = $currentElement.next();
        }
        else {
          $activeElement = $currentElement;
        }
        $('.absolute-wrapper .views-row .history-milestone-image-wrapper').removeClass('current');
        $activeElement.prevAll('.views-row').each(function() {
          $(this).find('.history-milestone-image-wrapper').removeClass('next').addClass('prev');
        });
        $activeElement.nextAll('.views-row').each(function() {
          $(this).find('.history-milestone-image-wrapper').removeClass('prev').addClass('next');
        });
        $activeElement.find('.history-milestone-image-wrapper').addClass('current');
      }

      function _moveToElement($element) {
        newLeftMargin = $absoluteWrapper.css('margin-left') - offset;
        $absoluteWrapper.css('margin-left', "-=" + offset);
      }

      var _animateBubbleTail = (function() {
        var timer = undefined;
        var isTiming = false;

        var animateBubbleTailFunction = function() {
          if (!isTiming) {
            isTiming = true;
            $bubbleTail.animate({
              'background-position-y': '20px'
            }, 200);
          }
          clearTimeout(timer);
          timer = setTimeout(function() {
            $bubbleTail.animate({
              'background-position-y': '0'
            }, 200);
            isTiming = false;
          }, 600);
        };

        return animateBubbleTailFunction;

      })();

      //initialize
      function _initialize($rowOne) {
        $rowOne.find('.history-milestone-image-wrapper').addClass("current");
        $(".history-milestone-nav ." + currentYear).addClass('active');
        $currentElement = $($inlineBlocks[0]);
        _alignImages();
      }

      _initialize($firstRow);

    })(jQuery, Drupal, this, this.document);

    var $floatingElements = [];
    // Add items we want floated on the left side
    $floatingElements.push($(".floating-sidebar .region-sidebar-first"));
    $floatingElements.push($("#content .group-left"));
    $floatingElements.push($(".view-missions .view-header"));

//fixed sidebar.
    var $viewPort = $(window);
    // the top offset for the elements. This is global and will override any
    // css styles
    var topOffsetVal = 10;
    var topOffset =  topOffsetVal + 'px';
    var $footer = $('#footer');

    $floatingElementSidebar = $(".floating-sidebar .region-sidebar-first");

    var blockTop = ($floatingElementSidebar.size() > 0) ? $floatingElementSidebar.offset().top : 0;
    if(blockTop > 0) {
      $(window).scroll($floatingElementSidebar, function(eventObject) {
        var footerTop = $footer.offset().top;
        var floatingElementSidebarBottom = $floatingElementSidebar.offset().top + $floatingElementSidebar.height();
        if($viewPort.scrollTop() <= (blockTop - topOffsetVal)){
          $floatingElementSidebar.css({
            position: 'static'
          });
        }
        else if($viewPort.scrollTop() >= (footerTop - $floatingElementSidebar.height() - (2 * topOffsetVal))) {
          // Difficult to find the correct top value to apply because of the relative parent
          // Instead set a bottom position, then get the top value, then apply the top value
          $floatingElementSidebar.css({ position: 'absolute', bottom: topOffset, top: 'auto' });
          var newTop = $floatingElementSidebar.position().top;
          $floatingElementSidebar.css({
            position: 'absolute',
            bottom: 'auto',
            top: newTop + 'px'
          });
        }
        else {
          $floatingElementSidebar.css({
            position: 'fixed',
            bottom: 'auto',
            top: topOffset
          });
        }
      });
    }

    // To add another floating element just copy this code (starting here)
    // replace the CSS Selector and the Rename the variables bellow
    $floatingElementNodeGroupLeft = $(".page-node .group-left");

    var blockTopNodeGroupLeft = ($floatingElementNodeGroupLeft.size() > 0) ? $floatingElementNodeGroupLeft.offset().top : 0;
    if(blockTopNodeGroupLeft > 0) {
      $(window).scroll($floatingElementNodeGroupLeft, function(eventObject) {
        var footerTop = $footer.offset().top;
        var floatingElementNodeGroupLeftBottom = $floatingElementNodeGroupLeft.offset().top + $floatingElementNodeGroupLeft.height();
        if($viewPort.scrollTop() <= (blockTopNodeGroupLeft - topOffsetVal)){
          $floatingElementNodeGroupLeft.css({
            position: 'static'
          });
        }
        else if($viewPort.scrollTop() >= (footerTop - $floatingElementNodeGroupLeft.height() - (2 * topOffsetVal))) {
          // Difficult to find the correct top value to apply because of the relative parent
          // Instead set a bottom position, then get the top value, then apply the top value
          $floatingElementNodeGroupLeft.css({ position: 'absolute', bottom: topOffset, top: 'auto' });
          var newTop = $floatingElementNodeGroupLeft.position().top;
          $floatingElementNodeGroupLeft.css({
            position: 'absolute',
            bottom: 'auto',
            top: newTop + 'px'
          });
        }
        else {
          $floatingElementNodeGroupLeft.css({
            position: 'fixed',
            bottom: 'auto',
            top: topOffset
          });
        }
      });
    }
    // end block of code to copy
    
    // To add another floating element just copy this code (starting here)
    // replace the CSS Selector and the Rename the variables bellow
    $floatingElementNodeGroupLeftGallery = $(".view-media-gallery-collection .group-left");
    
    var blockTopNodeGroupLeftGallery = ($floatingElementNodeGroupLeftGallery.size() > 0) ? $floatingElementNodeGroupLeftGallery.offset().top : 0;
    if(blockTopNodeGroupLeftGallery > 0) {
      $(window).scroll($floatingElementNodeGroupLeftGallery, function(eventObject) {
        var footerTop = $footer.offset().top;
        var floatingElementNodeGroupLeftGalleryBottom = $floatingElementNodeGroupLeftGallery.offset().top + $floatingElementNodeGroupLeftGallery.height();
        if($viewPort.scrollTop() <= (blockTopNodeGroupLeftGallery - topOffsetVal)){
          $floatingElementNodeGroupLeftGallery.css({
            position: 'static'
          });
        }
        else if($viewPort.scrollTop() >= (footerTop - $floatingElementNodeGroupLeftGallery.height() - (2 * topOffsetVal))) {
          // Difficult to find the correct top value to apply because of the relative parent
          // Instead set a bottom position, then get the top value, then apply the top value
          $floatingElementNodeGroupLeftGallery.css({ position: 'absolute', bottom: topOffset, top: 'auto' });
          var newTop = $floatingElementNodeGroupLeftGallery.position().top;
          $floatingElementNodeGroupLeftGallery.css({
            position: 'absolute',
            bottom: 'auto',
            top: newTop + 'px'
          });
        }
        else {
          $floatingElementNodeGroupLeftGallery.css({
            position: 'fixed',
            top: topOffset
          });
        }
      });
    }
    // end block of code to copy
    
    // To add another floating element just copy this code (starting here)
    // replace the CSS Selector and the Rename the variables bellow
    $floatingElementViewMissionHeader = $(".view-missions.missions.future .view-header").eq(0);

    var blockTopViewMissionHeader = ($floatingElementViewMissionHeader.size() > 0) ? $floatingElementViewMissionHeader.offset().top : 0;
    if(blockTopViewMissionHeader > 0) {
      $(window).scroll($floatingElementViewMissionHeader, function(eventObject) {
        var footerTop = $footer.offset().top;
        var floatingElementSidebarBottom = $floatingElementViewMissionHeader.offset().top + $floatingElementViewMissionHeader.height();
        if($viewPort.scrollTop() <= (blockTopViewMissionHeader - topOffsetVal)){
          $floatingElementViewMissionHeader.css({
            position: 'static'
          });
        }
        else if($viewPort.scrollTop() >= (footerTop - $floatingElementViewMissionHeader.height() - (2 * topOffsetVal))) {
          // Difficult to find the correct top value to apply because of the relative parent
          // Instead set a bottom position, then get the top value, then apply the top value
          $floatingElementViewMissionHeader.css({ position: 'absolute', bottom: topOffset, top: 'auto' });
          var newTop = $floatingElementViewMissionHeader.position().top;
          $floatingElementViewMissionHeader.css({
            position: 'absolute',
            bottom: 'auto',
            top: newTop + 'px'
          });
        }
        else {
          $floatingElementViewMissionHeader.css({
            position: 'fixed',
            bottom: 'auto',
            top: topOffset
          });
        }
      });
    }
    // end block of code to copy

  });

  //Multimedia Gallery block
  (function ($, Drupal, window, document, undefined) {
    // This is the functionality for the Multimedia Gallery Block
    // This is the place holder pagination for the controls.
    var pagination = '<div class="container pagination"><ul><li><a>1</a></li></ul></div>';

    // The DOM container for the block.
    var $multimediaBlock = $('.section-gallery.page-taxonomy-term-15 .block-views .view-media-gallery-collection');

    // Append the pagination to the block.
    $multimediaBlock.append(pagination);


    // media page jquery tools slider
    jQuery(document).ready(function() {
      jQuery(".scrollable").scrollable().navigator({ size: 1 });
    });



  })(jQuery, Drupal, this, this.document);
  
  Drupal.behaviors.spacexFloatingSidebarTrigger = {
    attach: function(context, settings) {
      $(window).scroll();
    }
  }

})(jQuery, Drupal, this, this.document);
  

function spacex_media_gallery_video_thumbnail_missing_attrib() {
  // Check if there is an empty TITLE, and a populated ALT to pull from.
  jQuery('.group-right .views-row .field-content').find('img').each(function(i) {
    if (!jQuery(this).attr('title') && jQuery(this).attr('alt')) {
      jQuery(this).attr('title', jQuery(this).attr('alt'));
    }
  });
}
;
/*
* Original Author : Zach Walders
*/

//(function($){

var CONSTANTS = {
    modalActiveClass : 'modal-is-opened',
    modalBodySelector : '.js-modal-body',
    modalCloserSelector : '.js-modal-closer',
    revealFeatureActiveClass : 'reveal-bd-feature-element-is-visible',
    revealToggleActiveClass : 'toggle-active',
    scrollTopAdjustmentAttr : 'data-scrollTop-adjustment',
    mastheadSelector : '.masthead'
};

var Modal = function(params) {
    this.$trigger = params.$trigger;
    this.$wrapper = params.$wrapper;
    this.$modalBody = this.$wrapper.find(CONSTANTS.modalBodySelector);
    this.$closer = this.$wrapper.find(CONSTANTS.modalCloserSelector);
    this.$window = jQuery(window);
    this.$html = jQuery('html');
    this.$body = jQuery('body');
    this.$modalOverlay = jQuery('<div class="modal-overlay"></div>').appendTo(jQuery('.rocket-container'));
    this.isWebkit = 'WebKitCSSMatrix' in window && 'm11' in new WebKitCSSMatrix();
    this.isIe = jQuery.browser.msie;
    this.scrollTopAdjuster = parseInt(this.$trigger.attr(CONSTANTS.scrollTopAdjustmentAttr), 10);
    this.targetScroll = null;
    this.$masthead = jQuery(CONSTANTS.mastheadSelector);

    this
        .init()
        .setupHandlers()
        .enable();
};
//}(jQuery));

Modal.prototype.init = function() {
    this.isEnabled = false;
    this.isOpened = false;

    this.$wrapper.css('opacity', 0);

    return this;
};

Modal.prototype.setupHandlers = function() {
    this.onClickHandler = this.onClick.bind(this);

    return this;
};

Modal.prototype.enable = function() {
    if(this.isEnabled) {
        return this;
    }

    this.isEnabled = true;

    this.$trigger.on('click', this.onClickHandler);
    this.$closer.on('click', this.onClickHandler);
    this.$modalOverlay.on('click', this.onClickHandler);
    this.$window.on('keypress', this.onKeypress);

    return this;
};

Modal.prototype.disable = function() {
    if(!this.isEnabled) {
        return this;
    }

    this.isEnabled = false;

    this.$trigger.off('click', this.onClickHandler);
    this.$closer.off('click', this.onClickHandler);
    this.$modalOverlay.off('click', this.onClickHandler);
    this.$window.off('keypress', this.onKeypress);

    return this;
};

Modal.prototype.onClick = function(e) {
    if(this.$wrapper.is(':animated')) {
        return false;
    }

    if(!this.isOpened) {
        this.isOpened = true;

        this.open();
    } else {
        this.isOpened = false;

        this.close();
    }

    return false;
};

Modal.prototype.onKeypress = function(e) {
    if (e.keyCode == 27) {  // ESC
        jQuery('.js-modal-closer:visible').click();
    }
};

Modal.prototype.open = function() {
    var self = this;

   this.targetScrollTop = (this.$trigger.offset().top - this.scrollTopAdjuster);


    jQuery('html, body').animate({
        scrollTop : this.targetScrollTop
    }, 400, function() {
        if(!self.isWebkit && !self.isIe) {
            // self.$body.css('margin-top', -self.targetScrollTop);
            self.$masthead.css('display', 'none');
        }

        self.$html.css('overflow', 'hidden');

        self.$wrapper.addClass(CONSTANTS.modalActiveClass);

        self.$modalOverlay.fadeIn(400);
        self.$wrapper.animate({
            'opacity' : 1
        }, 400, function() {
            self.$modalBody.animate({
                'opacity' : 1
            }, 400);
        });
    });

    return this;
};

Modal.prototype.close = function() {
    var self = this;

    this.$modalBody.animate({
        'opacity' : 0
    }, 400, function() {
        self.$wrapper.animate({
            'opacity' : 0
        }, 400, function() {
            self.$html.css({
                'overflow-y' : 'scroll',
                'overflow-x' : 'auto'
            });

            self.$wrapper.removeClass(CONSTANTS.modalActiveClass);

            if(!self.isWebkit && !self.isIe) {
                self.$body.css('margin-top', 0);
                jQuery('html, body').animate({
                    scrollTop : self.targetScrollTop
                }, 0, function() {
                    self.$masthead.css('display', 'block');
                    self.targetScrollTop = (self.$trigger.offset().top - self.scrollTopAdjuster);
                });
            }

            // re-embed inner html to stop media playback
            self.$wrapper.find('iframe').each(function() {
              jQuery(this).parent().html(jQuery(this).parent().html());
            });
        });
        self.$modalOverlay.fadeOut(400);
    });

    return this;
};

var RevealToggle = function(params) {
    this.$wrapper = params.$wrapper;
    this.$target = params.$target;

    this
        .init()
        .setupHandlers()
        .enable();
};

RevealToggle.prototype.init = function() {
    this.$images = this.$target.children();
    this.$toggles = this.$wrapper.find('a');
    this.toggles = [];
    this.isEnabled = false;
    this.$activeImage = jQuery(this.$images[0]);
    this.$activeToggle = jQuery(this.$toggles[0]);
    var length = this.$toggles.length;
    var i = 0;

    for (; i < length; i++) {
        this.toggles.push(this.$toggles[i]);
    }

    this.$activeImage
        .addClass(CONSTANTS.revealFeatureActiveClass)
        .css('opacity', 1);

    this.$activeToggle.addClass(CONSTANTS.revealToggleActiveClass);

    return this;
};

RevealToggle.prototype.setupHandlers = function() {
    this.onClickHandler = this.onClick.bind(this);

    return this;
};

RevealToggle.prototype.enable = function() {
    if(this.isEnabled) {
        return this;
    }

    this.isEnabled = true;

    this.$toggles.on('click', this.onClickHandler);

    return this;
};

RevealToggle.prototype.disable = function() {
    if(!this.isEnabled) {
        return this;
    }

    this.isEnabled = false;

    this.$toggles.off('click', this.onClickHandler);

    return this;
};

RevealToggle.prototype.onClick = function(e) {
    var self = this;
    var index = this.toggles.indexOf(e.currentTarget);
    var $targetToggle = jQuery(this.$toggles[index]);
    var $targetImage = jQuery(this.$images[index]);

    if(this.$activeImage.is(':animated') || $targetToggle.hasClass(CONSTANTS.revealToggleActiveClass)) {
        return false;
    }

    this.$activeToggle.removeClass(CONSTANTS.revealToggleActiveClass);

    this.$activeToggle = $targetToggle;

    this.$activeToggle.addClass(CONSTANTS.revealToggleActiveClass);

    this.$activeImage.animate({
        'opacity' : 0
    }, 400);

    $targetImage
        .addClass(CONSTANTS.revealFeatureActiveClass)
        .animate({
            'opacity' : 1
        }, 400, function() {
            self.$activeImage.removeClass(CONSTANTS.revealFeatureActiveClass);
            self.$activeImage = $targetImage;
        });

    return false;
};





(function($){
    $(function() {
        var modalMerlinParams = {
            $trigger : $('#modal-trigger-merlin'),
            $wrapper : $('#modal-merlin')
        };

        var merlinModal = new Modal(modalMerlinParams);

        var merlinTogglesParams = {
            $wrapper : $('#merlin-reveal-toggles'),
            $target : $('#merlin-reveal-target')
        };

        var merlinToggles = new RevealToggle(merlinTogglesParams);
    });
}(jQuery));

;
/*
 * author: Glen Cheney
 */

// adding indexOf functionality for legacy IE browsers
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(elt, from) {
        var len = this.length >>> 0;
        from = Number(from) || 0;
        from = (from < 0) ? Math.ceil(from) : Math.floor(from);
        if (from < 0) {
            from += len;
        }

        for (; from < len; from++) {
            if (from in this &&
                    this[from] === elt
                    ) {
                return from;
            }
        }

        return -1;
    };
}

// adding bind functionality for legacy IE browsers
if (!Function.prototype.bind) {
    Function.prototype.bind = function (oThis) {
        if (typeof this !== "function") {
            // closest thing possible to the ECMAScript 5 internal IsCallable function
            throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
        }
        var aArgs = Array.prototype.slice.call(arguments, 1),
                fToBind = this,
                fNOP = function () {},
                fBound = function () {
                    return fToBind.apply(this instanceof fNOP && oThis ? this : oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
                };
        fNOP.prototype = this.prototype;
        fBound.prototype = new fNOP();

        return fBound;
    };
}

/*global Modernizr, Tap */

// If there's no console, make a console variable and do nothing with logs
if (!window.console) {
    var empty = function() {};
    window.console = {
        log: empty,
        info: empty,
        warn: empty,
        error: empty,
        assert: empty
    };
}

var Exp = {
    Modules: {},
    Page: ''
};

// Constrains a value between a min and max
Exp.constrain = function(value, min, max) {
    'use strict';

    value = parseFloat(value);

    return value < min ? min :
            value > max ? max :
                    value;
};

Exp.sum = function() {
    'use strict';

    var sum = 0,
            i = 0,
            len = arguments.length;

    for (; i < len; i++) {
        if (Array.isArray(arguments[i])) {
            sum += Exp.sum.apply(this, arguments[i]);
        } else {
            sum += parseFloat(arguments[i]);
        }
    }

    return sum;
};

Exp.truncate = function(str, length, truncation) {
    'use strict';

    length = length || 30;
    truncation = truncation === undefined ? '...' : truncation;
    return str.length > length ?
            str.slice(0, length - truncation.length) + truncation : str;
};

// Each rocket piece should have a data-overlap, data-start, and data-distance attribute on the containing div
// data-overlap is the amount the rocket piece overlaps the next piece
// data-start is the distance from the _bottom_ of the screen that the parallaxing starts
// data-distance is the distance the piece should travel before stopping
// The speed variable could possibly be based on window height
Exp.Modules.ParallaxRocket = (function($, Modernizr, window) {
    'use strict';

    var containerOffsetTop = 0,
            speed = 0,
            containerHeight = 0,
            winHeight = 0,
            touchST = 0,
            touchStartedY = 0,
            $window,
            $container,
            $elements,
            $hotspots,
            isInitialized = false,
            transBegin = Modernizr.csstransforms3d ? 'translate3d(0, ' : 'translate(0, ',
            transEnd = Modernizr.csstransforms3d ? 'px, 0)' : 'px)',

            _init = function() {
                // Set variables
                $window = $(window);
                $elements = $('.rocket-piece');
                $container = $('.rocket-body');
                $hotspots = $('.hotspots .hotspot');

                if (!$('.dragon').length) {
                    return;
                }

                // Set indexes and an initial transform
                $elements.each(function(i) {
                    this.setAttribute('data-index', i);
                    $(this).css('transform', transBegin + '0' + transEnd);
                });

                // On window resize, we need to recalculate values and positions of the rocket elements
                $window.on('resize.rocket', $.throttle(100, _onResize));

                // If this is a touch device, subscribe to touch events
                if (Modernizr.touch) {
                    $('body').on('touchstart', _touchStart)
                            .on('touchmove', _touchMove)
                            .on('touchend', _touchEnd);
                }

                else {
                    $window.on('scroll.rocket', _onScroll);
                }

                // On window load, find images and calculate future height of container
                $window.on('load.rocket', function() {
                    var extraHeight = 0;
                    $elements.each(function() {
                        var extra = $(this).data('distance') || 0;
                        extraHeight += extra;
                    });

                    //$container.css('height', '+=' + extraHeight);

                    isInitialized = true;
                    _recalculate();
                });

                // Do extra work for dragon rocket
                if ($('.rocket').hasClass('dragon')) {
                    // TODO: there was an error with this line -- not sure where it's used, or if it's needed, but it didn't run before.
                    // _animatedSprite();
                }
            },

            _onScroll = function() {
                _animate($window.scrollTop());
            },

            _onResize = function() {
                _recalculate();
            },

            _animate = function(st) {
                var totalOffset = 0,
                        sb = st + winHeight,
                        offset = sb - containerOffsetTop;

                if (!_initialized()) {
                    return;
                }

                // Loop through each element and calculate its new margin bottom or translate
                // Values are also applied to the hotspots to keep them in sync with the rocket
                $elements.each(function(i) {
                    var $piece = $(this),
                            $rocketHotspots = _getRocketHotspots(i + 1),
                            data = $piece.data(),
                            overlap = data.overlap || 0,
                            total = data.distance + overlap,
                            pieceHeight = $piece.height(),
                            parentOffset = $piece.position().top,
                            offsetFromBottom = offset - pieceHeight - parentOffset + overlap,
                            prct = (offsetFromBottom - data.start) / total,
                            amount = Math.round(prct * total * speed);

                    amount = Exp.constrain(amount, 0, total) || 0;
                    totalOffset += amount;

                    // If css transforms are available, use them. It will be much smoother than adding pixels while scrolling
                    if (Modernizr.csstransforms) {
                        $elements.eq(i + 1).css('transform', transBegin + totalOffset + transEnd);
                        $rocketHotspots.css('transform', transBegin + totalOffset + transEnd);

                        // Otherwise we need to add pixels to the margin bottom of the rocket piece element
                    } else {
                        $piece.css('marginBottom', amount + 'px');
                        $rocketHotspots.each(function() {
                            var $this = $(this),
                                    originalY = $this.data('originalY');
                            $this.css('top', originalY + totalOffset + 'px');
                        });
                    }

                    // If this piece should be a sprite sheet, tell it to go to the frame associated with the percentage
                    // calculated above
                    if ($piece.find('img').data('isSprite')) {
                        var $sprite = $piece.find('img'),
                                sprite = $sprite.animatedSprite(),
                                frames = sprite.numFrames.v,
                                frame = Exp.constrain( Math.round(prct * frames) , 0, frames);

                        sprite.goToFrame(frame, 'v');
                    }

                });
            },

    // Returns hotspots associated with a rocket index
            _getRocketHotspots = function(index) {
                return $hotspots.filter(function() {
                    return index === parseInt(this.getAttribute('data-piece'), 10);
                });
            },

    // Recalcutes window size and heights and calls animate again
            _recalculate = function() {
                containerOffsetTop = $container.offset().top;
                containerHeight = $container.height();
                winHeight = $window.height();

                if (winHeight < 500) {
                    speed = 0.9;
                } else if (winHeight < 800) {
                    speed = 0.8;
                } else if (winHeight >= 800) {
                    speed = 0.6;
                }

                _onScroll();
            },

    // On touch start, save the Y value
            _touchStart = function(evt) {
                touchST = $window.scrollTop();
                touchStartedY = evt.originalEvent.targetTouches[0].clientY;
            },

    // On touch move, add the distance we've travelled to where the touch started, call animate
            _touchMove = function(evt) {
                var yDistance = touchStartedY - evt.originalEvent.targetTouches[0].clientY,
                        newScrollTop = touchST + yDistance;
                _animate(newScrollTop);
            },

    // Add an event listener that will only be called once for scrolling.
    // This will be executed, for example, when the device has scroll momentum
            _touchEnd = function() {
                $window.one('scroll', function() {
                    _animate($window.scrollTop());
                });
            },

    // Initializes an animated sprite
            _animatedSprite = function() {
                var $trunk = $('#trunk');
        $trunk.animatedSprite('/sites/all/themes/spacex2012/images/dragon/dragon-spritesheet_transparent.png', {
                    loop: false,
                    playing: false,
                    frameWidth: 1024,
                    frameHeight: 240,
                    orientation: 'v'
                });
                $trunk.data('isSprite', true);
            },

            _initialized = function() {
                return isInitialized;
            };

    return {
        init: _init,
        isInitialized: _initialized
    };
}(jQuery, Modernizr, window));

Exp.Modules.Hotspot = (function($, Modernizr) {
    'use strict';

    var $hotspots,
            $body,
            evtName = '',

            init = function() {
                $hotspots = $('.hotspot');

                if ($hotspots.length === 0) {
                    return;
                }

                $hotspots.each(function(i) {
                    var data = $(this).data();
                    this.style.left = data.x + 'px';
                    this.style.top = data.y + 'px';
                    // Set an index value for each hotspot for navigation
                    this.setAttribute('data-index', i);
                    this.setAttribute('data-original-x', data.x);
                    this.setAttribute('data-original-y', data.y);
                });

                $hotspots.first().find('.hotspot-prev').addClass('disabled');
                $hotspots.last().find('.hotspot-next').addClass('disabled');

                $body = $('body');

                Modernizr.load({
                    test: Modernizr.touch,
                    yep: 'scripts/vendor/tap.js',
                    complete: function() {
                        events();
                    }
                });
            },

            events = function() {
                evtName = Modernizr.touch ? 'tap' : 'click';

                // Add tap listener to body
                if (Modernizr.touch) {
                    new Tap('body');
                }

                // Hotspot clicks/taps
                $hotspots.on(evtName, function(evt) {
                    var $hotspot = $(this);
                    evt.stopPropagation();

                    // Clicked on content inside the hotspot, not the hotspot itself or outside it.
                    if ($.contains(this, evt.target)) {
                        return;
                    }

                    // Already has active class, close the popover
                    if ($hotspot.hasClass('active')) {
                        close($hotspot);

                        // Doesn't have active class
                    } else {
                        // Make this one active
                        show($hotspot);
                    }
                });

                // close the popover when the close button is clicked/tapped
                $hotspots.find('.close').on(evtName, function() {
                    close($(this).parents('.hotspot'));
                });

                // Hotspot navigation
                $('.hotspot-nav-btn').on(evtName, function() {
                    var $btn = $(this),
                            $hotspot = $btn.parents('.hotspot'),
                            index = $hotspot.data('index'),
                            fwd = $btn.hasClass('hotspot-next'),
                            targetIndex = fwd ? index + 1 : index - 1,
                            $targetHotspot = $('.hotspot[data-index="' + targetIndex + '"]'),
                            offset;

                    if (targetIndex < 0 || targetIndex > $hotspots.length - 1) {
                        return;
                    }

                    offset = 45; // the hotspot is down 15px from the arrow

                    if ($targetHotspot.hasClass('top')) {
                        var contentHeight = $targetHotspot.find('.hotspot-content').outerHeight();
                        // .top hotspot is 14px above that. and then 30px of margin at the top
                        offset = contentHeight + 14 + 30;
                    }

                    $.simplescroll({
                        target: $targetHotspot,
                        speed: 400,
                        showHash: false,
                        easing: 'easeOutQuad',
                        callback: function() {
                            close($hotspot);
                            show($targetHotspot);
                        },
                        offset: offset
                    });
                });
            },

            show = function($hotspot) {
                // Remove all other active hotspots
                $hotspots.filter('.active').removeClass('active');
                $hotspot.addClass('active');

                // Add an event to the body so when we tap there, it closes the popover
                $body.on(evtName + '.body', function() {
                    close($hotspot);
                });
            },

            clear = function() {
                $body.off(evtName + '.body');
            },

            close = function($hotspot) {
                clear();
                $hotspot.removeClass('active');
            };

    return {
        init: init,
        close: close
    };
}(jQuery, Modernizr));

Exp.Modules.Social = (function($, window) {
    'use strict';

    var url = window.encodeURIComponent(window.location.protocol + '//' + window.location.hostname + window.location.pathname),

            title = window.document.title,

            _init = function() {
                var $twitters = $('.share-twitter'),
                        $plusOnes = $('.share-plus'),
                        $facebooks = $('.share-facebook');

                // Append the current encoded url to the share string
                $twitters.each(function() {
            //this.href += url;
          this.href = 'https://twitter.com/intent/tweet?url=' + url;
                })

                    // Open href in a new popup window
                        .on('click', function(evt) {
                            evt.preventDefault();
                            _newWindow(this.href, 'intent', 550, 420);
                        });

                // Append the current encoded url to the share string
                $plusOnes.each(function() {
            //this.href += url;
            this.href = 'https://plus.google.com/share?url=' + url;
                })

                    // open href in a new popup window
                        .on('click', function(evt) {
                            evt.preventDefault();
                            _newWindow(this.href, 'Share this Google+', 600, 600);
                        });

                // Append the current encoded url to the share string
                $facebooks.each(function() {
            //this.href += url + '&t=' + title;
            this.href = 'http://www.facebook.com/sharer/sharer.php?u=' + url + '&t=' + title;
                })

                    // open href in a new popup window
                        .on('click', function(evt) {
                            evt.preventDefault();
                            _newWindow(this.href, title, 640, 320);
                        });
            },

            _newWindow = function(url, title, width, height) {
                var windowOptions = 'scrollbars=yes,resizable=yes,toolbar=no,location=yes',
                        winHeight = screen.height,
                        winWidth = screen.width,
                        left = Math.round((winWidth / 2) - (width / 2)),
                        top = 0;

                if (winHeight > height) {
                    top = Math.round((winHeight / 2) - (height / 2));
                }

                window.open(url, title, windowOptions + ',width=' + width + ',height=' + height + ',left=' + left + ',top=' + top);
            };

    return {
        init: _init
    };
}(jQuery, window));

Exp.Modules.Timeline = (function($, window) {
    'use strict';

    var $carousel,
            carousel,
            $container,
            $navbar,
            $dots,
            $years,
            $window,
            navbarHeight = 0,
            ww = 0,
            wh = 0,
            room = 0,
            contentTop = 0,
            dotTop = 0,
            dotHeight = 0,
            dates = [],
            minDate = 0,
            maxDate = 0,
            dateDiff = 0,
            years = [],
            isInitialized = false,

            init = function() {
                // Initialize carousel
                $carousel = $('.timeline .carousel').carousel({
                    transition: 'vertical',
                    swipe: 'vertical',
                    cssEasing: 'cubic-bezier(0.250, 0.460, 0.450, 0.940)',
                    duration: 400,
                    loop: false,
                    disabledClass: 'disabled',
                    activeClass: 'active',
                    generateNav: false,
                    showSlideCountTxt: true,
                    slideCountSeparator: '/'
                });

                // Save some variables
                carousel = $carousel.data('carousel');
                $container = $carousel.parent();
                $dots = $container.find('.carousel-index-btn');
                $navbar = $container.find('.carousel-navbar-inner');
                navbarHeight = $navbar.height();
                $window = $(window);
                ww = $window.width();
                wh = $window.height();

                // Move dots on slide start
                $carousel.on('slideStart.Carousel', slideStart);

                // Fix for IE window resize event
                $window.on('resize.timeline', $.throttle(200, function() {
                    if ($window.height() !== wh || $window.width() !== ww) {
                        onResize();
                    }
                }));

                $window.on('load.timeline', function() {
                    isInitialized = true;
                    onResize();
                });

                setDates();

                $dots.each(function(i) {
                    this.title = new Date(dates[i]);
                });

            },

            slideStart = function(evt, index/*, prevIndex, direction, carousel*/) {
                positionEventDots(index);
                positionYears(index);
            },

    // parse a date in yyyy-mm-dd format
            parseDate = function(input) {
                var parts = input.match(/(\d+)/g);
                // new Date(year, month [, date [, hours[, minutes[, seconds[, ms]]]]])
                // months are 0-based
                return new Date( parts[0], parts[1] - 1, parts[2] );
            },

            setDates = function() {
                var i = 0,
                        line = $container[0].querySelector('.line .years'),
                        frag = document.createDocumentFragment(),
                        maxYear, minYear, yearsBetween;

                dates.length = 0;
                carousel.slides.each(function() {
                    var $this = $(this),
                            $date = $this.find('time'),
                            dateStr = $date.attr('datetime') || $date.html(),
                            date = Date.parse(dateStr);

                    if (isNaN(date)) {
                        date = parseDate(dateStr);
                    }

                    dates.push(date);
                });

                // Make some calculations
                minDate = dates.min();
                maxDate = dates.max();
                dateDiff = maxDate - minDate;
                maxYear = new Date(maxDate).getFullYear();
                minYear = new Date(minDate).getFullYear();
                yearsBetween = maxYear - minYear;

                // Create ~4 year elements, append them to the .line element, and push them onto our years array.
                // Finally, save them to a jQuery object
                for (; i < yearsBetween; i++) {
                    var el = document.createElement('span'),
                            year = new Date(maxYear - i, 0, 1);
                    el.className = 'year';
                    el.title = year.getFullYear();
                    frag.appendChild(el);
                    years.push(year.getTime());
                }
                line.appendChild(frag);
                $years = $(line).children();
            },

            onResize = function() {
                if (!initialized()) {
                    return;
                }

                contentTop = Math.round($carousel.find('.active .event').eq(0).position().top);
                dotTop = contentTop + 4;
                $dots.parent().css('top', dotTop + 'px');
                $years.parent().css('top', dotTop + 'px');

                var cHeight = $carousel.height();

                dotHeight = $dots.eq(0).outerHeight();

                room = cHeight - dotTop - ($dots.length * dotHeight);

                positionEventDots(carousel.currIndex);
                positionYears(carousel.currIndex);
            },

            getPercents = function(times, index) {
                var percents = [],
                        diff = dates[index] - minDate;

                // Save the percentages of where the events are on the timeline
                $.each(times, function(i, time) {
                    var percent = 1 - ((time - minDate) / diff);
                    percent = Exp.constrain(percent, -1, 1);
                    if (isNaN(percent)) {
                        percent = 0;
                    }
                    percents.push(percent);
                });

                return percents;
            },

            getSpacing = function(percents, noOverlap) {
                var spacing = [],
                        lastOffset = null;

                $.each(percents, function(i, percent) {
                    var offset = Math.round(percent * room);

                    // If the circles are too close together, separate them a bit
                    if (noOverlap && lastOffset !== null && offset - lastOffset < dotHeight) {
                        offset = lastOffset + dotHeight + 3; // 3px margin
                        lastOffset = offset;
                    }

                    spacing.push(offset);
                });

                return spacing;
            },

            positionEventDots = function(index) {
                index = index || 0;
                positionItems($dots, dates, index, true);
            },

            positionYears = function(index) {
                index = index || 0;
                positionItems($years, years, index);
            },

            positionItems = function($collection, items, index, noOverlap) {
                index = index || 0;

                var spacing = getSpacing( getPercents(items, index), noOverlap );

                $collection.each(function(i) {
                    var top = spacing[i] > -25 ? spacing[i] : -contentTop - 20;
                    this.style.top = top + 'px';
                });
            },

            initialized = function() {
                return isInitialized;
            };

    return {
        init: init,
        isInitialized: initialized
    };
}(jQuery, window));

Exp.Modules.HomeCarousel = (function($, Modernizr) {
    'use strict';

    var $carousel,
            $navButtons,
            timeout = 5000,
    duration = 2000,

            init = function() {
                $carousel = $('.carousel');
                var $slides = $('.slide', $carousel);

                // If there is only one slide don't initialize
                // the carousel.
                if ($slides.length < 2) {
                  return;
                }

                $carousel.addClass('is-active');
                $carousel.carousel({
                    transition: 'fade',
                    activeClass: 'active',
                    duration: duration,
                    showIndexBtns: true,
                    showPrevNextBtns: false,
                    timeout: timeout,
                    pauseOnHover: false,
                    useTitles: true,
                    putControlsInside: true
                });

        // append container divs to hold dynamic solid background for transparent .active button styling
        $carousel.find('.carousel-controls').prepend('<div class="carousel-controls-pre"></div>');
        $carousel.find('.carousel-controls').append('<div class="carousel-controls-post"></div>');

                $navButtons = $carousel.find('.carousel-index-btn');
                $navButtons.each(function(i, li) {
                    var $li = $(li);
                    $li
                            .wrapInner('<span class="title"/>')
                            .append('<span class="progress" />')
                            .append('<span class="bg-cell bg-cell' + i + '"/>');

                    var txt = $li.find('.title').text();

                    $li.find('.title').text(Exp.truncate(txt, 40));
                    $li.find('.title').click(function() {
                        $(this).parent().click();
                    });
                }).css('width', (100 / $navButtons.length) + '%');

                // If we don't have css animations, we have some work to do with the progress bar
                if (!Modernizr.cssanimations) {

                    $carousel
                        // On slide start, set the progress width to 0
                            .on('slideStart.Carousel', function(evt, index, prevIndex, direction, carousel) {
                                carousel.$el.find('.carousel-index-btn').eq(prevIndex).find('.progress').stop(true).width(0);
                            })

                        // Start progress bar animation
                            .on('timerStart.Carousel', function(evt, index, prevIndex, direction, carousel) {
                                animateProgress(carousel, timeout);
                            })

                        // Pause progress bar animation
                            .on('paused.Carousel', function(evt, remaining, carousel) {
                                carousel.$el.find('.carousel-index-btn').eq(carousel.currIndex).find('.progress').stop();
                            })

                        // Resume progress bar with remaining time
                            .on('resumed.Carousel', function(evt, remaining, carousel) {
                                animateProgress(carousel, remaining);
                            })

                        // The timerStart event is triggered before we've attached a handler to it :(
                            .one('slideEnd.Carousel', function(evt, index, prevIndex, direction, carousel) {
                                animateProgress(carousel, timeout - duration);
                            });

                }
            },

            complete = function() {
                this.style.width = 0;
            },

            animateProgress = function(carousel, duration) {
                var $progress = carousel.$el.find('.carousel-index-btn').eq(carousel.currIndex).find('.progress');
                $progress.animate({
                    width: '100%'
                }, duration, 'linear', complete);
            };

    return {
        init: init
    };
} (jQuery, Modernizr));

Exp.Modules.DragonTabs = (function ($, Modernizr) {
    'use strict';

    var $tabs,
            $navButtons,

            init = function () {

        $tabs = $('.node .dragon .tabs');

                $navButtons = $tabs.find('.nav ul li, .pagination ul li');
                $navButtons.each(function (i, li) {

                    var $li = $(li);

                    $li.find('a').click(function (e) {

            	e.preventDefault;

                        var tabId = $(this).attr('href');

                        $tabs.find('.active').removeClass('active');
                        $tabs.find(tabId + '-tab').addClass('active');

                        $tabs.find('ul li a[href=' + tabId + ']').parent().addClass('active');
                        $tabs.find('.nav ul').attr('class', tabId.replace('#', ''));

                        return false;

                    });

                });
            };

    return {
        init: init
    };

} (jQuery, Modernizr));

Exp.Modules.Nav = (function($, Modernizr) {
    'use strict';

    var $searchBtn,
            $searchContainer,
            $searchForm,
            $searchInput,
            $subnav,
            $subnavArrow,
            $navLinks,

            arrowPositions = {
                'search' : 270,
                'updates' : 581,
                'about' : 675
            },
            arrowTransitionDuration = '',

            currentSubnav = '',
            isOpen = false,

            _init = function() {
                $searchBtn = $('.main-nav .search-wrap');
                $searchContainer = $('.super-search');
                $searchForm = $('.super-search form');
                $searchInput = $searchForm.find('.blended-input');
                $subnav = $('.subnav');
                $subnavArrow = $subnav.find('.subnav-arrow');
                $navLinks = $('.main-nav .nav-list');

                arrowTransitionDuration = $subnavArrow.css('transitionDuration');

                $searchBtn.on('click', function() {
                    if ($searchContainer.hasClass('open')) {
                        $searchBtn.removeClass('active');
                        _hideSearch();
                    } else {
                        $searchBtn.addClass('active');
                        _showSearch();
                    }
                });

                $searchInput.on('keypress', function(evt) {
                    if (evt.which === 13) {
                        $searchForm.trigger('submit');
                    }
                });

                // Set widths on links. WHERE ARE YOU FLEXBOX!
                $('.subnav .subnav-wrap').not('.search-topics').each(function() {
                    var $wrap = $(this),
                            $links = $wrap.children(),
                            len = $links.length;
                    $links.css('width', (100 / len) + '%');
                });

                $navLinks.find('.dropdown-trigger').on('click', function(evt) {
                    evt.preventDefault();
                    var $self = $(this);
                    var target = $self.attr('data-subnav-target');
                    var $activeItem = $navLinks.find('.dropdown-trigger-active');

                    if (isOpen && target === currentSubnav) {
                        _navClose($self.find('.dropdown-indicator'));
                        $self.removeClass('dropdown-trigger-active');
                    } else {
                        if ($activeItem.length) {
                            _navClose($activeItem.find('.dropdown-indicator'));
                            $activeItem.removeClass('dropdown-trigger-active');
                        }
                        $self.addClass('dropdown-trigger-active');
                        _navOpen($self.find('.dropdown-indicator'), target);
                    }
                });
            },

            _navClose = function($element) {
                _hideSubnav();

                $element.stop(true, true).animate({
                    'margin-left' : -5,
                    'bottom' : -10,
                    'border-left-width' : 5,
                    'border-right-width' : 5,
                    'border-bottom-width' : 5,
                    'opacity' : 0.4
                }, 400);
            },

            _navOpen = function($element, target) {
                $element.stop(true, true).animate({
                    'margin-left' : -12,
                    'bottom' : -29,
                    'border-left-width' : 12,
                    'border-right-width' : 12,
                    'border-bottom-width' : 12
                }, 400, function() {
                    _showSubnav(target);
                    $element.stop(true, true).animate({
                        'opacity' : 1
                    }, 400);
                });
            },

            _showSearch = function() {
                $searchBtn.find('i')[0].className = 'icon-x';

                // Slide out, and fade out links
                if (Modernizr.csstransitions) {
                    $searchContainer.addClass('open');
                    $navLinks.fadeOut(200);
            // @TODO find out what happened to _shinkArrow
            // _shrinkArrow($navLinks.find('.dropdown-trigger-active').find('.dropdown-indicator'));
                }

                // Fade out links, then snap input open
                else {
                    $searchInput.fadeIn(450);
                    $searchContainer.addClass('open');
                    $navLinks.fadeOut(450);
            // @TODO find out what happened to _shinkArrow
            // _shrinkArrow($navLinks.find('.dropdown-trigger-active').find('.dropdown-indicator'));
                }

                if (!isOpen && Modernizr.csstransitions) {
                    setTimeout(_showSubnav, 450, 'search');
                } else {
                    _showSubnav('search');
                }

                $searchInput.focus();
            },

            _hideSearch = function() {
                // Slide back in, then fade in links
                $searchBtn.find('i')[0].className = 'icon-search';
                if (Modernizr.csstransitions) {
                    $searchContainer.removeClass('open');
                    setTimeout(function() {
                        $navLinks.fadeIn(200);
                    }, 200);
                }

                // Slide in immediately, fade in links
                else {
                    $searchInput.fadeOut(450);
                    $searchContainer.removeClass('open');
                    $navLinks.fadeIn(450);
                }
                _hideSubnav();
            },

    // _moveArrow = function(subnav) {
    //     if (isOpen) {
    //         $subnavArrow.css('left', arrowPositions[subnav] + 'px');
    //     } else {
    //         $subnavArrow.css({
    //             'transitionDuration': '0ms',
    //             'left' : arrowPositions[subnav]
    //         });
    //         setTimeout(function() {
    //             $subnavArrow.css('transitionDuration', arrowTransitionDuration);
    //         }, 100);
    //     }
    // },

            _showSubnav = function(subnav) {
                //show/hide tertiary menu
                jQuery('.region region-tertiary-menu').hide();
                jQuery('#block-menu-menu-about-spacex-sublinks').hide();
                $subnav.find('[data-subnav="' + subnav + '"]').show().siblings('[data-subnav]').hide();
                $subnav.addClass('open');
                currentSubnav = subnav;
                // _moveArrow(subnav);
                isOpen = true;
            },

            _hideSubnav = function() {
                //show/hide tertiary menu
                jQuery('.region region-tertiary-menu').show();
                jQuery('#block-menu-menu-about-spacex-sublinks').show();
                $subnav.removeClass('open');
                currentSubnav = '';
                isOpen = false;
            };

    return {
        init: _init
    };
}(jQuery, Modernizr));

Exp.Modules.Polyfills = (function(window, Modernizr) {
    'use strict';

    var fill = function() {

        // Find the maximum value in an array
        if (!Array.prototype.max) {
            Array.prototype.max = function() {
                return Math.max.apply( Math, this );
            };
        }

        // Find the minimum value in an array
        if (!Array.prototype.min) {
            Array.prototype.min = function() {
                return Math.min.apply( Math, this );
            };
        }

        // https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/isArray
        if(!Array.isArray) {
            Array.isArray = function (vArg) {
                return Object.prototype.toString.call(vArg) === '[object Array]';
            };
        }

        // Replace SVG with png
        if (!Modernizr.svg) {
            jQuery('img[src$=".svg"]').each(function() {
                this.src = this.src.replace('.svg', '.png');
            });
        }


        // Opera engineer Erik Möller polyfill for request animation frame
        var lastTime = 0;
        var vendors = ['ms', 'moz', 'webkit', 'o'];
        for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
            window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
            window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
        }

        if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = function(callback, element) {
                var currTime = new Date().getTime();
                var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                var id = window.setTimeout(function() { callback(currTime + timeToCall); },
                        timeToCall);
                lastTime = currTime + timeToCall;
                return id;
            };
        }

        if (!window.cancelAnimationFrame) {
            window.cancelAnimationFrame = function(id) {
                clearTimeout(id);
            };
        }

        // Placeholder polyfill. Uses request animation frame above
        if (!Modernizr.input.placeholder) {
            window.placeHolderConfig = {
                // css class that is used to style the placeholder
                className: 'placeholder',
                // expose the placeholder text to screenreaders or not
                visibleToScreenreaders : true,
                // css class is used to visually hide the placeholder
                visibleToScreenreadersHideClass : 'placeholder-hide-except-screenreader',
                // css class used to hide the placeholder for all
                visibleToNoneHideClass : 'placeholder-hide',
                // either hide the placeholder on focus or on type
                hideOnFocus : false,
                // remove this class from a label (to fix hidden labels)
                removeLabelClass : 'visuallyhidden',
                // replace the label above with this class
                hiddenOverrideClass : 'visuallyhidden-with-placeholder',
                // allow the replace of the removeLabelClass with hiddenOverrideClass or not
                forceHiddenOverride : true,
                // apply the polyfill even for browser with native support
                forceApply : true,
                // init automatically or not
                autoInit : true
            };
        }
        Modernizr.load({
            test: Modernizr.input.placeholder,
            nope: [
                'sites/all/themes/spacex2012/css/styles/placeholder_polyfill.min.css',
                'sites/all/themes/spacex2012/js/vendor/placeholder_polyfill.jquery.min.js'
//                'styles/placeholder_polyfill.min.css',
//                'scripts/vendor/placeholder_polyfill.jquery.min.js'
            ]
        });
    };

    return {
        init: fill
    };
}(window, Modernizr));

(function($){
$(document).ready(function () {
    Exp.Modules.Polyfills.init();
    Exp.Modules.Hotspot.init();
    Exp.Modules.Social.init();
    Exp.Modules.Nav.init();
    Exp.Modules.DragonTabs.init();

    if (Exp.Page === 'rocket') {
    	Exp.Modules.ParallaxRocket.init();
    } else if (Exp.Page === 'home') {
        var $heroImg = $('.home-carousel .background');
        var heroRatio;
        // Hero Width
        var heroWidth = $heroImg.outerWidth();
        var heroHeight = $heroImg.outerHeight();
        var $wrappers = $('.home-carousel, .home-carousel .carousel');

        // assumes all images in carousel will be 2400 x 1600
        max_height = $heroImg.width() * .65;

        bold = function () {
            var windowHeight = $(window).height();
            var windowWidth = $(window).width();
                $wrappers.height(Math.floor(windowHeight * 0.8));
            // fix fortall screens
            $wrappers.css('max-height', max_height)
        };

        $wrappers.height(Math.floor($(window).outerHeight() * 0.8));

        $(window).on('load', function () {
            heroRatio = $heroImg.height() / $heroImg.width();
            Exp.Modules.HomeCarousel.init();
            bold();
        });
        $(window).on('resize', function () {
            bold();
        });
    } else if (Exp.Page === 'about') {
        Exp.Modules.Timeline.init();
    }

    /* News Page Carousel */
    /* Added .page-news, otherwise it interferes with slideshow in Chrome on home page */
   $('.page-news .slide:not(#slide-0)').fadeOut();  // Hide all slides except the first one

    /* Cycle slideshow on a timer */  //
    var curSlide = 0;
    var lastSlide = (jQuery('#views_slideshow_cycle_main_news-block_1 .slide').length -1);
    var cycleNewsFeatured = function() {
      $('#slide-'+(curSlide)).fadeOut();
      if (curSlide >= lastSlide) {
        curSlide = 0;
      }
      else {
        curSlide++;
      }
      $('#slide-'+(curSlide)).fadeIn();
    }
    window.setInterval(cycleNewsFeatured, 3500);

    /* Advance the slideshow using the previous and next arrows. */
    $('.featured-news').click(function(){
      curSlide = $(this).attr('id'); // Reset curSlide (current slide)
    	$('#'+$(this).closest('.slide').attr('id')).fadeOut();
    	$('#slide-'+(this.id)).fadeIn();
});

  });
})(jQuery);
;
// Avoid `console` errors in browsers that lack a console.
if (!(window.console && console.log)) {
    (function() {
        var noop = function() {};
        var methods = ['assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error', 'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log', 'markTimeline', 'profile', 'profileEnd', 'markTimeline', 'table', 'time', 'timeEnd', 'timeStamp', 'trace', 'warn'];
        var length = methods.length;
        var console = window.console = {};
        while (length--) {
            console[methods[length]] = noop;
        }
    }());
}

// Place any jQuery/helper plugins in here.
;
/**
 * Gallery JS
 */

(function ($) {

Drupal.behaviors.initAssetHoverDetails = {
  attach: function (context, settings) {
    $(document).ready(function() {
	    $("#asset-actions").css({display: "none"});
	    $("#asset-image-container, .media-gallery-item").hover(function() {
				  $("#asset-actions").slideDown("fast");
				}, function() {
					$("#asset-actions").slideUp("fast");
				}
			);
		});
  }
};

})(jQuery);;
(function($) {

  "use strict";

  // sync animations with events instead of timers
  $.transit.useTransitionEnd = true;

  // revolve two divs infinitely inside their parent
  var PhotoCycle = function(el) {

    var defaults = {
      speed: 10000
    };

    this.el = el instanceof jQuery ? el : $(el);
    this.opts = $.extend(true, {}, defaults, el.data() || {});
    this.init();
  };

  PhotoCycle.prototype = {

    init: function() {

      this.a = this.el.children(':first-child');
      this.b = this.el.children(':last-child');
      this.w = this.el.width();
      this.s = this.opts.speed;
      this.m = window.Modernizr;
      this.e = 'linear';

      if(this.m && this.m.csstransitions) {
        this.a.css({left:'auto'});
        this.b.css({left:'auto'});
        this.cycleA();
        this.cycleB();
      } else {
        // this.cycleLegacy();
      }
    },
    // cycleLegacy: function() {
    //   var a = this.a,
    //       b = this.b,
    //       w = this.w,
    //       s = this.s,
    //       e = this.e,
    //       c = $.proxy(this.cycleLegacy, this);

    //   a.css({left:0}).animate({left:-w}, s, e, function() {
    //     a.css({left:w}).transition({left:0}, s, e, c);
    //   });

    //   b.css({left:w}).animate({left:-w}, s*2, e);
    // },
    cycleA: function() {
      var w = this.w;
      this.cycle(this.a, 0, -w, w, 0, $.proxy(this.cycleA, this));
    },
    cycleB: function() {
      var w = this.w;
      this.cycle(this.b, w, 0, 0, -w, $.proxy(this.cycleB, this));
    },
    cycle: function(seg, start1, end1, start2, end2, cb) {

      var s = this.s,
          e = this.e;

      seg.css({x:start1}).transition({x:end1}, s, e, function() {
        if(end1 !== start2) {
          seg.css({x:start2});
        }
        seg.transition({x:end2}, s, e, function() {
          cb();
        });
      });
    }
  };

  function initVenn() {
    var d = $('#discs');
    var t = $('#discs-text');
    d.on('click', '.disc', function(e) {
      e.preventDefault();
      var target = $(this);
      if(target.hasClass('active')) {
        // Hide closed circle behavior
        //target.removeClass('active');
        //d.parent().removeClass('active');
      } else {
        d.children().removeClass('active');
        t.children().removeClass('active');
        target.addClass('active');
        $(target.data().target).addClass('active');
        d.parent().addClass('active');
      }
    });
  }

  // DOMReady - init various effects and interfaces
  $(function() {
    new PhotoCycle($('#photo-cycle-1'));
    new PhotoCycle($('#photo-cycle-2'));
    initVenn();
  });

//})();
})(jQuery);;
(function ($) {

Drupal.behaviors.initColorboxSpacexStyle = {
  attach: function (context, settings) {

    var actionsDiv = '<div id="asset-actions">\
                        <div class="asset-social-share">\
                          <a href="#" class="iconSocial iconSocialFacebook"><span>Share on Facebook</span></a>\
                          <a href="#" class="iconSocial iconSocialTwitter"><span>Share on Twitter</span></a>\
                          <a href="#" class="iconSocial iconSocialGoogle"><span>Share on Google+</span></a>\
                        </div>\
                      </div>',
    license,
    downloadLink;
    license;
    $(document).bind('cbox_open', function () {
      // Define the overlay styling on cbox_open so the defautl Colorbox stripes are never seen
      $('#cboxOverlay').css({'background': '#000', 'opacity': 0.9});
    });

    $(document).bind('cbox_load', function () {
      // Move the Prev/Next elements to a non-dynamic element so they will be there for next cbox_load

      // .hide() prevents a visual jump during the transition
      if($('body').hasClass('page-node-3') || $('body').hasClass('page-node-2') || $('body').hasClass('page-node-1')) {
        $('#cboxPrevious, #cboxNext').hide();
        $('#asset-actions').remove();
        $('#cboxPrevious, #cboxNext').css({display: "none"});
      }
      else {
        $('#cboxPrevious, #cboxNext').hide().appendTo('#cboxContent');
        $('#asset-actions').remove();
      }

      // .hide() prevents a visual jump during the transition caused when other elements are removed
      $('#cboxPrevious, #cboxNext').hide().appendTo('#cboxContent');

      // Remove any current instances of div#asset-actions so it can be re-appended without the old download link
      $('#asset-actions').remove();

      // Preload the above div#asset-actions so it is ready to be appended elsewhere
      $('#cboxContent').append(actionsDiv);
      $('#asset-actions').css({display: "none"});
    });

    $(document).bind('cbox_complete', function () {
      // Move the close button above the image
      $('#cboxClose').prependTo('#cboxWrapper');

      // Override the default overflow property to ensure all elements are visible
      // This is needed because moving the close button above the image pushes down the content by 78px
      $('#colorbox, #cboxWrapper, #cboxContent').css({overflow: 'visible'});

      // Move the previously preloaded div#asset-actions to the proper location, now that it's ready in the DOM
      $('#asset-actions').appendTo('#cboxLoadedContent .media-gallery-item');

      // Move the downloan link into div#asset-actions now that it's in place
      $('.gallery-download').appendTo('#asset-actions');

      // Remove the license content with detach() in case we choose to add it back in
      license = $('.media-license').detach();

      // Move the Prev/Next elements to a better position for stable styling
      // .show() is needed because we used .hide() previously to remove a visual jump during transition
       if (!$('body').hasClass('page-node-3') && !$('body').hasClass('page-node-2') && !$('body').hasClass('page-node-1')) {
        $('#cboxPrevious, #cboxNext').show().appendTo('#cboxLoadedContent .gallery-thumb-inner');
       }
       
       // Override and hide the controls always
       $('#cboxPrevious, #cboxNext').hide();
    });

    $(document).bind('cbox_cleanup', function () {

      // Move the Prev/Next elements back to a non-dynamic element so they will be there for next cbox_load
      //
      if($('body').hasClass('page-node-3') || $('body').hasClass('page-node-2') || $('body').hasClass('page-node-1')) {
        $('#cboxPrevious, #cboxNext').hide();
        $('#asset-actions').remove();
        $('#cboxPrevious, #cboxNext').css({display: "none"});
      }
      else {
        $('#cboxPrevious, #cboxNext').hide().appendTo('#cboxContent');
        $('#asset-actions').remove();
      }

      // Stage and remove specific elements to be reused if the light box is reopened before page reload
      $('#cboxPrevious, #cboxNext').hide().appendTo('#cboxContent');
      $('#asset-actions').remove();
    });

    $(document).bind('cbox_closed', function () {});
  }
};

})(jQuery);
;
/*!
 * jQuery Tools v1.2.7 - The missing UI library for the Web
 * 
 * scrollable/scrollable.js
 * scrollable/scrollable.autoscroll.js
 * scrollable/scrollable.navigator.js
 * 
 * NO COPYRIGHTS OR LICENSES. DO WHAT YOU LIKE.
 * 
 * http://flowplayer.org/tools/
 * 
 */
(function(a){a.tools=a.tools||{version:"v1.2.7"},a.tools.scrollable={conf:{activeClass:"active",circular:!1,clonedClass:"cloned",disabledClass:"disabled",easing:"swing",initialIndex:0,item:"> *",items:".items",keyboard:!0,mousewheel:!1,next:".next",prev:".prev",size:1,speed:400,vertical:!1,touch:!0,wheelSpeed:0}};function b(a,b){var c=parseInt(a.css(b),10);if(c)return c;var d=a[0].currentStyle;return d&&d.width&&parseInt(d.width,10)}function c(b,c){var d=a(c);return d.length<2?d:b.parent().find(c)}var d;function e(b,e){var f=this,g=b.add(f),h=b.children(),i=0,j=e.vertical;d||(d=f),h.length>1&&(h=a(e.items,b)),e.size>1&&(e.circular=!1),a.extend(f,{getConf:function(){return e},getIndex:function(){return i},getSize:function(){return f.getItems().size()},getNaviButtons:function(){return n.add(o)},getRoot:function(){return b},getItemWrap:function(){return h},getItems:function(){return h.find(e.item).not("."+e.clonedClass)},move:function(a,b){return f.seekTo(i+a,b)},next:function(a){return f.move(e.size,a)},prev:function(a){return f.move(-e.size,a)},begin:function(a){return f.seekTo(0,a)},end:function(a){return f.seekTo(f.getSize()-1,a)},focus:function(){d=f;return f},addItem:function(b){b=a(b),e.circular?(h.children().last().before(b),h.children().first().replaceWith(b.clone().addClass(e.clonedClass))):(h.append(b),o.removeClass("disabled")),g.trigger("onAddItem",[b]);return f},seekTo:function(b,c,k){b.jquery||(b*=1);if(e.circular&&b===0&&i==-1&&c!==0)return f;if(!e.circular&&b<0||b>f.getSize()||b<-1)return f;var l=b;b.jquery?b=f.getItems().index(b):l=f.getItems().eq(b);var m=a.Event("onBeforeSeek");if(!k){g.trigger(m,[b,c]);if(m.isDefaultPrevented()||!l.length)return f}var n=j?{top:-l.position().top}:{left:-l.position().left};i=b,d=f,c===undefined&&(c=e.speed),h.animate(n,c,e.easing,k||function(){g.trigger("onSeek",[b])});return f}}),a.each(["onBeforeSeek","onSeek","onAddItem"],function(b,c){a.isFunction(e[c])&&a(f).on(c,e[c]),f[c]=function(b){b&&a(f).on(c,b);return f}});if(e.circular){var k=f.getItems().slice(-1).clone().prependTo(h),l=f.getItems().eq(1).clone().appendTo(h);k.add(l).addClass(e.clonedClass),f.onBeforeSeek(function(a,b,c){if(!a.isDefaultPrevented()){if(b==-1){f.seekTo(k,c,function(){f.end(0)});return a.preventDefault()}b==f.getSize()&&f.seekTo(l,c,function(){f.begin(0)})}});var m=b.parents().add(b).filter(function(){if(a(this).css("display")==="none")return!0});m.length?(m.show(),f.seekTo(0,0,function(){}),m.hide()):f.seekTo(0,0,function(){})}var n=c(b,e.prev).click(function(a){a.stopPropagation(),f.prev()}),o=c(b,e.next).click(function(a){a.stopPropagation(),f.next()});e.circular||(f.onBeforeSeek(function(a,b){setTimeout(function(){a.isDefaultPrevented()||(n.toggleClass(e.disabledClass,b<=0),o.toggleClass(e.disabledClass,b>=f.getSize()-1))},1)}),e.initialIndex||n.addClass(e.disabledClass)),f.getSize()<2&&n.add(o).addClass(e.disabledClass),e.mousewheel&&a.fn.mousewheel&&b.mousewheel(function(a,b){if(e.mousewheel){f.move(b<0?1:-1,e.wheelSpeed||50);return!1}});if(e.touch){var p={};h[0].ontouchstart=function(a){var b=a.touches[0];p.x=b.clientX,p.y=b.clientY},h[0].ontouchmove=function(a){if(a.touches.length==1&&!h.is(":animated")){var b=a.touches[0],c=p.x-b.clientX,d=p.y-b.clientY;f[j&&d>0||!j&&c>0?"next":"prev"](),a.preventDefault()}}}e.keyboard&&a(document).on("keydown.scrollable",function(b){if(!(!e.keyboard||b.altKey||b.ctrlKey||b.metaKey||a(b.target).is(":input"))){if(e.keyboard!="static"&&d!=f)return;var c=b.keyCode;if(j&&(c==38||c==40)){f.move(c==38?-1:1);return b.preventDefault()}if(!j&&(c==37||c==39)){f.move(c==37?-1:1);return b.preventDefault()}}}),e.initialIndex&&f.seekTo(e.initialIndex,0,function(){})}a.fn.scrollable=function(b){var c=this.data("scrollable");if(c)return c;b=a.extend({},a.tools.scrollable.conf,b),this.each(function(){c=new e(a(this),b),a(this).data("scrollable",c)});return b.api?c:this}})(jQuery);
(function(a){var b=a.tools.scrollable;b.autoscroll={conf:{autoplay:!0,interval:3e3,autopause:!0}},a.fn.autoscroll=function(c){typeof c=="number"&&(c={interval:c});var d=a.extend({},b.autoscroll.conf,c),e;this.each(function(){var b=a(this).data("scrollable"),c=b.getRoot(),f,g=!1;function h(){f&&clearTimeout(f),f=setTimeout(function(){b.next()},d.interval)}b&&(e=b),b.play=function(){f||(g=!1,c.on("onSeek",h),h())},b.pause=function(){f=clearTimeout(f),c.off("onSeek",h)},b.resume=function(){g||b.play()},b.stop=function(){g=!0,b.pause()},d.autopause&&c.add(b.getNaviButtons()).hover(b.pause,b.resume),d.autoplay&&b.play()});return d.api?e:this}})(jQuery);
(function(a){var b=a.tools.scrollable;b.navigator={conf:{navi:".navi",naviItem:null,activeClass:"active",indexed:!1,idPrefix:null,history:!1}};function c(b,c){var d=a(c);return d.length<2?d:b.parent().find(c)}a.fn.navigator=function(d){typeof d=="string"&&(d={navi:d}),d=a.extend({},b.navigator.conf,d);var e;this.each(function(){var b=a(this).data("scrollable"),f=d.navi.jquery?d.navi:c(b.getRoot(),d.navi),g=b.getNaviButtons(),h=d.activeClass,i=d.history&&history.pushState,j=b.getConf().size;b&&(e=b),b.getNaviButtons=function(){return g.add(f)},i&&(history.pushState({i:0},""),a(window).on("popstate",function(a){var c=a.originalEvent.state;c&&b.seekTo(c.i)}));function k(a,c,d){b.seekTo(c),d.preventDefault(),i&&history.pushState({i:c},"")}function l(){return f.find(d.naviItem||"> *")}function m(b){var c=a("<"+(d.naviItem||"a")+"/>").click(function(c){k(a(this),b,c)});b===0&&c.addClass(h),d.indexed&&c.text(b+1),d.idPrefix&&c.attr("id",d.idPrefix+b);return c.appendTo(f)}l().length?l().each(function(b){a(this).click(function(c){k(a(this),b,c)})}):a.each(b.getItems(),function(a){a%j==0&&m(a)}),b.onBeforeSeek(function(a,b){setTimeout(function(){if(!a.isDefaultPrevented()){var c=b/j,d=l().eq(c);d.length&&l().removeClass(h).eq(c).addClass(h)}},1)}),b.onAddItem(function(a,c){var d=b.getItems().index(c);d%j==0&&m(d)})});return d.api?e:this}})(jQuery);
;
(function ($) {

  // Store our function as a property of Drupal.behaviors.
  Drupal.behaviors.crewDragon = {
    attach: function (context, settings) {
      // Open the modal and build the pano.
      $('.dragon-crew__modal-trigger').click(function() {
        $('html').addClass('modal-open');
      });
      // Close the modal.
      $('.dragon-crew__modal-closer').click(function() {
        $('html').removeClass('modal-open');
      });
    }
  };
}(jQuery));
;
(function ($) {
// Based on http://codepen.io/andreasmb/pen/tGbyA.
url = 'https://api.lever.co/v0/postings/spacex-university?group=location&mode=json';

//Functions for checking if the variable is unspecified
function cleanString(string) {
  if (string) {
    var cleanString = string.replace(/\s+/ig, "");
    return cleanString.toLowerCase().split(',')[0];
  }
  else {
    return "Uncategorized";
  }
}

function nullCheck(string) {
  if (!string) {
    var result = 'Uncategorized'
    return result;
  }
  else {
    return string;
  }
}

function createJobs(_data) {
  for(i = 0; i < _data.length; i++) {

    var jobLocation = nullCheck(_data[i].title)
    var jobLocationClean = cleanString(jobLocation);
    $('.internships__teams').append(
        '<li class="internships__location-item"><a href="#" class="internships__location-link" data-location="' + jobLocationClean+ '">' + jobLocation + '</a></li>'
      );
  }

  for(i = 0; i < _data.length; i++) {
    for (j = 0; j < _data[i].postings.length; j ++) {
      var posting = _data[i].postings[j]
      var title = posting.text
      var description = posting.description
      //Making each job description shorter than 250 characters
      var shortDescription = $.trim(description).substring(0, 250)
      .replace('\n', ' ') + "...";
      var location = nullCheck(posting.categories.location);
      var locationCleanString = cleanString(location);
      var commitment = nullCheck(posting.categories.commitment);
      var commitmentCleanString = cleanString(commitment);
      var team = nullCheck(posting.categories.team);
      var teamCleanString = cleanString(team);
      var link = posting.hostedUrl;

    	$('#internships-container .internships__list').append(
        '<div class="internships__job" data-location="' + locationCleanString + '">' +
          '<div class="internships__job-meta">' +
            '<h4 class="internships__job-title">' + title + '</h4>' +
            '<div class="internships__job-tags">' + team + ', '  + location  + ', ' + commitment + '</div>' +
          '</div>' +
          '<a class="btn btn--job-cta" href="' + link + '">Apply</a>' +
        '</div>'
      );
    }
  }
}

//Creating filter buttons for sorting your jobs
function activateButtons(_data){
  $('.internships__teams').on("click", "a", function(e) {
    e.preventDefault();
    for(i = 0; i < _data.length; i++) {
      var locationRaw = _data[i].title;
      var jobLocation = cleanString(locationRaw);
      var jobs = $(".internships__list");
      if ($(this).data('location') == jobLocation) {
        if (!$(this).hasClass("active")) {
          $('.internships__list-title').text(locationRaw);
          $(".internships__teams").find("a").removeClass("is-active");
          $(this).addClass("is-active");
          jobs.find("[data-location='" + jobLocation + "']").removeClass('is-hidden');
          jobs.find(".internships__job").not("[data-location='" + jobLocation + "']").addClass('is-hidden');
        }
      }
    }
  })
}

//Fetching job postings from Lever's postings API
$.ajax({
  dataType: "json",
  url: url,
  success: function(data){
    createJobs(data);
    activateButtons(data);
  }
});
})(jQuery);
;
