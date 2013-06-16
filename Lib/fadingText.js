(function() {
	
	// Game Alchemist Workspace.
    window.ga = window.ga || {};
    
    ga.utility = ga.utility || {} ;
 
	ga.utility.FadingText = function (fadeStartOffset, fadeDuration, txt, color, ctx ) { 
		          this.fadeStart = Date.now() + fadeStartOffset ; 
		          this.fadeEnd   = this.fadeStart + fadeDuration   ; 
		          this.txt = txt ;  this.color = color;  this.ctx = ctx ; 
		         } ;
		         
    ga.utility.FadingText.prototype.draw = function (x,y, txt) {
   	              var currentTime = Date.now();
   	              if (currentTime>this.fadeEnd) return;
   	              var savedAlpha = -1;
   	              if (currentTime>this.fadeStart) {
   	              	            savedAlpha      = this.ctx.globalAlpha; 
   	              	            this.ctx.globalAlpha = (this.fadeEnd - currentTime)/(this.fadeEnd-this.fadeStart); 
   	              	           }
   	              this.ctx.fillStyle = this.color ; 
   	              this.ctx.font = "16px Georgia" ;
   	              txt = txt || this.txt ;
   	              this.ctx.fillText(this.txt,x,y)  ;
   	              if (savedAlpha != -1 )  this.ctx.globalAlpha = savedAlpha ;
     }
     
})() ;
