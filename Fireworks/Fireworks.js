//             FireWorks
//
//  Definition of a Particle for the FireWorks demo of JSparkle.
//
// include some color-handling helpers.

(function() {

// Game Alchemist Workspace.
window.ga = window.ga || {};

ga.particles = ga.particles || {} ; 

var numberOfCachedColors = 512;
		
ga.particles.Fireworks = function( x, y, speed ) {	
	this.x     = 0      ;     this.y    = 0 ;
	this.vx    = 0	    ; 	  this.vy   = 0 ;
	this.oldX  = 0	    ;     this.oldY = 0 ;
    this.speed = 0      ;  
	this.colorIndex = 0 ;  
    
    this.birthTime = 0  ;     // birth is handled 
    this.deathTime = 0  ;     // death is handled
    this.fadeTime  = 0  ;  	  // fade pattern
    
    this.fadeDuration = 0 ;
    this.fadeRatio    = 1 ;
};

ga.particles.Fireworks.prototype = {
  dt            : 0        , // current time-step value (ms). reserved for the engine
  currentTime   : 0        , // current time (ms). reserved for the engine
  drawContext   : null     , // current drawing context. reserved for the engine

  gravity      : +0.5/1000 ,
  maxSpeedNorm : 0.5        ,
  fireworksLifeTime : 1000  ,
  strokeStyle  : '#FFF'     ,
  previousBaseColor : 0     ,
  colors	   : createColors(numberOfCachedColors),

   // update  : standard newton computation (no friction)
   update : function () {
   	    var dt = this.dt;
   	    this.oldX  = this.x      ;      this.oldY = this.y ;
        this.vy   +=  this.gravity*dt ;
        this.x    += this.vx*dt  ;      this.y  +=  this.vy*dt;
        // compute fade ratio if we entered the fading phase.
        if (this.currentTime > this.fadeTime) { this.fadeRatio = (this.deathTime - this.currentTime) / this.fadeDuration ; }
    },
    
    // draws a line joining current position to previous, using 
    // particle opacity if we entered the fading phase.
   draw   : function () {
   	    var ctx = this.drawContext ;
        ctx.strokeStyle = this.colors[this.colorIndex];

       if (this.fadeRatio != 1) { ctx.globalAlpha = this.fadeRatio }
		ctx.beginPath();
        ctx.moveTo ( Math.round(this.oldX) , Math.round(this.oldY) );
	    ctx.lineTo ( Math.round(this.x)    , Math.round(this.y)    );
		ctx.stroke ();   	
        if (this.fadeRatio != 1) { ctx.globalAlpha = 1 }
   },

   // spawn the particles centered on CenterX, CenterY, with disp as dispertion.
   // particles are spawn in all directions, and have birth/death/fade time related to fireworksLifeTime.
   spawn : function (particleLoopBuffer, firstIndex, cnt, currentTime, centerX, centerY, disp) {
	   var index    = firstIndex            ;
	   var length   = particleLoopBuffer.length ;
	   var particle = null                  ;
	   
       var randomAngle= 0, thisRandom= 0, thisSpeed=0;
    
       var maxSpeedNorm = this.maxSpeedNorm ;
       var fireworksLifeTime = this.fireworksLifeTime ;
       // we compute the base color index for this burst :
       // we take the last index, and shift it 
       var baseColorIndex = 0 | numberOfCachedColors * ( ((this.previousBaseColor/ numberOfCachedColors ) + 0.2 +  0.2*Math.random() ) % 1 ) * numberOfCachedColors   ;
       this.previousBaseColor = baseColorIndex;
       var colorVariance = 0 |  0.1 *numberOfCachedColors * ( 0.3 + 0.7 * Math.random() )   ;
       
	   while (cnt--) {	
			particle = particleLoopBuffer[index];
			// -- initialise particle here
	
	        randomAngle = 6.28 * Math.random()                   ;  // direction where to spawn 
	        thisRandom  = 0.3 + 0.7  * Math.random() ;  
	        thisSpeed   = thisRandom * maxSpeedNorm              ;  // speed norm
	        particle.vx = thisSpeed  * Math.cos(randomAngle)     ;  // speed x
	        particle.vy = thisSpeed  * Math.sin(randomAngle)     ;  // speed y
	        particle.x  = centerX    + Math.random()*disp        ;  // position x = center + dispertion
	        particle.y  = centerY    + Math.random()*disp        ;  //          y ...
			particle.oldX = particle.x + 16 * particle.vx ;                      
			particle.oldY = particle.y + 16* particle.vy ;
	       
	        var birthDelay     =  0.01 * fireworksLifeTime*Math.random() ;          // 
	        particle.birthTime = currentTime + birthDelay ;                        // birth
	    	particle.deathTime = currentTime  +  birthDelay + fireworksLifeTime ;  //  death
	    	 
	        var fadeDuration = 0.3 * fireworksLifeTime* ( 0.7 + 0.3* Math.random() ) ;
		    particle.fadeTime   = particle.deathTime - fadeDuration ;              // fade
			particle.fadeDuration = fadeDuration;
	        particle.fadeRatio      = 1 ;
	        // random color within the currently used range.
            particle.colorIndex =( 0 | ( baseColorIndex +  Math.random() * colorVariance    )) % numberOfCachedColors ;
			// -- end initialize
			index++;  if (index == length ) { index = 0 }; 
		}
	 }
};


function createColors (count) {
	var colorArray = [];
	var midcount = 0 | ( count / 2 );
	for (var i=0  ; i< midcount; i++ )
	{
	    var ratio = 1- ( i / midcount ) ;
	    var h =ratio / 1.1,   s= 0.5 , l =0.5;
	    colorArray[i] =hsl2rgbHex(h,s,l);
	}	
	for (var i=midcount  ; i<count ; i++ )
	{
	    var ratio = 1- ( (i-midcount) / midcount ) ;
	    var h =ratio / 1.1,   s= 0.7 , l =0.9;
	    colorArray[i] =hsl2rgbHex(h,s,l);
	}	
	return colorArray;
}

// converts an h,s,l value to an rgb hex value
function hsl2rgbHex(h,s,l) {
	var res = hsl2rgb(h,s,l);
	var r = 0 | (res[0]*255), g = 0 | (res[1]*255), b=0 | (res[2]*255);
   return '#' +	(0x1000000 | (r<<16) | (g<<8) | b).toString(16).slice(1);
}

// converts an h,s,l value to an rgb value stored in an array.
function hsl2rgb(h,s,l) {
   var v, min, sv, sextant, fract, vsf;
  
   if (l <= 0.5) v = l * (1 + s);
   else v = l + s - l * s;
  
   if (v === 0) return [0, 0, 0];
   else {
    min = 2 * l - v;
    sv = (v - min) / v;
    h = 6 * h;
    sextant = 0 | h;
    fract = h - sextant;
    vsf = v * sv * fract;
    if (sextant === 0 || sextant === 6) return [v, min + vsf, min];
    else if (sextant === 1) return [v - vsf, v, min];
    else if (sextant === 2) return [min, v, min + vsf];
    else if (sextant === 3) return [min, v - vsf, v];
    else if (sextant === 4) return [min + vsf, min, v];
    else return [v, min, v - vsf];
   }
  }

} ());
