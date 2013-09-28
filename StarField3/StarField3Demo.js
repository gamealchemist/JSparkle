//             Starfield
//
// setup of the JSparkle engine for the Starfield demo of JSparkle.
//

var mustBeLoadedCount = 1 ; // we must wait the window to be loaded.

// wait window load
window.onload = launchWhenloaded;

function launchWhenloaded() { if (!--mustBeLoadedCount) { launchDemo() };	};

function launchDemo() {
	// ..
	var starCount = 300 ;
		
	// read the parameters of the page, update starCount if ?#number# is found ( expl: ?500 )
	if (location.search) { 
		var newPartCount = parseInt (location.search.substring(1));
		if (newPartCount) { starCount = Math.max(10,newPartCount); }
	};

	// *** Setup Canvas // drawContext	
	var starCanvas 		= ga.CanvasLib.insertMainCanvas() ;
	var ScreenCssWidth  = starCanvas.width   ;    
	var ScreenCssHeight = starCanvas.height  ;
	var ctx  		    = starCanvas.getContext('2d');

	// **** Setup the particle engine
	// setup the star static values :
	var spaceSpeed ={x:0 ,  y:0 };
   ga.particles.Star.setOnPrototype( {     fieldWidth   : ScreenCssWidth,
				  						   fieldHeight  : ScreenCssHeight, 
				   						   spaceSpeed    : spaceSpeed,      // unit is screen per second
				   			          }) ;
	// create the engine	
	var starSparkle = new ga.JSparkle(ga.particles.Star, starCount, null );
	// fill the engine
	starSparkle.spawn(starCount);

    var myTextDrawer = new ga.utility.FadingText(4000, 2000, ' StarField Demo of JSpakle.   Add ?#number# to the url use a different star count (ex: ?500).    Use right click to display stats. ', '#FFF', ctx);
	var runLoopPreDraw = function (ctx) {    ctx.clearRect(0,0, ScreenCssWidth, ScreenCssHeight);
											 myTextDrawer.draw(100, 20);
		                                };

	// start the particle engine run loop
   starSparkle.startRunLoop ( ctx, runLoopPreDraw);
   
	// *** listen to some mouse events  (right click, mouse move)
	var maxSpeed = 5;
	function handleMouseMoved(e) {
		 spaceSpeed.x = maxSpeed * ( e.clientX - ScreenCssWidth/2 ) / ScreenCssWidth ;
		 spaceSpeed.y = maxSpeed * ( e.clientY - ScreenCssHeight/2 ) / ScreenCssHeight;		 
	}
	
	
	starCanvas.addEventListener('mousemove', handleMouseMoved );
	
	var displayStats = false;
	addEventListener('mousedown', function (e) { if (e.button == 2) { 
													  displayStats = ! displayStats;
                                         		      starSparkle.setStatisticsDisplay(displayStats);
                                    				   } 
                                    				   e.preventDefault();     			  
                                    				   e.stopPropagation();
                                    				   }, false);

    addEventListener('contextmenu', function (e) {  e.preventDefault();     e.stopPropagation(); }, false);

};

/*
	// override the update to avoid all function calls. 
	// Does not bring that much of an improvment on Chrome / FF desktop
		
	StarBatchUpdate = function batchUpdate_noDeathNoBirth(dt, currentTime) {
		var particleArray     = this.particleArray      ;

		var thisParticle      = null                    ;		
		var index             = this.firstParticleIndex ;
		var lastIndex         = this.lastParticleIndex  ; 
    	var length			  = particleArray.length    ;	

		while (true) {
			thisParticle = particleArray[index];
		    // *** update thisParticle		   		    		    
			thisParticle.x += dt*thisParticle.speed;
       		if (thisParticle.x > thisParticle.fieldWidth) { 
				thisParticle.x = - 32 ;
				thisParticle.y = Math.random() * thisParticle.fieldHeight;
		        thisParticle.speed = thisParticle.fakeZ * thisParticle.fieldWidth * thisParticle.starSpeed / ( 1000 ) ;  	
	       		}
			// *****
			if (index == lastIndex ) { break }
			index++; 
			if (index == length )    { index = 0 }
		  }			
	};
*/