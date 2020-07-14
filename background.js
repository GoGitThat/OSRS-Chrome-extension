chrome.runtime.onInstalled.addListener(function(details){
    if(details.reason == "install"){
      chrome.storage.sync.set({'numItems': 0}, function() {
      });
    }
});
