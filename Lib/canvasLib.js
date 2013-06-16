/*
 * 			CanvasLib
 * 
 *   Javascript html5 Canvas Helper object
 * 
 *   Author : Vincent Piel
 * 
 *   m@il   : vincentpiel • free.fr
 * 
 *   Blog   : http://gamealchemist.wordpress.com/ 
 * 
 *   License : Fair-ware.
 *             Play around as you like at home.
 * 			   You might tell me it's been usefull to you.
 *             Ask me, or at least warn me, and mention the original 
 *                     name/author if you redistribute a modified version.
 *             Share some profits if it helped you to build a payed game.
 */

(function() {
	
// Game Alchemist Workspace.
window.ga = window.ga || {};

ga.CanvasLib = { canvasCount : 0 };

// insert a canvas on top of the current document.
// If width, height are not provided, use all document width / height
// width / height unit is Css pixel.
// returns the canvas.
ga.CanvasLib.insertMainCanvas = function insertMainCanvas (_w,_h) {
   if (_w==undefined) { _w = document.documentElement.clientWidth & (~3)  ; }
   if (_h==undefined) { _h = document.documentElement.clientHeight & (~3) ; }
   var mainCanvas = ga.CanvasLib.createCanvas(_w,_h);
   if ( !document.body ) { 
   	        var aNewBodyElement = document.createElement("body"); 
            document.body = aNewBodyElement; 
   };
   document.body.appendChild(mainCanvas);
   return mainCanvas;
}
		
// creates and returns a canvas having provided width, height
ga.CanvasLib.createCanvas  = function createCanvas ( w, h ) {
    var newCanvas = document.createElement('canvas');
	newCanvas.width  = w;     newCanvas.height = h;
    newCanvas.style.position = 'absolute' ;
	return newCanvas;
}

// Add a canvas below (default) or above the target canvas.
// returns this canvas.
// the inserted canvas has same width, height, and offset within the document.
ga.CanvasLib.insertCanvasLayer = function insertCanvasLayer (targetCanvas, _above) {
    if (_below === undefined) { _below=true; }
    var newCanvas= CanvasLib.createCanvas ( targetCanvas.width, targetCanvas.height );
    var parentDiv = targetCanvas.parentNode;
    if (!_above)   { parentDiv.insertBefore(newCanvas, targetCanvas); } 
    else           { var next = targetCanvas.nextSibling;   parentDiv.insertBefore(newCanvas, next); }
    newCanvas.offsetLeft = targetCanvas.offsetLeft; newCanvas.offsetTop = targetCanvas.offsetTop;
    return newCanvas;
};

// Returns a new canvas having the content as the provided image.
// It will be of same size, except if scale is provided.
// _smoothing defines wether the image should be smoothed when scaled up. defaults to true.
ga.CanvasLib.canvasFromImage = function canvasFromImage (sourceImage, _scale, _smoothing) {
	_scale = _scale || 1;
	var finalWidth  = sourceImage.width  * _scale ;
	var finalHeight = sourceImage.height * _scale ;
    var newCanvas   = ga.CanvasLib.createCanvas(finalWidth, finalHeight);
	var ctx = newCanvas.getContext('2d');
	if (_scale !=1 ) {
		if (_smoothing === undefined ) { _smoothing = true }
		_smoothing=!!_smoothing; 
		ctx.imageSmoothingEnabled  = ctx.mozImageSmoothingEnabled    = _smoothing;
		ctx.oImageSmoothingEnabled = ctx.webkitImageSmoothingEnabled = _smoothing;
	}
	ctx.drawImage(sourceImage, 0, 0, finalWidth, finalHeight);
	return newCanvas;
};

// draw a rounded rectangle.
// use stroke()  or fill()    afterwise.
AddHiddenProp(CanvasRenderingContext2D.prototype, "roundRect" , function (x, y, w, h, r) {
            if (w < 2 * r) r = w / 2;
            if (h < 2 * r) r = h / 2;
            this.beginPath();
            this.moveTo(x+r, y);
            this.arcTo(x+w, y,   x+w, y+h, r);
            this.arcTo(x+w, y+h, x,   y+h, r);
            this.arcTo(x,   y+h, x,   y,   r);
            this.arcTo(x,   y,   x+w, y,   r);
            this.closePath();
            return this; } );
      
// width property for the context2d.  Does cache the this.canvas.width into a hidden property            
Object.defineProperty(CanvasRenderingContext2D.prototype, "width" ,
                      { get : function () { 
                      	                   if (this._width) return this._width;
  	                                       Object.defineProperty(this, '_width', { value : this.canvas.width}) ;
  	                                       return this._width ;        }} );
  	                                       
// height property for the context2d.  Does cache the this.canvas.height into a hidden property            
Object.defineProperty(CanvasRenderingContext2D.prototype, "height" ,
                      { get : function () { if (this._height) return this._height;
  	                                       Object.defineProperty(this, '_height', { value : this.canvas.height}) ;
  	                                       return this._height ;        }} );
  
   
   function AddHiddenProp (obj, name, value) { Object.defineProperty(obj, name, {value : value }) };
   

}());
