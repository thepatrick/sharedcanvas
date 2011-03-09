/* 
 * Copyright (c) 2011 Patrick Quinn-Graham
 * 
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 * 
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

var socket = new io.Socket(""), touchCache = {}; 
$(document).observe("dom:loaded", function(){
  
  socket.connect();
  
  var doc = $(document);

	var drawingCanvas = new Element('canvas', { width: document.width, height: document.height }); 
	$$('body')[0].appendChild(drawingCanvas);
  
  var dims = document.viewport.getDimensions();
  
  // Check the element is in the DOM and the browser supports canvas
  if(!drawingCanvas.getContext) {
    alert("No canvas tag :(");
    return;
  }
  var context = drawingCanvas.getContext('2d');
  
  context.lineCap = 'round';
  context.lineWidth = 2.5;

  doc.observe('touchstart', function(e){
    var t = $A(e.touches).map(function(touch) {          
      touchCache[touch.identifier] = { x: touch.pageX, y: touch.pageY };
      context.strokeStyle = "#000000";
      context.fillStyle = "#000000";
      context.beginPath();
      context.moveTo(touch.pageX - 1, touch.pageY -1);
      context.lineTo(touch.pageX, touch.pageY);
      context.closePath();
      context.stroke();
      context.fill();
      return { x: touch.pageX, y: touch.pageY, id: touch.identifier };
    });
    socket.send({ event: "start", touches: t });
    e.preventDefault();
  });
  doc.observe('touchmove', function(e){
    var t = $A(e.touches).map(function(touch) {
     var lastEvent = touchCache[touch.identifier];
     
     context.strokeStyle = "#000000";
     context.fillStyle = "#000000";
     context.beginPath();
     context.moveTo(lastEvent.x, lastEvent.y);
     context.lineTo(touch.pageX, touch.pageY);
     context.closePath();
     context.stroke();
     context.fill();
     
     lastEvent.x = touch.pageX;
     lastEvent.y = touch.pageY;
     
     
     return { x: touch.pageX, y: touch.pageY, id: touch.identifier };
    });
    socket.send({ event: "move", touches: t });
    e.preventDefault();
  });
  doc.observe('touchend', function(e){
    var t = $A(e.touches).map(function(touch) {
      
       var lastEvent = touchCache[touch.identifier];

       context.strokeStyle = "#000000";
       context.fillStyle = "#000000";
       context.beginPath();
       context.moveTo(lastEvent.x, lastEvent.y);
       context.lineTo(touch.pageX, touch.pageY);
       context.closePath();
       context.stroke();
       context.fill();
      
      delete touchCache[touch.identifier];
    
      return { x: touch.pageX, y: touch.pageY, id: touch.identifier };
    });
    socket.send({ event: "end", touches: t });
    e.preventDefault();
  });

  socket.on('message', function(m){  
    if(m.event == 'start') {
      
      m.touches.each(function(m){
        touchCache[m.id] = { x: m.x, y: m.y };
        context.strokeStyle = "#000000";
        context.fillStyle = "#000000";
        context.beginPath();
        context.moveTo(m.x - 1, m.y -1);
        context.lineTo(m.x, m.y);
        context.closePath();
        context.stroke();
        context.fill();            
      });

    } else if(m.event == 'move') {

      m.touches.each(function(m){
        var lastEvent = touchCache[m.id];
        context.strokeStyle = "#000000";
        context.fillStyle = "#000000";
        context.beginPath();
        context.moveTo(lastEvent.x, lastEvent.y);
        context.lineTo(m.x, m.y);
        context.closePath();
        context.stroke();
        context.fill();
        lastEvent.x = m.x;
        lastEvent.y = m.y;
      });

    } else if(m.event == 'end') {

      m.touches.each(function(m){
        var lastEvent = touchCache[m.id];
        context.strokeStyle = "#000000";
        context.fillStyle = "#000000";
        context.beginPath();
        context.moveTo(lastEvent.x, lastEvent.y);
        context.lineTo(m.x, m.y);
        context.closePath();
        context.stroke();
        context.fill();
        delete touchCache[m.id];
      });

    }

  });

});