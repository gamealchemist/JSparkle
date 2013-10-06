// -------------------------------------------
//
//                JSParkle
//
//
//     Game Alchemist's Particle Engine.
//
//      Copyright Vincent Piel 2013 
//
//      Version 0.7 09/28/13  
//        Beware 0.5 and 0.6 users : 
//              new particle spawn signature.
//              new constructor signature.
//              new engine.draw() signature.
//            sorry for that, but performances 
//                  raised 20% up :-) .
// -------------------------------------------


JSparkle is a Particle Engine written in Javascript. 


JSparkle is fast and provides some handy functions to
 quickly write and test a particle engine.

It implements a constant sized loop buffer so that
  particles are allocated once and do not create garbage.

It provides functions to spawn particles, to auto-spawn
or emit at any time.

It provides also a clean run loop to quickly test your engine.

You can display statistics about your engine to see its
performances.

You can find some screenshots and links on my
blog :

 http://gamealchemist.wordpress.com/2013/06/16/introducing-jsparkle-a-versatile-and-fast-javascript-particle-engine/


Below is a description on how to use, but you might prefer
to watch the provided examples and build your engine out of
them, Bubbles being the simplest one.

 
______________________________ 
How To use - summary -
______________________________
 
    1. Create a Particle function, having update, draw and spawn defined on 
           its prototype
    2. optionnaly define on the prototype predraw and postdraw. 
          Those methods might be used to save some settings before all 
           particles gets drawn, and to restore those settings afterwise. 
          (expl : changing globalCompositeOperation to lighter / restore to source-over)
    3. create a new JSparkle
    4. spawn, autoSpawn or emit particles.

then :
    5 . have your game update and draw the engine in each 
             update/draw cycle of your game.

OR  5'. launch a run loop with startRunLoop to test your engine.



______________________________
How to use - complete story -
______________________________

//////////////////////////
1. The Particle
//////////////////////////
The particle should be a standard Javascript Class built with a constructor
function. This constructor takes no parameter and must initializes *all* used properties
to a default value. 
The 'real' values for all the particles properties will be set during the spawn, 
as explained later.

RQ :You have a full example of a particle at the end of JSparkle's source.
        Just copy-paste this example to build your own.

!! Important : If you want the engine to handle the particle death and/or birth for you, you have
to define deathTime and birthTime within the constructor.
If you define either property in the constructor, then do not initialize in particle's spawn,
the engine will just not work  !!

var myParticle = function() {
    this.x = 0;            this.y = 0;
    this.deathTime = 0;    /* if property set the engine will handle death */
    this.birthTime = 0;    /* if property set the engine will handle birth */
}

.birthTime is the time, in the future, when the particle will begins to
be updated / drawn. This allows you to spawn all your particles at once,
but still to have them appear with a small time shift to make a nicer effect.

.deathTime is the time, in the future, when the particle will be considered
dead and reclaimed for a future spawn.
Rq : To avoid fragmentation within the particle buffer, particles should have 
quite the same life duration. If you have very different life times, use
several engines, each one having homogenous life times.
  
The particle prototype :

It is strongly advised, for optimisation purposes, to set dt, currentTime and drawContext
on the prototype with rightly typed default values.
  myParticle.prototype.dt           = 0          ,  // JSparkle reserved
  myParticle.prototype.currentTime  = 0          ,  // JSparkle reserved
  myParticle.prototype.drawContext  = null       ,  // JSparkle reserved
  
update : update is a function taking no parameter that will be called on a 
particle instance to update its properties. 
While in update(), you have access to : 
   - this.dt -the time duration of the current frame- 
   - this.currentTime -the current engine time-.

Rq : If handling death/birth, update is called only on born and undead particles.

example :

myParticle.prototype.update = function () {
  this.x = this.x + this.dt * this.vx ;
  this.y = this.x + this.dt * this.vy ;
} ;

draw : draw is a function taking no parameter that is called on a particle
instance to draw it.
while in draw(), you have access to 
   this.drawContext : the draw context provided to the engine's constructor.

example :

myParticle.prototype.update = function () {
  this.drawContext.drawImage ( this.x, this.y, this.size, this.size);
} ;

-- rq : if of any use, you also have access to this.dt, this.currentTime 
       same meaning as in update.  										  --

spawn : spawn is a *callback* function that will get called on the particle 
prototype whenever the engine needs to spawn some particle. 
When calling spawn on the engine, some checks will be performed, then 
the engine will callback the particle's spawn with the right arguments.
 
