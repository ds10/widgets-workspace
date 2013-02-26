/*TODO
 * error handling for HTML (local server)
 * geo random position
 */

var WAITFORHUB = 1000;

/**
 * A feed object, e.g. Twitter, Facebook
 */
function feed(name, controller) {
	this.name = name;
	this.controller = controller;
}

/**
 * A message object from a social network feed
 */
function message(ts, feed, feedIcon, id, text, geo, userName, userId, icon) {
	// publication time: js date
	this.timestamp = ts;
	// feed type: string
	this.feed = feed;
	// feed type: string (url)
	this.feedIcon = ficon;
	// msg identifier (unique for feed): string
	this.id = id;
	// message text: string
	this.text = text;
	// message location: {lat,long}
	this.geo = geo;
	// user name
	this.userName = userName;
	// user id
	this.userId = userId;	
	// message icon, i.e., avatar: string (url)
	this.icon = icon;
}

//get tag feed
$(document).ready(function() {
	controller.init();
	registerOpenAjax();
})


/**
 * Provides a basic shim for opening the widget without a widget object (e.g. directly in browsers)
 */
if (!window.widget) {
	window.widget = {};
}

/**
 * Adds in the "proxify" method if it isn't in the widget object, e.g. as we're opening the widget
 * directly in a browser, or using a widget runtime other than Wookie e.g. Opera, PhoneGap etc
 */
if (!window.widget.proxify) {
	window.widget.proxify = function(url) {
		return url
	};
}

/**
 * Register for trends at OpenAjax hub
 */

function registerOpenAjax() {
	try {
		hub.subscribe("http://ict-omelette.eu/topics/social/trendingTopic", controller.updateSearch);
		hub.subscribe("http://ict-omelette.eu/topics/geo/circularArea", controller.filterByArea);
	} catch (exception) {
	  console.log("Can't subscribe to OpenAjax hub ("+exception+"). Trying again in "+(WAITFORHUB/1000)+"s...");
	  window.setTimeout("registerOpenAjax()",WAITFORHUB*=2);
	}
}
  
function sleep(ms) {
	var dt = new Date();
	dt.setTime(dt.getTime() + ms);
	while (new Date().getTime() < dt.getTime());
}