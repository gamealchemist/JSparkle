//             Starfield
//
//  Definition of a Particle for the Starfield demo of JSparkle.
//

(function() {
	
// Game Alchemist Workspace.
window.ga = window.ga || {};

ga.particles = ga.particles || {} ; 	
	
ga.particles.Star = function() {
	this.x     = 0 ;  this.y = 0;
    this.fakeZ = 1 ;               // trick : we use a 'fake Z', which is a number [0..1[ 
                                   // by which we multiply (not divide) x and y (>12 times faster)
    this.speed = 0 ;

   // birthTime and deathTime are not handled : the 
   // particles gets recycle to the left when they reach the right.
};

ga.particles.Star.prototype = {
   dt            : 0        , // current time-step value (ms). reserved for the engine
   currentTime   : 0        , // current time (ms). reserved for the engine
   drawContext   : null     , // current drawing context. reserved for the engine


   fieldWidth   : 0,    // 
   fieldHeight  : 0,    // 
   starSpeed    : 1,    // unit is screen per second for the closest stars.
   starImage	: null, //
   
   update : function () {
       this.x += this.dt*this.speed;
       if (this.x > this.fieldWidth) {   // put the star on the left again if it left the field
			this.x = - 32 ;
			this.y = Math.random() * this.fieldHeight;  // random height
	        this.speed = this.fakeZ * this.fieldWidth * this.starSpeed / ( 1000 ) ;
	        // in fact we should sort the loop buffer here but huushh !!  	
       		}
   },
   
   draw   : function ( ) {
        var width1 = Math.round(38 * this.fakeZ  * this.fakeZ);
        if (width1 >2 ) {
        	  // draw the star image.
              this.drawContext.drawImage(this.starImage, Math.round(this.x), Math.round(this.y),  width1, width1);	
        } else {
        	// too small star : just draw a point
        	this.drawContext.fillStyle='#FF8';
        	this.drawContext.fillRect( Math.round(this.x), Math.round(this.y), 1, 1);
        }        
   },
   
   spawn : function (particleLoopBuffer, firstIndex, count) {
	   var w = this.fieldWidth, h = this.fieldHeight ;
	   var index = firstIndex;
	   var length = particleLoopBuffer.length;
	   var particle = null;
	   while (count--) {	
			particle = particleLoopBuffer[index];
			// ---- initialise here -----
			particle.x     = w * Math.random() ;
			particle.y     = h * Math.random() ;
			particle.fakeZ = 0.08 + Math.pow(Math.random(),1.4) * 0.92;  // far stars are more likely.
	        particle.speed = this.starSpeed * w * particle.fakeZ / ( 1000 ) ; // speed related to depth. 	
			// ---------------------------
			index++; if (index == length ) index = 0; 
		}		
		particleLoopBuffer.sort( function(a,b) { if (!a.fakeZ*b.fakeZ) return 1;  return (a.fakeZ - b.fakeZ) });
    },
    
   preDraw : null,
   postDraw : null
};

}() );