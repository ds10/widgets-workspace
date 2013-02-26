/**
 * Facebook helper
 */
var facebook = {
	baseUrl: "... public ",
	searchUrl: "... search",
	icon: "icons/facebook32.png",
	messages: [],
	init : function() {
		// init
	},
	/**
	 * Search the remote service and sort results if possible.
	 */
	search : function(query, sort, order) {
		// reset twitter message pool
		this.messages = [];
		if (sort === undefined) {
			sort = "updated";
		}
		if (query === undefined || query == null || query == "") {
			var url = widget.proxify(this.baseUrl);
		} else {
			// NOTE: encodeURI will leave '#' (=bad), while escape doesn't.
			var url = widget.proxify(this.searchUrl + escape(query) + "&include_entities=true");
		}

 		$.ajax({
  			url: url,
  			dataType: "json",
  			async: false,
  			success: function(fb){
  				// callback in the facebook scope
  				return function(json) {
	  				facebook.processResult(json);
  				}
  			}(facebook),
    		error: function(xhr, textStatus, errorThrown) {
        		alert(errorThrown);
    		}
 		});
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
			/*var ts = new Date(Date.parse(msg.created_at));
			var fromUser = (msg.user != null) ? msg.user.id : msg.from_user_id;
			twitter.messages.push({
				ts:ts,
				type:twitter,
				text:msg.text,
				meta:{
					id:msg.id,
					geo:msg.geo,
					user: fromUser
				}
			});*/
		});
		controller.notifyUpdate(this,this.messages);
	}
};