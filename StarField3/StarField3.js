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

	this.colorIndex =0;

    this.timeShift = 0;
    this.fakeZ = 1 ;               // trick : we use a 'fake Z', which is a number [0..1[ 
                                   // by which we multiply (not divide) x and y (>12 times faster)
                                   
    // no birth / death : particles gets recycled when they leave the screen
};

var colors = [] ;
for (var i=0; i<10; i++) colors.push('#' + (i+8).toString(16) + (i+6).toString(16) + (i+6).toString(16) );

ga.particles.Star.prototype = {
   dt           : 0          ,
   currentTime  : 0          ,
   drawContext    : null     ,

   fieldWidth   : 0,    // 
   fieldHeight  : 0,    // 
   starImage	: null, //
   spaceSpeed   : null, // {x : y: } object that must be set on the prototype.
                        // speed shared by all stars.
   
   update : function () {
   	
       this.x += this.dt*this.spaceSpeed.x * this.fakeZ;
       this.y += this.dt*this.spaceSpeed.y * this.fakeZ ;
       
       // did the star went off screen ?
       // horizontal off screen
       if ((this.x < 0) || (this.x > this.fieldWidth)) {   // put the star on the left again if it left the field
			this.y = Math.random() * this.fieldHeight;  // random y
			if (this.x<0 ) this.x = this.fieldWidth;
			else this.x = 0;
       		}
       // vertical off screen
       if ((this.y < 0) || (this.y > this.fieldHeight)) {   // put the star on the left again if it left the field
			this.x= Math.random() * this.fieldWidth;  // random x
			if (this.y<0 ) this.y = this.fieldHeight;
			else this.y = 0;
       		}

   },
   preDraw : function () {
 //  this.drawContext.globalCompositeOperation = 'lighter';
   },
   
   draw   : function ( ) {
        var width1 = Math.round(4 * this.fakeZ  * this.fakeZ);
        if (width1 <=2) {
           this.drawContext.fillStyle= colors[this.colorIndex];
           this.drawContext.globalAlpha = 0.4 + 0.6*Math.abs(Math.cos(this.timeShift + Date.now()/200));
           this.drawContext.fillRect( Math.round(this.x), Math.round(this.y), width1, width1);        	
        } else {
        this.drawContext.fillStyle= colors[this.colorIndex];
           this.drawContext.strokeStyle= colors[this.colorIndex];  
           this.drawContext.lineCap = 'round';             	
           this.drawContext.lineWidth=8 ; //width1;
            this.drawContext.globalAlpha = 0.15;
            this.drawContext.moveTo( Math.round(this.x), Math.round(this.y));        	
           this.drawContext.lineTo(Math.round(this.x - 10*this.spaceSpeed.x * this.fakeZ), Math.round(this.y - 10*this.spaceSpeed.y * this.fakeZ));
  			this.drawContext.stroke();
  			
            this.drawContext.lineWidth=2 ;
          this.drawContext.globalAlpha = 0.3 + 0.3*Math.abs(Math.cos(this.timeShift + Date.now()/200));
           this.drawContext.beginPath();
           this.drawContext.moveTo( Math.round(this.x), Math.round(this.y));       
           var speedRd =  	this.spaceSpeed * (1+3*Math.random() );
           this.drawContext.lineTo(Math.round(this.x - 16*speedRd * this.fakeZ), Math.round(this.y - 16*speedRd * this.fakeZ));
           this.drawContext.stroke();
       	
            this.drawContext.lineWidth=3 ;
              this.drawContext.globalAlpha = 1;
           this.drawContext.moveTo( Math.round(this.x), Math.round(this.y));       
                     this.drawContext.lineTo(Math.round(this.x - 5*this.spaceSpeed.x * this.fakeZ), Math.round(this.y - 5*this.spaceSpeed.y * this.fakeZ));
			this.drawContext.stroke();
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
		    particle.colorIndex = 0 | ( particle.fakeZ * colors.length ) ; 
		    particle.timeShift = Math.random() * 100;
			// ---------------------------
			index++; if (index == length ) index = 0; 
		}		
		particleLoopBuffer.sort( function(a,b) { if (!a.fakeZ*b.fakeZ) return 1;  return (a.fakeZ - b.fakeZ) });
    },
     
   preDraw : null,
   // restores the globalAlpha in the postDraw to avoid interfering with other draws.
   postDraw : function() {
   	   	this.drawContext.globalAlpha = 1;
   }
};

}() );