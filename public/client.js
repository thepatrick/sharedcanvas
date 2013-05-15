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

var socket = new io.Socket(""); 
$(document).observe("dom:loaded", function(){
  
  var doc = $(document);

  var drawingCanvas = new Element('canvas', { width: document.width, height: document.height - 40 }); 
  $$('body')[0].appendChild(drawingCanvas);
	
  // Check the element is in the DOM and the browser supports canvas
  if(!drawingCanvas.getContext) {
    alert("No canvas tag :(");
    return;
  }
  var context = drawingCanvas.getContext('2d');
  
  context.lineCap = 'round';
  context.lineWidth = 2.5;
	
  var magic = {
    context: drawingCanvas.getContext('2d'),
    touchCache: {},
    setup: function() {
      this.context.lineCap = 'round';
      this.context.lineWidth = 2.5;
      socket.connect();
    },
    drawLine: function(moveX, moveY, lineX, lineY) {
      this.context.strokeStyle = "#000000";
      this.context.fillStyle = "#000000";
      this.context.beginPath();
      this.context.moveTo(moveX, moveY);
      this.context.lineTo(lineX, lineY);
      this.context.closePath();
      this.context.stroke();
      this.context.fill();
    },
    clear: function() {
      this.context.clearRect(0,0, document.width, document.height - 40);
    },
    eventToProtocol: function(touch) {
      return { x: touch.pageX, y: touch.pageY, id: touch.identifier };
    }
  }
	
  magic.setup();

  drawingCanvas.observe('touchstart', function(e){
    var t = $A(e.touches).map(function(touch) {          
      magic.touchCache[touch.identifier] = { x: touch.pageX, y: touch.pageY };
      magic.drawLine(touch.pageX - 1, touch.pageY -1, touch.pageX, touch.pageY);
      return magic.eventToProtocol(touch);
    });
    socket.send({ e: "start", touches: t });
    e.preventDefault();
  });
  drawingCanvas.observe('touchmove', function(e){
    var t = $A(e.touches).map(function(touch) {
    var lastEvent = magic.touchCache[touch.identifier];	
    magic.drawLine(lastEvent.x, lastEvent.y, touch.pageX, touch.pageY);
    lastEvent.x = touch.pageX;
    lastEvent.y = touch.pageY;
      return magic.eventToProtocol(touch);
    });
    socket.send({ e: "move", touches: t });
    e.preventDefault();
  });
  drawingCanvas.observe('touchend', function(e){
    var t = $A(e.touches).map(function(touch) {
      var lastEvent = magic.touchCache[touch.identifier];
      magic.drawLine(lastEvent.x, lastEvent.y, touch.pageX, touch.pageY);
      delete magic.touchCache[touch.identifier];
      return magic.eventToProtocol(touch);
    });
    socket.send({ e: "end", touches: t });
    e.preventDefault();
  });

  $$('.clear')[0].observe('click', function(e){
    e.preventDefault();
    socket.send({ e: "clear" });
    magic.clear();
  });

  socket.on('message', function(m){  
    if(m.e == 'start') {
      m.touches.each(function(m){
        magic.touchCache[m.id] = { x: m.x, y: m.y };
        magic.drawLine(m.x - 1, m.y -1, m.x, m.y);
      });

    } else if(m.e == 'move') {
      m.touches.each(function(m){
        var lastEvent = magic.touchCache[m.id];
        magic.drawLine(lastEvent.x, lastEvent.y, m.x, m.y);
        lastEvent.x = m.x;
        lastEvent.y = m.y;
      });

    } else if(m.e == 'end') {
      m.touches.each(function(m){
        var lastEvent = magic.touchCache[m.id];
        magic.drawLine(lastEvent.x, lastEvent.y, m.x, m.y);
        delete magic.touchCache[m.id];
      });

    } else if(m.e == 'clear') {
      magic.clear();
    } else if(m.e == 'welcome') {
      var channel = document.location.search.match(/canvas=([^&]+)/);
      socket.send({ e: 'canvas', c: channel && channel[1] || 'default' });
    }
  });
});
