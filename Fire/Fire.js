//             Bubbles
//
//  Definition of a Particle for the Bubbles demo of JSparkle.
//

(function() {

// Game Alchemist Workspace.
window.ga = window.ga || {};

ga.particles = ga.particles || {} ; 
		
ga.particles.Fire = function( ) {	
	this.x    = 0 ;     this.y  = 0    ;
	this.vx   = 0 ; 	this.vy = 0    ;
    this.color = 0;
    
    this.birthTime = 0 ;  // birth is handled        
	this.deathTime = 0 ;  // death is handled
};

ga.particles.Fire.prototype = {
  dt            : 0        , // current time-step value (ms). reserved for the engine
  currentTime   : 0        , // current time (ms). reserved for the engine
  drawContext   : null     , // current drawing context. reserved for the engine

  colors : [ '#321','#322', '#321','#311',   '#221', '#210'],
 // colors : [ '#FFB','#FEC', '#EEB','#EBB',   '#221', '#210'],
   
  screenWidth  : 0          ,
  screenHeight : 0          ,
  
  previousAlpha : 0			,
  
   update : function () {
   	    var dt = this.dt;
        this.x    += this.vx*dt  ;      this.y  +=  this.vy*dt;
        
        this.vy -=dt*0.0005;
       // if (this.deathTime -this.currentTime < 200 && (this.color < this.colors.length-1)) this.color--;

    },
   draw   : function () {
   	    this.drawContext.beginPath();
   	    var ttl = (this.deathTime -this.currentTime);
   	    this.drawContext.globalAlpha = 	(ttl>400) ? 1.0 : ttl/400 ;
   	    this.drawContext.arc(this.x, this.y, 10, 0,6.28);	
        this.drawContext.fillStyle = this.colors[this.color];
   	    this.drawContext.fill();	
   },

   spawn : function (particleLoopBuffer, firstIndex, cnt, currentTime, x, y) {
	   var index    = firstIndex            ;
	   var length   = particleLoopBuffer.length ;
	   var particle = null                  ;
	   
       var randomAngle = 0 ;
       var thisSpeed   = 0 ;
           
	   while (cnt--) {	
			particle = particleLoopBuffer[index];
			// -- initialise particle here
	
	        randomAngle = - ( 1+ 1.14 * Math.random() )                    ; 
	        // take a random speed between 3 values.
            thisSpeed   = 0.1 + (0.1*Math.random()); 
            
	        particle.vx = thisSpeed  * Math.cos(randomAngle)     ;
	        particle.vy = thisSpeed  * Math.sin(randomAngle)     ;
	        particle.x  =  x + 10 * Math.random()  ;     
	        particle.y  =  y   ;     
	        particle.color = 0 | this.colors.length*Math.random();
	        
	        var birthDelay     =  100 *Math.random() ;          // 
	        particle.birthTime = currentTime + birthDelay ;                        // birth
	    	particle.deathTime = currentTime  +  birthDelay + 1400 ;  //  death

			// -- end initialize
			index++;  if (index == length ) { index = 0; }; 
		}
	 },
  preDraw : function() {
  	    // save g c o
     	this._previous_globalCompositeOperation = this.drawContext.globalCompositeOperation;
        // set it to lighter
    	this.drawContext.globalCompositeOperation = 'lighter';
  },
  // postDraw. Optionnal class method. Operation performed before all draw.
  // You can use here this.drawContext -and also this.dt and this.currentTime-
  postDraw : function() {
  	// restore previous g c o
  	this.drawContext.globalCompositeOperation = this._previous_globalCompositeOperation;
  	this.drawContext.globalAlpha = 	1.0 ;

  },
  _previous_globalCompositeOperation : null 
};


} ());
