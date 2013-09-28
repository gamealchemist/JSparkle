//             Bubbles
//
//  Definition of a Particle for the Bubbles demo of JSparkle.
//

(function() {

// Game Alchemist Workspace.
window.ga = window.ga || {};

ga.particles = ga.particles || {} ; 
		
ga.particles.Bubbles = function( ) {	
	this.x    = 0 ;     this.y  = 0    ;
	this.vx   = 0 ; 	this.vy = 0    ;
	this.size = 0 ;     this.timeScale = 0 ;
};

ga.particles.Bubbles.prototype = {
  dt            : 0        , // current time-step value (ms). reserved for the engine
  currentTime   : 0        , // current time (ms). reserved for the engine
  drawContext   : null     , // current drawing context. reserved for the engine
  
  bubbleImage  : null       , // image used for the bubbles.
  minSize      : 8          ,
  sizeRange    : 8          ,
  
  screenWidth  : 0          ,
  screenHeight : 0          ,
  
  previousAlpha : 0			,
  
   update : function () {
   	    var dt = this.dt;
        this.x    += this.vx*dt  ;      this.y  +=  this.vy*dt;
        this.size = this.minSize + Math.abs( this.sizeRange * Math.sin(this.currentTime*this.timeScale/1000)) ;
        // bounce on borders
        if ( (this.x<0  && this.vx<0 ) || (this.x>this.screenWidth-this.size   && this.vx>0)  )  { this.vx = -this.vx }
        if ( (this.y<0  && this.vy<0 ) || (this.y>this.screenHeight-this.size  && this.vy>0) )  { this.vy = -this.vy }
    },
   draw   : function () {
   	    this.drawContext.drawImage(this.bubbleImage, Math.round(this.x), Math.round(this.y),  this.size, this.size);	
   },

   spawn : function (particleLoopBuffer, firstIndex, cnt, currentTime) {
	   var index    = firstIndex            ;
	   var length   = particleLoopBuffer.length ;
	   var particle = null                  ;
	   
       var randomAngle = 0 ;
       var thisSpeed   = 0 ;
           
	   while (cnt--) {	
			particle = particleLoopBuffer[index];
			// -- initialise particle here
	
	        randomAngle = 6.28 * Math.random()                    ; 
	        // take a random speed between 3 values.
            thisSpeed   = (Math.random() >0.8) ? 1 : (Math.random()>0.5) ? 2 : 3 ;
            thisSpeed /= 10;
           
	        particle.vx = thisSpeed  * Math.cos(randomAngle)     ;
	        particle.vy = thisSpeed  * Math.sin(randomAngle)     ;
	        particle.x  =  this.screenWidth  * (  0.1 + 0.8 * Math.random())  ;     
	        particle.y  =  this.screenHeight * (  0.1 + 0.8 * Math.random())  ;     

			particle.timeScale =  0.5 + 2 * Math.random() ;
			// -- end initialize
			index++;  if (index == length ) { index = 0 }; 
		}
	 },
	preDraw : function() {
		 this.previousAlpha   = this.drawContext.globalAlpha; 
    	 this.drawContext.globalAlpha = 0.8 ; 
	},
	postDraw : function() {
		this.drawContext.globalAlpha = this.previousAlpha ;
	}
};


} ());
