
var mustBeLoadedCount = 2;
function launchWhenloaded() { if (!--mustBeLoadedCount) { launchDemo() };	};

// load bubble image
var bubbleImage =new Image();
bubbleImage.onload = launchWhenloaded; 
bubbleImage.src = 'Bubble.png';

// wait window load
window.onload = launchWhenloaded;


function launchDemo() {

	var bubblesCount = 200;


	// read the parameters of the page, update fireParticlesCount if ?#number# is found ( expl: ?500 )
	if (location.search) { 
		var newPartCount = parseInt (location.search.substring(1));
		if (newPartCount) { bubblesCount = Math.max(500,newPartCount); }
	};
	
	// *** Setup Canvas // Context2d	
	var starCanvas 		= ga.CanvasLib.insertMainCanvas() ;
	var ScreenCssWidth  = starCanvas.width   ;    
	var ScreenCssHeight = starCanvas.height  ;
	var ctx  		    = starCanvas.getContext('2d');	

   //
   ga.particles.Bubbles.setOnPrototype ( { bubbleImage : bubbleImage ,
   											minSize    : bubbleImage.width / 2,
   											sizeRange  : bubbleImage.width /2 ,
   											screenWidth  : ScreenCssWidth ,
   											screenHeight : ScreenCssHeight        });					
		
	// **** Setup the particle engine			
																		           
	var bubbleSparkle = new ga.JSparkle(ga.particles.Bubbles, bubblesCount, null );
	
    bubbleSparkle.spawn (bubblesCount);
 
    // start a run loop with this particle engine
       //  preDraw == erase canvas with low opacity for blur  + draw fading text
        var myTextDrawer = new ga.utility.FadingText(4000, 2000, 'Bubbles Demo of JSpakle.   Add ?#number# to the url use a different bubble count (ex: ?500).    Use right click to display stats. ', '#FFF', ctx);

    	var bubblePreDraw  = function (ctx) {   ctx.globalAlpha  = 0.3 ;
    		                                    ctx.fillStyle = '#000';
    		                                    ctx.fillRect(0, 0, ctx.width, ctx.height) ;
    		                                    ctx.globalAlpha  = 1.0 ;  
    		                                    myTextDrawer.draw(100, 20);   
    		                                 };
	
	bubbleSparkle.startRunLoop(ctx, bubblePreDraw );
	
	// *** listen to some mouse events  	
	var displayInfo = false;
	addEventListener('mousedown', function (e) { if (e.button == 2) { 
                                     					displayInfo = !displayInfo; 
                                     					bubbleSparkle.setStatisticsDisplay(displayInfo); } 
                                         		  }  	) ;
                                         		  
    addEventListener('contextmenu', function (e) {  e.preventDefault();     e.stopPropagation(); }, false)                                    				   
                                      				
};
