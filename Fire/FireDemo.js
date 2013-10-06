
var mustBeLoadedCount = 1;
function launchWhenloaded() { if (!--mustBeLoadedCount) { launchDemo() };	};

// load bubble image
//var bubbleImage =new Image();
//bubbleImage.onload = launchWhenloaded; 
//bubbleImage.src = 'Bubble.png';
// mustBeLoadedCount++;

// wait window load
window.onload = launchWhenloaded;

function launchDemo() {

	var fireCircleCount = 5000;

	// read the parameters of the page, update fireParticlesCount if ?#number# is found ( expl: ?500 )
	if (location.search) { 
		var newPartCount = parseInt (location.search.substring(1));
		if (newPartCount) { fireCircleCount = Math.max(500,newPartCount); }
	};
	
	// *** Setup Canvas // Context2d	
	var fireCanvas 		= ga.CanvasLib.insertMainCanvas() ;
	var ScreenCssWidth  = fireCanvas.width   ;    
	var ScreenCssHeight = fireCanvas.height  ;
	var ctx  		    = fireCanvas.getContext('2d');	

   //
   ga.particles.Fire.setOnPrototype ( { 	screenWidth  : ScreenCssWidth ,
   											screenHeight : ScreenCssHeight        });					
		
	// **** Setup the particle engine			
																		           
	var FireSparkle = new ga.JSparkle(ga.particles.Fire, fireCircleCount, ctx ,null );
    		
	FireSparkle.autoSpawn ( 100, 40 , ScreenCssWidth/2, ScreenCssHeight );

	FireSparkle.autoSpawn ( 100, 40 , ScreenCssWidth/4, ScreenCssHeight );

	FireSparkle.autoSpawn ( 100, 40 , 3*ScreenCssWidth/4, ScreenCssHeight );


// FireSparkle.setStatisticsDisplay(true);
    // start a run loop with this particle engine
       //  preDraw == erase canvas with low opacity for blur  + draw fading text
        var myTextDrawer = new ga.utility.FadingText(4000, 2000, 'Fire Demo of JSpakle.  Mouse the mouse to bring fire.    Use right click to display stats. ', '#FFF', ctx);

    	var FirePreDraw  = function (ctx) {   ctx.globalAlpha  = 1.0 ;
    		                                    ctx.fillStyle = '#000';
    		                                    ctx.fillRect(0, 0, ctx.width, ctx.height) ;
    		                                    ctx.globalAlpha  = 1.0 ;  
    		                                    myTextDrawer.draw(100, 20);   
    		                                 };
	
	FireSparkle.startRunLoop(FirePreDraw );
	
	// *** listen to some mouse events  	
	var displayInfo = false;
	addEventListener('mousedown', function (e) { if (e.button == 2) { 
                                     					displayInfo = !displayInfo; 
                                     					FireSparkle.setStatisticsDisplay(displayInfo); } 
                                         		  }  	) ;
	//fireCanvas.addEventListener('mousemove',handleMouseMove) ;
	 fireCanvas.onmousemove = handleMouseMove;
	 function handleMouseMove(e) {   		FireSparkle.spawn(20, e.clientX, e.clientY);  
		                                    e.stopPropagation();
		                                    e.preventDefault();
		                                       };
		                                                                                		  
    addEventListener('contextmenu', function (e) {  e.preventDefault();     e.stopPropagation(); }, false)  ;                                  				   
                                      				
};