Particle spawn is a 'static' method, executed with the particle prototype 
as context ('this').
The first four mandatory arguments are : particleLoopBuffer, firstIndex, count, currentTime.
- particleLoopBuffer is the particle array, handled as a loop buffer
- firstIndex is the indexe of first particle to handle.
- count is the number of particles to spawn. Always >0.
- currentTime is the engine time at the time of the spawn.

If some custom parameter where send to the engine while spawning, they are added
after those four arguments.

expl : if you call   myEngine.spawn(100, x, y); 
          then the engine will call Particle.spawn with (buffer, 0, 100, currentTime, x, y);

!!! You'll have to loop by yourself within the array, which is in fact
a loop buffer, so you have to loop back to 0 when reaching its end. 
Just copy/paste/modify the example loop.                                !!!

example :

// this example will spawn randomly particles within a rect of (width, height size)
myParticle.prototype.spawn = function (particleLoopBuffer, firstIndex, count, currentTime, width, height) {
	   var index = firstIndex;
	   var length = particleLoopBuffer.length;
	   var particle = null;
	   while (count--) {	
			particle = particleLoopBuffer[index];
			
			// ------- initialise here ---------
			particle.x = width  * Math.random() ;
			particle.y = height * Math.random() ;
	        particle.speed = this.starSpeed     ;       // speed is a constant protoype property  	
			
			// _____ end of initialisation _____
			index++; if (index == length ) index = 0;   // iterate / loop
		}
     }

predraw : (optionnal) is a parameterless function that is called before the first draw.
might be used to set-up once opacity, color, ... for all the draws to come.
Rq : you have access to this.drawContext and this.currentTime inside preDraw.

example :

myParticle.prototype.predraw = function() {
  this.drawContext.globalAlpha = 0.1;
}


postDraw : (optionnal) parameterless function called after the last draw.
Rq : you have access to this.drawContext and this.currentTime inside postDraw.

example :

myParticle.prototype.predraw = function() {
  this.drawContext.globalAlpha = 1;
}


//////////////////////////
2. Create the Engine
//////////////////////////

Creation :
* Buffer : JSparkle uses a fixed-length loop buffer to hold all particles. This buffer is allocated
at once on engine creation, to avoid memory allocation / disallocation during the game.
Choose wisely the buffer length : too short it will prevent some spawn to occur, to big
and you are wasting memory (which is only annoying if you are lacking memory...).
You might in fact change the buffer size at any time with 'resize' function, but expect to
create garbage every time you resize.
--> display the statistics to evaluate your engine's load.

* Time   : the engine needs a clock to properly update the particles whatever 
the display refresh rate. Provide your game time if you happen to handle it, or 
if you don't provide a time, JSparkle will use performance.now OR Date.now as a fallback. 

example :

var myGameTime = function() { return MYGAME.TimeHandler.currentTime; };

var myEngine = new ga.JSparkle(MyParticle, 500, myContext,  myGameTime);

!! for impact users, an engine is built that way :

   var myGameTime = function() { return ig.Timer.time * 1e3 ; };

   var myEngine = new ga.JSparkle(MyParticle, 500, ig.system.context,  myGameTime);

   remind when writing your particle that the engine is using milliseconds, where Impact is using seconds.


//////////////////////////
3. Spawn some Particles
//////////////////////////

To use the engine, you have 3 ways of spawning particles : spawn, autoSpawn and emit.

spawn (count /* optArg1, optArg2, ... */ )
spawn is the most simple way to spawn particles.
It will spawn count particles, using the additionnal arguments if any.

example - with no parameters -

    myEngine.spawn(100);
    
 --->> will callback myParticle.prototype.spawn ( loopBuffer, 0, 100, 1231)  // (where 1231 is the current time)

example 2 - with 2 additionnal parameters

    myEngine.spawn(50, width, height);
    
 --->> will callback myParticle.prototype.spawn ( loopBuffer, 0, 50, 1231, 640, 480)  // (where 1231 is the current time)
     

autoSpawn (timeInterval, particleCount /*, spArg1, spArg2, ... */  ) 
will call spawn every interval.  
Rq : the spawn is performed within the engine update, and uses the provided time : the 
engine is *NOT* using setInterval / setTimeout, which could get out of sync with
the engine in case, for example, the browser tab changed.
--> you have to call update in a regular loop, typically your game update loop.
 
The additionnal arguments of autoSpawn might be parameterless functions : if it is the case,
they will be evaluated (with the particle prototype as context) before a call to the particle's
spawn.
 
 example :
 
   var randColor = function() { return this.colorArray[ 0 | Math.random() * this.colorArray.length ] }
   
   myEngine.autoSpawn(500, 50, 640, 480, randColor);
   
   this example will spawn 50 particles twice per second, using each time a new random color within colorArray.
                It  will call spawn with some arguments like :
           myParticle.prototype.spawn(loopBuffer, 100, 149, 1442, 640, 480, '#FEF' );
           
