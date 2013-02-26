/**
 * Twitter helper
 */
var twitter = {
	name : "Twitter",
	baseUrl : "http://api.twitter.com/1/statuses/public_timeline.json",
	searchUrl : "http://search.twitter.com/search.json?q=",
	localMsg : ["messages/flood1.json","messages/flood2.json","messages/flood3.json","messages/flood4.json"],
	localIdx : 3,
	localReq : false,
	icon : "icons/twitter32.png",
	messages : [],
	threshold : 10,
	lastSearch : {term: '',ts : new Date(0), area: null},
	init : function() {
		this.setLocal(true);
		return this;
	},
	/**
	 * Enables local search, i.e., loading "fake" cached messages, when the search cap is reached
	 */
	setLocal : function(local){
		if (local != null) {
			this.localReq = local;
		 	if (local) {
		 		$("#localAPI").css({'border':'1px inset #ccc'});
		 		$("#twitterAPI").css({'border': '0'});
		 	}
		 	else  {
		 		$("#localAPI").css({'border': '0'});
		 		$("#twitterAPI").css({'border':'1px inset #ccc'});
		 	};
		}
	},
	getLocalUrl : function(){
		twitter.localIdx++;
		if (twitter.localIdx == twitter.localMsg.length) twitter.localIdx = 0;
		return twitter.localMsg[twitter.localIdx];
	},
	/**
	 * Search the remote service and sort results if possible.
	 */
	search : function(query, sort, order, area, since) {
		var time = new Date();
		var diff = Math.abs((time.getTime() - this.lastSearch.ts.getTime()) / 1000); 
		// if last search is less than [threshold] secons ago, use cached messages
		if (diff < this.threshold && query == this.lastSearch.term && !this.localReq) {
			controller.notifyUpdate(this, this.messages);
		} else {
			// reset twitter message pool
			this.messages = [];
			this.lastSearch.term = query;
			if (sort === undefined) {
				sort = "updated";
			}
			if (query === undefined || query == null || query == "") {
				var url = widget.proxify(this.baseUrl);
			} else {
				// NOTE: encodeURI will leave '#' (=bad), while escape doesn't.
				var url = widget.proxify(this.searchUrl + escape(query) + "&include_entities=true");
			}
			if (area != null) {
				url += "&geocode=" + area.center.lat +","+ area.center.long +","+area.radius+"km";
				this.lastSearch.area = area;
			}
			// request and store messages
			$.ajax({
				// use local (fake) url to prevent twitter rate cap
				url: this.localReq? twitter.getLocalUrl() : url,
				dataType : "json",
				async : false,
				success : function(twitter) {
					twitter.lastSearch.ts = new Date();
					// callback in the twitter scope
					return function(json) {
						twitter.processResult(json);
					}
				}(twitter),
				error : function(req, status, error) {
					var resp = req.responseText;
					// test if json
					if(resp.substr(0,1) == '{') {
						if ($.parseJSON(resp).error != undefined)
							twitter.handleError(error,$.parseJSON(resp).error);
						else  
							twitter.handleError(error,$.parseJSON(resp).errors[0].message);
					}
					else {
						try {
							var error = $.parseXML(resp).find('h1')[0];
							var msg = $.parseXML(resp).find('u')[0];
							controller.displayError(twitter, error, msg);
						}
						catch (exception){
							controller.displayError(twitter,"An error occured.","");
						}	
					}
					controller.displayError(twitter, error, $.parseJSON(req.responseText).error);
				}
			});
		}
	},
	/**
	 * Process new messages retrieved by a search -> put in local pool and notify controller
	 */
	processResult : function(json) {
		var itemList = json;
		// if return msg is a search result, extract entries
		if (json.results)
			itemList = json.results;
		itemList.forEach(function(msg) {
			var ts = new Date(Date.parse(msg.created_at));
			var fromUser = (msg.user != null) ? msg.user.screen_name : msg.from_user;
			var fromUserName = (msg.user != null) ? msg.user.name : msg.from_user_name;
			var userImg  = (msg.user != null) ? msg.user.profile_image_url : msg.profile_image_url;
			var geo = (msg.geo != null ) ? msg.geo : twitter.generateGeoInfo(); // generate geo info from visible area
			twitter.messages.push({
				ts : ts,
				id : msg.id,
				feed : "Twitter",
				feedIcon : twitter.icon,
				text : msg.text,
				geo : (geo != null) ? geo : {lat: 51.05,long: 13.73}, // geo fallback
				userName : fromUser,
				userId : fromUser,
				icon : userImg,
			});
		});
		controller.notifyUpdate(this, this.messages);
	},
	/**
	 * Generates fake geo information for messages with in a certain area 
	 * returns: {lat:double,long:double}
	 */
	generateGeoInfo : function() {
		var bounding = controller.areaBounding;
		
		if (bounding != null){
			var lat = bounding.lat1 + (Math.random() * (bounding.lat2 - bounding.lat1));
			var lon = bounding.lon1 + (Math.random() * (bounding.lon2 - bounding.lon1));
			return {lat:lat,long:lon};
		}
		return null;
	},
	
	handleError : function(error,errorTxt){
		// if rate limit has been reached, switch to stored results (local api)
		if (errorTxt.substr(0,10) == 'Rate limit'){
			twitter.setLocal(true);
			twitter.search(twitter.lastSearch.term,null,null,twitter.lastSearch.area);
		}
		controller.displayError(twitter, error, errorTxt)
	}
}; 