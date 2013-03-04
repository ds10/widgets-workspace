// main.js - put your code here
 $(document).ready(function() {
	 get_jsonp_feed();
 })
 
function get_jsonp_feed() {
	 $.ajax({
		  url: 'http://crunch.kmi.open.ac.uk/people/~dsherlock/services/%20JSONexample.r',
		  dataType: 'jsonp',
		  data: {},
		  success: function(data, textStatus) {
			   $('div.d3').html('This widget has just recived a JSON object from crunch, it is now publishing it to ');
			   publish(data);
		  },
		  jsonpCallback: 'foo'
		});
    }

function publish(data){
	setInterval( function(){
    	        hub.publish('http://davidsherlock.info',data);
 	}, 5000 );
}