emit   (emitControler /*, spArg1, spArg2, ... */ )       
emit is a more complex function, an even more flexible version of autoSpawn : 
- on each update, the emitController function is called with currentTime as argument. 
- If its return value is >0, then there will be a spawn with this count of particles spawned, and its additionnal arguments.
- No particle gets spawned with a 0 return value.
- The emiter will get killed if the return value is -1 (it will be removed from the list of emiters).

  emit can also take additionnal parameters, that might be functions that will be evaluated on
  the particle's prototype, just like for autoSpawn.
  
example (using a closure):
  
     var nextSparkleTime = 0 ;       
       
     // this controller will randomly emit 50 particles with a time between 0.1 and 1.1 second in
     // between two spawns.
     var randomEmitController = function (currentTime) {
	         // spawn 50 particles if time elapsed
	         if ( currentTime > nextSparkleTime) { 
	                 // next sparkle time is between 100ms and 1100 ms in the future :
	                  nextSparkleTime = currentTime + 100 + Math.random()*1000; 
	                  return 50; }           
	         return 0;
	 }
      
     myEngine.emit(randomEmitController, 640, 480);    
     
     --> when randomEmitController returns 50, the engine will be called like :
                myParticle.prototype.spawn   (loopBuffer, 200, 249, 1842, 640, 480);
   
Removing autoSpawn and emiters :
You can remove a autoSpawn or emiter with cancelAutoSpawn  // cancelEmit.
example :
 
       var myAutoSpawnID = myEngine.autoSpawn( ... ...);       

       // ... later ...
       myEngine.cancelAutoSpawn(myAutoSpawnID) ;
   
//////////////////////////
4. Run the engine
//////////////////////////

To have the engine run within your game, just call update within your update loop,
and draw within your draw loop.

draw (_currentTime)
 
     see remarks below for _currentTime.

update (_dt, _currentTime)

     _dt is the frame duration
     _currentTime is the current game time.
      
     If you do not provide the _dt or _currentTime, they will be computed from the
     provided timer (or its fallback). 
 
     -->> if you provided a timer in the constructor, or if you are satisfied with
             the default timer, just call update() with no parameter.

draw and update will callback particle's draw and update on every particles OR on
every born and not yet dead particles if you handle birth/death.

//////////////////////////
4. Run the engine - Now -
//////////////////////////

To conveniently test the engine, a run loop is allready implemented in the engine.
This way you can setup the particles before inserting them in your application, thus
reducing development time.
You can provide a engine pre/post draw to perform some operations before/after any
draw. 
For instance, you would surely not want to have your particles to erase the 
screen, but while testing you need to erase it -->> clear the screen in the *engine* preDraw

startRunLoop ( _runLoopPreDraw, _runLoopPostDraw)
			
		_runLoopPreDraw, if defined, will get called with the drawContext as argument and no 'this' context
	            before the particles get drawn. typically use it to clear screen.
	    _runLoopPostDraw, if defined, will get called with the drawContext as argument and no 'this' context
	            after the particle postDraw.
	          	
example (using ga.CanvasLib) :

         	var myCanvas 		= ga.CanvasLib.insertMainCanvas() ;  // insert a full screen canvas on page
            var myCtx  		    = myCanvas.getContext('2d');
            
            var runLoopPreDraw = function (ctx) { ctx.clearRect(0 ,0, ctx.width, ctx.height ) };

			myEngine.startRunLoop ( runLoopPreDraw );
  
Rq : you might stop the run loop at any time with myEngine.stopRunLoop();
     Afterwise the engine will be quite 'broken' : restarting is not handled as of now. 
     
//////////////////////////
5. Monitor the engine 
//////////////////////////

*If* you are using a context2d of an html5 canvas, you can use a handy function that will
display the engine update and draw time, and give a visual representation of the current
buffer use within a small graph : green stands for free particles, and red for used ones.

setStatisticsDisplay (shouldDisplay, x, y, scale) 

      set shouldDisplay to true to show / false to hide the display.
             x,y is the position on screen of the display (defaults to (0,0)),
             and scale is the scale (defaults to 1).

Rq : the display window is approximately 180 pixels high (with scale == 1.0).

OR you can display yourself the statistic using displayStats.
	myEngine.displayStats ( x, y, scale) 
             x, y, scale arguments have the same meaning.
 

//////////////////////////
7. Helper
//////////////////////////


