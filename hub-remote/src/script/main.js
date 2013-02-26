var stepSize = 40;
var animation = null;
var WAITFORHUB = 1000;
var imageFallback = false;

$(document).ready(function()
  {	
   // iDevices have poor youtube support, show thumbnail image only
   if (isiPhone())
	 {
	  imageFallback = true;
	  
	  // remove iframe and replace with still image
	  $("#camera").remove();
	  $("#cameraFallback").attr("id","camera");
	 }
	
   registerOpenAjax();	
   $(".button").click(function(event) { event.stopPropagation(); buttonClick($(this).attr("id").substr(2)); });
   
   var timeoutId = 0;
   
   $('.button').mousedown(function(event) {
       timeoutId = setTimeout("buttonHold("+$(this).attr("id").substr(2)+")", 500);
   }).bind('mouseup mouseleave', function() {
	   buttonRelease();
       clearTimeout(timeoutId);
   });
   
   adjustHeight();
   window.onresize = adjustHeight;
   $(document).click(hideControls);
   	 
   // center the cam
   buttonClick(5);
	// restore widget preferences
	/* var pos = Widget.preferences.getItem("position");
	 
	 if (pos != null)
		 {
		  pos = pos.split(",");

		   $("#camera").css("left",pos[0]);
		   $("#camera").css("top",pos[1]);	  
		 }*/   
  });

function isiPhone()
  {
   return ((navigator.platform.indexOf("iPhone") != -1) || (navigator.platform.indexOf("iPod") != -1) || (navigator.platform.indexOf("iPad") != -1));
  }

function adjustHeight()
  {
   $("#camContainer").css("height",(window.innerHeight-25)+"px");
  }

function showControls()
  {
   $("#controls p").css("visibility","hidden");
   $("#controls").css("bottom","-3px");
   $("#block").css("display","block");
  }

function hideControls()
  {
   $("#controls p").css("visibility","visible");
   $("#controls").css("bottom","-160px");
   $("#block").css("display","none");
  }

function buttonHold(id)
  {
   if (animation == null) animation = setInterval("buttonClick("+id+")",250);
  }

function buttonRelease()
  {
   clearInterval(animation);
   animation = null;
  }

function buttonClick(id)
  {
   var x = 0;
   var y = 0;

   // move up
   if (id >= 7) y = 1;
   // move down
   else if (id <=3) y = -1;
   // move left
   if (id == 7 || id == 4 || id == 1) x = 1;
   // move right
   else if (id == 9 || id == 6 || id == 3) x = -1;
   
   shiftViewport(x,y);
  }

function registerOpenAjax()
  {
	try
	  {
	   hub.subscribe("http://ict-omelette.eu/topics/resource/webcam",webcamSelected);
	  }
	catch (exception)
	  {
	   console.log("Can't subscribe to OpenAjax hub ("+exception+"). Trying again in "+(WAITFORHUB/1000)+"s...");
 	   window.setTimeout("registerOpenAjax()",WAITFORHUB*=2);
	  }
  }

function shiftViewport(x,y)
  {
   var cam = $("#camera");
	
   // center button clicked
   if (x == 0 && y == 0)
	 {
	  var centerX = (cam.width()-$("#camContainer").width())/2;
	  var centerY = (cam.height()-$("#camContainer").height())/2;
		
	  cam.animate({left:-centerX,top:-centerY}, 500);
	 }
   // other buttons clicked
   else
	 {
	  var newX = cam.position().left+(x*stepSize);
	  var newY = cam.position().top+(y*stepSize);
	  
	  // check that it does not pan across the video's edges
	  if (newX+cam.width() < $("#camContainer").width()) newX = $("#camContainer").width()-cam.width();
	  else if (newX > 0) newX = 0;
	  if (newY+cam.height() < $("#camContainer").height()) newY = $("#camContainer").height()-cam.height();
	  else if (newY > 0) newY = 0;
	   
	  // now move the camera
	  cam.animate({top:newY,left:newX}, 250);
	 }
   
   Widget.preferences.setItem("position", cam.css("left")+","+cam.css("top"));
  }

function webcamSelected(channel,webcam,meta)
  {
    var video = null;
    var start = null;

	if (webcam != null)
      {
	   video = webcam.youtubeid;
	   start = webcam.youtubestart;
      }
	
	if (video == null)
      {
	   $("#camera").attr("src","");
	   $("#camera").css("display","none");
	   $("#controls").css("display","none");
	   $("#msg").css("display","block");
	   
	   return;
      }
	
	var url;
	
	if (imageFallback)
	  {
	   // get youtube image
	   // correct way would be to load image url from http://gdata.youtube.com/feeds/api/videos/VIDEOID?v=2&alt=json
	   url = "http://i.ytimg.com/vi/"+video+"/hqdefault.jpg";
	  }
	else
	  {
	   // create new youtube url
	   url = "http://www.youtube.com/embed/"+video+"?autoplay=1&showinfo=0&wmode=transparent";
	   if (start != null) url += "#t="+start;
      }
	
	// re-center camera
	var centerX = ($("#camera").width()-$("#camContainer").width())/2;
	var centerY = ($("#camera").height()-$("#camContainer").height())/2;

	$("#camera").css("left",-centerX);
    $("#camera").css("top",-centerY);

    // make it visible
	$("#camera").css("display","block");
    $("#camera").attr("src",url);	
	$("#controls").css("display","block");
	$("#msg").css("display","none");
  }