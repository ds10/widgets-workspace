/**
 * The controller object
 * This is used to wire up the view and model with actions
 */
var controller = {
	feeds : [],
	messageList : [],
	currentQuery : "",
	optionsToggleState : 1, // 0 = hidden, 1 = visible
	area : null,
	areaBounding : null,
	toggleArrows : 	["icons/bullet_arrow_down.png","icons/bullet_arrow_up.png"],
	fmt : null,
	/**
	 * Initialize the controller (initial search) 
	 */
	init : function() {
		this.fmt = new TwitterCldr.TimespanFormatter();
		this.feeds.push(new feed("Twitter",twitter.init()));
		//this.feeds.push(new feed("Facebook","icons/facebook32.png",facebook));

		if (navigator.geolocation) navigator.geolocation.getCurrentPosition(this.locSuccess);
   		else console.log("HTML5 GeoLocation is not supported by your browser.");	
   		
		$('#toggleArrow').attr('src',this.toggleArrows[this.optionsToggleState]);
		// show initial messages (query = "")
		this.submitSearchForm();
	},
	/**
	 * Enable search from local cache
	 */
	setLocal : function (local){
		this.feeds.forEach( function(feed){
			feed.controller.setLocal(local);					
		});
		this.search();
	},
	/**
	 * Call, when a location has been detected via GeoLocation API
	 */
	locSuccess : function(position) {
		var coords = position.coords;
		var lat = coords.latitude;
		var long = coords.longitude;
		this.area = {center:{lat:lat,long:long},radius:'10km'};
		
	},
	/*
	 * Toggles the options bar, including search (true=open,false=close)
	 */
	toggleOptions : function(state) {
		// state given
		if (state != null)
			(state) ? this.openOptions() : this.closeOptions();
		else
		// using last known state
		(0 == this.optionsToggleState) ? this.openOptions() : this.closeOptions();
	},
	/**
	 * Opens the options bar 
	 */
	openOptions : function(){
		// unless already open
		if (this.optionsToggleState < 1) {
			$('#toggleArrow').attr("src",this.toggleArrows[1]);
			this.optionsToggleState = 1;
			$('#searchPanel').animate({height : 'toggle'
				}, 500, null);
		}
	},
	/**
	 * Closes the options bar 
	 */
	closeOptions : function(){
		// unless already closed
		if (this.optionsToggleState > 0) {		
			$('#toggleArrow').attr("src",this.toggleArrows[0]);
			this.optionsToggleState = 0;
			$('#searchPanel').animate({height : 'toggle'
					}, 500, null);
		}
	},
	/**
	 * Search/Filter by incoming trend
	 */	
	updateSearch : function(channel,trend,meta){
		//console.log("Receiving 'Trend': " +trend);
		if (trend != null) {
			$('#searchString').val(trend);
			controller.submitSearchForm();
		}
	},
	/**
	 * Search/Filter by given area 
	 */	
	filterByArea : function(channel,area,meta){
		//console.log("Receiving 'Location': " +trend);
		if (area != null) {
			controller.area = area;
			controller.areaBounding = controller.generateAreaBB(area);
			controller.search();
		}
	},
	/**
	 * Generates the corner points of a given area 
	 */
	generateAreaBB : function(area){
		var radius = area.radius; // km
		var lat = area.center.lat;
		var lon = area.center.long;

		var factor = 115.166666; //km
		
		x1 = -(radius - (factor*lat))/factor;
		x2 = (radius + (factor*lat))/factor;
		
		y1 = lon - (radius/(factor*Math.cos(lat/57.3)));
		y2 = (radius/(factor*Math.cos(lat/57.3)))+lon;
		
		var dist = Math.sqrt(Math.pow(factor * (x2-x1),2) + Math.pow(factor * (y2 - y1) * Math.cos(x2/57.3),2));
		var should = Math.sqrt(Math.pow(2*radius,2)*2);
		
		console.log("Area bounding box: "+x1+" < ["+lat+"] < "+x2+";"+y1+" < ["+lon+"] < "+y2+". (radius was "+radius+"km, BB diagonal is "+dist+"km (max: "+should+"))");
		return {lat1:x1,lon1:y1,lat2:x2,lon2:y2};
	},
	/**
	 * Extract the values from the search form, do the search and display the results.
	 */
	submitSearchForm : function() {
		var query = $('#searchString').val();
		// do search
		this.currentQuery = query;
		this.search();
		this.toggleOptions(false);		
	},
	/**
	 * Reset the search (value, location) 
	 */
	resetSearch : function() {
		$('#searchString').val('');
		this.currentQuery = "";
		this.area = null;
		this.search();
	},
	/**
	 * Set the status bar text /wrt to a query 
	 */
	setStatus : function(query) {
		if (query == null) query = this.currentQuery;
		$("#statusPanel").empty();
		
		var txt = $("<div>").attr("id","statusText").appendTo("#statusPanel");
		var buttons = $("<div>").attr("id","statusButtons").appendTo("#statusPanel");
		
		// "filtered by location" button
		if (this.area != null)
			$("<img>").attr("src","icons/world_go.png")
				.attr("title","Filtered by location")
				.css({width: '12px', height: '12px', margin: '0 5px 0 0'})
				.appendTo("#statusText");
		
		if (query.length>0) 
			$("#statusPanel #statusText").append(document.createTextNode("Search results for '"+query+"'..."));
		else 
			$("#statusPanel #statusText").append(document.createTextNode("Recent public updates"));
			
		// refresh button
		$("<img>").attr("src","icons/arrow_refresh.png").attr("onclick","javascript:controller.submitSearchForm()").attr("title","Refresh").appendTo("#statusButtons");
		$("<div>").attr("style", "clear:both;width: 0;").appendTo("#statusPanel");	
	},
	/**
	 * Start search (based on the preset query and area)
	 */
	search : function(sort,order,area) {
		this.messageList = [];
				
		// remove all old results and wait ...
		$('#messageList').empty();
		$('#messageList').hide();
		$("#spinner").spin();
		
		// for all feeds: trigger search, merge, populate list
		this.feeds.forEach(function(item) {
			var c = item.controller; 
			c.search(controller.currentQuery,null,null,controller.area);
		});
		
		this.setStatus();		
	},
	/**
	 * Sorts the message pool by time
	 */	
	sortMessages : function(a,b){
		var aTime = new Date(Date.parse(a.ts));
		var bTime = new Date(Date.parse(b.ts));
		return (aTime.getTime() - bTime.getTime());
	},
	/*
	 * (Callback) Inoked by feed controllers, once new messages have been received
	 * Used to fill overall messageList with recevied msg
	 */
	notifyUpdate : function(feed,messages){
		$("#"+feed.name+"Error").remove();
		
		$.merge(this.messageList,messages);
		// sort array by time
		this.messageList.sort(this.sortMessages);
		this.publishMessageList();
		this.render();
	},	
	/**
	 * Render all messages in the message list
	 */
	render : function() {
		$("#spinner").spin(false);
		$('#messageList').show();
		
		var now = Math.round(Date.now() / 1000);  // get seconds
		
		// for every message, do:
		this.messageList.forEach(function(msg){
			var msgItem = $("<tr>").addClass("messageItem").prependTo("#messageList");
			var iconCell = $("<td>").addClass("icons").appendTo(msgItem);
			var iconCont = $("<div>").addClass("iconContainer").appendTo(iconCell);
			// feed icon
			$("<img>").attr("src", msg.feedIcon).addClass("feed").attr("alt",msg.feed).appendTo(iconCont);
			// avatar
			$('<img class="avatar" />').bind('load', function(){
        		if (!this.complete || this.naturalWidth == 0 ) {
            		$(this).trigger('load');      
        		} else {
            		$(this).appendTo(iconCont);
        		}    
    		}).attr("src",msg.icon);   

			// message text
			var message = $("<td>").addClass("message")
				.html("<span style='font-weight:bold'>"+msg.userName+" </span> "
				+ "<span style='color: #999;'> @"+msg.userId+"</span>"
				+ "<br/>"+msg.text).appendTo(msgItem);
			// time
			var then = msg.ts.getTime() / 1000;
			$("<div>").addClass("time").html(controller.fmt.format(then - now)).appendTo(message);
			//message.append("<div class='time'>"+controller.fmt.format(then - now)+"</div>");
			// publishing link
			var pubCell = $("<td>").addClass("publish").appendTo(msgItem);
			var pubElem = $("<img>").attr("src", "icons/publish.png")
				.attr("title","Publish message")
				.attr("alt","Publish message")
				.appendTo(pubCell);
			pubElem.click(function(){
				hub.publish("http://ict-omelette.eu/topics/social/message", msg);
			});
		});
	},
	/**
	 * (Callback) Shows an error message, if the search failed 
	 */
	displayError : function(feed,error,txt){
		$("#spinner").spin(false);
		$("errorPanel").show();
		var errorMsg;
		if ($("#"+feed.name+"Error").length<1) {
			var errorDiv = $("<div>").attr("id",feed.name+"Error").appendTo($("#errorPanel"))
			// feed icon
			var errorIcon = $("<div>").addClass("icons").appendTo(errorDiv);
				$("<img>").attr("src", feed.icon).appendTo(errorIcon);
			errorMsg = $("<div>").addClass("message").appendTo(errorDiv);
			$("<div>").attr("style","clear:both").appendTo('#errorPanel');
		}	
		else {
			errorMsg = $("#"+feed.name+"Error .message");
			errorMsg.empty();
		}
		// message text
		$("<h3>").text(error).appendTo(errorMsg);
		$("<p>").text(txt).appendTo(errorMsg);
	},
	/**
	 * Publishes messages on the OpenAjax hub on user request
	 */
	publishMessage : function(msg) {
		try {
			hub.publish("http://ict-omelette.eu/topics/social/message", msg);
		}
		catch (exception){
			console.log("[SF] Could not publish message via hub.");
		};
	},
	/**
	 * Publishes the messageList on the OpenAjax hub upon change 
	 */
	publishMessageList : function(){
		try {
			hub.publish("http://ict-omelette.eu/topics/social/messages",this.messageList);
			}
		catch (exception){
			console.log("[SF] Could not publish message list via hub.");
		};
	}
}