You might want to set, at intialisation time, some values in the constructor's function's 
prototype : i added the 'setOnPrototype' method on Object.prototype to ease those modifications :

   MyParticleCttor.setOnParticle({ screenWidth : 640, screenHeight : 480 });

 
//////////////////////////
8. Some usefull patterns
//////////////////////////

     
Obviously, you might spawn at any time during your game, with any of the 3 ways
quoted above (spawn/autoSpawn/emit). 
Try to regroup as much as possible the particles into 'bursts', to avoid the spawn
 overhead.
birthDelay is exactly meant to allow such burst while, in the same time, having
 all particles not spawn at the very same time.

I'll describe below this birth/death pattern, as well as two other patterns to show how
to use the JSparkle engine wisely.


BIRTH/DEATH PATTERN :

The birth/death pattern is so usefull it is allready implemented in the
engine : a particle will only get handled after its birth and will be 
ignored, then reclaimed as an available particle after its death.

In the following example, we spawn the stars one by one every 30 ms, and have them killed after
300 ms.
(!! Reminder : you must set birthTime and deathTime property to 0 in the constructor for birth/death to
be handled !!)

myParticle.prototype.spawn = function (particleLoopBuffer, firstIndex, count, currentTime, width, height) {
	   var index = firstIndex;
	   var length = particleLoopBuffer.length;
	   var particle = null;
	   
	   var particleIndex = 0;
	   while (count--) {	
			particle = particleLoopBuffer[index];
			// ------- initialise here ---------
			particle.x = width  * Math.random() ;
			particle.y = height * Math.random() ;
	        particle.speed = this.starSpeed     ;    // speed is a protoype property  	
	        
	// !!! Birth/death handling !!!
	        particle.birthTime = currentTime + 30*particleIndex ;  // will spawn one by one every 30 ms.
	        particle.deathTime = particle.birthTime + 300 ;        // will die after a 300 ms life.
   //  !!!                      !!!
   	        
			particleIndex ++ ;
			// _____ end of initialisation _____
			index++; if (index == length ) index = 0;   // iterate / loop
		}
     }    
    
RQ : the loop buffer can only reclaim the dead particles located at the start of the buffer,
so if the particles have very different life times, this will lead to a buffer fragmentation :
avoid this by using homogenous particle life time.


FADE OUT PATTERN

To have your particle fade out after a given time, add a fadeTime to the constructor, and
initialize it :

Change the time-related part of the spawn with :

	        particle.birthTime = currentTime + 30 * particleIndex ;  // will spawn one by one every 30 ms.
            particle.fadeTime  = particle.birthTime + 200  ;         // start fade after 200 ms.
            particle.deathTime = particle.birthTime + 300 ;          // will die after a 300 ms life.

In your particle update, compute the opacity you'll want for your star (add this.opacity property with 
the default value 1.0 in the constructor):

         if (this.currentTime > this.fadeTime) { 
               this.opacity = (this.deathTime - this.currentTime ) / 100 ; 
          }

In the particle draw, just use that opacity :

         if (this.opacity !=1) this.drawContext.globalAlpha = this.opacity;
         ... do the drawing ...

When using opacity, you might want to use the postDraw of your particle either to 
restore the globalAlpha to 1.0, so that other draw won't be affected.

       postDraw : function() {
          this.drawContext.globalAlpha = 1.0;
       }        


CHAIN PATTERN

If you want to have your particles behave like a rope, or be attracted (or repulsed) one by another,
you'll have to inform each particle of its neighboors during the spawn.
So :

1. Add to the constructor.
   this.previousPart = null ;
   this.nextPart     = null ;
   
2. spawn like this :
myParticle.prototype.spawn = function (particleLoopBuffer, firstIndex, count, currentTime, width, height) {
	   var index = firstIndex;
	   var length = particleLoopBuffer.length;
	   var particle = null;
	   
	   var previousParticle = particleLoopBuffer[(firstIndex + count ) % length ];
	   while (count--) {	
			particle = particleLoopBuffer[index];
			// ------- initialise here ---------

                ... some initialisation on x,y, ......

            particle.previousParticle      = previousParticle ;        // ** previous of current is previous
            previousParticle.nextParticle  = particle         ;        // ** next of previous is current

            previousParticle               = particle ;                // store previous for next iteration

			// _____ end of initialisation _____
			index++; if (index == length ) index = 0;   // iterate / loop
		}
		particle.nextParticle=particleLoopBuffer[firstIndex] ;         // ** link the last one to the first

     }    

then you will have access, in your update, to previous and next particles, and you might, 
for instance, apply an elastic force to get the particles to regroup.

