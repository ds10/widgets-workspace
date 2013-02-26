var stepSize = 40;
var animation = null;
var WAITFORHUB = 1000;
var REFRESHINTERVAL = 2500;
var imageUrl = null;
var reloader = null;
var camObj = null;
var initialLoad = true;

$(document).ready(function()
  {	
   registerOpenAjax();	
   $(".button").click(function(event) { event.stopPropagation(); buttonClick($(this).attr("id").substr(2)); });
   
   var timeoutId = 0;
   
   $('.button').mousedown(function(event) {
       timeoutId = setTimeout("buttonHold("+$(this).attr("id").substr(2)+")", 500);
   }).bind('mouseup mouseleave', function() {
	   buttonRelease();
       clearTimeout(timeoutId);
   });   
	// restore widget preferences
	/* var pos = Widget.preferences.getItem("position");
	 
	 if (pos != null)
		 {
		  pos = pos.split(",");

		   $("#camera").css("left",pos[0]);
		   $("#camera").css("top",pos[1]);	  
		 }*/   
  });

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
   var cam = camObj;
	
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

function hideCam()
  {
   if (camObj)
	 {
      camObj.attr("src","");
      camObj.css("display","none");
      camObj.css("left","0");
      camObj.css("top","0");
	 }

   $("#controls").css("display","none");
   $("#error").css("display","none");
   $("#loading").css("display","none");
   $("#videolabel").css("display","none");
   window.clearTimeout(reloader);
   
   $("#nocam").css("display","table");
  }

function reloadWebcamImage()
  {
   camObj.attr("src",imageUrl+"?t="+new Date().getTime());
  }

function centerCam()
  {
   var centerX = (camObj.width()-$("#camContainer").width())/2;
   var centerY = (camObj.height()-$("#camContainer").height())/2;
	
   camObj.css("left",-centerX);
   camObj.css("top",-centerY);
  }

function webcamSelected(channel,webcam,meta)
  {    
   hideCam();
   
   if (webcam == null) return;
   
   if (webcam.imgurl == null && webcam.youtubeid == null)
	 {
	  $("#nocam").css("display","none");
	  $("#error").css("display","table");
	  return;
	 }
   
   // use imgurl if available
   if (webcam.imgurl != null)
	 {
	  camObj = $("#cameraPicture");
	  initialLoad = true;
	  
	  imageUrl = webcam.imgurl;
	  // load image now
	  reloadWebcamImage();
	  // show loading animation
	  $("#nocam").css("display","none");
	  $("#loading").css("display","table");
	  
	  // center cam after it has been loaded
	  camObj[0].onload = function() {
		  
		  // the first time a pic is loaded, align the camera
		  if (initialLoad)
	        {
		     centerCam();
		  
		     if (webcam.offsetX) camObj.css("left","-"+webcam.offsetX+"px");
		     if (webcam.offsetY) camObj.css("top","-"+webcam.offsetY+"px");
		  
		     camObj.css("display","block"); $("#loading").css("display","none");
			}
		  
		  initialLoad = false;

		  // start loading interval
		   reloader = window.setTimeout(reloadWebcamImage,REFRESHINTERVAL);
		  };
	  camObj[0].onerror = function() {		  
		  camObj.css("display","block");
		  $("#loading").css("display","none");
		  $("#loading").css("error","table");
		  };
	  
	 }
   else
     {
	  var video = webcam.youtubeid;
	  var start = webcam.youtubestart;
	  
	  camObj = $("#camera");
	  
	  // create new youtube url
	  var url = "http://www.youtube.com/embed/"+video+"?autoplay=1&showinfo=0&wmode=transparent";
	  if (start != null) url += "#t="+start;

	  // load video
      camObj.attr("src",url);	
      // re-center camera
	  centerCam();
	  // show it now
      camObj.css("display","block");
     }

   
   $("#videolabel").text(webcam.label);

   // make controls visible
   if (webcam.steerable)
	 {
	  $("#controls").css("display","block");
	  $("#camContainer").css("bottom","26px");
	  $("#videolabel").css("bottom","26px");
	 }
   else
	 {
	  $("#camContainer").css("bottom","0");
	  $("#videolabel").css("bottom","0");
	 }
	
   $("#nocam").css("display","none");
   $("#videolabel").fadeIn();
	
   window.setTimeout("$('#videolabel').fadeOut();",5000);
  }