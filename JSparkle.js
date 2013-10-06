/*
 * 			JSparkle
 * 
 *   Javascript Particle Engine
 * 
 *   Author : Vincent Piel
 * 
 *   m•il   : vincentpiel • free.fr
 * 
 *   Blog   : http://gamealchemist.wordpress.com/ 
 * 
 *   License : Fair-ware.
 *             Play around as you like at home.
 * 			   You might tell me it's been usefull to you.
 *             Ask me, or at least warn me, and mention the original 
 *                     name/author if you redistribute a modified version.
 *             Help me if it helped you to build a payed game.
 */

(function() {
	
// Game Alchemist Workspace.
window.ga = window.ga || {};

//                                         JSparkle
//   Constructor of a particle engine.
//      ParticleCtor   : constructor function that has update, draw, and spawn defined on its prototype
//                  preDraw and postDraw are optionnal. See an example at the end of the file.
//      maxParticleCnt : maximum count of particle - that you might change with resize -
//      drawContext    : draw context 
//      _getTime : optionnal clock used by the engine. using ms. Use your game time. 
//                                      fallback is Performance.now then Date.now. 
ga.JSparkle = function(ParticleCtor, maxParticleCnt , drawContext, _getTime ) {
	  if (!(maxParticleCnt>=1)) { throw('JSparkle ctor error : Particle Count must be >=1'); }
	  if (arguments.length<3)   { throw('JSparkle ctor error : constructor takes at least 3 parameters.'); }
	  // store Particle constructor   
	  this._ParticleCtor       = ParticleCtor ;  
	  this._particleProto      = ParticleCtor.prototype;	  
	  this._batchSpawnCallback = ParticleCtor.prototype.spawn ;	  
	  // setup draw context on Particle
	  ParticleCtor.prototype.drawContext = drawContext;
	  // create the particle loop buffer
	  this.particleLoopBuffer=new Array(maxParticleCnt);
	  for (var i=0; i < maxParticleCnt; i++) {
			this.particleLoopBuffer[i] = new ParticleCtor();
	      }
	  this.firstParticleIndex =  0 ; // inclusive index, valid oif currentCount !=0
	  this.lastParticleIndex  = -1 ; // inclusive index, valid oif currentCount !=0
	  this.currentCount       =  0 ; // current count of handled particle. 
	                                 // (total part. count is particleLoopBuffer.length.)
	  // store context for statistic display
	  this._drawContext = drawContext;
      // re/post Draw of the engine for the demo loop (see startRunLoop)
	  this._preDraw      = null  ;
	  this._postDraw     = null ;
	  // fallback time handling
	  this.getTime = _getTime || window.performance.now.bind(performance) ;
	  this.dt      = 1  ;
	  this.dtAvg   = 16 ;	
	  this.lastUpdateTime = 0  ;
      // handling death / birth ? 
	  var firstParticle = this.particleLoopBuffer[0] ;	
	  this._handleDeath  =  (firstParticle.deathTime !== undefined);
	  this._handleBirth  =  (firstParticle.birthTime !== undefined);	  
	  // emiters
	  // (autoSpawn are handled as emiters)
	  this.emiters      = [] ;
	  this._nextEmiterId = 1  ; 
	  // performance monitoring / display
	  this._displayStats    = false      ;
	  this._displayStatsX   = 0		     ;
	  this._displayStatsY   = 0		     ;
	  this._displayStatsScale  = 1 		 ;
	  this._measureUpdateDraw = false ;
	  this._drawDuration	=	this._drawDurationAvg     = 0  ; 
	  this._updateDuration	=	this._updateDurationAvg  = 0   ;	    
	  // run loop
	  this._lastRunTime  = 0         ;
	  this.drawContext    = null      ;
	  this._boundRunLoop = null  	 ;
	  this._runLoopTime  = 0		 ;
	  // this._screenFps   = 0       ; unused yet
};

var __callbackArgumentsArray = [null, 0, 0, 0];

ga.JSparkle.prototype = {
	// call spawn to spawn cnt particles. 
	// if available particle count is less than cnt will allocates all remaining particles.
	// Does nothing if no particles available. 
	// call spawn with your arguments, which will be provided to the particle.spawn callback
	// JSparkle will callback the spawn method of the particle,
	//       with (particleLoopBuffer, firstIndex, count + given arguments) as arguments.
	//       and the particle prototype as context ('this')
	// returns the number of actually spawned particles.
	spawn : function spawn (cnt /*, arg1, arg2, ... */ ) {		
   		 var length = this.particleLoopBuffer.length;
		 // return if 0 particule requested or no more room
		 if ( !(cnt > 0) || (this.currentCount == length ))  return 0 ;
		 // if not enough part. available, take maximum count
         if ( cnt > length - this.currentCount ) cnt = length - this.currentCount ;
         var  batchStartIndex   = ( this.lastParticleIndex + 1   ); if (batchStartIndex==length) batchStartIndex=0;
		 this.lastParticleIndex = ( this.lastParticleIndex + cnt ); if (this.lastParticleIndex>=length) this.lastParticleIndex-=length;
		 this.currentCount     += cnt;
		 if (arguments.length > 1) {
			// if additionnal arguments where provided, build up the arguments array
			__callbackArgumentsArray[0] = this.particleLoopBuffer;
			__callbackArgumentsArray[1] = batchStartIndex;
			__callbackArgumentsArray[2] = cnt;
			__callbackArgumentsArray[3] = this.getTime();
			// add custom arguments
			for (var i=1, l=arguments.length; i<l; i++) { __callbackArgumentsArray[i+3] = arguments[i] ; }
			if (__callbackArgumentsArray.length>l+3) __callbackArgumentsArray.length=l+3;
			// call the callback
			this._batchSpawnCallback.apply(this._particleProto, __callbackArgumentsArray);		 	
		 } else {
		 	// no additionnal arguments : std call to the callback
     		this._batchSpawnCallback.call(this._particleProto, this.particleLoopBuffer, batchStartIndex, cnt, this.getTime());
		 }
		 return cnt;
	},
	// returns the max number of particles
	getMaxCount : function getMaxCount () {
		return this.particleLoopBuffer.length;
	},
	// returns the current number of spawned particles. 
	// ( including unborn ones, and dead ones that could not yet be reclaimed within the loop buffer.)
	getCurrentCount : function getCurrentCount () {
		 return this.currentCount;
	},
	// removes all spawned particles (does not affect the loop buffer size)
	clearSpawned : function clearSpawned () {
		this.currentCount       =  0  ;
	    this.firstParticleIndex =  0  ;  
		this.lastParticleIndex  = -1  ; 
	},	
	// creates an autospawn.
	// will auto-spawn particleCount particles with the optionnal spawn arguments,
	// every timeInterval milliseconds.
	// The autospawn is performed in the engine update.
	// if any spawn argument is a function, it will get evaluated before the spawn, with the particle 
	// prototype as context and no arguments.
	// returns an id that you can use to remove the autoSpawn.
	autoSpawn : function autoSpawn (timeInterval, particleCount /*, x, y, color, ... */  ) {
		var nextEmitTime = this.getTime() + timeInterval ;
		// build emit controller function for this auto-spawn		
		var asEmitController = isFunction(particleCount) ?  
									function (currentTime) {
										if (currentTime < nextEmitTime ) { return 0; }
										nextEmitTime = currentTime + timeInterval ;
										return particleCount() ; 
									} :
									function (currentTime) {
										if (currentTime < nextEmitTime ) { return 0 }
										nextEmitTime = currentTime + timeInterval ;
										return particleCount ; 
									};
		if (arguments.length == 2) { 
			   // just call emit with this function if no additionnal parameters
			      return this.emit(asEmitController); }
		else { 
			   //... or build arguments to call emit
			   var args = Array.prototype.slice.call(arguments,1) ;
			   args[0]  = asEmitController   ;
			   return this.emit.apply(this, args)   ;
			}			
    }, 
    // creates an emitter
    // emitControler is a function controlling the particle count, called with no context
    // with the current time as argument.
    // if the emitController(currTime) returns :
    //                - >0 number, there will be a spawn of this
    //                            number of particles with the provided arguments.
    //                - 0  nothing happens
    //                - -1 the emitter will be removed
    // you might add additionnal spawn arguments that will be sent to your particfle's spawn.
	// if a spawn argument is a function, it will get evaluated before the spawn, with the particle 
	// prototype as context and no arguments.
	// returns an id that you can use to remove the emiter.
	emit : function emit (emitControler /*, x, y, color,  ...*/ ) {
		var emitArguments = (arguments.length >1 ) ? Array.prototype.slice.call(arguments) : null;
		if (emitArguments) { emitArguments[0] = 0 ; }
		var containsFunction = false;
		for (var i=1; i<arguments.length; i++) { if (isFunction(arguments[i])) { containsFunction = true; break; } }
		this.emiters.push( { emitController   : emitControler, 
  						     emitArguments    : emitArguments,
  						     containsFunction : containsFunction, 
  						     id               : this._nextEmiterId } );
  		var	currId = this._nextEmiterId++;
  	    return 	currId;
	}, 
	// removes the autoSpawn having the provided id
	cancelAutoSpawn: function (autoSpawnId) {
		this.removeEmiter(autoSpawnId);
	} ,
	// removes the emiter having the provided id
	cancelEmit : function(emiterId) {
		var i=0, emiters = this.emiters;
		if (!emiters.length) return false;
		for (i=0; i<emiters.length ; i++) if (emiters[i].id == emiterId) break;
		// return if no such id found
		if  (i == emiters.length) return false;
		// remove the emiter
		for (; i<this.emiters.length-1; i++) this.emiters[i] = this.emiters[i+1];
		this.emiters.length--;
		return true;
	},
	// set wether the engine should displays the statistics for this engine at point (x,y) with scale. 
	// (x, y, scale) defaults to (0, 0, 1).
	// the draw is done after all draws are done  ( particle's preDraw / draw of all / postDraw)
	setStatisticsDisplay : function setStatisticsDisplay (shouldDisplay, x, y, scale) {		
		  this._displayStats    	= shouldDisplay      ;
		  this._displayStatsX   	= x	|| 0   		     ;
		  this._displayStatsY   	= y	|| 0	   		 ;
		  this._displayStatsScale   = scale || 1  		 ;
	},
	// updates all particles.
	// dt and currentTime are optionnal. If undefined, JSparkle will use its
	// internal timer (see constructor).
	// removes dead particle if death is handled, and do not update yet
	// unborn ones if birth is handled.
	update : function update (dt, currentTime ) {
    	// most basic time handling if no time is provided	 		 			
		if (!(dt && currentTime )) {
			 if (!this.lastUpdateTime ) {  currentTime = ( currentTime || this.getTime() ) ;
		 	                               dt = 16 ; 
		 	 }
		 	 else {
		       		 currentTime      = this.getTime();
		     		 dt               = ( currentTime - this.lastUpdateTime ) ;					 	 	
		 	 }	
    		 this.lastUpdateTime = currentTime;		 
		}		 
		if (this._displayStats) { this.dt = dt ; } 	
		 // handle emitters if any
		 if (this.emiters.length) this._handleEmit(currentTime);		 	     
	     // exit if no particles in buffer
	     if (!this.currentCount)  return ;
	    
	    // -->> Update !
	    var particleLoopBuffer  = this.particleLoopBuffer       ;
		var index     		    = this.firstParticleIndex  ;
		var count 		    	= this.currentCount   ; 
		var length 		 	    = particleLoopBuffer.length     ;	
		var thisParticle        = null                     ;
		var deadCount 		    = 0                        ;
		 	      	
 		// remove first dead particles if handling death
 		if (this._handleDeath) { 
 						 while (count--) {
											// stop when alive particle found
										 	if ( currentTime < particleLoopBuffer[index].deathTime ) { break; }
							                deadCount++;
							     		 	index++ ;  if ( index == length)  { index = 0 ; }	 	    
									  	 }
									  	 this.currentCount -= deadCount;
										 // there might be no more alive particles now
									  	 if (this.currentCount == 0) {   this.firstParticleIndex = 0 ;  
									  	 	                             this.lastParticleIndex = -1; 
									  	 	                             return; }		
										 this.firstParticleIndex = index ;
										 count 		    	= this.currentCount   ; 
								 }
 		// setup dt and currentTime on particle proto
 		this._particleProto.dt          = dt;
		this._particleProto.currentTime = currentTime ;

 		// call update on all particles
 		if (this._handleDeath) { 
 			  // case when we handle birth / death
			  while (count--) {
					thisParticle = particleLoopBuffer[index];		
					if (!(currentTime >= thisParticle.deathTime )  &&    	// skip if dead or unborn
								     !(currentTime <  thisParticle.birthTime ) ) { 	 	
							// --------- update thisParticle  --------
							thisParticle.update();
					    }
					index++;  if (index == length )  index = 0;			
			  }	 
		  } else {
		  	  // simpler loop if we're not handling birth / death
			  while (count--) {
			 	    // --------- update thisParticle  --------
					particleLoopBuffer[index].update();
					index++;  if (index == length )  index = 0 ;
			     }		  
		 }
	},
	// draws all particles.
	// (only undead and born ones)
	// currentTime is optionnal. used only if handling death/birth.
	//      If currentTime is undefined, JSparkle will use its internal timer (see constructor).
	draw : function draw (_currentTime) {
        // exit if no particles in buffer
		var count = this.currentCount ; 
		if (!count) return;
		var particleLoopBuffer = this.particleLoopBuffer  ;    			
    	var index  = this.firstParticleIndex ;
    	var length = particleLoopBuffer.length  ;	
		var thisParticle  = null ;
		_currentTime   = _currentTime || this.getTime();	
		// perform the pre-draw operation of the particle if available
		if (this._particleProto.preDraw) this._particleProto.preDraw();
        // draw all particles
		while (count--) {
			thisParticle = particleLoopBuffer[index];
			// draw if born and not dead
			if (!(_currentTime >= thisParticle.deathTime )  &&  
			     !(_currentTime <  thisParticle.birthTime ) ) { 				     				    
			 	    // --------- draw thisParticle  --------
 					   thisParticle.draw();
			}	
			index++;  if (index == length ) index = 0;
		}
		// perform the post-draw operation of the particle if available		
        if (this._particleProto.postDraw) this._particleProto.postDraw();	
    	// display engine statistics if required
	   if (this._displayStats) 	{ 
		    this.displayStats(this._displayStatsX, this._displayStatsY, this._displayStatsScale ); 
		} 	
	},
	// resize the buffer of particle to the newCount size.
	// try to preserve existing particles if current count allows it.
	resize : function resize (newSize) {
		var particleLoopBuffer = this.particleLoopBuffer  	;
    	var length             = particleLoopBuffer.length  ;
		if ((!(newSize > 1))  || newSize == length ) { return }

    	var isLooping = this.currentCount && (this.firstParticleIndex > this.lastParticleIndex) ;
		if (isLooping) {
				var index     = this.firstParticleIndex ;
				var lastIndex = this.firstParticleIndex	; 
				var newArray  = new Array(newSize)  	;
				var newIndex  = 0						;	
				if ( this.currentCount >=  newSize ) {
					   index = (index + (this.currentCount - newSize)) % length ;
					   this.currentCount = newSize ; 
					}
				// 1. copy the living particles at the start of the new array
				do {
					newArray[newIndex] = particleLoopBuffer[index];
					newIndex++;
		        	if (newIndex == newSize  ) { break }
					index++; 
					if (index == length ) { index = 0 }
				}	while (index    != lastIndex );
				this.particleLoopBuffer = particleLoopBuffer = newArray;
				this.firstParticleIndex = 0;	
				this.lastParticleIndex = this.currentCount - 1; 
		}
 
        if (newSize < length) {
        	// reducing Loopbuffer size
        	// simple case : no active particle within the reduced array 
        	// we just have to reduce the size
        	if ((!this.currentCount) || 
        	                 this.currentCount && this.lastParticleIndex < newSize) {
        		this.particleLoopBuffer.length = newSize;
        		return ;
        	}
        	// are we in the case where there are more active particle than the new size ?        	 
        	if ( this.currentCount >= newSize) {
        		// just copy the latest particles
        		var index = (this.firstParticleIndex + (this.currentCount - newSize)) % length, i2 = 0 ;
				do {
				     particleLoopBuffer[i2++]=particleLoopBuffer[index++];				    
				} while (index != newSize)  ;
				this.currentCount = newSize ;
            }  else {
        		var index = this.firstParticleIndex, i2 = 0, swp = null ;
        		for (; index <= this.lastParticleIndex; index++, i2++ ) {
        			swp = particleLoopBuffer[i2];
        			particleLoopBuffer[i2] = particleLoopBuffer[index] ;
        		    particleLoopBuffer[index] = swp;
        		}
            }

			this.firstParticleIndex  = 0           ;
			this.lastParticleIndex   = this.currentCount - 1 ;
			this.particleLoopBuffer.length = newSize;       	
        	return ;
        } else {
        	  // increasing LoopBuffer size
              for (var i=length; i<newSize; i++) {
					     particleLoopBuffer[i]= new this._ParticleCtor();
				  }	
        }


	},
	// starts a draw / update loop to test the engine.
	// the optionnal preDraw / postDraw are performed before / after drawing all particles.
	// typically, for a demo you will want to clear the screen in the run loop predraw.
	// This runLoop uses its own timer, protected against high fps screen, frame miss and tab out 
	startRunLoop : function startRunLoop( _runLoopPreDraw, _runLoopPostDraw) {
		this._lastRealTime = performance.now() - 16   ;
        this._boundRunLoop = this._runLoop.bind(this) ;
        this._preDraw      = _runLoopPreDraw		  ;
        this._postDraw     = _runLoopPostDraw  		  ;
        this._runLoopTime  = 1 						  ;
        this.getTime       = (function() { return this._runLoopTime; }).bind(this);
        requestAnimationFrame(this._boundRunLoop) 	  ;
	},
	// stops the run loop.
	stopRunLoop : function stopRunLoop () {
		if (!this._drawContext) return;
		this._drawContext = null;
	},	
	_runLoop : function _runLoop ()  {
		if (!this._drawContext) return;
		var now = performance.now(), interval = now - this._lastRealTime ;
		requestAnimationFrame(this._boundRunLoop);	   
	    if (interval > 14) { // 
			if (interval > 100) { 
				                    interval = 16 ;  }  // in case window was tabbed out.
			this._lastRealTime = now ;

			// draw  ( =) preDraw + draw all particles + postDraw )
			if (this._preDraw)               this._preDraw(this._drawContext);
			this.draw (this._runLoopTime);
			if (this._postDraw)               this._postDraw (this._drawContext);

			// update
			this.update ( interval, this._runLoopTime ) ;
			this._runLoopTime += interval 				;			
		} 			
	},
	// display the current statistics of the engine.
	// (x,y,scale) defaults to (0,0,1)
	// you can call setStatisticsDisplay so the engine draws automatically the stats
	// !! displaying the stats affects performances !!
	displayStats : function displayStats ( x, y, scale)  {
		x=x||0 ;      y=y||0;  scale = scale || 1;
        var ctx = this._drawContext;
		ctx.save();
		ctx.translate(x,y);
		ctx.scale(scale, scale);
		// ----------- fps ---------------
		this.dtAvg = this.dtAvg *0.95 + this.dt*0.05;
		ctx.globalAlpha = 0.5;
		ctx.fillStyle = '#00A';
		ctx.fillRect (4,4, 114, 40);
		ctx.globalAlpha = 1;		
		ctx.font = "bold 12px Arial";
		ctx.fillStyle= '#fff';
		ctx.fillText ( 'fps              : ' + ( 1000/ this.dt    ).toFixed(2) , 10, 20);
		ctx.fillText ( 'fps avg       : '     + ( 1000/ this.dtAvg).toFixed(2) , 10, 36);

		if (!this.measureUpdateDraw) {
	            var oldUpdate = this.update;
	  			this.update = function() {var st = performance.now(); 
	  									  oldUpdate.apply(this, arguments); 
	  									  this._updateDuration = performance.now() - st ;} ;
	  			var oldDraw = this.draw;
	  			this.draw   = function() { var st = performance.now(); 
	  									  oldDraw.apply(this, arguments); 
	  									  this._drawDuration = performance.now() - st ;} ;
	  			this.measureUpdateDraw = true ;
		}
		this._drawDurationAvg     =   this._drawDurationAvg   * 0.95 +  this._drawDuration * 0.05   ;
	    this._updateDurationAvg	  =	  this._updateDurationAvg * 0.95 + this._updateDuration * 0.05  ;

		// ----------- draw / update  ---------------
		ctx.globalAlpha = 0.5;
		ctx.fillStyle = '#00A';
		ctx.fillRect (4,52, 114, 70);
		ctx.globalAlpha = 1;		

		ctx.font = "bold 12px Arial";
		ctx.fillStyle= '#fff';
		ctx.fillText ( 'draw           : ' + (  this._drawDuration   ).toFixed(2) , 10, 68);
		ctx.fillText ( 'update        : '   + (  this._updateDuration ).toFixed(2) , 10, 84);
		ctx.fillText ( 'draw avg    : ' + (  this._drawDurationAvg   ).toFixed(2) , 10, 100);
		ctx.fillText ( 'update avg : '   + (  this._updateDurationAvg ).toFixed(2) , 10, 116);

    	// ------- loopBuffer count + draw  -----------
		ctx.globalAlpha = 0.5;
		ctx.fillStyle = '#00A';
		ctx.fillRect (4,128, 114, 56);
		ctx.globalAlpha = 1;	
		ctx.fillStyle= '#fff';
		var length = this.particleLoopBuffer.length ;
		ctx.fillText ( this.currentCount + ' / ' + length , 24, 148);
        ctx.fillStyle = '#4B4';
		ctx.fillRect ( 10, 160, 100, 8 );
		ctx.fillStyle = '#B44';
		if (this.firstParticleIndex < this.lastParticleIndex ) {
			ctx.fillRect ( 10  + 100*this.firstParticleIndex/length, 160, 
							      100 * this.currentCount / length, 8 );
		} else {
			ctx.fillRect ( 10  , 160, 
							 100*this.lastParticleIndex/length, 8 );
			ctx.fillRect ( 10  + 100*this.firstParticleIndex/length, 160, 
							   ( 100 - 100*this.firstParticleIndex/length), 8 );
			
		}
      ctx.restore();
	},
	//  Performs a spawn if an emiter or an autospawn elapsed. condition : emiters is not empty.
	_handleEmit : function (currentTime) {
		var ei = 0, len= 0 ;
		 var emiters     = this.emiters;
		 var killedCount = 0 ;
		 for (ei=0, len = emiters.length ; ei<len ; ei++) {
			 var thisEmiter = emiters[ei];
		 	 var partCount  = thisEmiter.emitController(currentTime);
			 // case 1 : no particle to emit
		 	 if (partCount == 0) { continue }
		     // case 2 : -1 : cease to emit (kill the emiter)
		 	 if (partCount == -1) { emiters[ei] = null; killedCount++; continue; }		
		 	      
 	 		 var thisArguments = thisEmiter.emitArguments;
 	 	     if (!thisArguments) { 
 	 	    	 this.spawn (partCount); 
  	 	     } else {   
  	 	    	  thisArguments[0] = partCount ;
  	 	    	  if (thisEmiter.containsFunction) {
  	 	    	  	 thisArguments = thisArguments.slice(); // copy
  	 	    	  	 for (var i=0; i<thisArguments.length; i++) { if (isFunction(thisArguments[i])) thisArguments[i]=thisArguments[i].call(this._particleProto) }  	 	    	  	
  	 	    	  }
 	        	  this.spawn.apply(this, thisArguments );   	 	    	  	
 	        }
		 }
		 if (killedCount) {  emiters.removeNull();   }
	}, 
	// measure the actual refresh rate of the display.  
	// will callback 'MeasureDoneCallback' with the actual fps as argument.
	// untested / unused yet.
	_measureScreenFps : function _measureScreenFps (MeasureDoneCallback) {
		var startMeasureTime = 0;
		var measure = function () {
			if (!startMeasureTime) { startMeasureTime= performance.now() ; 
									 requestAnimationFrame(measure)      ;
									 return; }
		    var screenFps = performance.now() - startMeasureTime;
		    MeasureDoneCallback(screenFps);
		};
		requestAnimationFrame(measure); 
	}
};
	


// ------------------------------------------------------------
//
//              Example of a Particle.
//
// ------------------------------------------------------------

TypicalParticleCtor = function() {
	// takes no argument - used to fill in the buffer on engine start -
    // initialize here any property with default values.
    // you will later change those values within the particle's spawn method.
	this.x  = 0 ;      this.y  = 0;
	this.vx = 0 ;      this.vy = 0 ;
	this.colorIndex = 0;
    //...
    
    // !!!! if you want to handle birth or death,                  !!!!
    /// !!! then setup birthTime and deathTime in the constructor  !!!!
    this.birthTime= 0;   this.deathTime = 0;
};

TypicalParticleCtor.prototype = {
	dt            : 0        , // current time-step value (ms). reserved for the engine
    currentTime   : 0        , // current time (ms). reserved for the engine
    drawContext   : null     , // current drawing context. reserved for the engine
    
	gravity   : 9.8 ,  // example 1 of value used for all particles
	colors : ['#FEF', '#FED', '#EDE', '#EEF']   ,  // example2

	// update. Instance method. You can use here this.dt and this.currentTime
    // if birth / death is handled, called only if particle is born and not dead.
	update : function () {
		this.x += this.vx * this.dt ;
		this.y += this.vy * this.dt ;
		// ...
	},

	// draw. Instance method. You can use here this.drawContext -and also this.dt and this.currentTime-
    // if birth / death is handled, called only if particle is born and not dead.
	draw : function () {
		this.drawContext.fillRect(this.x, this.y, 1, 1);
	},
	
	// spawn. class method.
	// JSparkle calls this callback when a spawn is requested on the particle engine.
	//    the first arguments are particleLoopBuffer, firstIndex, count, currentTime
	//    the following arguments are the arguments provided to the engine's spawn method.
	//     expl :  partEngine.spawn(100, x, y, color)  will callback spawn(partArray, 0, 99, 43213, x, y, color)
	//    Rq : spawn is a static method : the 'this' is set to the particle's prototype.
	spawn : function (particleLoopBuffer, firstIndex, count, currentTime  /* optionnal args here */, x, y, colorIndex /*... */) {
		var index = firstIndex;
		var length = particleLoopBuffer.length;
		var particle = null;
		while ( count-- ) {
			particle = particleLoopBuffer[index];

			//  --  start of particle initialisation
			particle.x = x + 10 * Math.random(); 
			particle.y = y + 10 * Math.random(); /*+ ... ;    particle.y = ... */
			// you might use prototype properties. expl :  this.gravity;
			particle.color = this.colors[colorIndex] ;			
			//  --  end of particle initialisation
			
			index++;		if (index == length ) { index = 0 }; 
		  }	
  },
  // preDraw. Optionnal class method.. Operation performed before all draw.
  // You can use here this.drawContext -and also this.dt and this.currentTime-
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
  },
  //
  _previous_globalCompositeOperation : null 	
};

/*
 // Use example. Commented since we do not want to create an engine.
 
 var myEngine = new JSparkle(TypicalParticleCtor, 500, myCanvas);
 
 myEngine.spawn(40, 200, 200);
  
  
  For impact users :
       function getGameTime() { return ig.Timer.time * 1e3;  };
       var myEngine = new JSparkle (TypicallParticleCtor, 500, ig.system.canvas, getGameTime);
       
       spawn, autoSpawn or emit in your game init.
       you might want to spawn also when an event trigger (expl : enemy dead)
       
       then update() (no parameters required) the engine in your game update()
       and draw() (no parameters required) the engine in your game draw()

*/


// ------------------------------------------------------------
//
//              Helpers Functions.
//
// ------------------------------------------------------------

function isFunction(e) { return (typeof e == 'function') ; }	


// little helper function to set values on a function protoype easily
// use myFunction.setOnPrototype ( myObject ) to set all values of myObject
// on the prototype function.
Object.defineProperty(Function.prototype, 'setOnPrototype', { value : function(o) { for (var p in o) { this.prototype[p]=o[p] } }});
	

// removeNull : function added to arrays to remove null slots.
var removeNull = function() {
	var nullCount = 0           ;
	var length    = this.length ;
	for (var i=0, len=this.length; i<len; i++) { if (!this[i]) {nullCount++} }
    // no item is null
	if (!nullCount) { return this}
	// all items are null
	if (nullCount == length) { this.length = 0; return this }
	// mix of null // non-null
	var idest=0, isrc=length-1;
	length -= nullCount ;				 
	while (true) {
			 	    while (!this[isrc])  { isrc--; nullCount--; } // find a non null (source) slot on the right
			 		if    (!nullCount)   { break }       // break if found all null
			 		while ( this[idest]) { idest++  }  // find one null slot on the left (destination)
					// perform copy
			 		this[idest]=this[isrc];
			 		if (!(--nullCount)) {break}
			 		idest++;  isrc --; 
				 }
	this.length=length; 
	return this;
};	
Object.defineProperty(Array.prototype, 'removeNull', { value : removeNull } ) ;
				 	



// requestAnimationFrame polyfill
var  w=window,    foundRequestAnimationFrame  =    w.requestAnimationFrame ||
                               w.webkitRequestAnimationFrame || w.msRequestAnimationFrame ||
                               w.mozRequestAnimationFrame    || w.oRequestAnimationFrame  ||
                                        function(cb) { setTimeout(cb,1000/60); } ;
window.requestAnimationFrame  = foundRequestAnimationFrame ;

// performance.now polyfill
if (!window.performance) { window.performance={} ; };
var p=window.performance;
window.performance.now        =     p.now || p.webkitNow || p.msNow ||
   				          p.mozNow || Date.now || function() { return +new Date() } ;

}) ();





/*
function pSqDistance(x, y, x1, y1, x2, y2) {

    var A = x - x1;
    var B = y - y1;
    var C = x2 - x1;
    var D = y2 - y1;

    var dot = A * C + B * D;
    var len_sq = C * C + D * D;
    var param = dot / len_sq;

    var xx, yy;

    if (param < 0 || (x1 == x2 && y1 == y2)) {
        xx = x1;
        yy = y1;
    }
    else if (param > 1) {
        xx = x2;
        yy = y2;
    }
    else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    var dx = x - xx;
    var dy = y - yy;
    return (dx * dx + dy * dy);
}
    */