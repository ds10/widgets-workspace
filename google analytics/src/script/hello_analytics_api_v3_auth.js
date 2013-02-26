var clientId = '745280465192.apps.googleusercontent.com';
var apiKey = 'AIzaSyAzTFrdzyN5DHXw8PAtYxP-bBXISUw8qDc';
var scopes = 'https://www.googleapis.com/auth/analytics.readonly';

//This function is called after the Client Library has finished loading
function handleClientLoad() {
  // 1. Set the API Key
  gapi.client.setApiKey(apiKey);

  // 2. Call the function that checks if the user is Authenticated. This is defined in the next section
  window.setTimeout(checkAuth,1);
}

function checkAuth() {
	  // Call the Google Accounts Service to determine the current user's auth status.
	  // Pass the response to the handleAuthResult callback function
	  gapi.auth.authorize({client_id: clientId, scope: scopes, immediate: true}, handleAuthResult);
	}

function handleAuthResult(authResult) {
	  if (authResult) {
	    // The user has authorized access
	    // Load the Analytics Client. This function is defined in the next section.
	    loadAnalyticsClient();
	  } else {
	    // User has not Authenticated and Authorized
	    handleUnAuthorized();
	  }
	}


	// Authorized user
	function handleAuthorized() {
	  var authorizeButton = document.getElementById('authorize-button');
	  var makeApiCallButton = document.getElementById('make-api-call-button');

	  // Show the 'Get Visits' button and hide the 'Authorize' button
	  makeApiCallButton.style.visibility = '';
	  authorizeButton.style.visibility = 'hidden';

	  // When the 'Get Visits' button is clicked, call the makeAapiCall function
	  makeApiCallButton.onclick = makeApiCall;
	}


	// Unauthorized user
	function handleUnAuthorized() {
	  var authorizeButton = document.getElementById('authorize-button');
	  var makeApiCallButton = document.getElementById('make-api-call-button');

	  // Show the 'Authorize Button' and hide the 'Get Visits' button
	  makeApiCallButton.style.visibility = 'hidden';
	  authorizeButton.style.visibility = '';

	  // When the 'Authorize' button is clicked, call the handleAuthClick function
	  authorizeButton.onclick = handleAuthClick;
	}
	
	function handleAuthClick(event) {
		  gapi.auth.authorize({client_id: clientId, scope: scopes, immediate: false}, handleAuthResult);
		  return false;
		}
	
	function loadAnalyticsClient() {
		  // Load the Analytics client and set handleAuthorized as the callback function
		  gapi.client.load('analytics', 'v3', handleAuthorized);
		}